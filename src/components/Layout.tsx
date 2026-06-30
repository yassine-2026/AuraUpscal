import React from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Zap, Shield, HelpCircle, Mail, Sparkles } from 'lucide-react';
import ThreeBackground from './ThreeBackground';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30">
      <ThreeBackground />
      
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Lumina<span className="text-indigo-400">AI</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/" className="text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link to="/faq" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> FAQ</Link>
            <Link to="/contact" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"><Mail className="w-4 h-4" /> Contact</Link>
            <Link to="/upload" className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all hover:scale-105">
              Upscale Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content with Route Transitions */}
      <main className="pt-20 min-h-[calc(100vh-100px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} LuminaAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
