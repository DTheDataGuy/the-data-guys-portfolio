import { useEffect, useRef, memo } from 'react';

function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spacing = 40;
    const baseAlpha = 0.2;
    const glowRadius = 300;
    const maxAlpha = 0.8;
    const dotSize = 1.8;
    const connectionDistance = 80;
    const connectionAlpha = 0.1;
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', handleMouseMove);

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      const { x: mx, y: my } = mouseRef.current;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      // Store dot positions for connection lines
      const activeDots: { x: number; y: number; alpha: number }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing + spacing / 2;
          const y = row * spacing + spacing / 2;

          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Ambient pulse using sine wave
          const pulseOffset = Math.sin(time + (row + col) * 0.3) * 0.05;
          let alpha = baseAlpha + pulseOffset;

          if (dist < glowRadius) {
            const factor = 1 - dist / glowRadius;
            alpha = alpha + (maxAlpha - alpha) * factor * factor;
          }

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.fill();

          // Track dots near mouse for connections
          if (dist < glowRadius * 0.8) {
            activeDots.push({ x, y, alpha });
          }
        }
      }

      // Draw connecting lines between nearby active dots
      for (let i = 0; i < activeDots.length; i++) {
        for (let j = i + 1; j < activeDots.length; j++) {
          const dx = activeDots[i].x - activeDots[j].x;
          const dy = activeDots[i].y - activeDots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const lineAlpha = connectionAlpha * (1 - dist / connectionDistance);
            ctx.beginPath();
            ctx.moveTo(activeDots[i].x, activeDots[i].y);
            ctx.lineTo(activeDots[j].x, activeDots[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default memo(ParticleGrid);