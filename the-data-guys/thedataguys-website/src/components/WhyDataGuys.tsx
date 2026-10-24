import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const comparisons = [
  { others: 'Dashboard First', us: 'Strategy First' },
  { others: 'Reports', us: 'Decisions' },
  { others: 'Outputs', us: 'Outcomes' },
  { others: 'Activity Metrics', us: 'Impact Metrics' },
  { others: 'Generic Templates', us: 'Industry Frameworks' },
  { others: 'Tool Recommendations', us: 'Complete Systems' },
  { others: 'One-Time Project', us: 'Long-Term Intelligence' },
];

export default function WhyDataGuys() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const scrollToDataHouse = () => {
    const el = document.getElementById('living-data-house');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="why-data-guys"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.04] blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            The Difference
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Why The Data Guys™?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We don&apos;t just build dashboards. We build Data Houses.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-2 border-b border-white/[0.08]">
            <div className="px-6 py-4 text-center">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Most Consultants</span>
            </div>
            <div className="px-6 py-4 text-center border-l border-white/[0.08]">
              <span className="text-sm font-semibold text-[#00f0ff] uppercase tracking-wider">The Data Guys™</span>
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, index) => (
            <motion.div
              key={row.us}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`grid grid-cols-2 ${index < comparisons.length - 1 ? 'border-b border-white/[0.05]' : ''} group hover:bg-white/[0.02] transition-colors duration-300`}
            >
              {/* Others column */}
              <div className="px-6 py-5 flex items-center">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                  <span className="text-gray-500 text-sm md:text-base">{row.others}</span>
                </div>
              </div>

              {/* The Data Guys column */}
              <div className="px-6 py-5 flex items-center border-l border-white/[0.08] bg-[#00f0ff]/[0.02] group-hover:bg-[#00f0ff]/[0.05] transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shrink-0 shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                  <span className="text-[#00f0ff] text-sm md:text-base font-medium">{row.us}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-10"
        >
          <button
            onClick={scrollToDataHouse}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 hover:scale-105"
          >
            See What Makes Your Data House Different
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}