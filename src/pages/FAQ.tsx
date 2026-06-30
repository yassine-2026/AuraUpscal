import React from 'react';
import { motion } from 'motion/react';

const faqs = [
  {
    q: "How does the AI upscaling work?",
    a: "We use state-of-the-art neural networks (like ESRGAN) to analyze your video frame by frame. The AI predicts and reconstructs missing details, textures, and edges, creating a true 4K output rather than just stretching the pixels."
  },
  {
    q: "What file formats are supported?",
    a: "We support most common video formats including MP4, MOV, AVI, MKV, WEBM, and MPEG. The maximum file size per upload is currently 100MB."
  },
  {
    q: "Is my data secure?",
    a: "Yes. Videos are processed ephemerally on secure GPU clusters. We do not store your original or upscaled videos permanently. They are automatically deleted from our temporary storage after processing."
  },
  {
    q: "How long does processing take?",
    a: "Processing time depends on the length and original resolution of your video. Typically, a 10-second clip takes about 1-3 minutes. Our backend automatically routes your request to the fastest available GPU provider."
  }
];

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-slate-400 text-lg">Everything you need to know about our AI video upscaling.</p>
      </motion.div>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <h3 className="text-xl font-medium mb-3">{faq.q}</h3>
            <p className="text-slate-400 leading-relaxed">{faq.a}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
