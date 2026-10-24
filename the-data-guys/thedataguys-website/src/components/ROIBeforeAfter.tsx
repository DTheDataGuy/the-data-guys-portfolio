import { motion } from 'framer-motion';

const beforeItems = [
  { label: 'Monthly reporting takes', value: '40+ hours', icon: '⏰' },
  { label: 'Decisions based on', value: 'Gut feeling', icon: '🎲' },
  { label: 'Data accuracy', value: '~60%', icon: '❌' },
  { label: 'Revenue leakage', value: 'Unknown', icon: '💸' },
  { label: 'Board confidence', value: 'Low', icon: '📉' },
];

const afterItems = [
  { label: 'Monthly reporting takes', value: '2 hours', icon: '⚡' },
  { label: 'Decisions based on', value: 'Real-time data', icon: '🎯' },
  { label: 'Data accuracy', value: '99.4%', icon: '✅' },
  { label: 'Revenue leakage', value: 'Identified & fixed', icon: '💰' },
  { label: 'Board confidence', value: 'Complete visibility', icon: '📈' },
];

export default function ROIBeforeAfter() {
  return (
    <section id="roi-story" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            The Transformation
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            What Happens When Your Data House Is{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Strong?
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The difference between organizations that struggle and those that thrive comes down to one thing: a solid data foundation.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-8 backdrop-blur-xl"
          >
            <div className="absolute -top-4 left-6 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono uppercase tracking-wider">
              Before — Broken Data House
            </div>
            <div className="space-y-5 mt-4">
              {beforeItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-gray-400 text-sm">{item.label}</span>
                  </div>
                  <span className="text-red-400 font-mono text-sm font-bold">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-8 backdrop-blur-xl"
          >
            <div className="absolute -top-4 left-6 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
              After — Strong Data House
            </div>
            <div className="space-y-5 mt-4">
              {afterItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-gray-300 text-sm">{item.label}</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-sm font-bold">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm mb-4">
            Every organization we work with starts on the left. Within 90 days, they're on the right.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/20 transition-all duration-300"
          >
            Start Your Transformation
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}