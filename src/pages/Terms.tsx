import React from 'react';
import { motion } from 'motion/react';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert prose-indigo max-w-none text-slate-300">
          <p className="lead text-xl text-slate-400 mb-8">
            Please read these terms carefully before using our AI video upscaling service.
          </p>
          
          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-6">
            By accessing or using our website and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">2. Acceptable Use</h2>
          <p className="mb-6">
            You agree not to use the service to upscale any content that is illegal, infringes on intellectual property rights, or contains explicit/harmful material. We reserve the right to refuse service to anyone for any reason at any time.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">3. Service Availability</h2>
          <p className="mb-6">
            We strive to provide 99.9% uptime. However, processing times and service availability may vary based on server load and API provider status. We provide fallback mechanisms to ensure reliability, but we are not liable for temporary interruptions.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">4. Intellectual Property</h2>
          <p className="mb-6">
            You retain all rights to the videos you upload. By uploading a video, you grant us a temporary license to process it solely for the purpose of providing the upscaling service. We do not claim any rights to the generated outputs.
          </p>
          
          <h2 className="text-2xl font-semibold text-white mt-10 mb-4">5. Limitation of Liability</h2>
          <p className="mb-6">
            The service is provided "as is". We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
