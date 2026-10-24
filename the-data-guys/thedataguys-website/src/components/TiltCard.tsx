import { useRef, useState, useCallback, type ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({ children, className = '', maxTilt = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * maxTilt;
    const tiltY = (x - 0.5) * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    setGlareStyle({
      opacity: 0.15,
      background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(0,240,255,0.3), transparent 60%)`,
      transition: 'opacity 0.1s ease-out',
    });
  }, [maxTilt]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s ease-out',
    });
    setGlareStyle({ opacity: 0, transition: 'opacity 0.4s ease-out' });
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        className="absolute inset-0 pointer-events-none rounded-inherit z-10"
        style={glareStyle}
      />
    </div>
  );
}