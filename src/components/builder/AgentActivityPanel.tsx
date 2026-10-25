import React, { useState } from "react";
import { 
  AgentStep, 
  WebsiteRequirementAnalysis, 
  AIModelOption, 
  ProjectVersion,
  ProjectFile
} from "../../types";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Cpu, 
  Palette, 
  Type as TypeIcon, 
  Layers, 
  History, 
  RotateCcw,
  Sparkles,
  ChevronDown
} from "lucide-react";

interface AgentActivityPanelProps {
  steps: AgentStep[];
  analysis: WebsiteRequirementAnalysis | null;
  models: AIModelOption[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  versions: ProjectVersion[];
  currentVersionIndex: number;
  onRestoreVersion: (version: ProjectVersion) => void;
  isGenerating: boolean;
}

export default function AgentActivityPanel({
  steps,
  analysis,
  models,
  selectedModel,
  onSelectModel,
  versions,
  currentVersionIndex,
  onRestoreVersion,
  isGenerating,
}: AgentActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<"activity" | "design" | "versions">("activity");

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border-l border-slate-800 text-xs select-none">
      {/* Tab Switcher */}
      <div className="p-2 border-b border-slate-800 bg-[#080c14] flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg w-full">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "activity"
                ? "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => setActiveTab("design")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "design"
                ? "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Design</span>
          </button>

          <button
            onClick={() => setActiveTab("versions")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-[11px] transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "versions"
                ? "bg-gradient-to-r from-pink-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>History ({versions.length})</span>
          </button>
        </div>
      </div>

      {/* Model Selection Layer Header */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/40">
        <label className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 mb-1">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>AI Coding Model</span>
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          disabled={isGenerating}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.speed})
            </option>
          ))}
        </select>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Tab 1: AI Agent Activity Stream */}
        {activeTab === "activity" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Agentic Workflow Pipeline</span>
              {isGenerating && (
                <span className="text-cyan-400 font-semibold animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  Generating...
                </span>
              )}
            </div>

            {steps.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-500">
                <Sparkles className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <p>Describe your website to start the Priya Agentic builder.</p>
              </div>
            ) : (
              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {steps.map((step, idx) => (
                  <div key={step.id || idx} className="relative group">
                    {/* Status Bullet */}
                    <div className="absolute -left-[19px] top-0.5">
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 bg-[#0b0f19] rounded-full" />
                      ) : step.status === "running" ? (
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin bg-[#0b0f19]" />
                      ) : step.status === "error" ? (
                        <AlertCircle className="w-4 h-4 text-red-400 bg-[#0b0f19] rounded-full" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-600 bg-[#0b0f19] rounded-full" />
                      )}
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                      <h4 className="font-semibold text-slate-200 text-xs flex items-center justify-between">
                        <span>{step.title}</span>
                      </h4>
                      {step.detail && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Design Intelligence Blueprint */}
        {activeTab === "design" && (
          <div className="space-y-3">
            {analysis ? (
              <>
                {/* Category & Style */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Design Intelligence
                  </div>
                  <div className="font-bold text-sm text-white">
                    {analysis.websiteType}
                  </div>
                  <div className="text-xs text-slate-300">
                    {analysis.purpose}
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <strong>Style:</strong> {analysis.layoutStyle}
                  </div>
                </div>

                {/* Color Palette */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-pink-400 uppercase tracking-wider">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Theme Color Palette</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {Object.entries(analysis.colorTheme).map(([name, hex]) => (
                      <div key={name} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full h-8 rounded-lg border border-white/20 shadow-inner"
                          style={{ backgroundColor: hex }}
                          title={`${name}: ${hex}`}
                        />
                        <span className="text-[9px] text-slate-400 capitalize truncate w-full text-center">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span>Typography</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Headings: <span className="font-semibold text-white">{analysis.typography.headingFont}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Body: <span className="text-slate-200">{analysis.typography.bodyFont}</span>
                  </p>
                </div>

                {/* Planned Sections */}
                <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Layout Sections ({analysis.sections.length})</span>
                  </div>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {analysis.sections.map((sec, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{sec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-slate-500">
                Design intelligence will populate automatically once code generation starts.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Version History */}
        {activeTab === "versions" && (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 font-mono mb-2">
              Timeline of Project Builds
            </div>

            {versions.map((ver, idx) => {
              const isCurrent = idx === currentVersionIndex;
              return (
                <div
                  key={ver.version}
                  className={`p-3 rounded-xl border transition ${
                    isCurrent
                      ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span className="text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Version {ver.version}: {ver.title}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <button
                        onClick={() => onRestoreVersion(ver)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Restore
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                    "{ver.prompt}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/60">
                    <span>{ver.files.length} files</span>
                    <span>{new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
