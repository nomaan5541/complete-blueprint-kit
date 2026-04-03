import { useEffect, useRef, useState, memo } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  wobble: number;
  wobbleSpeed: number;
}

// Snow animation for Christmas
function SnowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      color: "#fff",
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      wobble: Math.random() * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      particles.forEach(p => {
        p.y += p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.wobble) * 0.5;
        if (p.y > canvas.height) { p.y = -5; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Fireworks for Diwali
function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Spark {
      x: number; y: number; vx: number; vy: number;
      color: string; life: number; size: number;
    }

    let sparks: Spark[] = [];
    let animId: number;

    const colors = ["#ff6b00", "#ffd700", "#e91e63", "#ff4081", "#ffab00", "#ff5722"];

    const explode = (x: number, y: number) => {
      const count = 30 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 1 + Math.random() * 3;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          life: 60 + Math.random() * 40,
          size: 1.5 + Math.random() * 1.5,
        });
      }
    };

    let timer = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      timer++;
      if (timer % 60 === 0) {
        explode(Math.random() * canvas.width, Math.random() * canvas.height * 0.5 + 50);
      }

      sparks = sparks.filter(s => s.life > 0);
      sparks.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.03;
        s.life--;
        ctx.globalAlpha = Math.min(s.life / 30, 1);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    // Initial clear
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Confetti for New Year
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiColors = ["#ffd700", "#ff4081", "#00e5ff", "#76ff03", "#ff6d00", "#e040fb", "#40c4ff"];
    const pieces: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.3,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      wobble: Math.random() * 4,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      pieces.forEach(p => {
        p.y += p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.wobble) * 1;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Color splashes for Holi
function ColorsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const holiColors = ["#e91e63", "#4caf50", "#ff9800", "#9c27b0", "#2196f3", "#ffeb3b", "#f44336"];
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 20 + 5,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.15 + 0.05,
      color: holiColors[Math.floor(Math.random() * holiColors.length)],
      rotation: 0,
      rotSpeed: 0,
      wobble: Math.random() * 3,
      wobbleSpeed: Math.random() * 0.01 + 0.005,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      particles.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.wobble) * 0.8;
        p.size += Math.sin(time * 0.02) * 0.1;
        if (p.y < -30) { p.y = canvas.height + 30; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.abs(p.size), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Floating lanterns for Eid
function LanternsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lanterns = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height * 0.3,
      size: Math.random() * 12 + 8,
      speed: Math.random() * 0.5 + 0.3,
      glow: Math.random() * 0.5 + 0.3,
      wobble: Math.random() * 3,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;

      // Draw stars
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5) % canvas.width;
        const sy = (i * 97.3) % (canvas.height * 0.4);
        const twinkle = Math.sin(time * 0.05 + i) * 0.3 + 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${twinkle})`;
        ctx.fill();
      }

      // Crescent moon
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvas.width * 0.85, 80, 30, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvas.width * 0.85 + 10, 75, 28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fill();
      ctx.restore();

      // Draw lanterns
      lanterns.forEach(l => {
        l.y -= l.speed;
        l.x += Math.sin(time * 0.02 + l.wobble) * 0.3;
        if (l.y < -30) { l.y = canvas.height + 30; l.x = Math.random() * canvas.width; }

        // Glow
        const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.size * 2);
        grad.addColorStop(0, `rgba(255, 200, 50, ${l.glow * 0.3})`);
        grad.addColorStop(1, "rgba(255, 200, 50, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(l.x - l.size * 2, l.y - l.size * 2, l.size * 4, l.size * 4);

        // Lantern body
        ctx.beginPath();
        ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 50, ${l.glow})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Tricolor for Independence/Republic Day
function TricolorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const tricolors = ["#ff9933", "#ffffff", "#138808"];
    const ribbons = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 1.5 + 0.5,
      color: tricolors[Math.floor(Math.random() * 3)],
      wobble: Math.random() * 4,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
    }));

    let animId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;
      ribbons.forEach(r => {
        r.y += r.speed;
        r.x += Math.sin(time * r.wobbleSpeed + r.wobble) * 0.8;
        r.rotation += r.rotSpeed;
        if (r.y > canvas.height + 10) { r.y = -10; r.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rotation);
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-r.size / 2, -r.size / 4, r.size, r.size / 2);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Garba particles for Navratri
function GarbaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const garbaColors = ["#e91e63", "#ff5722", "#ffc107", "#9c27b0", "#ff4081", "#f44336"];
    const dots = Array.from({ length: 50 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 200 + 100,
      cx: Math.random() * canvas.width,
      cy: Math.random() * canvas.height,
      speed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 4 + 2,
      color: garbaColors[Math.floor(Math.random() * garbaColors.length)],
    }));

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.angle += d.speed;
        const x = d.cx + Math.cos(d.angle) * d.radius;
        const y = d.cy + Math.sin(d.angle) * d.radius;
        ctx.beginPath();
        ctx.arc(x, y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Trail
        ctx.beginPath();
        ctx.arc(x - Math.cos(d.angle) * 5, y - Math.sin(d.angle) * 5, d.size * 0.6, 0, Math.PI * 2);
        ctx.globalAlpha = 0.15;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

// Main exported component
const ANIMATION_MAP: Record<string, React.FC> = {
  snow: SnowCanvas,
  fireworks: FireworksCanvas,
  confetti: ConfettiCanvas,
  colors: ColorsCanvas,
  lanterns: LanternsCanvas,
  tricolor: TricolorCanvas,
  garba: GarbaCanvas,
};

interface FestivalAnimationsProps {
  animationType: string;
}

function FestivalAnimations({ animationType }: FestivalAnimationsProps) {
  const AnimComponent = ANIMATION_MAP[animationType];
  if (!AnimComponent) return null;
  return <AnimComponent />;
}

export default memo(FestivalAnimations);
