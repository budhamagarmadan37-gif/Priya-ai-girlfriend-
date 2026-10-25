import React, { useState, useEffect, useRef } from "react";
import { 
  ProjectFile, 
  WebsiteRequirementAnalysis, 
  AIModelOption, 
  AgentStep, 
  ValidationIssue, 
  ProjectVersion,
  ConsoleLogEntry 
} from "../../types";
import FileExplorer from "./FileExplorer";
import CodeEditor from "./CodeEditor";
import LivePreview from "./LivePreview";
import AgentActivityPanel from "./AgentActivityPanel";
import BottomConsole from "./BottomConsole";
import { downloadProjectAsZip, downloadSingleFile } from "../../utils/zipExporter";
import { exportWebsiteAsPdf } from "../../utils/pdfExporter";
import { 
  Sparkles, 
  Download, 
  FileDown, 
  Printer, 
  Wand2, 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Code2, 
  FolderTree, 
  Play, 
  RefreshCw, 
  Sliders, 
  Check, 
  Layers, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Terminal as TerminalIcon,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WebsiteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  initialCategory?: string;
}

// Built-in starter website templates for 1-click generation
const STARTER_TEMPLATES = [
  {
    title: "Dev Portfolio",
    category: "Portfolio",
    prompt: "Create a modern futuristic developer portfolio for a full-stack engineer with dark mode, neon accents, interactive project showcase, skills grid, animated terminal hero, and a working contact modal.",
    badge: "Popular"
  },
  {
    title: "SaaS Analytics",
    category: "SaaS",
    prompt: "Build a sleek SaaS landing page for an AI analytics platform with dark glassmorphism, interactive pricing tier calculator, live metrics charts, customer testimonials, and an animated sticky navbar.",
    badge: "Trending"
  },
  {
    title: "Movie & Anime Hub",
    category: "Streaming",
    prompt: "Create a Netflix & Crunchyroll style dark streaming platform landing page with hero trailer banner, trending carousels, genre filter tabs, watch-later modal, and responsive mobile navigation.",
    badge: "Featured"
  },
  {
    title: "Gourmet Restaurant",
    category: "Restaurant",
    prompt: "Build an elegant, luxury gourmet restaurant website with an interactive digital menu, reservation booking modal with date/time pickers, chef's specials slider, and smooth parallax effects.",
    badge: "New"
  },
  {
    title: "Luxury Sneaker Store",
    category: "E-Commerce",
    prompt: "Build a high-energy cyberpunk sneaker store with 3D product cards, size selector, animated add-to-cart cart drawer with pricing calculations, and customer reviews.",
    badge: "Cool"
  },
  {
    title: "AI Tool Showcase",
    category: "AI Showcase",
    prompt: "Design a high-tech AI prompt engineering playground landing page with interactive prompt tester, feature comparison matrix, dark neon theme, and responsive FAQ accordion.",
    badge: "Pro"
  }
];

// Helper to safely parse JSON from responses and prevent "<!doctype" syntax errors on HTML error pages
async function safeFetchJson<T = any>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `Server error (${response.status})`);
    }
    return data;
  }

  // Handle HTML or non-JSON text error responses from proxies, timeouts, or servers
  const rawText = await response.text();
  if (rawText.includes("<!doctype") || rawText.includes("<html")) {
    throw new Error(`The website builder engine is temporarily busy (HTTP ${response.status}). Please try again in a moment.`);
  }
  throw new Error(rawText.slice(0, 150) || `Request failed with HTTP ${response.status}`);
}

export default function WebsiteBuilderModal({
  isOpen,
  onClose,
  initialPrompt = "",
  initialCategory = "",
}: WebsiteBuilderModalProps) {
  // Main Project State
  const [promptInput, setPromptInput] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFileName, setActiveFileName] = useState("index.html");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [originalFiles, setOriginalFiles] = useState<ProjectFile[]>([]);
  const [analysis, setAnalysis] = useState<WebsiteRequirementAnalysis | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  
  // Model Selector & Router
  const [models, setModels] = useState<AIModelOption[]>([
    {
      id: "auto-router",
      name: "⚡ Auto-Select Best Coding Model (Router)",
      description: "Intelligently analyzes requirements, benchmarks models, and automatically routes to the optimal coding engine.",
      speed: "Ultra Fast",
      codingScore: 99,
      contextLength: "Dynamic",
      recommended: true,
    },
    {
      id: "gemini-3.8-flash",
      name: "Gemini 3.8 Flash (High Fidelity Code)",
      description: "Ultra-fast response, exceptional HTML5/CSS3/JavaScript fidelity, 1M context.",
      speed: "Ultra Fast",
      codingScore: 98,
      contextLength: "1M tokens",
      recommended: false,
    },
    {
      id: "gemini-3.1-flash-lite",
      name: "Gemini 3.1 Flash Lite (High Speed Prototyping)",
      description: "Low-latency coding model designed for rapid prototyping with 1M tokens.",
      speed: "Ultra Fast",
      codingScore: 94,
      contextLength: "1M tokens",
      recommended: false,
    },
    {
      id: "gemini-flash-latest",
      name: "Gemini Flash Latest (Production Tier)",
      description: "Latest stable production Flash release with optimal rate limits.",
      speed: "Ultra Fast",
      codingScore: 97,
      contextLength: "1M tokens",
      recommended: false,
    },
    {
      id: "gemini-3.1-pro-preview",
      name: "Gemini 3.1 Pro Preview (Deep Architectural Reasoning)",
      description: "Maximum reasoning capability for complex logic, algorithms, and deep architectures.",
      speed: "Balanced",
      codingScore: 99,
      contextLength: "2M tokens",
      recommended: false,
    },
  ]);
  const [selectedModel, setSelectedModel] = useState("auto-router");

  // Versions History
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  // Improvement Dialog State
  const [isImproveOpen, setIsImproveOpen] = useState(false);
  const [improveInput, setImproveInput] = useState("");
  const [isImproving, setIsImproving] = useState(false);

  // Voice Recognition for Builder
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Mobile View Switcher
  const [mobileTab, setMobileTab] = useState<"preview" | "files" | "code" | "activity" | "improve">("preview");
  const [leftTab, setLeftTab] = useState<"files" | "code">("code");

  // Load Models from backend on mount
  useEffect(() => {
    safeFetchJson<{ models: AIModelOption[] }>("/api/builder/models", {})
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {});
  }, []);

  // Handle Initial Prompt if opened via voice or template
  useEffect(() => {
    if (isOpen && initialPrompt && (!files || files.length === 0)) {
      setPromptInput(initialPrompt);
      handleGenerate(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Voice Recognition setup
  const toggleVoiceInput = () => {
    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser. Please type your request.");
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListeningVoice(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setPromptInput(transcript);
    };

    recognition.onerror = () => {
      setIsListeningVoice(false);
    };

    recognition.onend = () => {
      setIsListeningVoice(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  // Clear/Reset project to build a fresh new website
  const handleResetProject = () => {
    setFiles([]);
    setOriginalFiles([]);
    setPromptInput("");
    setAnalysis(null);
    setSteps([]);
    setVersions([]);
    setValidationIssues([]);
    setLogs([]);
    setActiveFileName("index.html");
  };

  // Main Generation Handler
  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || promptInput;
    if (!promptToUse.trim() || isGenerating) return;

    setIsGenerating(true);
    // Automatically wipe previous code so new website generates clean and fresh
    setFiles([]);
    setOriginalFiles([]);
    setLogs([]);
    setValidationIssues([]);

    // Initialize UI steps
    const initialSteps: AgentStep[] = [
      {
        id: "step_analyze",
        title: "Requirement Analysis & Design Architecture",
        status: "running",
        detail: "Evaluating website type, color schemes, typography, and responsive hierarchy...",
        timestamp: Date.now(),
      }
    ];
    setSteps(initialSteps);

    try {
      const data = await safeFetchJson<{
        files: ProjectFile[];
        analysis: WebsiteRequirementAnalysis;
        steps: AgentStep[];
        validationIssues: ValidationIssue[];
        version?: ProjectVersion;
      }>("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          model: selectedModel,
        }),
      });

      setFiles(data.files || []);
      setOriginalFiles(data.files || []);
      setAnalysis(data.analysis || null);
      setSteps(data.steps || []);
      setValidationIssues(data.validationIssues || []);

      if (data.version) {
        setVersions([data.version]);
        setCurrentVersionIndex(0);
      }

      // Default to index.html
      setActiveFileName("index.html");
    } catch (err: any) {
      console.error("Generate error:", err);
      setSteps((prev) => [
        ...prev,
        {
          id: "step_err",
          title: "Generation Notice",
          status: "error",
          detail: err.message || "Priya encountered a temporary issue creating the code. Please retry.",
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Iterative Improvement ("Improve Website")
  const handleImprove = async () => {
    if (!improveInput.trim() || isImproving || files.length === 0) return;

    setIsImproving(true);
    const nextVersionNum = versions.length + 1;

    setSteps((prev) => [
      ...prev,
      {
        id: `step_improve_${nextVersionNum}`,
        title: `Applying Iterative Update: "${improveInput}"`,
        status: "running",
        detail: "Updating project markup, styling, and interactivity...",
        timestamp: Date.now(),
      }
    ]);

    try {
      const data = await safeFetchJson<{
        files: ProjectFile[];
        summary: string;
        validationIssues?: ValidationIssue[];
        version?: ProjectVersion;
      }>("/api/builder/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentFiles: files,
          instruction: improveInput,
          model: selectedModel,
          versionNumber: nextVersionNum,
        }),
      });

      setFiles(data.files);
      setOriginalFiles(data.files);
      setValidationIssues(data.validationIssues || []);

      if (data.version) {
        setVersions((prev) => [...prev, data.version]);
        setCurrentVersionIndex(versions.length);
      }

      setSteps((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) {
          last.status = "completed";
          last.detail = data.summary || "Improvements applied cleanly.";
        }
        return copy;
      });

      setImproveInput("");
      setIsImproveOpen(false);
    } catch (err: any) {
      console.error("Improvement error:", err);
      alert(err.message || "Failed to update website.");
    } finally {
      setIsImproving(false);
    }
  };

  // File Operations
  const handleSelectFile = (fileName: string) => {
    setActiveFileName(fileName);
    setLeftTab("code");
    if (window.innerWidth < 768) {
      setMobileTab("code");
    }
  };

  const handleCreateFile = (name: string, language: ProjectFile["language"]) => {
    if (files.some((f) => f.name === name)) {
      alert("A file with this name already exists.");
      return;
    }
    const newFile: ProjectFile = {
      name,
      language,
      content: language === "html" ? "<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n\n</body>\n</html>" : "",
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileName(name);
    setLeftTab("code");
  };

  const handleDeleteFile = (name: string) => {
    if (name === "index.html") {
      alert("Cannot delete root entry index.html");
      return;
    }
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      setFiles((prev) => prev.filter((f) => f.name !== name));
      if (activeFileName === name) {
        setActiveFileName("index.html");
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.name === activeFileName ? { ...f, content: newContent } : f))
    );
  };

  const handleResetFile = () => {
    const orig = originalFiles.find((f) => f.name === activeFileName);
    if (orig) {
      handleContentChange(orig.content);
    }
  };

  // Restore Project Version
  const handleRestoreVersion = (version: ProjectVersion) => {
    setFiles(version.files);
    setOriginalFiles(version.files);
    const idx = versions.findIndex((v) => v.version === version.version);
    setCurrentVersionIndex(idx);
    setActiveFileName("index.html");
  };

  const activeFile = files.find((f) => f.name === activeFileName) || files[0] || {
    name: "index.html",
    language: "html",
    content: "<!DOCTYPE html><html><body></body></html>",
  };

  const origFile = originalFiles.find((f) => f.name === activeFileName) || activeFile;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020617] text-slate-100 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <header className="bg-[#090d16] border-b border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-pink-500 to-cyan-500 rounded-lg shadow-md shadow-pink-500/10">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Priya <span className="text-cyan-400">AI Website Builder</span>
              </h2>
              <span className="hidden sm:inline-block text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Full-Stack IDE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Autonomous AI Agent: Code Synthesis, Self-Healing & Live Preview Sandbox
            </p>
          </div>
        </div>

        {/* Action Controls & Export Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* New Website Reset Button */}
          {files.length > 0 && (
            <button
              onClick={handleResetProject}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-cyan-500/30"
              title="Clear current project and build a brand new website"
            >
              <span>+ New Website</span>
            </button>
          )}

          {/* Improve Website Trigger */}
          {files.length > 0 && (
            <button
              onClick={() => setIsImproveOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-pink-500 to-indigo-500 hover:opacity-95 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition cursor-pointer"
              title="Refine or add features to your website"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Improve</span>
            </button>
          )}

          {/* Download ZIP */}
          {files.length > 0 && (
            <button
              onClick={() => downloadProjectAsZip(files, analysis?.websiteType || "ai-website")}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Download full project as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">ZIP</span>
            </button>
          )}

          {/* Export PDF Preview */}
          {files.length > 0 && (
            <button
              onClick={() => exportWebsiteAsPdf(files, analysis?.websiteType || "AI Website")}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Export Rendered Preview as PDF / Print"
            >
              <Printer className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {/* Close Builder Modal */}
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg transition cursor-pointer ml-1"
            title="Close Website Builder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Prompt & Voice Bar */}
      <div className="bg-[#060a14] border-b border-slate-800/90 px-3 sm:px-5 py-2 flex flex-col gap-2 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Describe what website you want Priya to build (e.g. 'Dark futuristic portfolio for an app developer with neon UI and contact modal')..."
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition pr-10 shadow-inner"
            />
            {/* Voice Dictate Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-2 p-1.5 rounded-lg transition cursor-pointer ${
                isListeningVoice
                  ? "bg-pink-500 text-white animate-pulse shadow-lg shadow-pink-500/30"
                  : "text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              }`}
              title={isListeningVoice ? "Listening... Click to stop" : "Dictate website request by voice"}
            >
              {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Smart Model Router Dropdown */}
          <div className="hidden sm:flex items-center">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
              title="Select AI Coding Model or Auto-Router"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-100">
                  {m.name} ({m.codingScore}/100)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!promptInput.trim() || isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-lg shadow-cyan-500/10"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Coding...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Build Website</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Starter Templates Carousel / Chips */}
        {files.length === 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-500 font-mono shrink-0 uppercase tracking-wider">
              Quick Starters:
            </span>
            {STARTER_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptInput(tmpl.prompt);
                  handleGenerate(tmpl.prompt);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <span>{tmpl.title}</span>
                <span className="text-[9px] px-1 py-0.2 bg-cyan-500/10 text-cyan-400 rounded-full font-mono">
                  {tmpl.badge}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-around bg-[#080c14] border-b border-slate-800 p-1 text-xs shrink-0">
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
            mobileTab === "preview" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400"
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setMobileTab("files")}
          className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
            mobileTab === "files" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400"
          }`}
        >
          Files ({files.length})
        </button>
        <button
          onClick={() => setMobileTab("code")}
          className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
            mobileTab === "code" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400"
          }`}
        >
          Code
        </button>
        <button
          onClick={() => setMobileTab("activity")}
          className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
            mobileTab === "activity" ? "bg-slate-800 text-cyan-300 font-bold" : "text-slate-400"
          }`}
        >
          Agent
        </button>
      </div>

      {/* Main IDE Workspace (3 Panels Desktop, Tabbed Mobile) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left Panel: File Explorer & Code Editor (Desktop) */}
        <div className={`
          ${mobileTab === "files" || mobileTab === "code" ? "flex w-full" : "hidden md:flex"}
          w-full md:w-80 lg:w-96 flex-col shrink-0 border-r border-slate-800 bg-[#080c14]
        `}>
          {/* Sub Tab Header on Desktop */}
          <div className="hidden md:flex bg-[#0b0f19] border-b border-slate-800 p-1">
            <button
              onClick={() => setLeftTab("code")}
              className={`flex-1 py-1 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                leftTab === "code"
                  ? "bg-slate-800 text-cyan-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 py-1 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                leftTab === "files"
                  ? "bg-slate-800 text-cyan-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Explorer ({files.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftTab === "code" && mobileTab !== "files" ? (
              <CodeEditor
                files={files}
                activeFileName={activeFileName}
                onSelectFile={handleSelectFile}
                originalContent={origFile.content}
                onContentChange={handleContentChange}
                onReset={handleResetFile}
              />
            ) : (
              <FileExplorer
                files={files}
                activeFileName={activeFileName}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
              />
            )}
          </div>
        </div>

        {/* Center Panel: Live Website Preview & Bottom Console */}
        <div className={`
          ${mobileTab === "preview" ? "flex" : "hidden md:flex"}
          flex-1 flex-col overflow-hidden min-w-0 bg-[#030712]
        `}>
          <div className="flex-1 overflow-hidden">
            <LivePreview
              files={files}
              onConsoleLog={(entry) => setLogs((prev) => [...prev.slice(-150), entry])}
              localPort={3000}
              isGenerating={isGenerating}
              prompt={promptInput}
              onQuickStart={(tmplPrompt) => {
                setPromptInput(tmplPrompt);
                handleGenerate(tmplPrompt);
              }}
            />
          </div>

          {/* Bottom Console Drawer */}
          <BottomConsole
            logs={logs}
            issues={validationIssues}
            onClearLogs={() => setLogs([])}
            isOpen={isConsoleOpen}
            onToggleOpen={() => setIsConsoleOpen((prev) => !prev)}
          />
        </div>

        {/* Right Panel: AI Activity / Design Intelligence / Versions (Desktop) */}
        <div className={`
          ${mobileTab === "activity" ? "flex w-full" : "hidden lg:flex"}
          w-full lg:w-80 flex-col shrink-0 border-l border-slate-800 bg-[#0b0f19]
        `}>
          <AgentActivityPanel
            steps={steps}
            analysis={analysis}
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            versions={versions}
            currentVersionIndex={currentVersionIndex}
            onRestoreVersion={handleRestoreVersion}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Floating Modal for "Improve Website" */}
      <AnimatePresence>
        {isImproveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0d1322] border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-lg">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Improve / Tweak Website</h3>
                    <p className="text-xs text-slate-400">Priya modifies the existing project without restarting.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImproveOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  What would you like to improve or add?
                </label>
                <textarea
                  autoFocus
                  rows={3}
                  value={improveInput}
                  onChange={(e) => setImproveInput(e.target.value)}
                  placeholder="e.g. 'Make the hero header animated with particles', 'Change color theme to cyberpunk purple', 'Add a 3-tier pricing table with toggle', 'Add mobile hamburger menu'..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Popular Tweaks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Add an animated particles background",
                    "Add interactive pricing calculator",
                    "Change color theme to neon purple & gold",
                    "Make header sticky with blur glassmorphism",
                    "Add working contact modal with validation",
                    "Improve mobile drawer navigation"
                  ].map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImproveInput(sugg)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-[10px] text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImproveOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={!improveInput.trim() || isImproving}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-pink-500/20"
                >
                  {isImproving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Improvements...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
