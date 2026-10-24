import { useState, useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  opacity: number;
  speed: number;
  trail: { x: number; y: number }[];
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Create particles that will converge to form "TDG"
    const text = 'TDG';
    ctx.font = 'bold 120px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(text, centerX, centerY);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const targetPoints: { x: number; y: number }[] = [];

    // Sample pixels from the text
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        const index = (y * canvas.width + x) * 4;
        if (pixels[index + 3] > 128) {
          targetPoints.push({ x, y });
        }
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create particles with random starting positions
    const numParticles = Math.min(targetPoints.length, 600);
    const step = Math.floor(targetPoints.length / numParticles);
    
    particlesRef.current = [];
    for (let i = 0; i < numParticles; i++) {
      const target = targetPoints[i * step] || targetPoints[i % targetPoints.length];
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(canvas.width, canvas.height);
      particlesRef.current.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        targetX: target.x,
        targetY: target.y,
        size: Math.random() * 2.5 + 1,
        opacity: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.02 + 0.015,
        trail: [],
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 14, 26, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      progressRef.current = Math.min(progressRef.current + 0.014, 1);
      const eased = 1 - Math.pow(1 - progressRef.current, 3);

      particlesRef.current.forEach((p) => {
        // Store trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();

        // Move toward target
        p.x += (p.targetX - p.x) * p.speed * (1 + eased * 3);
        p.y += (p.targetY - p.y) * p.speed * (1 + eased * 3);

        // Draw trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = `rgba(0, 240, 255, ${p.opacity * 0.2 * (1 - eased * 0.5)})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      // Draw subtitle when particles are mostly settled
      if (progressRef.current > 0.7) {
        const subtitleOpacity = (progressRef.current - 0.7) / 0.3;
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${subtitleOpacity * 0.8})`;
        ctx.fillText('The Data Guys™', centerX, centerY + 80);
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.fillStyle = `rgba(0, 240, 255, ${subtitleOpacity * 0.6})`;
        ctx.fillText('Getting Your Data House In Order™', centerX, centerY + 105);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Fade out after 6500ms to allow full particle assembly animation
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 800);
    }, 6500);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearTimeout(timer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0e1a] transition-opacity duration-700 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}