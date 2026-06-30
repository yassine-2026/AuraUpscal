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

const PORT = 3000;
const app = express();

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
  message: "Too many requests from this IP, please try again after 15 minutes"
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

app.post("/api/upscale", upload.single("video"), async (req, res): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    if (!process.env.REPLICATE_API_TOKEN && !process.env.FAL_KEY) {
      return res.status(500).json({ error: "Server missing API credentials" });
    }

    console.log(`Processing upload: ${req.file.originalname} (${req.file.size} bytes)`);

    // 1. Upload to Fal.ai storage to get a public URL for the video
    // This is required because both Fal and Replicate expect public URLs for video processing
    let videoUrl: string;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      // We pass the buffer directly or create a File/Blob equivalent depending on fal-ai version
      // In @fal-ai/serverless-client 0.15+, fal.storage.upload takes a File, Blob, or Buffer
      videoUrl = await fal.storage.upload(fileBuffer);
      console.log(`Uploaded to temp storage: ${videoUrl}`);
    } catch (err: any) {
      console.error("Failed to upload video to temporary storage:", err);
      return res.status(500).json({ error: "Failed to upload video to processing storage" });
    } finally {
      // Clean up local temp file
      fs.unlink(req.file.path, () => {});
    }

    // 2. Try Replicate First
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        console.log("Attempting Replicate processing...");
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        
        // Using a popular video upscaling model on Replicate
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
        return res.json({ result: output, provider: "replicate", originalUrl: videoUrl });
      } catch (repErr: any) {
        console.error("Replicate failed, falling back to Fal.ai:", repErr.message);
      }
    }

    // 3. Fallback to Fal.ai
    if (process.env.FAL_KEY) {
      try {
        console.log("Attempting Fal.ai processing...");
        // Assuming fal-ai/esrgan-video or similar endpoint. 
        // We use a generic fallback simulation if the exact model ID is different in production.
        const result: any = await fal.subscribe("fal-ai/fast-svd", {
          input: {
            video_url: videoUrl
          },
          logs: true
        });
        
        console.log("Fal.ai success:", result);
        const outUrl = result.data?.video?.url || result.data?.url || result.video?.url;
        
        if (outUrl) {
          return res.json({ result: outUrl, provider: "fal.ai", originalUrl: videoUrl });
        } else {
          throw new Error("Invalid response format from Fal.ai");
        }
      } catch (falErr: any) {
        console.error("Fal.ai failed:", falErr.message);
        return res.status(500).json({ error: "Both Replicate and Fal.ai processing failed" });
      }
    }

    return res.status(500).json({ error: "No processing provider succeeded" });

  } catch (error: any) {
    console.error("Unexpected error in /api/upscale:", error);
    res.status(500).json({ error: "Internal server error during processing" });
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
