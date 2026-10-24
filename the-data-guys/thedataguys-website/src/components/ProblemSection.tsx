import { motion } from 'framer-motion';

const brokenItems = [
  { emoji: '🚨', text: 'Funding reports take weeks' },
  { emoji: '🚨', text: 'Nobody trusts the numbers' },
  { emoji: '🚨', text: 'Leadership guesses instead of knows' },
  { emoji: '🚨', text: 'Opportunities get missed' },
  { emoji: '🚨', text: 'Data lives in 12 spreadsheets' },
];

const strongItems = [
  { emoji: '✅', text: 'Real-time visibility' },
  { emoji: '✅', text: 'One trusted source' },
  { emoji: '✅', text: 'Faster decisions' },
  { emoji: '✅', text: 'Automated reporting' },
  { emoji: '✅', text: 'Proven outcomes' },
];

const transformationStages = [
  { label: 'BROKEN', color: 'red' },
  { label: 'ORGANIZED', color: 'yellow' },
  { label: 'INTELLIGENT', color: 'emerald' },
];

export default function ProblemSection() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="problem-section" className="relative z-10 py-14 md:py-20 bg-[#0a0e1a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-black text-center text-white mb-8"
        >
          What Happens When Your{' '}
          <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
            Data House
          </span>{' '}
          Is Broken?
        </motion.h2>

        {/* Transformation Timeline - Prominent Horizontal Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10"
        >
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-r from-red-500/[0.06] via-yellow-500/[0.06] to-emerald-500/[0.06] backdrop-blur-xl p-5 md:p-6">
            {/* Horizontal progression bar */}
            <div className="flex items-center justify-between relative">
              {/* Background track */}
              <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                  initial={{ width: '0%' }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Animated pulse traveling along the bar */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00f0ff] shadow-[0_0_16px_#00f0ff,0_0_32px_#00f0ff] z-10"
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {transformationStages.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.2 }}
                  className="relative z-20 flex flex-col items-center"
                >
                  {/* Stage node */}
                  <div
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 shadow-lg ${
                      i === 0
                        ? 'bg-red-500 border-red-400 shadow-red-500/40'
                        : i === 1
                          ? 'bg-yellow-500 border-yellow-400 shadow-yellow-500/40'
                          : 'bg-emerald-500 border-emerald-400 shadow-emerald-500/40'
                    }`}
                  />
                  {/* Stage label */}
                  <span
                    className={`mt-3 text-sm md:text-lg lg:text-xl font-black tracking-wider ${
                      i === 0
                        ? 'text-red-400'
                        : i === 1
                          ? 'text-yellow-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Arrows between stages (visible on md+) */}
            <div className="hidden md:flex items-center justify-center gap-4 mt-3">
              <motion.div
                className="flex items-center gap-2"
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-red-400/60 text-xs font-medium">chaos</span>
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none" className="text-yellow-400">
                  <path d="M0 6H28M28 6L22 1M28 6L22 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-yellow-400/60 text-xs font-medium">structure</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-2"
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              >
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none" className="text-emerald-400">
                  <path d="M0 6H28M28 6L22 1M28 6L22 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-emerald-400/60 text-xs font-medium">intelligence</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Two-column layout: Broken vs Strong */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8 mb-10">
          {/* Left: Broken Data House */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-xl md:text-2xl font-bold text-red-400 mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              Broken Data House
            </h3>
            {brokenItems.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-300"
              >
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <span className="text-gray-200 font-medium text-sm">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Strong Data House */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-xl md:text-2xl font-bold text-[#00f0ff] mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#00f0ff] animate-pulse" />
              Strong Data House
            </h3>
            {strongItems.map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm hover:bg-cyan-500/15 hover:border-cyan-500/30 transition-all duration-300"
              >
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <span className="text-gray-200 font-medium text-sm">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bridge text + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-300 text-lg md:text-xl font-medium mb-5">
            We built the <span className="text-[#00f0ff] font-bold">Data House™</span> framework to transform your
            organization into a{' '}
            <span className="text-emerald-400 font-semibold">scalable data system</span> prepared for future growth.
          </p>
          <motion.button
            onClick={() => scrollTo('living-data-house')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base md:text-lg font-bold bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff]/60 hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Explore The Data House →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}