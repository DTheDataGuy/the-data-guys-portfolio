import { memo } from 'react';

const orbs = [
  { size: 450, x: '10%', y: '5%', duration: 22, delay: 0, colors: 'rgba(0,240,255,0.06), rgba(59,130,246,0.03), transparent', pulse: false },
  { size: 350, x: '75%', y: '20%', duration: 18, delay: 2, colors: 'rgba(168,85,247,0.07), rgba(236,72,153,0.04), transparent', pulse: false },
  { size: 400, x: '5%', y: '55%', duration: 25, delay: 1, colors: 'rgba(0,240,255,0.05), rgba(6,182,212,0.06), transparent', pulse: false },
  { size: 300, x: '60%', y: '60%', duration: 20, delay: 4, colors: 'rgba(59,130,246,0.06), rgba(139,92,246,0.05), transparent', pulse: false },
  { size: 350, x: '40%', y: '85%', duration: 23, delay: 3, colors: 'rgba(6,182,212,0.06), rgba(0,240,255,0.04), transparent', pulse: false },
];

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.colors})`,
            animation: `drift-${(i % 4) + 1} ${orb.duration}s ease-in-out infinite${orb.pulse ? `, orb-pulse ${orb.duration * 0.6}s ease-in-out infinite` : ''}`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default memo(FloatingOrbs);