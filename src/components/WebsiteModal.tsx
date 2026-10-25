import { useEffect, useState } from "react";
import { WebsiteAction } from "../types";
import { ExternalLink, Globe, Sparkles } from "lucide-react";

interface WebsiteModalProps {
  action: WebsiteAction | null;
  onClose: () => void;
}

export default function WebsiteModal({ action, onClose }: WebsiteModalProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!action) return;
    setCountdown(5);

    // Attempt to open automatically, catching iframe blockages
    try {
      const newWindow = window.open(action.url, "_blank");
      if (!newWindow) {
        console.warn("Popup blocked by browser inside iframe");
      }
    } catch (e) {
      console.error("Failed to open popup automatically:", e);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [action]);

  if (!action) return null;

  return (
    <div id="website-action-panel" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom duration-300">
      <div className="relative overflow-hidden bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 shadow-[0_0_50px_-12px_rgba(6,182,212,0.4)]">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent blur-xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div id="action-icon" className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30 text-cyan-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-400" /> Priya Triggered Action
              </span>
            </div>
            
            <h3 className="text-white font-medium text-lg mt-0.5 leading-snug">
              Opening {action.name}
            </h3>
            
            <p className="text-slate-400 text-xs truncate mt-1">
              {action.url}
            </p>
          </div>
        </div>

        {/* Status and Action bar */}
        <div className="mt-4 flex items-center justify-between gap-4 pt-3 border-t border-white/5">
          <div className="text-[11px] text-slate-400 font-mono">
            {countdown > 0 ? (
              <span>Pop-up sent (Ready in {countdown}s)</span>
            ) : (
              <span className="text-emerald-400">Link active</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              id="btn-dismiss-action"
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/15 transition rounded-lg text-xs font-medium text-slate-300 border border-white/5"
            >
              Close
            </button>
            
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-launch-website"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:opacity-90 transition shadow-lg shadow-cyan-500/20 rounded-lg text-xs font-semibold text-white"
            >
              Visit Website <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
