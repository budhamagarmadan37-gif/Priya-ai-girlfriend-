import React, { useEffect, useRef, useState, useMemo } from "react";
import { ProjectFile, ConsoleLogEntry } from "../../types";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCw, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Sparkles 
} from "lucide-react";

interface LivePreviewProps {
  files: ProjectFile[];
  onConsoleLog: (entry: ConsoleLogEntry) => void;
  localPort?: number;
  isGenerating?: boolean;
  prompt?: string;
  onQuickStart?: (prompt: string) => void;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

export default function LivePreview({
  files,
  onConsoleLog,
  localPort = 3000,
  isGenerating = false,
  prompt = "",
  onQuickStart,
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const hasFiles = files.some(f => f.name === "index.html" && f.content.trim().length > 0);

  // Compile bundled HTML with inline CSS, JS, and console capture bridge
  const compiledHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.name === "index.html");
    const cssFile = files.find((f) => f.name === "style.css");
    const jsFile = files.find((f) => f.name === "script.js");

    if (!htmlFile) {
      return "";
    }

    let rawHtml = htmlFile.content;

    // Bridge script for capturing iframe console logs safely
    const bridgeScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalWarn = console.warn;
          const originalError = console.error;
          const originalInfo = console.info;

          function sendLog(type, args) {
            try {
              const message = Array.from(args).map(arg => {
                if (typeof arg === 'object') {
                  try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                }
                return String(arg);
              }).join(' ');

              window.parent.postMessage({
                source: 'priya-sandbox-preview',
                type: type,
                message: message,
                timestamp: Date.now()
              }, '*');
            } catch(e) {}
          }

          console.log = function() { sendLog('log', arguments); originalLog.apply(console, arguments); };
          console.warn = function() { sendLog('warn', arguments); originalWarn.apply(console, arguments); };
          console.error = function() { sendLog('error', arguments); originalError.apply(console, arguments); };
          console.info = function() { sendLog('info', arguments); originalInfo.apply(console, arguments); };

          window.onerror = function(msg, url, line) {
            sendLog('error', ['[Runtime Error] ' + msg + ' (Line ' + line + ')']);
          };
        })();
      </script>
    `;

    // Inject CSS
    if (cssFile && !rawHtml.includes("<style>")) {
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      if (rawHtml.includes("</head>")) {
        rawHtml = rawHtml.replace("</head>", `${styleTag}\n</head>`);
      } else {
        rawHtml = `<head>${styleTag}</head>\n${rawHtml}`;
      }
    }

    // Inject Bridge and JS
    let jsInject = bridgeScript;
    if (jsFile) {
      jsInject += `\n<script>\ntry {\n${jsFile.content}\n} catch(err) {\n  console.error('[Script Exception] ' + err.message);\n}\n</script>`;
    }

    if (rawHtml.includes("</body>")) {
      rawHtml = rawHtml.replace("</body>", `${jsInject}\n</body>`);
    } else {
      rawHtml += `\n${jsInject}`;
    }

    return rawHtml;
  }, [files]);

  // Listen for console logs from sandbox
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === "priya-sandbox-preview") {
        onConsoleLog({
          id: `log_${Date.now()}_${Math.random()}`,
          type: event.data.type || "log",
          message: event.data.message || "",
          timestamp: event.data.timestamp || Date.now(),
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleLog]);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleOpenStandalone = () => {
    const blob = new Blob([compiledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-full bg-[#050811] overflow-hidden select-none">
      {/* Top Browser Bar & Viewport Controls */}
      <div className="bg-[#090d16] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Localhost Address Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs text-slate-300 w-full overflow-hidden">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[11px] truncate text-slate-400">
              http://localhost:{localPort}
            </span>
            <span className="ml-auto flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Reload Preview"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>

        {/* Viewport Width Switchers */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewport("desktop")}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewport === "desktop"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Desktop Viewport (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setViewport("tablet")}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewport === "tablet"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setViewport("mobile")}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewport === "mobile"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Security & External Open Action */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Isolated Sandbox</span>
          </div>

          <button
            onClick={handleOpenStandalone}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center gap-1 text-xs transition cursor-pointer"
            title="Open In Standalone Browser Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </button>
        </div>
      </div>

      {/* Frame Container Stage */}
      <div className="flex-1 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#030712] flex items-center justify-center p-2 sm:p-4">
        {isGenerating ? (
          /* Live AI Synthesis Stage */
          <div className="w-full max-w-lg bg-[#0b101d] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10 text-center space-y-4 animate-in fade-in">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-pink-400 border-b-transparent animate-spin" style={{ animationDirection: 'reverse' }} />
              <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>

            <div>
              <h3 className="text-white font-bold text-base flex items-center justify-center gap-2">
                <span>Priya AI is Coding Your Website</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {prompt ? `"${prompt}"` : "Writing HTML5, responsive CSS3, and modern interactive JavaScript..."}
              </p>
            </div>

            {/* Simulated Live Terminal Stream */}
            <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-cyan-300 space-y-1.5 shadow-inner">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span>localhost:3000 • ai-compiler</span>
              </div>
              <p className="text-slate-300 flex items-center gap-1.5">
                <span className="text-pink-400">⚡</span> Analyzing UI architecture & responsive grid...
              </p>
              <p className="text-cyan-300 flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> Synthesizing index.html, style.css, script.js...
              </p>
              <p className="text-emerald-400 flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Initializing isolated sandbox on http://localhost:{localPort}...
              </p>
            </div>
          </div>
        ) : !hasFiles ? (
          /* Starter Guidance State */
          <div className="w-full max-w-md bg-[#090e1a] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-cyan-500 p-0.5 mx-auto">
              <div className="w-full h-full bg-[#090e1a] rounded-[14px] flex items-center justify-center">
                <Globe className="w-6 h-6 text-cyan-400" />
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-base">Ready to Build Your Website</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Describe any website or choose a 1-click starter below. Priya will write the complete production code and launch it live on localhost.
              </p>
            </div>

            {onQuickStart && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onQuickStart("Create a Netflix-style movie streaming website with dark neon UI, trailer modals, trending carousels, and watchlist")}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 rounded-xl text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-pink-300">🎬 Movie Stream</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Dark Cinema UI</div>
                </button>

                <button
                  type="button"
                  onClick={() => onQuickStart("Create a futuristic portfolio website for an app developer with dark mode, interactive projects, and contact form")}
                  className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-left transition cursor-pointer"
                >
                  <div className="text-xs font-bold text-cyan-300">🚀 Dev Portfolio</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Modern 3D style</div>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Live Interactive Website Frame */
          <div
            className={`h-full transition-all duration-300 flex flex-col bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-700 ${
              viewport === "desktop"
                ? "w-full"
                : viewport === "tablet"
                ? "w-[768px] max-w-full"
                : "w-[375px] max-w-full"
            }`}
          >
            {/* Top bezel for mobile/tablet */}
            {viewport !== "desktop" && (
              <div className="bg-slate-900 px-3 py-1 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800">
                <span className="font-mono">
                  {viewport === "tablet" ? "iPad • 768px" : "iPhone • 375px"}
                </span>
                <div className="w-12 h-2 rounded-full bg-slate-800 mx-auto" />
                <span>100%</span>
              </div>
            )}

            {/* Secure Isolated Sandboxed IFrame */}
            <iframe
              key={key}
              ref={iframeRef}
              srcDoc={compiledHtml}
              title="Priya Generated Website Preview"
              sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
              className="w-full flex-1 border-0 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
