import React, { useState } from "react";
import { ProjectFile } from "../../types";
import { 
  FileCode, 
  FileSpreadsheet, 
  FileText, 
  FilePlus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Folder,
  FolderOpen
} from "lucide-react";
import { downloadSingleFile } from "../../utils/zipExporter";

interface FileExplorerProps {
  files: ProjectFile[];
  activeFileName: string;
  onSelectFile: (fileName: string) => void;
  onCreateFile: (fileName: string, language: ProjectFile["language"]) => void;
  onDeleteFile: (fileName: string) => void;
}

export default function FileExplorer({
  files,
  activeFileName,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const getFileIcon = (file: ProjectFile) => {
    if (file.name.endsWith(".html")) {
      return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    if (file.name.endsWith(".css")) {
      return <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (file.name.endsWith(".js")) {
      return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
    }
    if (file.name.endsWith(".md")) {
      return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    let language: ProjectFile["language"] = "text";
    if (name.endsWith(".html")) language = "html";
    else if (name.endsWith(".css")) language = "css";
    else if (name.endsWith(".js")) language = "javascript";
    else if (name.endsWith(".json")) language = "json";
    else if (name.endsWith(".md")) language = "markdown";

    onCreateFile(name, language);
    setNewFileName("");
    setIsCreating(false);
  };

  const handleCopyFile = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.content);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 1800);
  };

  const handleDownloadFile = (file: ProjectFile, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadSingleFile(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border-r border-slate-800 select-none text-xs">
      {/* Explorer Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono">
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <span>Project Files</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded transition cursor-pointer"
          title="Create New File"
        >
          <FilePlus className="w-4 h-4" />
        </button>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-1.5">
          <input
            type="text"
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. custom.css"
            className="flex-1 bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-cyan-500 text-slate-950 rounded font-bold hover:bg-cyan-400 cursor-pointer"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setNewFileName("");
            }}
            className="px-2 py-1 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* File List Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 font-mono text-[10px] tracking-wider uppercase">
          <Folder className="w-3.5 h-3.5 text-slate-500" />
          <span>project/</span>
        </div>

        {files.map((file) => {
          const isActive = file.name === activeFileName;
          const isCore = file.name === "index.html";

          return (
            <div
              key={file.name}
              onClick={() => onSelectFile(file.name)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                isActive
                  ? "bg-gradient-to-r from-cyan-950/60 to-pink-950/40 border border-cyan-500/40 text-cyan-200 font-medium"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pl-2">
                {getFileIcon(file)}
                <span className="truncate">{file.name}</span>
                {file.name === "index.html" && (
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded font-mono">entry</span>
                )}
              </div>

              {/* Action icons on hover or active */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleCopyFile(file, e)}
                  className="p-1 hover:text-white rounded"
                  title="Copy File Code"
                >
                  {copiedFile === file.name ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={(e) => handleDownloadFile(file, e)}
                  className="p-1 hover:text-white rounded"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {!isCore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.name);
                    }}
                    className="p-1 hover:text-red-400 rounded"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>{files.length} files</span>
        <span>Vanilla HTML/CSS/JS</span>
      </div>
    </div>
  );
}
