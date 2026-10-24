import { useRef, useState } from "react";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

const MagneticButton = ({ children, className = "", strength = 0.3 }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });
  const [glowIntensity, setGlowIntensity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    const rotateX = -(deltaY / rect.height) * 15;
    const rotateY = (deltaX / rect.width) * 15;

    setTransform({
      x: deltaX,
      y: deltaY,
      rotateX,
      rotateY,
      scale: 1.05,
    });
    setGlowIntensity(0.4);
  };

  const handleMouseLeave = () => {
    setTransform({ x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1 });
    setGlowIntensity(0);
  };

  return (
    <div
      ref={ref}
      className={`inline-block transition-all duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        perspective: "800px",
        boxShadow: glowIntensity > 0
          ? `0 0 ${20 * glowIntensity}px rgba(0, 240, 255, ${glowIntensity}), 0 0 ${40 * glowIntensity}px rgba(0, 240, 255, ${glowIntensity * 0.5})`
          : "none",
      }}
    >
      {children}
    </div>
  );
};

export default MagneticButton;