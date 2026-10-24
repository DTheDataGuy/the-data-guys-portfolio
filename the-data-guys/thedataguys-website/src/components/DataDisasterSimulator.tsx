import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface Industry {
  id: string;
  label: string;
  icon: string;
}

interface DisasterItem {
  title: string;
  description: string;
  icon: string;
  solution: string;
}

const industries: Industry[] = [
  { id: 'construction', label: 'Construction', icon: '🏗️' },
  { id: 'government', label: 'Government', icon: '🏛️' },
  { id: 'nonprofit', label: 'Nonprofit', icon: '💚' },
  { id: 'small-business', label: 'Small Business', icon: '🏪' },
  { id: 'enterprise', label: 'Enterprise', icon: '🏢' },
];

const disasterData: Record<string, DisasterItem[]> = {
  construction: [
    {
      title: 'Cost Overruns Discovered Too Late',
      description: 'Projects exceed budget by 20-40% before anyone notices the bleeding.',
      icon: '💸',
      solution: 'Real-time cost tracking dashboards with automated threshold alerts catch overruns within 24 hours.',
    },
    {
      title: 'Safety Compliance Gaps',
      description: 'OSHA violations pile up because incident data lives in disconnected spreadsheets.',
      icon: '⚠️',
      solution: 'Unified safety data platform with automated compliance monitoring and predictive risk scoring.',
    },
    {
      title: 'Project Forecast Misses',
      description: 'Completion dates slip by months because progress tracking is manual and outdated.',
      icon: '📅',
      solution: 'AI-powered project forecasting using real-time field data and historical pattern analysis.',
    },
    {
      title: 'Subcontractor Payment Delays',
      description: 'Payment disputes and delays cause walkoffs, halting entire project timelines.',
      icon: '🚧',
      solution: 'Automated payment workflows tied to milestone verification and digital lien tracking.',
    },
    {
      title: 'Equipment Utilization Blind Spots',
      description: '$500K+ in idle equipment because nobody knows what\'s where or when it\'s needed.',
      icon: '🔧',
      solution: 'IoT-integrated asset tracking with utilization analytics and predictive maintenance scheduling.',
    },
  ],
  government: [
    {
      title: 'Missed Grant Deadlines',
      description: 'Millions in available funding expires because tracking is manual across departments.',
      icon: '⏰',
      solution: 'Centralized grant lifecycle management with automated deadline alerts and submission workflows.',
    },
    {
      title: 'Compliance Audit Failures',
      description: 'Failed audits trigger funding freezes and public trust erosion.',
      icon: '📋',
      solution: 'Continuous compliance monitoring with audit-ready reporting generated automatically.',
    },
    {
      title: 'Constituent Data Breaches',
      description: 'Sensitive citizen data exposed due to fragmented security across legacy systems.',
      icon: '🔓',
      solution: 'Unified data governance framework with role-based access, encryption, and breach detection.',
    },
    {
      title: 'Budget Allocation Errors',
      description: 'Departments over/underspend by millions because financial data is weeks old.',
      icon: '💰',
      solution: 'Real-time budget visibility across all departments with AI-driven allocation optimization.',
    },
    {
      title: 'Reporting Delays to Federal Agencies',
      description: 'Late federal reports risk sanctions and reduced future allocations.',
      icon: '📊',
      solution: 'Automated federal reporting pipelines that compile, validate, and submit on schedule.',
    },
  ],
  nonprofit: [
    {
      title: 'Donor Reporting Inaccuracies',
      description: 'Incorrect impact reports erode donor trust and reduce recurring giving by 30%+.',
      icon: '📉',
      solution: 'Automated donor impact dashboards pulling verified data from program delivery systems.',
    },
    {
      title: 'Grant Compliance Failures',
      description: 'Misreported fund usage triggers clawbacks and blacklisting from future grants.',
      icon: '🚫',
      solution: 'Real-time grant fund tracking with automated compliance checks against funder requirements.',
    },
    {
      title: 'Impact Measurement Gaps',
      description: 'Can\'t prove program effectiveness because outcome data is scattered and incomplete.',
      icon: '📏',
      solution: 'Unified impact measurement framework connecting inputs, activities, outputs, and outcomes.',
    },
    {
      title: 'Volunteer Data Silos',
      description: 'Volunteer hours, skills, and availability trapped in separate systems nobody maintains.',
      icon: '🗂️',
      solution: 'Integrated volunteer management platform with skills matching and automated hour tracking.',
    },
    {
      title: 'Funding Opportunity Misses',
      description: 'Relevant grants and partnerships slip by because nobody\'s monitoring the landscape.',
      icon: '🎯',
      solution: 'AI-powered funding opportunity scanner matched to your mission, capacity, and eligibility.',
    },
  ],
  'small-business': [
    {
      title: 'Revenue Leakage Undetected',
      description: '5-15% of revenue silently disappears through unbilled work and pricing errors.',
      icon: '🕳️',
      solution: 'Automated revenue reconciliation catching discrepancies between services delivered and billed.',
    },
    {
      title: 'Payroll Errors',
      description: 'Overtime miscalculations and classification errors invite DOL investigations.',
      icon: '💳',
      solution: 'Integrated time tracking with automated payroll validation and compliance checks.',
    },
    {
      title: 'Customer Churn Invisible',
      description: 'Customers leave silently because no system tracks engagement decline patterns.',
      icon: '👻',
      solution: 'Customer health scoring with early warning signals and automated re-engagement triggers.',
    },
    {
      title: 'Cash Flow Surprises',
      description: 'Unexpected shortfalls force emergency decisions because forecasting is guesswork.',
      icon: '🌊',
      solution: 'AI-powered cash flow forecasting with scenario modeling and early warning alerts.',
    },
    {
      title: 'Tax Reporting Nightmares',
      description: 'Year-end scrambles, missed deductions, and audit triggers from messy financial data.',
      icon: '😱',
      solution: 'Continuous tax-ready bookkeeping with automated categorization and deduction optimization.',
    },
  ],
  enterprise: [
    {
      title: 'Failed AI Projects ($Millions Wasted)',
      description: '87% of AI initiatives never reach production because the data foundation is broken.',
      icon: '📊',
      solution: 'Data readiness assessment and foundation-first approach ensuring AI projects succeed from day one.',
    },
    {
      title: 'Data Governance Violations',
      description: 'GDPR/CCPA fines reaching 4% of global revenue from uncontrolled data sprawl.',
      icon: '⚖️',
      solution: 'Enterprise data governance platform with automated policy enforcement and lineage tracking.',
    },
    {
      title: 'Cross-Department Conflicts',
      description: 'Teams report different numbers for the same metrics, destroying executive confidence.',
      icon: '🔥',
      solution: 'Single source of truth with governed metric definitions and unified semantic layer.',
    },
    {
      title: 'Merger Integration Chaos',
      description: 'Post-merger data integration takes 3x longer than planned, delaying synergy capture.',
      icon: '🌀',
      solution: 'Accelerated data integration playbook with automated schema mapping and migration pipelines.',
    },
    {
      title: 'Regulatory Penalties',
      description: 'Multi-million dollar fines from inability to produce required data within compliance windows.',
      icon: '🏴',
      solution: 'Regulatory data warehouse with pre-built compliance reports and automated submission workflows.',
    },
  ],
};

export default function DataDisasterSimulator() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [disastersRevealed, setDisastersRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const handleIndustrySelect = (id: string) => {
    if (id === selectedIndustry) return;
    setShowSolutions(false);
    setDisastersRevealed(false);
    setSelectedIndustry(id);
    setTimeout(() => setDisastersRevealed(true), 300);
  };

  const handleShowSolutions = () => {
    setShowSolutions(true);
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const disasters = selectedIndustry ? disasterData[selectedIndustry] : [];

  return (
    <section ref={sectionRef} className="relative py-28 md:py-36 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-red-500/[0.02] blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.02] blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-red-400 font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Risk Assessment
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-white">
            Data Disaster{' '}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Simulator™
            </span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            What happens when your data breaks? Choose your industry and watch the cascade unfold.
          </p>
        </motion.div>

        {/* Industry Selector */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 md:gap-4 mb-16"
        >
          {industries.map((industry, i) => {
            const isActive = selectedIndustry === industry.id;
            return (
              <motion.button
                key={industry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                onClick={() => handleIndustrySelect(industry.id)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-md ${
                  isActive
                    ? 'bg-red-500/15 border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-red-400/30 hover:bg-white/[0.06]'
                }`}
              >
                <span className="text-2xl">{industry.icon}</span>
                <span
                  className={`font-semibold text-sm ${isActive ? 'text-red-300' : 'text-gray-300'}`}
                >
                  {industry.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="industry-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Disaster / Solution Display */}
        <AnimatePresence mode="wait">
          {selectedIndustry && disastersRevealed && (
            <motion.div
              key={`${selectedIndustry}-${showSolutions ? 'solutions' : 'disasters'}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Section Title */}
              <div className="text-center mb-10">
                <AnimatePresence mode="wait">
                  {!showSolutions ? (
                    <motion.div
                      key="disaster-title"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <motion.div
                        animate={{
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 mb-4"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-red-400 font-mono text-xs tracking-wider uppercase">
                          Alert: System Failures Detected
                        </span>
                      </motion.div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        When{' '}
                        <span className="text-red-400">
                          {industries.find((i) => i.id === selectedIndustry)?.label}
                        </span>{' '}
                        Data Breaks...
                      </h3>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="solution-title"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                        <span className="text-[#00f0ff] font-mono text-xs tracking-wider uppercase">
                          Prevention Protocol Active
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white">
                        Here&apos;s How We{' '}
                        <span className="text-[#00f0ff]">Prevent It</span>
                      </h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {disasters.map((item, i) => (
                  <motion.div
                    key={`${selectedIndustry}-${i}-${showSolutions ? 's' : 'd'}`}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.12,
                      ease: 'easeOut',
                    }}
                    className={`relative rounded-2xl border backdrop-blur-md p-5 transition-all duration-500 ${
                      showSolutions
                        ? 'bg-[#00f0ff]/[0.04] border-[#00f0ff]/20 shadow-[0_0_20px_rgba(0,240,255,0.05)]'
                        : 'bg-red-500/[0.04] border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
                    }`}
                  >
                    {/* Card top accent */}
                    <div
                      className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${
                        showSolutions
                          ? 'bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-red-400/60 to-transparent'
                      }`}
                    />

                    {/* Icon and number */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          showSolutions
                            ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <span className="text-xl">
                          {showSolutions ? '✅' : item.icon}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs ${
                          showSolutions ? 'text-[#00f0ff]/40' : 'text-red-400/40'
                        }`}
                      >
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className={`font-bold text-sm mb-2 ${
                        showSolutions ? 'text-[#00f0ff]' : 'text-red-300'
                      }`}
                    >
                      {showSolutions ? 'Prevention' : item.title}
                    </h4>

                    {/* Description */}
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {showSolutions ? item.solution : item.description}
                    </p>

                    {/* Animated warning pulse for disasters */}
                    {!showSolutions && (
                      <motion.div
                        animate={{
                          opacity: [0, 0.3, 0],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center mt-12"
              >
                {!showSolutions ? (
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 40px rgba(0,240,255,0.3)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShowSolutions}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:shadow-[0_0_50px_rgba(0,240,255,0.4)] transition-all duration-300"
                  >
                    Show Me The Prevention →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 40px rgba(0,240,255,0.3)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToContact}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:shadow-[0_0_50px_rgba(0,240,255,0.4)] transition-all duration-300"
                  >
                    Protect My Organization →
                  </motion.button>
                )}
                <p className="text-gray-500 text-xs mt-3 font-mono">
                  {showSolutions
                    ? 'Free assessment • No obligation • Results in 48 hours'
                    : 'Click to see how we prevent every single one'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state prompt */}
        {!selectedIndustry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-gray-500 text-sm font-mono">
               Select your industry above to run the simulation 
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}