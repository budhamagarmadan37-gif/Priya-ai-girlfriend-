export type ConnectionState = "disconnected" | "connecting" | "listening" | "speaking" | "thinking" | "idle";

export interface ToolCallData {
  id: string;
  name: string;
  args: any;
}

export interface WebsiteAction {
  id: string;
  url: string;
  name: string;
  timestamp: number;
  status: "pending" | "executed" | "failed";
}

export interface ProjectFile {
  name: string;
  language: "html" | "css" | "javascript" | "json" | "markdown" | "text";
  content: string;
}

export interface WebsiteRequirementAnalysis {
  websiteType: string;
  purpose: string;
  targetAudience: string;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  layoutStyle: string;
  sections: string[];
  features: string[];
  responsiveRules: string[];
}

export interface AIModelOption {
  id: string;
  name: string;
  description: string;
  speed: "Ultra Fast" | "Fast" | "Balanced";
  codingScore: number; // out of 100
  contextLength: string;
  recommended: boolean;
}

export interface AgentStep {
  id: string;
  title: string;
  status: "pending" | "running" | "completed" | "warning" | "error";
  detail?: string;
  timestamp: number;
}

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  file: string;
  line?: number;
  message: string;
  autoFixed?: boolean;
}

export interface ProjectVersion {
  version: number;
  title: string;
  prompt: string;
  timestamp: number;
  files: ProjectFile[];
  summary: string;
}

export interface ConsoleLogEntry {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
}

// Screen Sharing Types
export type ScreenShareState = 
  | "off" 
  | "requesting" 
  | "active" 
  | "paused" 
  | "stopped" 
  | "denied" 
  | "unsupported";

export interface ScreenVisionAnalysis {
  timestamp: number;
  description: string;
  detectedElements?: string[];
  appsIdentified?: string[];
  textSummary?: string;
  errorFound?: string;
  confidence?: string;
  suggestedAction?: string;
}

export type VisionAnalysisStatus = "idle" | "capturing" | "analyzing" | "completed" | "error";

// Camera Types
export type CameraFacingMode = "user" | "environment";

export interface CameraState {
  isOpen: boolean;
  isStreaming: boolean;
  facingMode: CameraFacingMode;
  error: string | null;
  lastCapturedPhoto: string | null; // base64 or object URL
}

// Device & App Actions
export type DeviceActionType = 
  | "open_youtube"
  | "search_google"
  | "open_maps"
  | "open_settings"
  | "open_camera"
  | "close_camera"
  | "take_photo"
  | "switch_camera"
  | "open_url";

export interface DeviceActionPayload {
  id: string;
  action: DeviceActionType;
  target?: string;
  displayName: string;
  timestamp: number;
  status: "pending" | "executed" | "failed";
  details?: string;
}
