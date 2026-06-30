import React from 'react';
import { motion } from 'motion/react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-indigo max-w-none text-slate-300">
          <p className="lead text-xl text-slate-400 mb-8">
            Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our video upscaling service.
          </p>
          
          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">1. Data Collection</h2>
          <p className="mb-6">
            We only collect the minimum amount of data necessary to provide our service. When you upload a video, we process that specific file. We do not require you to create an account, so we do not collect personal identifiers like your name or email address unless you contact us for support.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">2. Video Processing and Storage</h2>
          <p className="mb-6">
            Uploaded videos are temporarily stored on secure servers solely for the purpose of processing. Once the upscaling is complete and the result is delivered to you, both the original and upscaled videos are automatically deleted from our servers. We do not claim any ownership over your content.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">3. Third-Party Services</h2>
          <p className="mb-6">
            We utilize enterprise-grade API providers (such as Replicate and Fal.ai) to perform the AI upscaling. Videos are securely transmitted to these providers, processed ephemerally, and are subject to their strict privacy and security protocols.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">4. Security</h2>
          <p className="mb-6">
            We implement industry-standard security measures to protect your videos during transmission and processing. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
