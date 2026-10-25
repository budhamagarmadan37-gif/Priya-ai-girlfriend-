import { ScreenShareState } from "../types";

export type FrameCallback = (base64Jpeg: string) => void;
export type StateChangeCallback = (state: ScreenShareState, reason?: string) => void;

export class ScreenCaptureService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private streamingIntervalId: any = null;
  private currentState: ScreenShareState = "off";
  private onStateChange: StateChangeCallback | null = null;
  private onFrameCaptured: FrameCallback | null = null;

  constructor(
    onStateChange?: StateChangeCallback,
    onFrameCaptured?: FrameCallback
  ) {
    if (onStateChange) this.onStateChange = onStateChange;
    if (onFrameCaptured) this.onFrameCaptured = onFrameCaptured;
  }

  public getState(): ScreenShareState {
    return this.currentState;
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && 
      !!navigator.mediaDevices && 
      typeof navigator.mediaDevices.getDisplayMedia === "function";
  }

  public async startCapture(): Promise<boolean> {
    if (!this.isSupported()) {
      this.updateState("unsupported", "Screen capture is not supported on this browser or platform.");
      return false;
    }

    try {
      this.updateState("requesting", "Requesting OS screen capture permission...");

      // MediaTrackConstraints for optimized mobile/desktop screen display
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          displaySurface: "monitor", // 'monitor' | 'window' | 'browser'
          width: { max: 1920, ideal: 1280 },
          height: { max: 1080, ideal: 720 },
          frameRate: { max: 15, ideal: 5 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      this.mediaStream = stream;

      // Create internal video element to receive stream
      if (!this.videoElement) {
        this.videoElement = document.createElement("video");
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
      }
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      // Listen for OS or browser native stop sharing event
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log("[ScreenCaptureService] Screen sharing ended by OS/browser track.");
          this.stopCapture("Native stop signal received");
        };
      }

      this.updateState("active");

      // Start periodic 1 FPS frame sampling
      this.startContinuousSampling();

      return true;
    } catch (err: any) {
      console.warn("[ScreenCaptureService] Screen capture failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.updateState("denied", "Screen sharing permission was denied.");
      } else if (err.name === "AbortError") {
        this.updateState("off", "Screen sharing request was dismissed.");
      } else {
        this.updateState("off", err.message || "Failed to start screen capture.");
      }
      return false;
    }
  }

  public pauseCapture(): void {
    if (this.currentState === "active") {
      this.stopContinuousSampling();
      this.updateState("paused");
    }
  }

  public resumeCapture(): void {
    if (this.currentState === "paused" && this.mediaStream && this.mediaStream.active) {
      this.updateState("active");
      this.startContinuousSampling();
    }
  }

  public stopCapture(reason: string = "User stopped sharing"): void {
    this.stopContinuousSampling();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.updateState("stopped", reason);
    // After brief stopped state, reset to off
    setTimeout(() => {
      if (this.currentState === "stopped") {
        this.updateState("off");
      }
    }, 1200);
  }

  /**
   * Captures a high quality snapshot of the active screen frame
   * Returns clean base64 JPEG (without data:image/jpeg;base64, prefix for API)
   * Also provides dataUrl for UI preview.
   */
  public captureSnapshot(maxWidth: number = 1280, quality: number = 0.8): { base64: string; dataUrl: string } | null {
    if (!this.videoElement || !this.mediaStream || !this.mediaStream.active) {
      return null;
    }

    const video = this.videoElement;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    if (!this.canvasElement) {
      this.canvasElement = document.createElement("canvas");
    }

    const canvas = this.canvasElement;
    let width = video.videoWidth;
    let height = video.videoHeight;

    // Downscale proportionally if larger than maxWidth
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

    return { base64, dataUrl };
  }

  public getLiveStream(): MediaStream | null {
    return this.mediaStream;
  }

  private startContinuousSampling(): void {
    this.stopContinuousSampling();

    // 1 frame per second to not overwhelm network/model, as recommended in Gemini guidelines
    this.streamingIntervalId = setInterval(() => {
      if (this.currentState !== "active") return;
      
      const snap = this.captureSnapshot(1024, 0.7);
      if (snap && this.onFrameCaptured) {
        this.onFrameCaptured(snap.base64);
      }
    }, 1200);
  }

  private stopContinuousSampling(): void {
    if (this.streamingIntervalId) {
      clearInterval(this.streamingIntervalId);
      this.streamingIntervalId = null;
    }
  }

  private updateState(newState: ScreenShareState, reason?: string): void {
    this.currentState = newState;
    if (this.onStateChange) {
      this.onStateChange(newState, reason);
    }
  }
}
