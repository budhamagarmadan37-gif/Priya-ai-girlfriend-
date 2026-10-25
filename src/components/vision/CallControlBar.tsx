import React from "react";
import { motion } from "motion/react";
import { 
  Mic, 
  Power, 
  RefreshCw, 
  Sparkles, 
  Monitor, 
  ScreenShare, 
  Camera, 
  CameraOff, 
  Square, 
  Code2, 
  AlertCircle
} from "lucide-react";
import { ConnectionState, ScreenShareState, CameraState } from "../../types";

interface CallControlBarProps {
  connectionState: ConnectionState;
  screenShareState: ScreenShareState;
  cameraState: CameraState;
  onToggleSession: () => void;
  onToggleScreenShare: () => void;
  onToggleCamera: () => void;
  onOpenBuilder: () => void;
  onStopScreenShare: () => void;
}

export default function CallControlBar({
  connectionState,
  screenShareState,
  cameraState,
  onToggleSession,
  onToggleScreenShare,
  onToggleCamera,
  onOpenBuilder,
  onStopScreenShare,
}: CallControlBarProps) {
  const isConnected = connectionState !== "disconnected";
  const isConnecting = connectionState === "connecting";
  const isScreenActive = screenShareState === "active" || screenShareState === "paused";
  const isScreenRequesting = screenShareState === "requesting";
  const isScreenDenied = screenShareState === "denied";
  const isScreenUnsupported = screenShareState === "unsupported";

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Control Buttons Container */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 p-2.5 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
        
        {/* 1. Camera Toggle Button */}
        <motion.button
          type="button"
          onClick={onToggleCamera}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title={cameraState.isOpen ? "Close Camera" : "Open Camera"}
          aria-label={cameraState.isOpen ? "Close Device Camera" : "Open Device Camera"}
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border
            ${cameraState.isOpen 
              ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/30" 
              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }
          `}
        >
          {cameraState.isOpen ? (
            <CameraOff className="w-5 h-5" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          {cameraState.isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          )}
        </motion.button>

        {/* 2. Screen Share Button (Prominent futuristic circular button) */}
        <motion.button
          type="button"
          onClick={onToggleScreenShare}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          disabled={isScreenUnsupported}
          title={
            isScreenUnsupported
              ? "Screen Share Unsupported on this Browser"
              : isScreenDenied
              ? "Permission Denied (Tap to Retry)"
              : isScreenActive
              ? "Screen Sharing Active (Tap for options)"
              : isScreenRequesting
              ? "Requesting OS Permission..."
              : "Share Mobile/Desktop Screen with Priya"
          }
          aria-label="Toggle Screen Sharing"
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border
            ${isScreenUnsupported 
              ? "bg-slate-800/40 border-slate-700 text-slate-600 cursor-not-allowed" 
              : isScreenDenied
              ? "bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/30"
              : isScreenRequesting
              ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse"
              : isScreenActive
              ? "bg-gradient-to-tr from-cyan-500/30 to-blue-500/30 border-cyan-400 text-cyan-300 shadow-xl shadow-cyan-500/40"
              : "bg-white/5 border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10"
            }
          `}
        >
          {isScreenRequesting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : isScreenDenied ? (
            <AlertCircle className="w-5 h-5" />
          ) : isScreenActive ? (
            <ScreenShare className="w-5 h-5 text-cyan-300 animate-pulse" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}

          {isScreenActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
          )}
        </motion.button>

        {/* 3. Central Voice Session Core (Mic / Power) */}
        <motion.button
          type="button"
          onClick={onToggleSession}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          title={isConnected ? "End Voice Call" : "Connect with Priya"}
          aria-label={isConnected ? "End Voice Call with Priya" : "Awaken Priya"}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border-2 shadow-2xl
            ${!isConnected 
              ? "bg-slate-900 border-red-500/50 text-red-400 hover:border-red-400 hover:text-red-300 shadow-red-500/20" 
              : isConnecting
              ? "bg-slate-900 border-cyan-500/60 text-cyan-400 animate-pulse cursor-wait"
              : connectionState === "speaking"
              ? "bg-pink-500 border-pink-300 text-white shadow-pink-500/40"
              : "bg-cyan-500 border-cyan-300 text-slate-950 shadow-cyan-500/40 hover:bg-cyan-400"
            }
          `}
        >
          {!isConnected ? (
            <Power className="w-7 h-7" />
          ) : isConnecting ? (
            <RefreshCw className="w-7 h-7 animate-spin" />
          ) : connectionState === "speaking" ? (
            <Sparkles className="w-7 h-7 animate-pulse" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </motion.button>

        {/* 4. AI Website Builder Button */}
        <motion.button
          type="button"
          onClick={onOpenBuilder}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          title="Open AI Website Builder"
          aria-label="Open AI Website Builder"
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border bg-white/5 border-white/10 text-slate-400 hover:text-pink-300 hover:border-pink-500/40 hover:bg-pink-500/10"
        >
          <Code2 className="w-5 h-5" />
        </motion.button>

        {/* 5. End Call / Stop Sharing Shortcut Button */}
        {isScreenActive ? (
          <motion.button
            type="button"
            onClick={onStopScreenShare}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title="Stop Screen Sharing"
            aria-label="Stop Screen Sharing"
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
          >
            <Square className="w-4 h-4 fill-red-400" />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={isConnected ? onToggleSession : onToggleSession}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            title={isConnected ? "Disconnect Call" : "Connect Call"}
            aria-label={isConnected ? "Disconnect Voice Session" : "Connect Voice Session"}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Power className="w-5 h-5 text-red-400/80" />
          </motion.button>
        )}
      </div>

      {/* Button Subtitles / Active State Chips */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
        {isScreenActive && (
          <span className="flex items-center gap-1 text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            SCREEN SHARING ACTIVE
          </span>
        )}
        {cameraState.isOpen && (
          <span className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            CAMERA ACTIVE
          </span>
        )}
      </div>
    </div>
  );
}
