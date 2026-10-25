import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ExternalLink, 
  Search, 
  MapPin, 
  Camera, 
  Settings, 
  CheckCircle2, 
  X,
  Youtube
} from "lucide-react";
import { DeviceActionPayload } from "../../types";

interface DeviceActionToastProps {
  action: DeviceActionPayload | null;
  onDismiss: () => void;
}

export default function DeviceActionToast({
  action,
  onDismiss,
}: DeviceActionToastProps) {
  useEffect(() => {
    if (action) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [action, onDismiss]);

  if (!action) return null;

  const getIcon = () => {
    switch (action.action) {
      case "open_youtube":
        return <Youtube className="w-5 h-5 text-red-400" />;
      case "search_google":
        return <Search className="w-5 h-5 text-blue-400" />;
      case "open_maps":
        return <MapPin className="w-5 h-5 text-emerald-400" />;
      case "open_camera":
      case "take_photo":
        return <Camera className="w-5 h-5 text-cyan-400" />;
      case "open_settings":
        return <Settings className="w-5 h-5 text-amber-400" />;
      default:
        return <ExternalLink className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        aria-label="Device action notification"
        className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-slate-900/95 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl shadow-cyan-500/20 text-white flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Priya Action Executed
            </div>
            <p className="text-xs font-semibold text-slate-100 truncate">
              {action.displayName}
            </p>
            {action.target && (
              <p className="text-[10px] text-slate-400 truncate">
                {action.target}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.aside>
    </AnimatePresence>
  );
}
