import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Monitor, Shield, Sparkles, X, CheckCircle, Eye } from "lucide-react";

interface ScreenSharePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ScreenSharePermissionModal({
  isOpen,
  onClose,
  onConfirm,
}: ScreenSharePermissionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl shadow-cyan-500/20 overflow-hidden"
        >
          {/* Neon Glow Accents */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <Monitor className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" /> Priya Vision AI
              </div>
              <h3 className="text-lg font-bold text-white">Share Screen with Priya</h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Allow Priya to view your active screen so she can inspect websites, identify apps, explain error messages, and guide you in real-time.
          </p>

          {/* Key Points */}
          <div className="space-y-2.5 mb-6 bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Live Visual Understanding:</strong> Ask <em>"Priya, what's on my screen?"</em> or <em>"Read this error"</em> anytime.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Protected:</strong> Screen frames are never stored or recorded. You can stop sharing instantly with one tap.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span>
                <strong>Full OS Control:</strong> Your browser or operating system will prompt you to select the exact window or screen to share.
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition cursor-pointer border border-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Monitor className="w-4 h-4" /> Start Sharing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
