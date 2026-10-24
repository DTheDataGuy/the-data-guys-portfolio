import { motion } from 'framer-motion';

const layers = [
  { label: 'Data-Ready', level: 6, color: 'from-[#8b5cf6] to-[#6366f1]', glow: '#8b5cf6' },
  { label: 'Trusted Data', level: 5, color: 'from-[#00f0ff] to-[#06b6d4]', glow: '#00f0ff' },
  { label: 'Systems', level: 4, color: 'from-[#3b82f6] to-[#2563eb]', glow: '#3b82f6' },
  { label: 'Processes', level: 3, color: 'from-[#06b6d4] to-[#0891b2]', glow: '#06b6d4' },
  { label: 'People', level: 2, color: 'from-[#22d3ee] to-[#06b6d4]', glow: '#22d3ee' },
  { label: 'Governance', level: 1, color: 'from-[#0ea5e9] to-[#0284c7]', glow: '#0ea5e9' },
];

export default function AIReadiness() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="ai-readiness" className="relative z-10 py-20 md:py-28 bg-[#0a0e1a]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            AI Doesn&apos;t Fix{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Bad Data
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Before AI can work, your Data House™ must be strong.
          </p>
        </motion.div>

        {/* Pyramid / Stacked Blocks */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="flex flex-col-reverse gap-2">
            {layers.map((layer, i) => {
              const width = 50 + (layers.length - i) * 8;
              return (
                <motion.div
                  key={layer.label}
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  whileInView={{ opacity: 1, scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="mx-auto relative group"
                  style={{ width: `${width}%` }}
                >
                  <div
                    className={`relative py-3 md:py-4 px-4 rounded-lg bg-gradient-to-r ${layer.color} border border-white/10 text-center transition-all duration-300 group-hover:scale-[1.02]`}
                    style={{
                      boxShadow: `0 0 20px ${layer.glow}15, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}
                  >
                    <span className="text-white font-bold text-sm md:text-base tracking-wide">
                      {layer.label}
                    </span>
                    {i === 0 && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white text-[10px] font-bold border border-white/20">
                        GOAL
                      </span>
                    )}
                  </div>
                  {/* Arrow between layers */}
                  {i < layers.length - 1 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-gray-500 text-xs z-10">
                      
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Key Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-block p-6 rounded-2xl bg-white/[0.03] border border-[#00f0ff]/15 backdrop-blur-sm max-w-2xl">
            <p className="text-gray-200 text-base md:text-lg leading-relaxed">
              <span className="text-[#00f0ff] font-bold">Data House™ = Data Readiness for AI.</span>{' '}
              We build the foundation that makes AI actually work.
              You can&apos;t skip to the top — each layer depends on the one below it.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <motion.button
            onClick={() => scrollTo('data-house-assessment')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base md:text-lg font-bold bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff]/60 hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Assess My Data Readiness →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}