import React from 'react';
import { useLocation, Navigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Download, RefreshCcw, CheckCircle2, Play } from 'lucide-react';
import type { UpscaleResponse } from '../types';

export default function Result() {
  const location = useLocation();
  const resultData = location.state?.resultData as UpscaleResponse | undefined;

  if (!resultData || !resultData.result) {
    // If accessed directly without data, redirect to upload
    return <Navigate to="/upload" replace />;
  }

  const handleDownload = () => {
    // Simple download logic - in a real app, might need to proxy if CORS restricts direct download
    const a = document.createElement('a');
    a.href = resultData.result!;
    a.download = `upscaled_4k_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-24 min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium mb-6">
          <CheckCircle2 className="w-5 h-5" />
          <span>Upscaling Complete</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Your 4K Masterpiece is Ready</h1>
        <p className="text-slate-400 text-lg">Processed successfully using {resultData.provider === 'replicate' ? 'Replicate GPU Cluster' : 'Fal.ai Inference Network'}.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Original */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h3 className="font-medium text-slate-300">Original Resolution</h3>
            <span className="text-xs px-2 py-1 rounded bg-white/10 text-slate-300">Before</span>
          </div>
          <div className="aspect-video bg-black relative flex-1 flex items-center justify-center">
            {resultData.originalUrl ? (
              <video 
                src={resultData.originalUrl} 
                controls 
                className="w-full h-full object-contain"
                muted
              />
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <Play className="w-12 h-12 mb-2 opacity-20" />
                <span>Original preview unavailable</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upscaled */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl overflow-hidden backdrop-blur-sm flex flex-col shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 pointer-events-none" />
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 relative z-10">
            <h3 className="font-medium text-indigo-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Upscaled 4K
            </h3>
            <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">After</span>
          </div>
          <div className="aspect-video bg-black relative flex-1">
            <video 
              src={resultData.result} 
              controls 
              className="w-full h-full object-contain"
              autoPlay
              muted
              loop
            />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-medium text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
        >
          <Download className="w-5 h-5" />
          Download 4K Video
        </button>
        
        <Link
          to="/upload"
          className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 text-white font-medium text-lg flex items-center justify-center gap-2 border border-white/20 transition-all hover:bg-white/20"
        >
          <RefreshCcw className="w-5 h-5" />
          Upscale Another
        </Link>
      </motion.div>
    </div>
  );
}
