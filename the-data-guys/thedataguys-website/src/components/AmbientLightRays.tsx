const AmbientLightRays = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Light Ray 1 */}
      <div
        className="absolute animate-light-ray-sweep-1"
        style={{
          top: "-20%",
          left: "-10%",
          width: "2px",
          height: "140%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0, 240, 255, 0.04) 30%, rgba(0, 240, 255, 0.05) 50%, rgba(0, 240, 255, 0.04) 70%, transparent 100%)",
          transform: "rotate(25deg)",
          transformOrigin: "top left",
        }}
      />
      {/* Light Ray 2 */}
      <div
        className="absolute animate-light-ray-sweep-2"
        style={{
          top: "-10%",
          right: "20%",
          width: "1px",
          height: "130%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(139, 92, 246, 0.03) 30%, rgba(139, 92, 246, 0.04) 50%, rgba(139, 92, 246, 0.03) 70%, transparent 100%)",
          transform: "rotate(-20deg)",
          transformOrigin: "top right",
        }}
      />
      {/* Light Ray 3 */}
      <div
        className="absolute animate-light-ray-sweep-3"
        style={{
          top: "-15%",
          left: "40%",
          width: "1px",
          height: "135%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.03) 25%, rgba(59, 130, 246, 0.05) 50%, rgba(59, 130, 246, 0.03) 75%, transparent 100%)",
          transform: "rotate(15deg)",
          transformOrigin: "top center",
        }}
      />
    </div>
  );
};

export default AmbientLightRays;