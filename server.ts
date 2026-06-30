import express from "express";
import path from "path";
import multer from "multer";
import os from "os";
import fs from "fs";
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

// Multer setup for file uploads
const upload = multer({
  dest: os.tmpdir(),
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
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    if (!process.env.REPLICATE_API_TOKEN && !process.env.FAL_KEY) {
      return res.status(500).json({ error: "Server missing API credentials (REPLICATE_API_TOKEN or FAL_KEY)" });
    }

    const mimeType = req.file.mimetype;
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg'];
    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: "Invalid file type. Supported formats: MP4, MOV, AVI, MKV, WEBM, MPEG." });
    }

    console.log(`Processing upload: ${req.file.originalname} (${req.file.size} bytes)`);

    let videoUrl: string;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      // Upload to Fal.ai storage for temporary public URL access
      videoUrl = await fal.storage.upload(fileBuffer);
      console.log(`Uploaded to temp storage: ${videoUrl}`);
    } catch (err: any) {
      console.error("Failed to upload video to temporary storage:", err);
      return res.status(500).json({ error: "Failed to upload video to processing storage" });
    } finally {
      // Clean up local temp file robustly
      if (fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });
      }
    }

    let resultPayload: any = null;
    let providerUsed = "";

    // 1. Try Replicate First
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        console.log("Attempting Replicate processing...");
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        
        const output = await replicate.run(
          "nightmareai/real-esrgan-video:fb8af171cfa1616ddcf1242c093f9c46bcada5bad4c2fdd14a09df073995eb83",
          {
            input: {
              input_video: videoUrl,
              outscale: 2
            }
          }
        );
        
        console.log("Replicate success:", output);
        resultPayload = output;
        providerUsed = "replicate";
      } catch (repErr: any) {
        console.error("Replicate failed, falling back to Fal.ai:", repErr.message);
      }
    }

    // 2. Fallback to Fal.ai
    if (!resultPayload && process.env.FAL_KEY) {
      try {
        console.log("Attempting Fal.ai processing...");
        const result: any = await fal.subscribe("fal-ai/fast-svd", {
          input: {
            video_url: videoUrl
          },
          logs: true
        });
        
        console.log("Fal.ai success:", result);
        const outUrl = result.data?.video?.url || result.data?.url || result?.video?.url;
        
        if (outUrl) {
          resultPayload = outUrl;
          providerUsed = "fal.ai";
        } else {
          throw new Error("Invalid response format from Fal.ai");
        }
      } catch (falErr: any) {
        console.error("Fal.ai failed:", falErr.message);
      }
    }

    if (resultPayload) {
      return res.json({ result: resultPayload, provider: providerUsed, originalUrl: videoUrl });
    } else {
      return res.status(500).json({ error: "Both Replicate and Fal.ai processing failed. Please try again." });
    }

  } catch (error: any) {
    next(error);
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
