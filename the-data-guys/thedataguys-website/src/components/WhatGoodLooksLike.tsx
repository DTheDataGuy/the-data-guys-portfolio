import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const industries = [
  {
    name: 'Nonprofit',
    icon: '🤝',
    items: [
      'Grant reports generated in 10 minutes',
      'Outcome dashboards update automatically',
      'Board sees impact at a glance',
      'Programs compared side by side',
      'Funding justification ready anytime',
    ],
  },
  {
    name: 'Construction',
    icon: '🏗️',
    items: [
      'Real-time labor utilization tracking',
      'Forecasts updated daily',
      'Cost overruns identified immediately',
      'Executive dashboard refreshes automatically',
      'Project profitability visible in real-time',
    ],
  },
  {
    name: 'Government',
    icon: '🏛️',
    items: [
      'Citizen response times tracked live',
      'Budget transparency dashboards public',
      'Department KPIs update weekly',
      'Council reports generated automatically',
      'Community impact measured continuously',
    ],
  },
];

export default function WhatGoodLooksLike() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="what-good-looks-like"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-[#00f0ff]/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vision
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            What Good Looks Like
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stop imagining pain. Start seeing the future.
          </p>
        </motion.div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 md:p-7 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300 group"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{industry.icon}</span>
                <h3 className="text-white font-bold text-lg">{industry.name}</h3>
              </div>

              {/* Items */}
              <ul className="space-y-3">
                {industry.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Bottom glow on hover */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <p className="text-emerald-400/60 text-xs font-mono group-hover:text-emerald-400 transition-colors">
                  Achievable in 90 days →
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm mb-5">
            This isn&apos;t aspirational. These are real outcomes from real clients.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-[#00f0ff] text-[#0a0e1a] shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-shadow"
          >
            See Your Future
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}