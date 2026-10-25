import { useEffect, useRef, useState } from "react";
import { ConnectionState } from "../types";
import { Sparkles, Maximize2, Minimize2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PriyaAvatarProps {
  state: ConnectionState;
}

export default function PriyaAvatar({ state }: PriyaAvatarProps) {
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const thinkingVideoRef = useRef<HTMLVideoElement>(null);
  const talkingVideoRef = useRef<HTMLVideoElement>(null);

  const [activeVideo, setActiveVideo] = useState<"idle" | "thinking" | "talking">("idle");
  const [hasVideoError, setHasVideoError] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Map ConnectionState to video type
  useEffect(() => {
    let target: "idle" | "thinking" | "talking" = "idle";
    
    if (state === "thinking" || state === "connecting") {
      target = "thinking";
    } else if (state === "speaking") {
      target = "talking";
    } else {
      target = "idle";
    }

    if (target !== activeVideo) {
      console.log(`PriyaAvatar state transition: ${activeVideo} -> ${target}`);
      
      const prevRef = getRef(activeVideo);
      const nextRef = getRef(target);

      if (nextRef.current) {
        nextRef.current.play().catch((err) => {
          console.warn(`Autoplay or play error for ${target}:`, err);
        });
      }

      setActiveVideo(target);

      // Keep previous video playing briefly during cross-fade transition before pausing
      const timeout = setTimeout(() => {
        if (prevRef.current && target !== activeVideo) {
          try {
            prevRef.current.pause();
          } catch (e) {}
        }
      }, 600);

      return () => clearTimeout(timeout);
    }
  }, [state, activeVideo]);

  const getRef = (type: "idle" | "thinking" | "talking") => {
    if (type === "thinking") return thinkingVideoRef;
    if (type === "talking") return talkingVideoRef;
    return idleVideoRef;
  };

  useEffect(() => {
    if (idleVideoRef.current) {
      idleVideoRef.current.load();
      idleVideoRef.current.play().catch((e) => {
        console.log("Idle video play on mount caught/prevented:", e);
      });
    }
  }, []);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === "contain" ? "cover" : "contain"));
  };

  return (
    <div
      id="priya-video-stage"
      className={`relative w-full flex items-center justify-center transition-all duration-300 ${
        isFullScreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-2 sm:p-6"
          : "h-[58vh] sm:h-[65vh] md:h-[72vh] lg:h-[76vh] max-w-3xl mx-auto rounded-3xl overflow-hidden bg-slate-950/60 border border-white/10 shadow-2xl backdrop-blur-md"
      }`}
    >
      {/* Controls Bar on Top Right of Video Stage */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <button
          onClick={toggleFitMode}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 transition shadow-lg cursor-pointer"
          title={fitMode === "contain" ? "Switch to Fill Crop" : "Switch to Full Image Uncropped"}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>{fitMode === "contain" ? "Entire Image" : "Fill Screen"}</span>
        </button>

        <button
          onClick={toggleFullScreen}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 backdrop-blur-md text-white transition shadow-lg cursor-pointer"
          title={isFullScreen ? "Exit Fullscreen" : "Enter Mobile Fullscreen"}
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4 text-pink-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-pink-400" />
          )}
        </button>
      </div>

      {/* Glow Rings & Lighting Behind Priya */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          state === "speaking"
            ? "bg-pink-500/10"
            : state === "listening"
            ? "bg-cyan-500/10"
            : state === "thinking"
            ? "bg-blue-500/10"
            : "bg-transparent"
        } pointer-events-none z-0`}
      />

      {/* Decorative Cyber Grid Background behind Priya */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />

      {/* Video Objects with Framer Motion Cross-Fade Transitions */}
      {/* 1. Priya Idle Video */}
      <motion.video
        ref={idleVideoRef}
        id="video-priya-idle"
        src="/priya_idle.mp4"
        initial={{ opacity: 1 }}
        animate={{
          opacity: activeVideo === "idle" && !hasVideoError ? 1 : 0,
          scale: activeVideo === "idle" ? 1 : 1.02,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-0 w-full h-full ${
          fitMode === "contain" ? "object-contain object-top" : "object-cover object-top"
        } ${isFullScreen ? "rounded-none" : "rounded-3xl"} z-10 ${
          activeVideo === "idle" ? "pointer-events-auto" : "pointer-events-none"
        }`}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        onError={() => setHasVideoError(true)}
      />

      {/* 2. Priya Thinking Video */}
      <motion.video
        ref={thinkingVideoRef}
        id="video-priya-thinking"
        src="/priya_thinking.mp4"
        initial={{ opacity: 0 }}
        animate={{
          opacity: activeVideo === "thinking" && !hasVideoError ? 1 : 0,
          scale: activeVideo === "thinking" ? 1 : 1.02,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-0 w-full h-full ${
          fitMode === "contain" ? "object-contain object-top" : "object-cover object-top"
        } ${isFullScreen ? "rounded-none" : "rounded-3xl"} z-10 ${
          activeVideo === "thinking" ? "pointer-events-auto" : "pointer-events-none"
        }`}
        muted
        playsInline
        loop
        preload="none"
        onError={() => setHasVideoError(true)}
      />

      {/* 3. Priya Talking Video */}
      <motion.video
        ref={talkingVideoRef}
        id="video-priya-talking"
        src="/priya_talking.mp4"
        initial={{ opacity: 0 }}
        animate={{
          opacity: activeVideo === "talking" && !hasVideoError ? 1 : 0,
          scale: activeVideo === "talking" ? 1 : 1.02,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`absolute inset-0 w-full h-full ${
          fitMode === "contain" ? "object-contain object-top" : "object-cover object-top"
        } ${isFullScreen ? "rounded-none" : "rounded-3xl"} z-10 ${
          activeVideo === "talking" ? "pointer-events-auto" : "pointer-events-none"
        }`}
        muted
        playsInline
        loop
        preload="none"
        onError={() => setHasVideoError(true)}
      />

      {/* Ambient glowing video clone in the background when in contain mode */}
      <AnimatePresence mode="wait">
        {fitMode === "contain" && !hasVideoError && (
          <motion.div
            key="ambient-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 overflow-hidden pointer-events-none z-0 filter blur-3xl scale-125"
          >
            <video
              src={
                activeVideo === "talking"
                  ? "/priya_talking.mp4"
                  : activeVideo === "thinking"
                  ? "/priya_thinking.mp4"
                  : "/priya_idle.mp4"
              }
              className="w-full h-full object-cover object-top transition-all duration-500"
              muted
              playsInline
              autoPlay
              loop
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant AI Orb Placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030712] z-0">
        <div className="relative flex items-center justify-center w-48 h-48">
          <div className="absolute inset-0 rounded-full border-2 border-pink-500/10 animate-ping duration-1000" />
          <div className="absolute inset-4 rounded-full border border-cyan-500/20 animate-pulse duration-1500" />
          <div className="absolute inset-10 rounded-full border border-indigo-500/30 animate-pulse duration-2000" />
          
          <div className="absolute inset-14 rounded-full bg-gradient-to-tr from-pink-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/5 flex items-center justify-center shadow-3xl shadow-pink-500/5">
            <div className="p-3 rounded-full bg-slate-900/80 border border-white/10">
              <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 font-mono tracking-widest uppercase mt-6 text-center px-4 animate-pulse">
          {hasVideoError ? "Virtual Hologram Mode" : "Awakening Priya Companion..."}
        </p>
      </div>

      {/* Real-time State Overlays on top of the video */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-xl border ${
              state === "disconnected"
                ? "bg-slate-900/90 text-slate-400 border-slate-700/50"
                : state === "connecting"
                ? "bg-blue-950/90 text-blue-400 border-blue-500/30 animate-pulse"
                : state === "listening"
                ? "bg-cyan-950/90 text-cyan-400 border-cyan-500/30"
                : state === "thinking"
                ? "bg-indigo-950/90 text-indigo-400 border-indigo-500/30 animate-bounce"
                : state === "idle"
                ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/30"
                : "bg-pink-950/90 text-pink-400 border-pink-500/30"
            }`}
          >
            {state === "disconnected" && "Offline"}
            {state === "connecting" && "Summoning Priya..."}
            {state === "listening" && "Listening"}
            {state === "thinking" && "Priya is Thinking"}
            {state === "speaking" && "Priya is Speaking"}
            {state === "idle" && "Priya is Ready"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Visual audio reactive indicators */}
      {state === "listening" && (
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent animate-pulse pointer-events-none z-20" />
      )}
      {state === "speaking" && (
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent animate-pulse pointer-events-none z-20" />
      )}
    </div>
  );
}


