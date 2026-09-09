import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Flower2 } from "lucide-react";

/**
 * 3D Falling Flower Shower (पुष्प वर्षा) Animation
 * Realistic marigold and rose petals drifting down with 3D physics,
 * fluttering wind turbulence, and golden sparkles.
 */
export default function FlowerShower() {
  const canvasRef = useRef(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Types of divine offerings:
    // 0: Orange Marigold Petal (गेंदे की पंखुड़ी)
    // 1: Golden Yellow Marigold Petal
    // 2: Crimson Rose Petal (गुलाब की पंखुड़ी)
    // 3: Full Marigold Blossom (गेंदे का फूल)
    // 4: Divine Golden Shimmer Particle

    const PETAL_COUNT = width < 768 ? 32 : 55;
    const petals = [];

    class Petal {
      constructor(initial = false) {
        this.reset(initial);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -30;
        this.z = Math.random() * 0.8 + 0.4; // 3D depth layer (0.4 = far/small, 1.2 = close/large)
        this.size = (Math.random() * 10 + 10) * this.z;
        this.type = Math.floor(Math.random() * 5);

        this.speedY = (Math.random() * 1.2 + 0.8) * this.z;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.swayFreq = Math.random() * 0.02 + 0.01;
        this.swayAmp = Math.random() * 2.5 + 1.2;

        // 3D rotation angles
        this.rotX = Math.random() * Math.PI * 2;
        this.rotY = Math.random() * Math.PI * 2;
        this.rotZ = Math.random() * Math.PI * 2;

        this.rotSpeedX = (Math.random() - 0.5) * 0.03;
        this.rotSpeedY = (Math.random() - 0.5) * 0.04;
        this.rotSpeedZ = (Math.random() - 0.5) * 0.02;

        this.opacity = Math.random() * 0.3 + 0.7;
        this.time = Math.random() * 100;
      }

      update() {
        this.time += 0.04;
        this.y += this.speedY;
        this.x += Math.sin(this.time * this.swayFreq) * this.swayAmp + this.speedX;

        // 3D tumble
        this.rotX += this.rotSpeedX;
        this.rotY += this.rotSpeedY;
        this.rotZ += this.rotSpeedZ;

        if (this.y > height + 40 || this.x < -40 || this.x > width + 40) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotZ);

        // Simulated 3D tilt
        const scaleX = Math.cos(this.rotY) * this.z;
        const scaleY = Math.sin(this.rotX) * this.z;
        ctx.scale(Math.abs(scaleX) < 0.1 ? 0.1 : scaleX, Math.abs(scaleY) < 0.1 ? 0.1 : scaleY);

        ctx.globalAlpha = this.opacity * Math.min(1, (height - this.y + 50) / 100);

        if (this.type === 0) {
          // Orange Marigold Petal
          const grad = ctx.createLinearGradient(-this.size / 2, -this.size, this.size / 2, this.size);
          grad.addColorStop(0, "#f97316");
          grad.addColorStop(0.5, "#ea580c");
          grad.addColorStop(1, "#c2410c");
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(0, -this.size);
          ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.6, this.size * 0.8, this.size * 0.3, 0, this.size);
          ctx.bezierCurveTo(-this.size * 0.8, this.size * 0.3, -this.size * 0.6, -this.size * 0.6, 0, -this.size);
          ctx.fill();

          // Subtle petal vein
          ctx.strokeStyle = "rgba(254, 215, 170, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -this.size * 0.7);
          ctx.lineTo(0, this.size * 0.7);
          ctx.stroke();

        } else if (this.type === 1) {
          // Bright Yellow-Gold Marigold Petal
          const grad = ctx.createLinearGradient(-this.size / 2, -this.size, this.size / 2, this.size);
          grad.addColorStop(0, "#fef08a");
          grad.addColorStop(0.6, "#eab308");
          grad.addColorStop(1, "#ca8a04");
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(0, -this.size);
          ctx.bezierCurveTo(this.size * 0.55, -this.size * 0.5, this.size * 0.75, this.size * 0.3, 0, this.size);
          ctx.bezierCurveTo(-this.size * 0.75, this.size * 0.3, -this.size * 0.55, -this.size * 0.5, 0, -this.size);
          ctx.fill();

        } else if (this.type === 2) {
          // Crimson Rose Petal
          const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.size);
          grad.addColorStop(0, "#f43f5e");
          grad.addColorStop(0.6, "#be123c");
          grad.addColorStop(1, "#881337");
          ctx.fillStyle = grad;

          ctx.beginPath();
          ctx.moveTo(0, -this.size * 0.8);
          ctx.bezierCurveTo(this.size * 0.8, -this.size * 0.8, this.size, this.size * 0.4, 0, this.size);
          ctx.bezierCurveTo(-this.size, this.size * 0.4, -this.size * 0.8, -this.size * 0.8, 0, -this.size * 0.8);
          ctx.fill();

        } else if (this.type === 3) {
          // Full Marigold Flower (गेंदे का पूरा फूल)
          const r = this.size * 0.8;
          for (let p = 0; p < 8; p++) {
            ctx.save();
            ctx.rotate((p * Math.PI) / 4);
            ctx.fillStyle = p % 2 === 0 ? "#f97316" : "#eab308";
            ctx.beginPath();
            ctx.ellipse(0, r * 0.4, r * 0.3, r * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          // Center core
          ctx.fillStyle = "#9a3412";
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Divine Golden Sparkle
          ctx.fillStyle = "#fde047";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Initialize petals
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push(new Petal(true));
    }

    function render() {
      ctx.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.update();
        p.draw();
      }
      animationId = requestAnimationFrame(render);
    }
    render();

    // Click anywhere to spawn a gentle burst of flowers
    const handleClick = (e) => {
      for (let k = 0; k < 6; k++) {
        const p = new Petal(false);
        p.x = e.clientX + (Math.random() - 0.5) * 30;
        p.y = e.clientY + (Math.random() - 0.5) * 30;
        p.speedY = Math.random() * 2 + 1;
        p.speedX = (Math.random() - 0.5) * 4;
        petals.push(p);
        if (petals.length > PETAL_COUNT + 15) petals.shift();
      }
    };
    window.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
    };
  }, [enabled]);

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-30"
          style={{ mixBlendMode: "screen" }}
        />
      )}

      {/* Subtle Floating Flower Shower Toggle in Corner */}
      <button
        type="button"
        onClick={() => setEnabled((prev) => !prev)}
        className="fixed bottom-20 sm:bottom-4 right-3 sm:right-4 z-40 flex items-center gap-2 rounded-full px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-105"
        style={{
          background: enabled
            ? "linear-gradient(135deg, rgba(234,88,12,0.85), rgba(154,45,45,0.9))"
            : "rgba(30,8,16,0.8)",
          border: "1px solid rgba(229,193,88,0.4)",
          color: "#fef08a",
          boxShadow: enabled ? "0 4px 15px rgba(234,88,12,0.4)" : "none",
        }}
        title="Toggle Divine Flower Shower"
      >
        <Flower2 size={15} className={enabled ? "animate-spin" : ""} style={{ animationDuration: "12s" }} />
        <span>{enabled ? "Pushp Varsha On 🌸" : "Pushp Varsha Off"}</span>
      </button>
    </>
  );
}
