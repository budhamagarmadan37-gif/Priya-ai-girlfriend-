/**
 * Utility class for recording raw PCM16 16kHz audio from the microphone
 * and converting it to Base64 to stream to the server.
 */
export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  public analyser: AnalyserNode | null = null;

  constructor() {}

  async start(onAudioChunk: (base64: string) => void): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Microphone access is not supported by this browser context. Try opening in a new standalone tab.");
    }

    // 1. Request microphone access with fallback constraints
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      console.warn("Detailed mic constraints failed, attempting basic audio request fallback...", err);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (fallbackErr: any) {
        if (fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError" || fallbackErr.message?.includes("Permission denied")) {
          throw new Error("Microphone permission denied. Please allow microphone access in your browser or open the app in a new tab.");
        }
        throw fallbackErr;
      }
    }

    // 2. Initialize AudioContext at 16kHz as expected by Gemini Live
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

    // Ensure AudioContext is active
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    // 3. Create AnalyserNode for visualizing mic input
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;

    // 4. Create source and script processor
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    
    // Using 4096 buffer size
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    // 5. Connect nodes
    this.source.connect(this.analyser);
    this.analyser.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);

    // 6. Handle audio processing
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16Buffer = this.floatTo16BitPCM(inputData);
      const base64 = this.arrayBufferToBase64(pcm16Buffer);
      onAudioChunk(base64);
    };
  }

  stop(): void {
    if (this.processor) {
      this.processor.onaudioprocess = null;
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    this.analyser = null;
  }

  getVolume(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let values = 0;
    for (let i = 0; i < dataArray.length; i++) {
      values += dataArray[i];
    }
    return values / dataArray.length;
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit signed integer PCM
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true for little-endian
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Utility class for gapless, interruptible playback of raw 24kHz PCM16 audio chunks.
 */
export class AudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  public analyser: AnalyserNode | null = null;
  private volumeNode: GainNode | null = null;

  constructor() {}

  init(): void {
    if (this.audioCtx) {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch((e) => console.warn("Failed to resume existing AudioContext:", e));
      }
      return;
    }

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtxClass({ sampleRate: 24000 }); // Gemini Live outputs 24kHz

    this.volumeNode = this.audioCtx.createGain();
    this.volumeNode.gain.value = 1.0;

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;

    this.volumeNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch((e) => console.warn("Failed to resume new AudioContext:", e));
    }
  }

  async playChunk(base64Data: string, onEnded?: () => void): Promise<void> {
    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    // 1. Decode base64 to binary byte array
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // 2. Interpret as 16-bit signed integers
    const pcm16 = new Int16Array(bytes.buffer);
    
    // 3. Convert to Float32 [-1.0, 1.0]
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    // 4. Create AudioBuffer
    const audioBuffer = this.audioCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    // 5. Create source and schedule
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.volumeNode!);

    const now = this.audioCtx.currentTime;
    // Standard VAD and queueing buffer: add 50ms buffer if queue is dry
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.05;
    }

    source.start(this.nextStartTime);
    const chunkDuration = audioBuffer.duration;
    
    // Record start time and duration for tracking
    const scheduledStartTime = this.nextStartTime;
    this.nextStartTime += chunkDuration;

    this.activeSources.push(source);

    // Cleanup when done
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
      if (onEnded) {
        onEnded();
      }
    };
  }

  stop(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
      try {
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;
  }

  getVolume(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    let values = 0;
    for (let i = 0; i < dataArray.length; i++) {
      values += dataArray[i];
    }
    return values / dataArray.length;
  }
}
