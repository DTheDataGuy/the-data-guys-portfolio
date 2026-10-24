const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Aurora Layer 1 - Cyan */}
      <div
        className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-aurora-shift-1"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(0, 240, 255, 0.04) 0%, transparent 50%)",
        }}
      />
      {/* Aurora Layer 2 - Purple */}
      <div
        className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-aurora-shift-2"
        style={{
          background:
            "radial-gradient(ellipse at 70% 60%, rgba(168, 85, 247, 0.03) 0%, transparent 50%)",
        }}
      />
      {/* Aurora Layer 3 - Blue */}
      <div
        className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-aurora-shift-3"
        style={{
          background:
            "radial-gradient(ellipse at 50% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 45%)",
        }}
      />
      {/* Aurora Layer 4 - Mixed cyan/purple overlap */}
      <div
        className="absolute w-[180%] h-[180%] top-[-40%] left-[-40%] animate-aurora-shift-4"
        style={{
          background:
            "radial-gradient(ellipse at 60% 30%, rgba(0, 240, 255, 0.03) 0%, transparent 40%), radial-gradient(ellipse at 40% 70%, rgba(139, 92, 246, 0.04) 0%, transparent 40%)",
        }}
      />
    </div>
  );
};

export default AuroraBackground;