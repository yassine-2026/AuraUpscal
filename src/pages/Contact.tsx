import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send } from 'lucide-react';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-[calc(100vh-200px)] flex flex-col md:flex-row gap-16 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Get in Touch</h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          Have questions about our enterprise plans, API access, or just want to say hi? We'd love to hear from you.
        </p>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Email us at</p>
              <p className="text-lg font-medium">hello@luminai.example.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Join our Discord</p>
              <p className="text-lg font-medium">LuminaAI Community</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm"
      >
        {sent ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 text-green-400">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-medium mb-2">Message Sent!</h3>
            <p className="text-slate-400">We'll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
              <input required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input required type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
              <textarea required rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" className="w-full py-4 rounded-xl bg-white text-black font-medium hover:bg-slate-200 transition-colors">
              Send Message
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
