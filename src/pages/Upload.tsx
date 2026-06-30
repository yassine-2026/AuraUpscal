import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Upload as UploadIcon, Film, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../lib/utils';

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/mpeg'];

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Unsupported file format. Please upload MP4, MOV, AVI, MKV, WEBM, or MPEG.");
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 100MB.");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleStartUpscale = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/api/upscale', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      // Navigate to result with data
      navigate('/result', { state: { resultData: data } });

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 min-h-[calc(100vh-200px)] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Upload Video</h1>
        <p className="text-slate-400 text-lg">Select a low-resolution video to magically upscale to 4K.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {!file ? (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ease-out group",
              dragActive ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/mpeg"
              onChange={handleChange}
            />
            
            <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UploadIcon className="w-10 h-10 text-indigo-400" />
            </div>
            
            <h3 className="text-2xl font-medium mb-2">Drag & Drop your video</h3>
            <p className="text-slate-400 mb-8">or click to browse from your computer</p>
            
            <button 
              onClick={() => inputRef.current?.click()}
              className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-indigo-50 transition-colors"
            >
              Select File
            </button>
            
            <p className="mt-8 text-sm text-slate-500 flex items-center justify-center gap-2">
              <Film className="w-4 h-4" /> MP4, MOV, AVI, MKV up to 100MB
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Film className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium truncate max-w-[200px] md:max-w-md" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}
                  </p>
                </div>
              </div>
              
              {!isUploading && (
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleStartUpscale}
                disabled={isUploading}
                className={cn(
                  "px-8 py-4 rounded-full font-medium text-lg flex items-center gap-2 transition-all",
                  isUploading 
                    ? "bg-indigo-500/50 text-white/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
                )}
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Upscale to 4K
                  </>
                )}
              </button>
            </div>
            
            {isUploading && (
              <div className="mt-8">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 15, ease: "circOut" }}
                  />
                </div>
                <p className="text-center text-sm text-slate-400 mt-4 animate-pulse">
                  AI is working its magic. This may take a few minutes...
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
