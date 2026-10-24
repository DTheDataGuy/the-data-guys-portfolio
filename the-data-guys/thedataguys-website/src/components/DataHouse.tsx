import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, ToggleRight } from 'lucide-react';

const systems = [
  { name: 'Excel', emoji: '📊' },
  { name: 'QuickBooks', emoji: '💰' },
  { name: 'Salesforce', emoji: '☁️' },
  { name: 'Google Forms', emoji: '📝' },
  { name: 'Mailchimp', emoji: '📧' },
  { name: 'Smartsheet', emoji: '📋' },
];

const beforePositions = [
  { top: '10%', left: '5%' },
  { top: '5%', left: '65%' },
  { top: '55%', left: '10%' },
  { top: '60%', left: '70%' },
  { top: '30%', left: '80%' },
  { top: '75%', left: '40%' },
];

export default function DataHouse() {
  const [isAfter, setIsAfter] = useState(false);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0c1220] to-[#0a0e1a]" />
      <div className="absolute inset-0 gradient-mesh-bg opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Inside Your <span className="gradient-text">Data House™</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See the transformation from chaos to clarity.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${!isAfter ? 'text-red-400' : 'text-gray-500'}`}>
            Before
          </span>
          <button
            onClick={() => setIsAfter(!isAfter)}
            className="relative w-16 h-8 rounded-full border-2 transition-all duration-500 flex items-center px-1"
            style={{
              borderColor: isAfter ? '#00f0ff' : '#ef4444',
              background: isAfter ? 'rgba(0, 240, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}
            aria-label="Toggle before and after view"
          >
            <motion.div
              className="w-5 h-5 rounded-full"
              animate={{
                x: isAfter ? 28 : 0,
                backgroundColor: isAfter ? '#00f0ff' : '#ef4444',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${isAfter ? 'text-[#00f0ff]' : 'text-gray-500'}`}>
            After
          </span>
        </motion.div>

        {/* Visualization Area */}
        <div className="relative max-w-4xl mx-auto h-[400px] md:h-[450px] rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          {/* Status Label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isAfter ? 'connected' : 'disconnected'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
            >
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isAfter
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {isAfter ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Before State - Scattered Systems */}
          <AnimatePresence>
            {!isAfter && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {/* Chaos lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <line x1="15%" y1="20%" x2="70%" y2="65%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="75%" y1="15%" x2="20%" y2="60%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50%" y1="80%" x2="85%" y2="35%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="10%" y1="50%" x2="60%" y2="20%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {systems.map((system, i) => (
                  <motion.div
                    key={system.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: [0, Math.random() * 10 - 5, 0],
                      y: [0, Math.random() * 10 - 5, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.3, delay: i * 0.1 },
                      scale: { duration: 0.3, delay: i * 0.1 },
                      x: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    className="absolute flex flex-col items-center gap-1"
                    style={{ top: beforePositions[i].top, left: beforePositions[i].left }}
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
                      {system.emoji}
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-400 font-medium">{system.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* After State - Connected Hub */}
          <AnimatePresence>
            {isAfter && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Central Hub */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                  className="relative"
                >
                  {/* Glow ring */}
                  <div className="absolute inset-0 w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#00f0ff]/20 blur-xl animate-pulse-glow" />
                  <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#3b82f6]/20 border-2 border-[#00f0ff]/50 flex items-center justify-center">
                    <span className="text-[#00f0ff] font-black text-xs md:text-sm text-center leading-tight">
                      DATA<br />HUB
                    </span>
                  </div>
                </motion.div>

                {/* Connected Systems in Circle */}
                {systems.map((system, i) => {
                  const angle = (i / systems.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 150;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={system.name}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                      className="absolute flex flex-col items-center gap-1"
                      style={{
                        top: `calc(50% + ${y}px - 28px)`,
                        left: `calc(50% + ${x}px - 28px)`,
                      }}
                    >
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-xl">
                        {system.emoji}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{system.name}</span>
                    </motion.div>
                  );
                })}

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {systems.map((system, i) => {
                    const angle = (i / systems.length) * Math.PI * 2 - Math.PI / 2;
                    const radius = 150;
                    const x = 50 + (Math.cos(angle) * radius) / 4;
                    const y = 50 + (Math.sin(angle) * radius) / 4.5;

                    return (
                      <motion.line
                        key={`line-${system.name}`}
                        x1="50%"
                        y1="50%"
                        x2={`${x}%`}
                        y2={`${y}%`}
                        stroke="#00f0ff"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}
                      />
                    );
                  })}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-gray-500 text-xs">
            {isAfter ? (
              <ToggleRight className="w-4 h-4 text-[#00f0ff]" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-red-400" />
            )}
            <span>Click toggle to switch view</span>
          </div>
        </div>
      </div>
    </section>
  );
}