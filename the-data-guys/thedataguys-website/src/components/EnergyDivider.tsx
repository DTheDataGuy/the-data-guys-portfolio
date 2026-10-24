interface EnergyDividerProps {
  className?: string;
}

const EnergyDivider = ({ className = "" }: EnergyDividerProps) => {
  return (
    <div className={`relative w-full h-8 flex items-center justify-center ${className}`}>
      {/* Base gradient line */}
      <div className="absolute w-[70%] max-w-[600px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Glowing energy dot traveling along the line */}
      <div className="absolute w-[70%] max-w-[600px] h-[1px] overflow-hidden">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-energy-travel"
          style={{
            background: "radial-gradient(circle, #00f0ff 0%, rgba(0, 240, 255, 0.6) 40%, transparent 70%)",
            boxShadow: "0 0 12px #00f0ff, 0 0 24px rgba(0, 240, 255, 0.5), 0 0 36px rgba(0, 240, 255, 0.2)",
          }}
        />
        {/* Trail effect */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-16 h-[2px] rounded-full animate-energy-travel"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.4), transparent)",
            marginLeft: "-14px",
          }}
        />
      </div>

      {/* Secondary pulse dot - offset timing */}
      <div className="absolute w-[70%] max-w-[600px] h-[1px] overflow-hidden">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-energy-travel-delayed"
          style={{
            background: "radial-gradient(circle, #a855f7 0%, rgba(168, 85, 247, 0.5) 40%, transparent 70%)",
            boxShadow: "0 0 8px #a855f7, 0 0 16px rgba(168, 85, 247, 0.4)",
          }}
        />
      </div>
    </div>
  );
};

export default EnergyDivider;