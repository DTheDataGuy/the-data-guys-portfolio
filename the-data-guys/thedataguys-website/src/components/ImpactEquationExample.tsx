import { motion } from 'framer-motion';

export default function ImpactEquationExample() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <p className="text-emerald-400 font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Real Example
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            The Impact Equation™ In Action
          </h2>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            How one Economic Development organization turned scattered data into $9.18M in measurable community impact.
          </p>
        </motion.div>

        {/* Visual Equation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] backdrop-blur-xl p-8 md:p-10"
        >
          {/* Equation Formula */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
            <div className="px-4 py-3 rounded-xl bg-[#00f0ff]/[0.08] border border-[#00f0ff]/25 text-center">
              <p className="text-[#00f0ff] font-mono font-bold text-lg">Clean Data</p>
              <p className="text-gray-500 text-[10px] uppercase">Foundation</p>
            </div>
            <span className="text-[#00f0ff] font-bold text-2xl">×</span>
            <div className="px-4 py-3 rounded-xl bg-purple-500/[0.08] border border-purple-500/25 text-center">
              <p className="text-purple-400 font-mono font-bold text-lg">Right Questions</p>
              <p className="text-gray-500 text-[10px] uppercase">Strategy</p>
            </div>
            <span className="text-[#00f0ff] font-bold text-2xl">×</span>
            <div className="px-4 py-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 text-center">
              <p className="text-amber-400 font-mono font-bold text-lg">Decision Logic</p>
              <p className="text-gray-500 text-[10px] uppercase">Framework</p>
            </div>
            <span className="text-emerald-400 font-bold text-2xl">=</span>
            <div className="px-5 py-3 rounded-xl bg-emerald-500/[0.12] border border-emerald-500/30 text-center">
              <p className="text-emerald-400 font-mono font-black text-2xl">$9.18M</p>
              <p className="text-gray-500 text-[10px] uppercase">Measurable Impact</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-2">The Challenge</p>
              <p className="text-gray-300 text-sm">
                Economic development agency with 15 disconnected data sources, no way to prove ROI of programs to funders.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-2">What We Built</p>
              <p className="text-gray-300 text-sm">
                Unified data warehouse connecting business surveys, workforce data, and financial systems with automated impact tracking.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-2">The Result</p>
              <p className="text-gray-300 text-sm">
                $9.18M in tracked community impact, 3x faster funder reporting, and data-backed decisions for every program.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}