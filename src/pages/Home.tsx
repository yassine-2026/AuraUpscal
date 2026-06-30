import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight, Wand2, Zap, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Next-Generation Video AI</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
        >
          Upscale to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">True 4K</span> <br className="hidden md:block" />
          with AI Precision.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
        >
          Transform your blurry, low-resolution videos into crystal-clear masterpieces. 
          Powered by state-of-the-art neural networks, automatically orchestrated for 
          maximum speed and reliability.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/upload"
            className="group relative flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium text-lg overflow-hidden transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Wand2 className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start Upscaling</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32 w-full">
        {[
          {
            icon: <Zap className="w-6 h-6 text-indigo-400" />,
            title: "Lightning Fast",
            desc: "Smart routing between top-tier GPU clusters ensures your videos process in record time."
          },
          {
            icon: <Wand2 className="w-6 h-6 text-purple-400" />,
            title: "True Detail Recovery",
            desc: "Not just sharpening. Our AI actually recreates missing details for flawless 4K output."
          },
          {
            icon: <Shield className="w-6 h-6 text-pink-400" />,
            title: "Enterprise Grade",
            desc: "Secure processing with automatic failover. Your data is ephemeral and never stored."
          }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              {feat.icon}
            </div>
            <h3 className="text-xl font-medium mb-3">{feat.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
