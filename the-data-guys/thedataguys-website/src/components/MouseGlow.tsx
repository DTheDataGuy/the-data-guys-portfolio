import { useEffect, useRef } from 'react';

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        glowRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-[2] transition-opacity duration-300"
      style={{
        background:
          'radial-gradient(350px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), rgba(0, 240, 255, 0.06), rgba(59, 130, 246, 0.03), transparent 70%)',
      }}
    />
  );
}