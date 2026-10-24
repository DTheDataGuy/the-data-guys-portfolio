import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Layers, Network, Eye, Target } from 'lucide-react';

interface ServiceCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  includes: string[];
  outcome: string;
}

const categories: ServiceCategory[] = [
  {
    icon: <Layers className="w-7 h-7" />,
    title: 'Build Your Foundation',
    description: 'Get the fundamentals right before anything else.',
    includes: [
      'Governance frameworks',
      'Process documentation',
      'Data standards',
      'Quality controls',
      'Ownership matrices',
    ],
    outcome: 'A foundation leadership can trust.',
  },
  {
    icon: <Network className="w-7 h-7" />,
    title: 'Connect Your Organization',
    description: 'Break silos. Create a single source of truth.',
    includes: [
      'System integrations',
      'Data warehousing',
      'API connections',
      'Automated pipelines',
      'Migration',
    ],
    outcome: 'All your data in one place, updated automatically.',
  },
  {
    icon: <Eye className="w-7 h-7" />,
    title: 'Create Visibility',
    description: 'See what\'s happening across your entire organization.',
    includes: [
      'Executive dashboards',
      'KPI frameworks',
      'Automated reporting',
      'Self-service analytics',
      'Forecasting',
    ],
    outcome: 'Leadership answers in 30 seconds, not 3 days.',
  },
  {
    icon: <Target className="w-7 h-7" />,
    title: 'Measure Impact',
    description: 'Prove what\'s working. Stop what isn\'t.',
    includes: [
      'Outcome measurement',
      'ROI tracking',
      'Program analytics',
      'Predictive models',
      'Impact frameworks',
    ],
    outcome: 'Every dollar and every program, measured.',
  },
];

export default function WhatWeBuild() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="what-we-build"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-[#3b82f6]/[0.03] blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[#00f0ff]/[0.02] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            What We Build
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Four Outcomes. One Mission.
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We don&apos;t sell hours or tools. We deliver measurable outcomes that transform how your organization operates.
          </p>
        </motion.div>

        {/* Categories Grid - 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.12 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-7 hover:border-[#00f0ff]/40 hover:bg-white/[0.05] hover:shadow-[0_0_40px_rgba(0,240,255,0.1)] transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] mb-5 group-hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-shadow duration-300">
                {category.icon}
              </div>

              {/* Title & Description */}
              <h3 className="text-white font-black text-xl mb-2 group-hover:text-[#00f0ff] transition-colors duration-300">
                {category.title}
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                {category.description}
              </p>

              {/* Includes */}
              <div className="mb-5">
                <div className="flex flex-wrap gap-2">
                  {category.includes.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] text-gray-300 border border-white/10 group-hover:border-[#00f0ff]/20 group-hover:text-gray-200 transition-colors duration-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-[#00f0ff] font-bold text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                  &ldquo;{category.outcome}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-white/[0.05] text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300"
          >
            Let&apos;s Build Your Outcome
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}