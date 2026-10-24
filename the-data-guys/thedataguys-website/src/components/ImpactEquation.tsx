import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const variables = [
  {
    name: 'Outcome Magnitude',
    description: 'The measurable change per person or unit. Revenue gained, time saved, costs avoided.',
    icon: '📈',
  },
  {
    name: 'Population Affected',
    description: 'How many people, projects, or processes benefit from the change.',
    icon: '👥',
  },
  {
    name: 'Duration',
    description: 'How long the impact compounds. Months? Years? Decades?',
    icon: '⏳',
  },
  {
    name: 'Attribution Confidence',
    description: 'How certain are we this outcome came from this intervention? (0-100%)',
    icon: '🎯',
  },
];

const examples = [
  {
    industry: 'Nonprofit',
    icon: '🤝',
    calculation: '$500 × 2,000 participants × 3 years × 70%',
    result: '$2.1M',
    breakdown: {
      outcome: '$500 annual outcome per participant',
      population: '2,000 program participants',
      duration: '3 years of sustained impact',
      confidence: '70% attribution confidence',
    },
  },
  {
    industry: 'Construction',
    icon: '🏗️',
    calculation: '$250K × 20 projects × 2 years × 80%',
    result: '$8M',
    breakdown: {
      outcome: '$250,000 cost savings per project',
      population: '20 active projects',
      duration: '2 years of implementation',
      confidence: '80% attribution confidence',
    },
  },
  {
    industry: 'Economic Development',
    icon: '🏛️',
    calculation: '$15K × 50 businesses × 3 years × 75%',
    result: '$1.7M',
    breakdown: {
      outcome: '$15,000 value per business',
      population: '50 businesses served',
      duration: '3 years of growth',
      confidence: '75% attribution confidence',
    },
  },
];

export default function ImpactEquation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="impact-equation"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Methodology
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            The Impact Equation™
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our proprietary methodology for measuring real organizational value.
          </p>
        </motion.div>

        {/* Formula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-14"
        >
          <div className="rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/[0.04] backdrop-blur-xl p-6 md:p-8 text-center shadow-[0_0_40px_rgba(0,240,255,0.08)]">
            <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-4">
              The Formula
            </p>
            <div className="font-mono text-sm md:text-lg lg:text-xl text-white leading-relaxed">
              <span className="text-[#00f0ff] font-bold">Impact Value</span>
              <span className="text-gray-400"> = </span>
              <span className="text-white">Outcome Magnitude</span>
              <span className="text-[#00f0ff]"> × </span>
              <span className="text-white">Population Affected</span>
              <span className="text-[#00f0ff]"> × </span>
              <span className="text-white">Duration</span>
              <span className="text-[#00f0ff]"> × </span>
              <span className="text-white">Attribution Confidence</span>
            </div>
          </div>
        </motion.div>

        {/* Featured Example: Economic Development $9.18M */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-14"
        >
          <div className="rounded-2xl border-2 border-[#00f0ff]/40 bg-[#00f0ff]/[0.04] backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,240,255,0.1)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider font-bold">Featured Example</p>
                <h3 className="text-white font-bold text-lg">Economic Development Agency</h3>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1.5 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-mono font-bold">
                  Real Client Result
                </span>
              </div>
            </div>

            {/* Step-by-step calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-1">Outcome Magnitude</p>
                <p className="text-white font-black text-xl">$30,000</p>
                <p className="text-gray-400 text-[11px] mt-1">avg improvement per business</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-1">Population Affected</p>
                <p className="text-white font-black text-xl">120</p>
                <p className="text-gray-400 text-[11px] mt-1">businesses served</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-1">Duration</p>
                <p className="text-white font-black text-xl">3 years</p>
                <p className="text-gray-400 text-[11px] mt-1">of sustained impact</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-wider mb-1">Attribution</p>
                <p className="text-white font-black text-xl">85%</p>
                <p className="text-gray-400 text-[11px] mt-1">confidence level</p>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-[#00f0ff]/30 bg-[#00f0ff]/[0.06] p-5 text-center">
              <p className="text-gray-400 text-xs font-mono mb-2">
                $30,000 × 120 businesses × 3 years × 85% attribution
              </p>
              <p className="text-[#00f0ff] font-black text-4xl md:text-5xl tracking-tight">
                $9.18M
              </p>
              <p className="text-gray-400 text-sm mt-1">measured community impact value</p>
            </div>
          </div>
        </motion.div>

        {/* Variables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {variables.map((variable, index) => (
            <motion.div
              key={variable.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/[0.04] transition-all duration-300"
            >
              <span className="text-2xl mb-3 block">{variable.icon}</span>
              <h3 className="text-white font-bold text-sm mb-2">{variable.name}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{variable.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Industry Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h3 className="text-white font-bold text-xl md:text-2xl text-center mb-8">
            Real-World Applications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {examples.map((example, index) => (
              <motion.div
                key={example.industry}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.15 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-[#00f0ff]/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{example.icon}</span>
                  <h4 className="text-white font-bold text-base">{example.industry}</h4>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-400 text-xs">{example.breakdown.outcome}</p>
                  <p className="text-gray-400 text-xs">{example.breakdown.population}</p>
                  <p className="text-gray-400 text-xs">{example.breakdown.duration}</p>
                  <p className="text-gray-400 text-xs">{example.breakdown.confidence}</p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-gray-500 text-[10px] font-mono mb-1">{example.calculation}</p>
                  <p className="text-[#00f0ff] font-black text-2xl">{example.result}</p>
                  <p className="text-gray-500 text-xs">measured impact</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}