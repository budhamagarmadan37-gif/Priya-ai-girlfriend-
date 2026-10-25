import { useEffect, useRef } from "react";
import { ConnectionState } from "../types";

interface WaveformVisualizerProps {
  state: ConnectionState;
  analyser: AnalyserNode | null;
}

export default function WaveformVisualizer({ state, analyser }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let t = 0; // time variable for procedural animations

    const resizeCanvas = () => {
      // Set canvas size matching bounding rect for crisp display
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const render = () => {
      t += 0.05;
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Get real-time audio energy
      let audioEnergy = 0;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        audioEnergy = sum / dataArray.length;
      }

      // Draw background glow
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, width / 2);
      if (state === "disconnected") {
        bgGlow.addColorStop(0, "rgba(239, 68, 68, 0.03)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "connecting") {
        bgGlow.addColorStop(0, "rgba(59, 130, 246, 0.05)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "listening") {
        bgGlow.addColorStop(0, "rgba(6, 182, 212, 0.06)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (state === "speaking") {
        bgGlow.addColorStop(0, "rgba(236, 72, 153, 0.08)");
        bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width / 2, 0, Math.PI * 2);
      ctx.fill();

      // --- STATE RENDERING ---

      if (state === "disconnected") {
        // Red breathing orb
        const baseRadius = 80;
        const pulse = Math.sin(t * 1.5) * 4;
        const radius = baseRadius + pulse;

        // Outer glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = "rgba(239, 68, 68, 0.4)";
        
        const grad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
        grad.addColorStop(0, "#f87171");
        grad.addColorStop(0.5, "#ef4444");
        grad.addColorStop(1, "#991b1b");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0; // reset shadow
      } 
      
      else if (state === "connecting") {
        // Blue spinning loading rings
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";

        // Spin 1
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 90, t, t + Math.PI * 1.2);
        ctx.stroke();

        // Spin 2 (counter)
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 110, -t * 0.7, -t * 0.7 + Math.PI * 0.8);
        ctx.stroke();

        // Central small core
        ctx.fillStyle = "#93c5fd";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      } 
      
      else if (state === "listening") {
        // Cyan highly-reactive microphone aura
        const energyPercent = audioEnergy / 255;
        const baseRadius = 90;
        const scale = 1 + energyPercent * 0.8;
        const pulse = Math.sin(t * 2) * 2;
        const radius = (baseRadius + pulse) * scale;

        // Render ambient glowing background ripples
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Bright Core
        ctx.shadowBlur = 40;
        ctx.shadowColor = "rgba(6, 182, 212, 0.7)";

        const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, "#22d3ee");
        grad.addColorStop(0.8, "#0891b2");
        grad.addColorStop(1, "#0f766e");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      } 
      
      else if (state === "speaking") {
        // Multi-frequency sine waveform that morphs with speech volume
        const energyPercent = audioEnergy / 255;
        const baseRadius = 95;
        const radius = baseRadius + energyPercent * 60;

        ctx.shadowBlur = 25;
        ctx.shadowColor = "rgba(236, 72, 153, 0.6)";

        // Draw multiple overlapping translucent wavy lines around the sphere
        const drawWave = (offset: number, color: string, speed: number, amplitude: number, count: number) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();

          const totalPoints = 120;
          for (let i = 0; i <= totalPoints; i++) {
            const angle = (i / totalPoints) * Math.PI * 2;
            
            // Generate waving noise on top of circle
            const freq = count;
            const waveNoise = Math.sin(angle * freq + t * speed + offset) * amplitude * (0.3 + energyPercent * 0.7);
            const r = radius + waveNoise;

            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();
        };

        // Draw 3 layers of waves (cyan, pink, violet)
        drawWave(0, "rgba(244, 63, 94, 0.8)", 1.8, 20, 6);   // Pink wave
        drawWave(Math.PI / 3, "rgba(168, 85, 247, 0.7)", 1.2, 16, 4); // Purple wave
        drawWave(Math.PI * 2 / 3, "rgba(6, 182, 212, 0.6)", 2.4, 25, 8); // Cyan wave

        // Central core of the speaking AI
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius * 0.6);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.5)");
        coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [state, analyser]);

  return (
    <div id="orb-container" className="relative w-72 h-72 md:w-80 md:h-80 mx-auto flex items-center justify-center">
      {/* Decorative Outer Rings */}
      <div className={`absolute inset-0 border border-white/5 rounded-full pointer-events-none transition-transform duration-1000 ${state === 'speaking' ? 'scale-110 rotate-45' : 'scale-100 rotate-0'}`} />
      <div className={`absolute -inset-4 border border-dashed border-white/5 rounded-full pointer-events-none transition-all duration-1000 ${state === 'listening' ? 'scale-105 border-white/10' : 'scale-100'}`} />
      
      {/* Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        id="voice-canvas"
        className="w-full h-full block"
      />
    </div>
  );
}
