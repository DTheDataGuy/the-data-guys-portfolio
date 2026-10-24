import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const costItems = [
  {
    year: 'Year 1',
    title: 'Invisible Losses',
    costs: [
      { label: 'Manual reporting labor', amount: '$85,000' },
      { label: 'Bad decisions from bad data', amount: '$150,000' },
      { label: 'Missed grant/funding opportunities', amount: '$200,000' },
      { label: 'Staff turnover from frustration', amount: '$120,000' },
    ],
    total: '$555,000',
    color: 'amber',
  },
  {
    year: 'Year 3',
    title: 'Compounding Damage',
    costs: [
      { label: 'Cumulative reporting waste', amount: '$255,000' },
      { label: 'Strategic opportunities missed', amount: '$750,000' },
      { label: 'Competitor advantage gap', amount: '$500,000' },
      { label: 'Technical debt accumulation', amount: '$300,000' },
    ],
    total: '$1,805,000',
    color: 'orange',
  },
  {
    year: 'Year 5',
    title: 'Existential Risk',
    costs: [
      { label: 'Total operational waste', amount: '$425,000' },
      { label: 'Market position erosion', amount: '$2,000,000' },
      { label: 'AI-readiness gap penalty', amount: '$1,500,000' },
      { label: 'Organizational stagnation', amount: '$800,000' },
    ],
    total: '$4,725,000',
    color: 'red',
  },
];

export default function CostOfDoingNothing() {
  const [activeYear, setActiveYear] = useState(0);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#1a0a0a] to-[#0a0e1a]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-red-400 font-mono text-sm tracking-[0.3em] uppercase mb-4">
            The Hidden Price Tag
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            The Cost of{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Doing Nothing
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every month without a data strategy costs more than you think. Here's what inaction actually costs your organization.
          </p>
        </motion.div>

        {/* Year Tabs */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {costItems.map((item, i) => (
            <button
              key={item.year}
              onClick={() => setActiveYear(i)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeYear === i
                  ? 'bg-red-500/15 border border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                  : 'bg-white/[0.03] border border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {item.year}
            </button>
          ))}
        </div>

        {/* Cost Breakdown */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeYear}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/[0.02] backdrop-blur-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-bold text-xl">{costItems[activeYear].title}</h3>
                <p className="text-gray-400 text-sm">{costItems[activeYear].year} of inaction</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs font-mono uppercase">Total Cost</p>
                <p className="text-red-400 font-mono font-black text-2xl">{costItems[activeYear].total}</p>
              </div>
            </div>

            <div className="space-y-4">
              {costItems[activeYear].costs.map((cost, i) => (
                <motion.div
                  key={cost.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <span className="text-gray-300 text-sm">{cost.label}</span>
                  <span className="text-red-400/80 font-mono text-sm font-bold">{cost.amount}</span>
                </motion.div>
              ))}
            </div>

            {/* Visual bar */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(activeYear + 1) * 33}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2 text-center">
                Cost compounds {activeYear === 0 ? 'linearly' : activeYear === 1 ? 'exponentially' : 'catastrophically'} over time
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-gray-400 text-sm mb-4">
            The average organization loses <span className="text-red-400 font-bold">$555K in Year 1</span> from data dysfunction alone.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 transition-all duration-300 mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[12px] pr-[24px] pb-[12px] pl-[24px] rounded-xl text-[14px] font-semibold text-center text-[#00F0FF] bg-[#00F0FF33] opacity-100"
          >
            Stop The Bleeding — Book A Call
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}