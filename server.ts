import express from "express";
import path from "path";
import multer from "multer";
import os from "os";
import fs from "fs";
import { promises as fsPromises } from "fs";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import Replicate from "replicate";
import { fal } from "@fal-ai/serverless-client";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const PORT = process.env.PORT || 3000;
const app = express();

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite HMR and development
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", apiLimiter);

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for file uploads
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/upscale", (req, res, next) => {
  upload.single("video")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: "Unknown error during file upload" });
    }
    next();
  });
}, async (req, res, next): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file provided" });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    if (!process.env.REPLICATE_API_TOKEN && !process.env.FAL_KEY) {
      return res.status(500).json({ error: "Server missing API credentials (REPLICATE_API_TOKEN or FAL_KEY)" });
    }

    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg'];
    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid file type. Supported formats: MP4, MOV, AVI, MKV, WEBM, MPEG." });
    }

    console.log(`Processing upload: ${req.file.originalname} (${req.file.size} bytes)`);

    let resultPayload: any = null;
    let providerUsed = "";
    const providerErrors: Record<string, any> = {};

    // 1. Try Replicate First
    if (process.env.REPLICATE_API_TOKEN) {
      console.log("\n--- [REPLICATE] STARTING REQUEST ---");
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
      
      let replicateFileUrl;
      try {
         console.log(`[REPLICATE] Attempting to upload file to Replicate storage...`);
         if (replicate.files && typeof (replicate.files as any).create === 'function') {
             const uploadedFile = await (replicate.files as any).create(fs.createReadStream(filePath));
             replicateFileUrl = uploadedFile?.urls?.get || (uploadedFile as any)?.url;
             console.log(`[REPLICATE] Uploaded file to Replicate storage: ${replicateFileUrl}`);
         } else {
             throw new Error("replicate.files.create not available in this SDK version.");
         }
      } catch (uploadErr: any) {
         console.warn(`[REPLICATE] File upload to Replicate storage failed:`, uploadErr.message);
         console.log(`[REPLICATE] Falling back to Data URI...`);
         const fileBuffer = await fsPromises.readFile(filePath);
         replicateFileUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      }

      const replicateModels = [
        {
           id: "nightmareai/real-esrgan-video:fb8af171cfa1616ddcf1242c093f9c46bcada5bad4c2fdd14a09df073995eb83",
           input: (url: string) => ({ input_video: url, outscale: 2 })
        },
        {
           id: "lucataco/video-upscaler:e90066b595213b28b5e683f2a89ee161b9e86c0f8373b3ebef01f3db98356b46",
           input: (url: string) => ({ video: url, scale: 2 })
        }
      ];

      for (const model of replicateModels) {
          try {
              console.log(`\n--- [REPLICATE] RUNNING MODEL ${model.id} ---`);
              const inputPayload = model.input(replicateFileUrl);
              
              console.log(`[REPLICATE] HTTP Method: POST`);
              console.log(`[REPLICATE] Model/Version: ${model.id}`);
              console.log(`[REPLICATE] Headers: { "Authorization": "Bearer [REDACTED]" }`);
              
              // Safely log payload without exposing huge base64 strings
              const safePayload = { ...inputPayload };
              const videoKey = Object.keys(safePayload).find(k => typeof safePayload[k] === 'string' && safePayload[k].length > 1000);
              if (videoKey) safePayload[videoKey] = "[REDACTED_DATA_URI]";
              console.log(`[REPLICATE] Input Payload:`, safePayload);

              const output = await replicate.run(model.id, { input: inputPayload });
              
              console.log(`[REPLICATE] Success Response from ${model.id}:`, output);
              resultPayload = output;
              providerUsed = `replicate (${model.id})`;
              break; // Exit loop on success
          } catch (repErr: any) {
              const errorDetails = repErr?.response?.data || repErr?.response || repErr.message || String(repErr);
              const statusCode = repErr?.response?.status || repErr?.status || "Unknown status";
              console.error(`[REPLICATE] FAILED for ${model.id} - Status Code: ${statusCode}`);
              console.error(`[REPLICATE] Error Message: ${repErr.message}`);
              console.error(`[REPLICATE] Response Body:`, JSON.stringify(errorDetails, null, 2));
              if (repErr.stack) console.error(`[REPLICATE] Stack Trace:`, repErr.stack);
              
              providerErrors[`replicate_${model.id}`] = {
                 status: statusCode,
                 message: repErr.message,
                 body: errorDetails
              };
          }
      }
    }

    // 2. Fallback to Fal.ai
    if (!resultPayload && process.env.FAL_KEY) {
      console.log("\n--- [FAL.AI] STARTING REQUEST ---");
      const fileBuffer = await fsPromises.readFile(filePath);
      
      let falUrl;
      try {
        console.log("[FAL.AI] Attempting fal.storage.upload...");
        falUrl = await fal.storage.upload(fileBuffer);
        console.log(`[FAL.AI] Uploaded to temp storage: ${falUrl}`);
      } catch (uploadErr: any) {
        console.warn("[FAL.AI] fal.storage.upload failed, falling back to Data URI:", uploadErr.message);
        falUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
      }

      const falModels = [
        { id: "fal-ai/fast-svd", input: (url: string) => ({ video_url: url }) },
        { id: "fal-ai/esrgan-video", input: (url: string) => ({ video_url: url }) }
      ];

      for (const model of falModels) {
          try {
              console.log(`\n--- [FAL.AI] RUNNING MODEL ${model.id} ---`);
              const inputPayload = model.input(falUrl);
              console.log(`[FAL.AI] Endpoint/Model: ${model.id}`);
              
              // Safely log payload without exposing huge base64 strings
              const safePayload = { ...inputPayload };
              const videoKey = Object.keys(safePayload).find(k => typeof safePayload[k] === 'string' && safePayload[k].length > 1000);
              if (videoKey) safePayload[videoKey] = "[REDACTED_DATA_URI]";
              console.log(`[FAL.AI] Request Payload:`, safePayload);

              const result: any = await fal.subscribe(model.id, {
                input: inputPayload,
                logs: true
              });
              
              console.log(`[FAL.AI] Success Response from ${model.id}:`, result);
              const outUrl = result.data?.video?.url || result.data?.url || result?.video?.url;
              
              if (outUrl) {
                resultPayload = outUrl;
                providerUsed = `fal.ai (${model.id})`;
                break; // Exit loop on success
              } else {
                throw new Error(`Invalid response format from Fal.ai: ${JSON.stringify(result)}`);
              }
          } catch (falErr: any) {
              const errorDetails = falErr?.body || falErr?.response || falErr.message || String(falErr);
              const statusCode = falErr?.status || "Unknown status";
              console.error(`[FAL.AI] FAILED for ${model.id} - Status Code: ${statusCode}`);
              console.error(`[FAL.AI] Error Message: ${falErr.message}`);
              console.error(`[FAL.AI] Response Body:`, JSON.stringify(errorDetails, null, 2));
              if (falErr.stack) console.error(`[FAL.AI] Stack Trace:`, falErr.stack);
              
              providerErrors[`fal.ai_${model.id}`] = {
                 status: statusCode,
                 message: falErr.message,
                 body: errorDetails
              };
          }
      }
    }

    if (resultPayload) {
      return res.json({ result: resultPayload, provider: providerUsed });
    } else {
      console.error("\n[SYSTEM] ALL AI PROVIDERS FAILED.");
      return res.status(500).json({ 
        error: "AI Providers Failed.", 
        details: providerErrors 
      });
    }

  } catch (error: any) {
    next(error);
  } finally {
    // ALWAYS clean up the temporary file
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
        console.log(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up file:", cleanupErr);
    }
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Error Handler:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "An unexpected internal server error occurred." });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
