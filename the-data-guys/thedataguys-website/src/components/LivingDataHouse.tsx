import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface FloorDetail {
  without: string[];
  strong: string[];
  deliverables: string[];
  outcome: string;
  symptoms: string[];
  outcomes: string[];
}

interface Floor {
  id: number;
  name: string;
  icon: string;
  subtitle: string;
  label: string;
  detail: FloorDetail;
}

const floors: Floor[] = [
  {
    id: 8,
    name: 'Impact & Intelligence',
    icon: '🚀',
    subtitle: 'The Roof',
    label: 'You see what\'s coming, not just what happened',
    detail: {
      without: [
        'Can\'t prove ROI on any initiative',
        'Backward-looking reports only',
        'Gut-feel decisions dominate strategy',
        'No predictive capability whatsoever',
      ],
      strong: [
        'Outcome measurement on every program',
        'Predictive models that anticipate trends',
        'Prescriptive insights that guide action',
        'Continuous improvement driven by data',
      ],
      deliverables: [
        'Impact measurement frameworks',
        'Predictive analytics',
        'AI/ML models',
        'Strategic dashboards',
        'ROI tracking',
      ],
      outcome: 'You see what\'s coming, not just what happened.',
      symptoms: [
        'Can\'t prove program effectiveness',
        'Funders ask questions you can\'t answer',
        'No connection between activity and outcomes',
      ],
      outcomes: [
        'Clear ROI for every initiative',
        'Funder confidence',
        'Data-driven strategic planning',
      ],
    },
  },
  {
    id: 7,
    name: 'Automation',
    icon: '⚡',
    subtitle: 'Efficiency',
    label: 'Your team focuses on decisions, not data entry',
    detail: {
      without: [
        'Staff doing repetitive tasks all day',
        'Delayed responses to critical events',
        'Human error in data entry and transfers',
        'Bottlenecks at every handoff point',
      ],
      strong: [
        'Triggered workflows that act instantly',
        'Auto-alerts for anomalies and thresholds',
        'Scheduled processes that run themselves',
        'Exception-based management frees your team',
      ],
      deliverables: [
        'Workflow automation',
        'Alert systems',
        'Scheduled ETL',
        'Exception reporting',
        'Integration triggers',
      ],
      outcome: 'Your team focuses on decisions, not data entry.',
      symptoms: [
        'Staff doing repetitive data entry',
        'Same email sent manually every week',
        'No alerts when things go wrong',
      ],
      outcomes: [
        'Staff focused on high-value work',
        'Proactive issue detection',
        'Scaled operations without scaling headcount',
      ],
    },
  },
  {
    id: 6,
    name: 'Reporting',
    icon: '📊',
    subtitle: 'Visibility',
    label: 'Answers in seconds, not days',
    detail: {
      without: [
        'Manual Excel reports consuming 40+ hours monthly',
        'Conflicting numbers across departments',
        'No self-service — everyone waits on one analyst',
        'Stale data that\'s outdated before it arrives',
      ],
      strong: [
        'Automated dashboards updated in real-time',
        'Self-service analytics for every team',
        'Consistent metrics everyone agrees on',
        'Real-time updates that reflect reality',
      ],
      deliverables: [
        'Executive dashboards',
        'KPI frameworks',
        'Automated report generation',
        'Self-service portals',
      ],
      outcome: 'Answers in seconds, not days.',
      symptoms: [
        'Reports take days to build',
        'Leadership waits for someone to pull data',
        'Dashboards exist but nobody uses them',
      ],
      outcomes: [
        'Automated reporting',
        'Self-service dashboards',
        'Real-time visibility',
      ],
    },
  },
  {
    id: 5,
    name: 'Data',
    icon: '💎',
    subtitle: 'Assets',
    label: 'You can trust every record',
    detail: {
      without: [
        'Duplicate records across every system',
        'Inconsistent formats and naming conventions',
        'Missing fields and incomplete records',
        'No validation — garbage in, garbage out',
      ],
      strong: [
        'Clean, standardized data across all sources',
        'Validated and deduplicated records',
        'Timely updates that reflect current reality',
        'Accessible data catalog for discovery',
      ],
      deliverables: [
        'Data quality audits',
        'Cleaning pipelines',
        'Validation rules',
        'Master data management',
        'Data catalog',
      ],
      outcome: 'You can trust every record.',
      symptoms: [
        'Nobody trusts the numbers',
        'Duplicates and gaps everywhere',
        'Can\'t answer basic questions quickly',
      ],
      outcomes: [
        'Clean, reliable data',
        'Answers in minutes not days',
        'Confident decision-making',
      ],
    },
  },
  {
    id: 4,
    name: 'Systems',
    icon: '🔗',
    subtitle: 'Technology',
    label: 'All your data talks to each other',
    detail: {
      without: [
        'Disconnected tools that don\'t communicate',
        'Data trapped in silos across departments',
        'Manual transfers between systems',
        'No single source of truth exists',
      ],
      strong: [
        'Fully integrated technology stack',
        'Automated data flow between all systems',
        'Centralized data warehouse',
        'Real-time access for every team',
      ],
      deliverables: [
        'Architecture design',
        'System integration',
        'Data warehouse',
        'API connections',
        'Migration plans',
      ],
      outcome: 'All your data talks to each other.',
      symptoms: [
        'Tools don\'t talk to each other',
        'Data lives in 10+ disconnected places',
        'Exports and imports are the norm',
      ],
      outcomes: [
        'Connected ecosystem',
        'Single source of truth',
        'Real-time data flow',
      ],
    },
  },
  {
    id: 3,
    name: 'Processes',
    icon: '🔄',
    subtitle: 'Workflows',
    label: 'Operations run without heroics',
    detail: {
      without: [
        'Manual reporting that takes days',
        'Inconsistent workflows across teams',
        'No documentation — tribal knowledge only',
        'Reactive firefighting instead of proactive work',
      ],
      strong: [
        'Automated pipelines that run themselves',
        'Documented workflows anyone can follow',
        'Proactive monitoring catches issues early',
        'Repeatable results every single time',
      ],
      deliverables: [
        'Process automation',
        'SOP documentation',
        'Quality checkpoints',
        'Alert systems',
        'Workflow maps',
      ],
      outcome: 'Operations run without heroics.',
      symptoms: [
        'Same report built 5 different ways',
        'No standard for data requests',
        'Manual workarounds everywhere',
      ],
      outcomes: [
        'Consistent, repeatable workflows',
        'Self-service data access',
        'Hours saved weekly',
      ],
    },
  },
  {
    id: 2,
    name: 'People',
    icon: '👥',
    subtitle: 'Team',
    label: 'Your team makes confident decisions independently',
    detail: {
      without: [
        'One person holds all the knowledge',
        'No data literacy across the organization',
        'Tribal knowledge creates bottlenecks',
        'High bus factor — if they leave, you\'re stuck',
      ],
      strong: [
        'Distributed expertise across teams',
        'Data-literate teams at every level',
        'Clear roles and responsibilities defined',
        'Succession planning eliminates risk',
      ],
      deliverables: [
        'Training programs',
        'Role definitions',
        'Knowledge base',
        'Data champions network',
        'Literacy assessments',
      ],
      outcome: 'Your team makes confident decisions independently.',
      symptoms: [
        'One person holds all the knowledge',
        'New hires take months to understand data',
        'Tribal knowledge runs the org',
      ],
      outcomes: [
        'Knowledge is documented and shared',
        'Anyone can find answers',
        'Team scales without bottlenecks',
      ],
    },
  },
  {
    id: 1,
    name: 'Governance',
    icon: '🏛️',
    subtitle: 'Foundation',
    label: 'Leadership trusts the numbers',
    detail: {
      without: [
        'Nobody owns data — accountability is zero',
        'Definitions change depending on who you ask',
        'Reports conflict with each other',
        'Compliance risk increases every quarter',
      ],
      strong: [
        'Clear ownership for every data asset',
        'Standard definitions everyone agrees on',
        'Access controls protect sensitive data',
        'Accountability baked into the culture',
      ],
      deliverables: [
        'Data ownership matrix',
        'Governance framework',
        'Data standards',
        'Quality controls',
        'Compliance documentation',
      ],
      outcome: 'Leadership trusts the numbers.',
      symptoms: [
        'Reports disagree across departments',
        'Teams argue about which numbers are right',
        'Board questions data accuracy',
      ],
      outcomes: [
        'Trusted reporting across all teams',
        'Reduced compliance risk',
        'Faster executive decisions',
      ],
    },
  },
];

export default function LivingDataHouse() {
  const [expandedFloor, setExpandedFloor] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const handleFloorClick = (floorId: number) => {
    setExpandedFloor(floorId === expandedFloor ? null : floorId);
  };

  return (
    <section
      id="living-data-house"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00f0ff]/[0.03] blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            The Data House™ Framework
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Eight Floors. One Foundation.
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0 text-center text-gray-400">
            {"Every floor depends on the one below it. Click each floor to see what breaks without it, and what becomes possible when it's strong."}
          </p>
        </motion.div>

        {/* House Structure */}
        <div className="relative">
          {/* Roof decoration */}
          <div className="flex justify-center mb-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-0 h-0 border-l-[120px] border-r-[120px] border-b-[50px] md:border-l-[200px] md:border-r-[200px] md:border-b-[70px] border-l-transparent border-r-transparent border-b-[#00f0ff]/20"
            />
          </div>

          {/* Floors */}
          <div className="space-y-2">
            {floors.map((floor, index) => {
              const isExpanded = expandedFloor === floor.id;

              return (
                <motion.div
                  key={floor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.06 }}
                >
                  {/* Floor Button */}
                  <button
                    onClick={() => handleFloorClick(floor.id)}
                    className={`w-full relative rounded-xl border px-5 py-4 md:px-7 md:py-5 transition-all duration-300 cursor-pointer text-left ${
                      isExpanded
                        ? 'bg-[#00f0ff]/[0.1] border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                        : 'bg-white/[0.03] border-white/10 hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00f0ff]/60 text-xs font-mono font-bold w-5">
                            {floor.id}
                          </span>
                          <span className="text-2xl md:text-3xl">{floor.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-black text-base md:text-lg">
                              {floor.name}
                            </span>
                            <span className="text-gray-500 text-[10px] md:text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                              {floor.subtitle}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs md:text-sm mt-0.5">
                            {floor.label}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#00f0ff]/60"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 rounded-xl border border-[#00f0ff]/20 bg-[#0a0e1a]/90 backdrop-blur-xl p-5 md:p-7">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Without It */}
                            <div className="rounded-lg bg-red-500/[0.05] border border-red-500/20 p-4">
                              <h4 className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                Without It
                              </h4>
                              <ul className="space-y-2">
                                {floor.detail.without.map((item) => (
                                  <li key={item} className="text-gray-400 text-sm flex items-start gap-2">
                                    <span className="text-red-400/70 mt-0.5">✗</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Strong Means */}
                            <div className="rounded-lg bg-[#00f0ff]/[0.04] border border-[#00f0ff]/20 p-4">
                              <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                                Strong Means
                              </h4>
                              <ul className="space-y-2">
                                {floor.detail.strong.map((item) => (
                                  <li key={item} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-[#00f0ff]/80 mt-0.5">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Symptoms */}
                            <div className="rounded-lg bg-amber-500/[0.05] border border-amber-500/20 p-4">
                              <h4 className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Symptoms
                              </h4>
                              <ul className="space-y-2">
                                {floor.detail.symptoms.map((item) => (
                                  <li key={item} className="text-gray-400 text-sm flex items-start gap-2">
                                    <span className="text-amber-400/70 mt-0.5">⚠</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Business Outcomes */}
                            <div className="rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20 p-4">
                              <h4 className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Business Outcomes
                              </h4>
                              <ul className="space-y-2">
                                {floor.detail.outcomes.map((item) => (
                                  <li key={item} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-emerald-400/80 mt-0.5">✓</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Deliverables */}
                            <div className="rounded-lg bg-white/[0.02] border border-white/10 p-4">
                              <h4 className="text-gray-300 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                                What We Deliver
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {floor.detail.deliverables.map((item) => (
                                  <span
                                    key={item}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Outcome */}
                            <div className="rounded-lg bg-[#00f0ff]/[0.03] border border-[#00f0ff]/10 p-4 flex items-center">
                              <div>
                                <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                                  When This Floor Is Strong
                                </h4>
                                <p className="text-white font-bold text-base md:text-lg leading-snug">
                                  &ldquo;{floor.detail.outcome}&rdquo;
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Foundation label */}
          <div className="mt-3 text-center">
            
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm mb-5">
            Most organizations have cracks in their foundation. The good news? Every floor can be strengthened.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow"
          >
            Assess My Data House
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}