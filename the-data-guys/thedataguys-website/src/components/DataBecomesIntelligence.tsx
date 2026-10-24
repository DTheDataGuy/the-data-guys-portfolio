import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Stage {
  number: number;
  icon: string;
  title: string;
  items: string[];
  accentColor: string;
}

const stages: Stage[] = [
  {
    number: 1,
    icon: '📁',
    title: 'DATA',
    items: ['Spreadsheets', 'Forms', 'CRMs', 'Surveys', 'Databases'],
    accentColor: 'from-gray-400 to-gray-300',
  },
  {
    number: 2,
    icon: '🔗',
    title: 'ORGANIZATION',
    items: [
      'Connected Systems',
      'Clean Data',
      'Definitions',
      'Governance',
      'Automation',
    ],
    accentColor: 'from-blue-400 to-cyan-400',
  },
  {
    number: 3,
    icon: '📊',
    title: 'INTELLIGENCE',
    items: [
      'Dashboards',
      'Forecasting',
      'Impact Measurement',
      'Operational Visibility',
      'Strategic Decisions',
    ],
    accentColor: 'from-[#00f0ff] to-[#3b82f6]',
  },
  {
    number: 4,
    icon: '🎯',
    title: 'OUTCOMES',
    items: [
      'More Funding',
      'More Revenue',
      'Less Reporting Time',
      'Better Services',
      'Measurable Impact',
    ],
    accentColor: 'from-[#00f0ff] to-emerald-400',
  },
];

function ConnectorLine({ delay }: { delay: number }) {
  return (
    <div className="flex justify-center py-2">
      <div className="relative w-[2px] h-16 overflow-hidden">
        {/* Static gradient line */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/40 to-[#3b82f6]/40 rounded-full" />
        {/* Animated pulse traveling down */}
        <motion.div
          className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-transparent via-[#00f0ff] to-transparent rounded-full"
          initial={{ y: -32 }}
          animate={{ y: 64 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
            delay: delay,
          }}
        />
      </div>
    </div>
  );
}

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 md:p-8 overflow-hidden group hover:border-[#00f0ff]/30 transition-colors duration-500"
    >
      {/* Subtle glow on hover */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#00f0ff]/[0.05] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-start gap-5">
        {/* Stage number + icon */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stage.accentColor} flex items-center justify-center shadow-lg`}
            >
              <span className="text-2xl">{stage.icon}</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0a0e1a] border border-[#00f0ff]/40 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#00f0ff]">
                {stage.number}
              </span>
            </div>
          </div>
          <h3
            className={`text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r ${stage.accentColor} bg-clip-text text-transparent`}
          >
            {stage.title}
          </h3>
        </div>

        {/* Items */}
        <div className="flex flex-wrap gap-2 md:gap-3 md:ml-auto">
          {stage.items.map((item, i) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.15 + 0.2 + i * 0.06 }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-sm text-gray-300 font-medium hover:bg-[#00f0ff]/[0.08] hover:border-[#00f0ff]/20 hover:text-white transition-all duration-300"
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function DataBecomesIntelligence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      id="data-becomes-intelligence"
      ref={sectionRef}
      className="relative z-10 py-20 md:py-28 overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            The Journey
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            From Data to{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Outcomes
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your transformation journey through the Data House™
          </p>
        </motion.div>

        {/* Vertical Journey */}
        <div className="flex flex-col">
          {stages.map((stage, index) => (
            <div key={stage.title}>
              <StageCard stage={stage} index={index} />
              {index < stages.length - 1 && (
                <ConnectorLine delay={index * 0.4} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}