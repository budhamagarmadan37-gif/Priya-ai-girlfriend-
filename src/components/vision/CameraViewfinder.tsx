import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  SwitchCamera, 
  X, 
  Sparkles, 
  Download, 
  Eye, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { CameraState } from "../../types";

interface CameraViewfinderProps {
  state: CameraState;
  onClose: () => void;
  onSwitchFacing: () => void;
  onCapturePhoto: () => { base64: string; dataUrl: string } | null;
  onAnalyzePhoto: (base64: string) => void;
  attachStreamToVideo: (video: HTMLVideoElement) => void;
}

export default function CameraViewfinder({
  state,
  onClose,
  onSwitchFacing,
  onCapturePhoto,
  onAnalyzePhoto,
  attachStreamToVideo,
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photoPreview, setPhotoPreview] = useState<{ base64: string; dataUrl: string } | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);

  useEffect(() => {
    if (videoRef.current && state.isOpen) {
      attachStreamToVideo(videoRef.current);
    }
  }, [state.isOpen, state.isStreaming, attachStreamToVideo]);

  if (!state.isOpen) return null;

  const handleCapture = () => {
    // Trigger shutter flash animation
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const result = onCapturePhoto();
    if (result) {
      setPhotoPreview(result);
    }
  };

  const handleAskPriyaAboutPhoto = () => {
    if (photoPreview) {
      onAnalyzePhoto(photoPreview.base64);
    }
  };

  const handleDownload = () => {
    if (!photoPreview) return;
    const a = document.createElement("a");
    a.href = photoPreview.dataUrl;
    a.download = `priya-capture-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-500/20 flex flex-col"
        >
          {/* Shutter Flash Animation */}
          {isFlashActive && (
            <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
          )}

          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 bg-slate-900/80 border-b border-white/10 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center">
                <Camera className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Device Camera Vision</h4>
                <p className="text-[10px] text-slate-400">
                  {state.facingMode === "user" ? "Front-Facing Selfie Mode" : "Rear Environment Mode"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchFacing}
                title="Switch Front/Rear Camera"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Camera"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Viewfinder Canvas / Video Feed */}
          <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
            {state.error ? (
              <div className="p-6 text-center text-red-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto" />
                <p className="text-xs font-semibold">{state.error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-500/20 rounded-xl text-xs hover:bg-red-500/30 text-white transition"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    state.facingMode === "user" ? "scale-x-[-1]" : ""
                  }`}
                />

                {/* Neon Viewfinder HUD Reticle Overlay */}
                <div className="absolute inset-6 border border-cyan-500/20 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                    <span className="w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 border border-cyan-400/30 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                    <span className="w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300">
                  LIVE SENSOR FEED
                </div>
              </>
            )}
          </div>

          {/* Captured Photo Preview Bar */}
          {photoPreview && (
            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={photoPreview.dataUrl}
                  alt="Captured photo thumbnail preview"
                  className="w-10 h-10 rounded-lg object-cover border border-cyan-400/50"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Captured Photo
                  </span>
                  <p className="text-[10px] text-slate-400 truncate">Ready for Priya analysis or download</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAskPriyaAboutPhoto}
                  className="px-2.5 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Eye className="w-3 h-3" /> Ask Priya
                </button>
                <button
                  onClick={handleDownload}
                  title="Download photo"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Shutter Controls */}
          <div className="p-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-around">
            <button
              onClick={onSwitchFacing}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition text-[10px] cursor-pointer"
            >
              <SwitchCamera className="w-5 h-5" />
              <span>Flip</span>
            </button>

            {/* Shutter Button */}
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-cyan-400 bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-xl shadow-cyan-500/30"
              title="Take Photo"
            >
              <div className="w-11 h-11 rounded-full bg-cyan-400 flex items-center justify-center text-slate-950">
                <Camera className="w-5 h-5" />
              </div>
            </button>

            <button
              onClick={onClose}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition text-[10px] cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
