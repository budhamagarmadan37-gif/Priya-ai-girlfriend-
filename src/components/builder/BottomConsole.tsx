import React, { useState } from "react";
import { ConsoleLogEntry, ValidationIssue } from "../../types";
import { 
  Terminal, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  Wrench
} from "lucide-react";

interface BottomConsoleProps {
  logs: ConsoleLogEntry[];
  issues: ValidationIssue[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export default function BottomConsole({
  logs,
  issues,
  onClearLogs,
  isOpen,
  onToggleOpen,
}: BottomConsoleProps) {
  const [tab, setTab] = useState<"console" | "linter">("console");

  const errorsCount = logs.filter((l) => l.type === "error").length;
  const validationErrors = issues.filter((i) => i.type === "error").length;
  const validationWarnings = issues.filter((i) => i.type === "warning").length;

  return (
    <div
      className={`border-t border-slate-800 bg-[#080c14] flex flex-col transition-all duration-200 select-none ${
        isOpen ? "h-48 sm:h-56" : "h-9"
      }`}
    >
      {/* Console Bar Header */}
      <div className="px-3 py-1.5 bg-[#0b0f19] border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isOpen) onToggleOpen();
              setTab("console");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
              tab === "console" && isOpen
                ? "bg-slate-800 text-cyan-300 font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Console ({logs.length})</span>
            {errorsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">
                {errorsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (!isOpen) onToggleOpen();
              setTab("linter");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
              tab === "linter" && isOpen
                ? "bg-slate-800 text-pink-300 font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-pink-400" />
            <span>Code Health & Linting</span>
            {validationErrors > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">
                {validationErrors}
              </span>
            )}
            {validationWarnings > 0 && validationErrors === 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-bold">
                {validationWarnings}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tab === "console" && logs.length > 0 && isOpen && (
            <button
              onClick={onClearLogs}
              className="p-1 text-slate-400 hover:text-red-300 rounded transition cursor-pointer"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onToggleOpen}
            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            title={isOpen ? "Minimize Console" : "Expand Console"}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Console Stream Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-[#060910]">
          {tab === "console" ? (
            logs.length === 0 ? (
              <div className="text-slate-600 p-3 italic">
                No console messages. Sandbox runtime is running smoothly.
              </div>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded ${
                    entry.type === "error"
                      ? "bg-red-950/40 text-red-300 border-l-2 border-red-500"
                      : entry.type === "warn"
                      ? "bg-amber-950/40 text-amber-300 border-l-2 border-amber-500"
                      : "text-slate-300 hover:bg-slate-900/60"
                  }`}
                >
                  <span className="text-[10px] text-slate-500 shrink-0 select-none">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="break-all whitespace-pre-wrap flex-1">
                    {entry.message}
                  </span>
                </div>
              ))
            )
          ) : (
            /* Linter & Validation Tab */
            <div className="p-2 space-y-2">
              {issues.length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4" />
                  <span>All project files passed semantic HTML, CSS, and JS validation checks.</span>
                </div>
              ) : (
                issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded-lg text-xs border ${
                      issue.type === "error"
                        ? "bg-red-950/40 border-red-500/30 text-red-300"
                        : "bg-amber-950/40 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {issue.type === "error" ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-[10px]">
                          {issue.file}
                        </span>
                        {issue.autoFixed && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                            Auto-Healed by Priya
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 text-slate-300">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
