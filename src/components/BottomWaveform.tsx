import { useEffect, useRef } from "react";

interface BottomWaveformProps {
  displayState: "disconnected" | "connecting" | "idle" | "listening" | "thinking" | "speaking";
  analyser: AnalyserNode | null;
}

export default function BottomWaveform({ displayState, analyser }: BottomWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      t += 0.08;
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let audioEnergy = 0;
      if (analyser) {
        if (displayState === "speaking") {
          analyser.getByteFrequencyData(dataArray);
        } else {
          analyser.getByteTimeDomainData(dataArray);
        }
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += Math.abs(dataArray[i] - 128);
        }
        audioEnergy = sum / dataArray.length;
      }

      // Choose line color and styles based on state
      let strokeColor = "rgba(148, 163, 184, 0.2)"; // Muted slate-400
      let glowColor = "rgba(148, 163, 184, 0)";
      let lineWidth = 1.5;
      let waveCount = 2;
      let speed = 0.5;
      let baseAmplitude = 3;

      if (displayState === "listening") {
        strokeColor = "rgba(34, 211, 238, 0.85)"; // Cyan-400
        glowColor = "rgba(34, 211, 238, 0.4)";
        lineWidth = 2.5;
        waveCount = 3;
        speed = 1.8;
        baseAmplitude = 6 + audioEnergy * 1.5;
      } else if (displayState === "speaking") {
        strokeColor = "rgba(244, 63, 94, 0.9)"; // Rose-500
        glowColor = "rgba(244, 63, 94, 0.5)";
        lineWidth = 2.5;
        waveCount = 4;
        speed = 2.2;
        baseAmplitude = 8 + audioEnergy * 2.2;
      } else if (displayState === "thinking") {
        strokeColor = "rgba(129, 140, 248, 0.7)"; // Indigo-400
        glowColor = "rgba(129, 140, 248, 0.2)";
        lineWidth = 2;
        waveCount = 2;
        speed = 1.2;
        baseAmplitude = 5;
      } else if (displayState === "connecting") {
        strokeColor = "rgba(59, 130, 246, 0.5)"; // Blue-500
        glowColor = "rgba(59, 130, 246, 0.1)";
        lineWidth = 1.5;
        waveCount = 2;
        speed = 1.0;
        baseAmplitude = 4;
      } else {
        // Idle / Disconnected state
        strokeColor = "rgba(148, 163, 184, 0.35)"; // Slate-400
        lineWidth = 1.5;
        waveCount = 1;
        speed = 0.4;
        baseAmplitude = 2;
      }

      // Setup shadows for glow effect
      ctx.shadowBlur = glowColor !== "rgba(148, 163, 184, 0)" ? 12 : 0;
      ctx.shadowColor = glowColor;

      // Draw multiple overlapping waves for a complex, premium look
      for (let w = 0; w < waveCount; w++) {
        ctx.strokeStyle = w === 0 ? strokeColor : strokeColor.replace(/[\d.]+\)$/, `${0.25 / w})`);
        ctx.lineWidth = w === 0 ? lineWidth : lineWidth * 0.75;
        
        ctx.beginPath();
        const segments = 100;
        const segmentWidth = width / segments;

        const phaseOffset = w * Math.PI * 0.4;
        const frequency = 0.02 + (w * 0.005);

        for (let i = 0; i <= segments; i++) {
          const x = i * segmentWidth;
          
          // Apply a bell curve envelope so the wave is flat at the edges and lively in the middle
          const envelope = Math.sin((i / segments) * Math.PI);
          
          // Procedural sine calculation
          const waveHeight = Math.sin(x * frequency - t * speed + phaseOffset) * baseAmplitude * envelope;
          const y = centerY + waveHeight;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Reset shadows
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [displayState, analyser]);

  return (
    <div id="waveform-panel" className="w-full h-16 relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        id="bottom-wave-canvas"
        className="w-full h-full block opacity-85 hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
