import { CameraFacingMode, CameraState } from "../types";

export type CameraStateCallback = (state: CameraState) => void;

export class CameraControlService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private facingMode: CameraFacingMode = "user";
  private onStateChange: CameraStateCallback | null = null;
  private lastCapturedPhoto: string | null = null;
  private isOpen: boolean = false;
  private isStreaming: boolean = false;
  private currentError: string | null = null;

  constructor(onStateChange?: CameraStateCallback) {
    if (onStateChange) this.onStateChange = onStateChange;
  }

  public isSupported(): boolean {
    return typeof navigator !== "undefined" && 
      !!navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === "function";
  }

  public getState(): CameraState {
    return {
      isOpen: this.isOpen,
      isStreaming: this.isStreaming,
      facingMode: this.facingMode,
      error: this.currentError,
      lastCapturedPhoto: this.lastCapturedPhoto,
    };
  }

  public async openCamera(requestedFacing: CameraFacingMode = this.facingMode): Promise<boolean> {
    if (!this.isSupported()) {
      this.currentError = "Camera is not supported on this browser or platform.";
      this.emitState();
      return false;
    }

    this.isOpen = true;
    this.facingMode = requestedFacing;
    this.currentError = null;
    this.emitState();

    try {
      if (this.mediaStream) {
        this.stopTracks();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      });

      this.mediaStream = stream;

      if (!this.videoElement) {
        this.videoElement = document.createElement("video");
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
      }

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.isStreaming = true;
      this.currentError = null;
      this.emitState();

      return true;
    } catch (err: any) {
      console.warn("[CameraControlService] Failed to open camera:", err);
      this.isStreaming = false;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.currentError = "Camera permission was denied. Please allow access in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        this.currentError = "No camera found on this device.";
      } else {
        this.currentError = err.message || "Could not start camera feed.";
      }
      this.emitState();
      return false;
    }
  }

  public async switchFacingMode(): Promise<boolean> {
    const nextFacing: CameraFacingMode = this.facingMode === "user" ? "environment" : "user";
    return this.openCamera(nextFacing);
  }

  public capturePhoto(): { base64: string; dataUrl: string } | null {
    if (!this.videoElement || !this.mediaStream || !this.isStreaming) {
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Flip horizontally if front-facing for natural mirror feel
    if (this.facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

    this.lastCapturedPhoto = dataUrl;
    this.emitState();

    return { base64, dataUrl };
  }

  public closeCamera(): void {
    this.stopTracks();
    this.isOpen = false;
    this.isStreaming = false;
    this.currentError = null;
    this.emitState();
  }

  public attachToVideoElement(targetVideo: HTMLVideoElement): void {
    if (this.mediaStream) {
      targetVideo.srcObject = this.mediaStream;
      targetVideo.play().catch(() => {});
    }
  }

  private stopTracks(): void {
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
  }

  private emitState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}
