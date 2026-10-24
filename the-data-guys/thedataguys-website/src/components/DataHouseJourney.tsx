import { motion } from 'framer-motion';
import { Layers, BarChart3, Brain, Rocket, ArrowRight } from 'lucide-react';

const phases = [
  {
    icon: Layers,
    title: 'Foundation',
    subtitle: 'The Data House™',
    color: '#3b82f6',
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/[0.06]',
    glowColor: 'from-blue-500/10',
    items: ['Governance', 'People', 'Processes', 'Systems', 'Data'],
  },
  {
    icon: BarChart3,
    title: 'Visibility',
    subtitle: 'See What Matters',
    color: '#06b6d4',
    borderColor: 'border-cyan-500/20',
    bgColor: 'bg-cyan-500/[0.06]',
    glowColor: 'from-cyan-500/10',
    items: ['Reporting', 'Dashboards', 'KPIs', 'Metrics', 'Alerts'],
  },
  {
    icon: Brain,
    title: 'Intelligence',
    subtitle: 'Know What It Means',
    color: '#8b5cf6',
    borderColor: 'border-purple-500/20',
    bgColor: 'bg-purple-500/[0.06]',
    glowColor: 'from-purple-500/10',
    items: ['Insights', 'Forecasting', 'Recommendations', 'Patterns', 'Predictions'],
  },
  {
    icon: Rocket,
    title: 'Impact',
    subtitle: 'Impact Intelligence™',
    color: '#00f0ff',
    borderColor: 'border-[#00f0ff]/20',
    bgColor: 'bg-[#00f0ff]/[0.06]',
    glowColor: 'from-[#00f0ff]/10',
    items: ['Outcomes', 'ROI', 'Community Impact', 'Funding Impact', 'Operational Impact'],
  },
];

export default function DataHouseJourney() {
  return (
    <section className="relative py-20 md:py-28 bg-[#0a0e1a] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/50 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-5">
            <Layers className="w-3.5 h-3.5" />
            THE JOURNEY
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            The Data House Journey™
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0 text-center text-gray-400">
            {"From scattered data to measurable impact, a proven progression that builds each layer on a solid foundation."}
          </p>
        </motion.div>

        {/* Phases */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-3 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-blue-500/30 via-cyan-500/30 via-purple-500/30 to-[#00f0ff]/30 -translate-y-1/2 z-0" />

          {phases.map((phase, i) => (
            <motion.div
              key={phase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative z-10 flex flex-col"
            >
              {/* Card */}
              <div
                className={`relative rounded-2xl border ${phase.borderColor} bg-white/[0.02] backdrop-blur-sm p-5 md:p-6 flex-1 hover:bg-white/[0.04] transition-all duration-300 group`}
              >
                {/* Phase number */}
                <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0a0e1a] border border-white/10 text-gray-400">
                  PHASE {i + 1}
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${phase.bgColor} border ${phase.borderColor} flex items-center justify-center mb-4 mt-2 group-hover:scale-110 transition-transform duration-300`}
                >
                  <phase.icon className="w-6 h-6" style={{ color: phase.color }} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-1">{phase.title}</h3>
                <p className="text-xs font-medium mb-4" style={{ color: phase.color }}>
                  {phase.subtitle}
                </p>

                {/* Items */}
                <ul className="space-y-1.5">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-400">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: phase.color, opacity: 0.6 }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow between cards (mobile) */}
              {i < phases.length - 1 && (
                <div className="flex md:hidden justify-center py-3">
                  <ArrowRight className="w-5 h-5 text-[#00f0ff]/40 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-sm text-gray-500 font-medium">
            <span className="text-blue-400">Data House™</span>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-cyan-400">Decision Intelligence™</span>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-[#00f0ff]">Impact Intelligence™</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}