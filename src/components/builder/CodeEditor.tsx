import React, { useState, useRef } from "react";
import { ProjectFile } from "../../types";
import { 
  Copy, 
  Check, 
  RotateCcw, 
  Save, 
  Code, 
  CheckCircle, 
  FileCode, 
  FileSpreadsheet, 
  FileText,
  Maximize2,
  Minimize2
} from "lucide-react";

interface CodeEditorProps {
  files: ProjectFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  originalContent: string;
  onContentChange: (newContent: string) => void;
  onReset: () => void;
}

export default function CodeEditor({
  files,
  activeFileName,
  onSelectFile,
  originalContent,
  onContentChange,
  onReset,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const file = files.find((f) => f.name === activeFileName) || files[0] || {
    name: "index.html",
    language: "html",
    content: "",
  };

  const isModified = file.content !== originalContent;
  const lines = file.content.split("\n");

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".html")) return <FileCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    if (fileName.endsWith(".css")) return <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    if (fileName.endsWith(".js")) return <FileCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        file.content.substring(0, start) + "  " + file.content.substring(end);
      onContentChange(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080c14] border-r border-slate-800 font-mono text-xs overflow-hidden ${
      isFullScreen ? "fixed inset-0 z-50 bg-[#080c14]" : ""
    }`}>
      {/* File Switcher Tabs across top */}
      <div className="bg-[#0b0f19] border-b border-slate-800 px-2 pt-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          {files.map((f) => {
            const isActive = f.name === activeFileName;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => onSelectFile(f.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition cursor-pointer border-t border-x ${
                  isActive
                    ? "bg-[#080c14] border-slate-700 text-cyan-300 border-b-transparent"
                    : "bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {getFileIcon(f.name)}
                <span className="truncate">{f.name}</span>
                {f.name === activeFileName && isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pb-1 shrink-0">
          {isModified && (
            <button
              onClick={onReset}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded flex items-center gap-1 text-[11px] transition cursor-pointer"
              title="Reset file to initial AI generation"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1 text-[11px] transition cursor-pointer"
            title="Copy Full Code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
            title="Changes auto-sync live"
          >
            {saved ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Synced</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Sync</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen Code View"}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Text Area with Line Numbers */}
      <div className="flex-1 flex relative overflow-hidden bg-[#070a10]">
        {/* Line Numbers Column */}
        <div className="w-11 sm:w-12 py-3 bg-[#070a10] border-r border-slate-800/80 text-right pr-2 select-none text-slate-600 font-mono text-[11px] leading-[20px] overflow-hidden shrink-0">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editable Code Area */}
        <textarea
          ref={textareaRef}
          value={file.content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-[11px] sm:text-xs leading-[20px] resize-none focus:outline-none focus:ring-0 whitespace-pre overflow-auto selection:bg-cyan-500/30 selection:text-white"
          placeholder="Code for this file will appear here..."
        />
      </div>

      {/* Status Bar */}
      <div className="bg-[#0b0f19] border-t border-slate-800/80 px-3 py-1 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>{file.name}</span>
          <span>{lines.length} lines</span>
          <span>{file.language.toUpperCase()}</span>
        </div>
        <div>
          {isModified ? (
            <span className="text-amber-400">● Live in Preview</span>
          ) : (
            <span className="text-emerald-400">✓ Production Code</span>
          )}
        </div>
      </div>
    </div>
  );
}
