import { useRef, useState } from "react";

interface GradientMeshCardProps {
  children: React.ReactNode;
  className?: string;
}

const GradientMeshCard = ({ children, className = "" }: GradientMeshCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLightPos({ x, y });
  };

  const handleMouseLeave = () => {
    setLightPos({ x: 50, y: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-2xl p-[1px] overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Rotating gradient border */}
      <div
        className="absolute inset-0 animate-gradient-rotate"
        style={{
          background:
            "conic-gradient(from 0deg, #00f0ff, #3b82f6, #a855f7, #ec4899, #00f0ff)",
        }}
      />

      {/* Inner card with glass effect */}
      <div className="relative rounded-2xl bg-[#0a0e1a]/90 backdrop-blur-xl p-6 h-full overflow-hidden">
        {/* Mouse-following light reflection */}
        <div
          className="absolute w-40 h-40 rounded-full pointer-events-none transition-all duration-300 ease-out opacity-0 group-hover:opacity-100"
          style={{
            left: `${lightPos.x}%`,
            top: `${lightPos.y}%`,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};

export default GradientMeshCard;