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
      try {
        console.log("Attempting Replicate processing...");
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        
        let replicateFileUrl;
        if (replicate.files && typeof (replicate.files as any).create === 'function') {
          console.log("Using Replicate file upload API...");
          const fileStream = fs.createReadStream(filePath);
          const uploadedFile = await (replicate.files as any).create(fileStream);
          replicateFileUrl = uploadedFile?.urls?.get || (uploadedFile as any)?.url;
        } 
        
        if (!replicateFileUrl) {
          console.log("Falling back to Data URI for Replicate...");
          const fileBuffer = await fsPromises.readFile(filePath);
          const base64 = fileBuffer.toString('base64');
          replicateFileUrl = `data:${mimeType};base64,${base64}`;
        }

        const modelId = "nightmareai/real-esrgan-video:fb8af171cfa1616ddcf1242c093f9c46bcada5bad4c2fdd14a09df073995eb83";
        const inputPayload = {
          input_video: replicateFileUrl,
          outscale: 2
        };

        console.log(`Replicate request payload for ${modelId}:`, { outscale: 2, input_video: "[REDACTED_URL_OR_BASE64]" });

        const output = await replicate.run(modelId, { input: inputPayload });
        
        console.log("Replicate success:", output);
        resultPayload = output;
        providerUsed = "replicate";
      } catch (repErr: any) {
        console.error("Replicate failed. Error Details:", repErr?.response?.data || repErr.message || repErr);
        providerErrors['replicate'] = repErr?.response?.data || repErr.message || String(repErr);
        
        // Try fallback Replicate model if the first one failed
        if (process.env.REPLICATE_API_TOKEN && providerErrors['replicate']) {
           try {
              console.log("Attempting Replicate processing with fallback model...");
              const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
              const fallbackModelId = "lucataco/video-upscaler:e90066b595213b28b5e683f2a89ee161b9e86c0f8373b3ebef01f3db98356b46";
              
              let replicateFileUrl;
              if (replicate.files && typeof (replicate.files as any).create === 'function') {
                const fileStream = fs.createReadStream(filePath);
                const uploadedFile = await (replicate.files as any).create(fileStream);
                replicateFileUrl = uploadedFile?.urls?.get || (uploadedFile as any)?.url;
              } else {
                const fileBuffer = await fsPromises.readFile(filePath);
                replicateFileUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
              }

              const inputPayload = { video: replicateFileUrl, scale: 2 };
              console.log(`Replicate fallback request payload for ${fallbackModelId}:`, { scale: 2, video: "[REDACTED]" });
              
              const output = await replicate.run(fallbackModelId, { input: inputPayload });
              console.log("Replicate fallback success:", output);
              resultPayload = output;
              providerUsed = "replicate_fallback";
              delete providerErrors['replicate']; // Clear error since fallback succeeded
           } catch (repFallbackErr: any) {
              console.error("Replicate fallback failed. Error Details:", repFallbackErr?.response?.data || repFallbackErr.message || repFallbackErr);
              providerErrors['replicate_fallback'] = repFallbackErr?.response?.data || repFallbackErr.message || String(repFallbackErr);
           }
        }
      }
    }

    // 2. Fallback to Fal.ai
    if (!resultPayload && process.env.FAL_KEY) {
      try {
        console.log("Attempting Fal.ai processing...");
        const fileBuffer = await fsPromises.readFile(filePath);
        
        let falUrl;
        try {
          console.log("Attempting fal.storage.upload...");
          falUrl = await fal.storage.upload(fileBuffer);
        } catch (uploadErr: any) {
          console.warn("fal.storage.upload failed, falling back to Data URI:", uploadErr.message);
          const base64 = fileBuffer.toString('base64');
          falUrl = `data:${mimeType};base64,${base64}`;
        }

        const modelId = "fal-ai/esrgan-video";
        const inputPayload = { video_url: falUrl };
        console.log(`Fal.ai request payload for ${modelId}:`, inputPayload);

        const result: any = await fal.subscribe(modelId, {
          input: inputPayload,
          logs: true
        });
        
        console.log("Fal.ai success:", result);
        const outUrl = result.data?.video?.url || result.data?.url || result?.video?.url;
        
        if (outUrl) {
          resultPayload = outUrl;
          providerUsed = "fal.ai";
        } else {
          throw new Error(`Invalid response format from Fal.ai: ${JSON.stringify(result)}`);
        }
      } catch (falErr: any) {
        console.error("Fal.ai failed. Error Details:", falErr?.body || falErr.message || falErr);
        providerErrors['fal.ai'] = falErr?.body || falErr.message || String(falErr);
      }
    }

    if (resultPayload) {
      return res.json({ result: resultPayload, provider: providerUsed });
    } else {
      return res.status(500).json({ 
        error: "Processing failed on all available AI providers.", 
        details: process.env.NODE_ENV !== 'production' ? providerErrors : undefined 
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
