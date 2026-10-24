import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  opacity: number;
  color: string;
}

const ParticleBurst = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered) {
            setTriggered(true);
            generateParticles();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [triggered]);

  const generateParticles = () => {
    const colors = ["#00f0ff", "#3b82f6", "#a855f7", "#22d3ee", "#06b6d4"];
    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      angle: (i / 24) * 360 + Math.random() * 15,
      speed: 40 + Math.random() * 60,
      size: 2 + Math.random() * 4,
      opacity: 0.7 + Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);

    // Clear particles after animation
    setTimeout(() => setParticles([]), 1500);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-16 overflow-hidden pointer-events-none"
    >
      {particles.map((particle) => {
        const rad = (particle.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * particle.speed;
        const ty = Math.sin(rad) * particle.speed;

        return (
          <div
            key={particle.id}
            className="absolute rounded-full animate-particle-burst-item"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 6px ${particle.color}`,
              opacity: particle.opacity,
              "--tx": `${tx}px`,
              "--ty": `${ty}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

export default ParticleBurst;