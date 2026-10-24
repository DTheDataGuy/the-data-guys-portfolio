import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, BarChart3, Settings, Layers, ArrowRight } from 'lucide-react';

interface OutcomeCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  details: string[];
}

interface Recommendation {
  dashboard: string;
  resources: string[];
  metrics: string[];
}

const outcomes: OutcomeCard[] = [
  {
    id: 'revenue',
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Grow Revenue',
    subtitle: 'See exactly where money is made — and where it leaks.',
    details: [
      'Real-time revenue dashboards across all channels',
      'Customer lifetime value tracking and segmentation',
      'Predictive sales forecasting with AI models',
      'Automated alerts when metrics drop below targets',
    ],
  },
  {
    id: 'time',
    icon: <Clock className="w-8 h-8" />,
    title: 'Save Time',
    subtitle: 'Eliminate the 40-hour reporting weeks forever.',
    details: [
      'Automated report generation — daily, weekly, monthly',
      'Self-service dashboards so teams stop waiting on analysts',
      'Data pipelines that run while you sleep',
      'One source of truth — no more reconciliation marathons',
    ],
  },
  {
    id: 'impact',
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Measure Impact',
    subtitle: 'Prove your value with numbers, not narratives.',
    details: [
      'Program outcome tracking tied to real data',
      'Grant reporting automated from source systems',
      'Board-ready visualizations generated in seconds',
      'ROI measurement across every initiative',
    ],
  },
  {
    id: 'operations',
    icon: <Settings className="w-8 h-8" />,
    title: 'Improve Operations',
    subtitle: 'Find bottlenecks before they become disasters.',
    details: [
      'Cross-department visibility in a single view',
      'Process mining to identify inefficiencies',
      'Real-time operational KPIs for every team',
      'Automated workflows that eliminate human error',
    ],
  },
  {
    id: 'ai',
    icon: <Layers className="w-8 h-8" />,
    title: 'Build a Smarter Foundation',
    subtitle: 'Prepare your people, processes, systems, and data for automation, forecasting, and intelligence.',
    details: [
      'Clean, structured data ready for machine learning',
      'Data governance and quality frameworks',
      'Scalable architecture designed for your use cases',
      'Pilot projects that prove value before scaling',
    ],
  },
];

const recommendations: Record<string, Recommendation> = {
  revenue: {
    dashboard: 'Funding & Growth Dashboard',
    resources: ['Revenue Analytics Guide', 'Grant Readiness Checklist', 'Funder Reporting Toolkit'],
    metrics: ['Funding Secured', 'Revenue Growth', 'Grant Success Rate', 'Donor Retention'],
  },
  time: {
    dashboard: 'Operations Efficiency Dashboard',
    resources: ['Process Automation Guide', 'Workflow Optimization Kit', 'Integration Playbook'],
    metrics: ['Hours Saved', 'Error Reduction', 'Process Cycle Time', 'Staff Productivity'],
  },
  impact: {
    dashboard: 'Program Impact Dashboard',
    resources: ['Impact Measurement Guide', 'Nonprofit KPI Starter Kit', 'Logic Model Templates'],
    metrics: ['Participants Served', 'Retention Rate', 'Employment Outcomes', 'Program ROI'],
  },
  operations: {
    dashboard: 'Project Performance Dashboard',
    resources: ['Construction KPI Guide', 'Budget Tracking Toolkit', 'Timeline Management'],
    metrics: ['Budget Variance', 'Schedule Adherence', 'Safety Incidents', 'Profit Margin'],
  },
  ai: {
    dashboard: 'Executive Reporting Dashboard',
    resources: [
      'Automated Reporting Guide',
      'Data Visualization Best Practices',
      'Stakeholder Communication Kit',
    ],
    metrics: ['Report Generation Time', 'Data Accuracy', 'Stakeholder Satisfaction', 'Decision Turnaround'],
  },
};

const recommendedPaths: Record<string, string> = {
  time: 'Recommended path: Start with reporting automation, workflow mapping, and dashboard consolidation.',
  impact: 'Recommended path: Start with outcome measurement, attribution modeling, and impact dashboards.',
  ai: 'Recommended path: Start with data governance, system integration, and organizational intelligence.',
  revenue:
    'Recommended path: Start with data consolidation, automated dashboards, and stakeholder-specific views.',
  operations:
    'Recommended path: Start with real-time visibility, predictive analytics, and decision frameworks.',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function ProblemsWeSolve() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(selected === id ? null : id);
  };

  const scrollTo = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedOutcome = outcomes.find((o) => o.id === selected);
  const selectedRecommendation = selected ? recommendations[selected] : null;

  return (
    <section id="problems-we-solve" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 gradient-mesh-bg" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            What Are You Trying To{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Accomplish?
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Click what matters most to your organization.
          </p>
        </motion.div>

        {/* Outcome Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
        >
          {outcomes.map((outcome) => (
            <motion.button
              key={outcome.id}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(outcome.id)}
              className={`relative rounded-2xl p-6 text-left transition-all duration-300 backdrop-blur-xl border cursor-pointer ${
                selected === outcome.id
                  ? 'bg-[#00f0ff]/10 border-[#00f0ff]/60 shadow-[0_0_40px_rgba(0,240,255,0.15)]'
                  : 'bg-white/[0.04] border-white/10 hover:border-[#00f0ff]/40 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(0,240,255,0.08)]'
              }`}
            >
              {/* Selected indicator */}
              {selected === outcome.id && (
                <motion.div
                  layoutId="selectedGlow"
                  className="absolute inset-0 rounded-2xl border-2 border-[#00f0ff]/50 pointer-events-none"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div
                className={`mb-4 transition-colors duration-300 ${
                  selected === outcome.id ? 'text-[#00f0ff]' : 'text-gray-400'
                }`}
              >
                {outcome.icon}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{outcome.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{outcome.subtitle}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedOutcome && selectedRecommendation && (
            <motion.div
              key={selectedOutcome.id}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-8 bg-white/[0.03] backdrop-blur-xl border border-[#00f0ff]/20 shadow-[0_0_60px_rgba(0,240,255,0.05)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-[#00f0ff]">{selectedOutcome.icon}</div>
                  <h4 className="text-white font-bold text-2xl">
                    How We Help You {selectedOutcome.title}
                  </h4>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {selectedOutcome.details.map((detail, i) => (
                    <motion.div
                      key={detail}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#00f0ff] mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                      <span className="text-gray-300 text-sm leading-relaxed">{detail}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Recommendations Section */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-white/10"
                >
                  {/* Recommended Dashboard */}
                  <div className="rounded-xl p-5 bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📊</span>
                      <span className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider font-bold">
                        Recommended Dashboard
                      </span>
                    </div>
                    <p className="text-white font-semibold text-sm leading-relaxed">
                      {selectedRecommendation.dashboard}
                    </p>
                  </div>

                  {/* Recommended Resources */}
                  <div className="rounded-xl p-5 bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📚</span>
                      <span className="text-[#3b82f6] text-xs font-mono uppercase tracking-wider font-bold">
                        Recommended Resources
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {selectedRecommendation.resources.map((resource) => (
                        <li key={resource} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-1.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Metrics */}
                  <div className="rounded-xl p-5 bg-white/[0.05] backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">📈</span>
                      <span className="text-[#22d3ee] text-xs font-mono uppercase tracking-wider font-bold">
                        Common Metrics
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecommendation.metrics.map((metric) => (
                        <span
                          key={metric}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Recommended path */}
                {selected && recommendedPaths[selected] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="mt-6 pt-6 border-t border-[#00f0ff]/10"
                  >
                    <p className="text-[#00f0ff]/90 text-sm md:text-base font-medium mb-4">
                      {recommendedPaths[selected]}
                    </p>
                    <button
                      onClick={() => scrollTo('transformation-roadmap')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-sm font-semibold hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all duration-300"
                    >
                      Show Me My Path
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}