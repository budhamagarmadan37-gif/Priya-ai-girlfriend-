import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Monitor, 
  Pause, 
  Play, 
  Square, 
  Scan, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  CheckCircle2, 
  Sparkles,
  Layers
} from "lucide-react";
import { ScreenShareState, ScreenVisionAnalysis, VisionAnalysisStatus } from "../../types";

interface ScreenShareHUDProps {
  state: ScreenShareState;
  analysisStatus: VisionAnalysisStatus;
  latestAnalysis: ScreenVisionAnalysis | null;
  previewUrl: string | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onTriggerAnalysis: () => void;
}

export default function ScreenShareHUD({
  state,
  analysisStatus,
  latestAnalysis,
  previewUrl,
  onPause,
  onResume,
  onStop,
  onTriggerAnalysis,
}: ScreenShareHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (state === "off" || state === "unsupported") {
    return null;
  }

  const isPaused = state === "paused";
  const isAnalyzing = analysisStatus === "analyzing" || analysisStatus === "capturing";

  return (
    <motion.aside
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      aria-label="Screen sharing controls and status"
      className="fixed top-20 right-4 sm:right-6 z-40 max-w-sm w-full bg-slate-900/90 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-3.5 shadow-2xl shadow-cyan-500/20 text-white"
    >
      {/* Top Status Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isPaused 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" 
                : isAnalyzing
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse"
                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/30"
            }`}>
              <Monitor className="w-4 h-4" />
            </div>
            {!isPaused && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                {isPaused 
                  ? "Sharing Paused" 
                  : isAnalyzing 
                  ? "Looking at your screen..." 
                  : "Screen Sharing Active"}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {isPaused 
                ? "Screen feed temporarily halted" 
                : isAnalyzing 
                ? "Priya is analyzing visible elements..." 
                : "Priya can analyze your shared screen."}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Analyze Now Button */}
          <button
            onClick={onTriggerAnalysis}
            disabled={isPaused || isAnalyzing}
            title="Inspect screen now"
            className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/30 transition disabled:opacity-40 cursor-pointer"
          >
            <Scan className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
          </button>

          {/* Pause / Resume */}
          {isPaused ? (
            <button
              onClick={onResume}
              title="Resume sharing"
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/30 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onPause}
              title="Pause sharing"
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/30 transition cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Stop Sharing */}
          <button
            onClick={onStop}
            title="Stop screen sharing"
            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-500/30 transition cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle preview and details"
            className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Section: Live Thumbnail & Recent Vision Observation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/10 space-y-2.5 overflow-hidden text-xs"
          >
            {/* Live Screen Thumbnail Preview */}
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black/60 aspect-video flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Live shared screen thumbnail preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 backdrop-blur-md text-[9px] font-mono text-cyan-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  LIVE PREVIEW
                </div>
              </div>
            )}

            {/* Latest Vision Insights */}
            {latestAnalysis && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Screen Analysis Complete
                  </span>
                  <span>{new Date(latestAnalysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {latestAnalysis.description}
                </p>

                {latestAnalysis.detectedElements && latestAnalysis.detectedElements.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {latestAnalysis.detectedElements.map((el, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-slate-300 font-mono">
                        {el}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Spoken Prompts Guide */}
            <div className="text-[10px] text-slate-400 bg-white/5 rounded-xl p-2 space-y-1 font-sans">
              <p className="font-semibold text-slate-300">💡 Voice Commands to Try:</p>
              <p className="text-cyan-300">"Priya, screen par kya dikh raha hai?"</p>
              <p className="text-cyan-300">"Read the text on this screen."</p>
              <p className="text-cyan-300">"What does this error message mean?"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
