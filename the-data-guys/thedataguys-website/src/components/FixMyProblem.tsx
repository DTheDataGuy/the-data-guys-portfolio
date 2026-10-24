import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Challenge {
  id: string;
  label: string;
  icon: string;
  recommendation: {
    service: string;
    caseStudy: string;
    dashboard: string;
  };
}

const challenges: Challenge[] = [
  {
    id: 'reporting',
    label: 'Reporting',
    icon: '📊',
    recommendation: {
      service:
        'Our Analytics & Visualization layer builds real-time dashboards your team actually trusts — no more spreadsheet chaos.',
      caseStudy: 'How a $50M nonprofit cut reporting time by 80% with unified dashboards.',
      dashboard: 'Executive KPI Dashboard with automated data refresh',
    },
  },
  {
    id: 'data-quality',
    label: 'Data Quality',
    icon: '🔍',
    recommendation: {
      service:
        'Our Data Processing & Engineering service implements automated quality checks, deduplication, and validation pipelines.',
      caseStudy: 'City government reduced data errors by 94% in 60 days.',
      dashboard: 'Data Quality Scorecard with anomaly detection',
    },
  },
  {
    id: 'ai-readiness',
    label: 'Data Readiness',
    icon: '🎯',
    recommendation: {
      service:
        'Our AI & Intelligence Layer assessment identifies exactly what foundation work is needed before AI can deliver real ROI.',
      caseStudy: 'Construction firm saved $4.2M by building data foundation before AI adoption.',
      dashboard: 'Data Readiness Assessment with maturity scoring',
    },
  },
  {
    id: 'construction',
    label: 'Construction Analytics',
    icon: '🏗️',
    recommendation: {
      service:
        'Purpose-built data architecture for construction — connecting project management, financials, and field data into one view.',
      caseStudy: 'ENR Top 100 contractor achieved 99.4% forecast accuracy.',
      dashboard: 'Project Performance & Cost Tracking Dashboard',
    },
  },
  {
    id: 'grants',
    label: 'Grant Management',
    icon: '💰',
    recommendation: {
      service:
        'Automated grant tracking and compliance reporting that connects funding sources to outcomes with full audit trails.',
      caseStudy: 'Nonprofit tracked $400M+ in funding with zero compliance gaps.',
      dashboard: 'Grant Lifecycle & Compliance Dashboard',
    },
  },
  {
    id: 'economic-impact',
    label: 'Economic Impact',
    icon: '📈',
    recommendation: {
      service:
        'Economic modeling and impact measurement frameworks that quantify community ROI with defensible methodology.',
      caseStudy: 'Regional authority demonstrated $2.1B economic impact from infrastructure investment.',
      dashboard: 'Economic Impact & Community ROI Dashboard',
    },
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '⚙️',
    recommendation: {
      service:
        'Operational data integration that connects siloed systems into a single operational command center.',
      caseStudy: '250+ businesses trained to optimize operations through data-driven decisions.',
      dashboard: 'Operational Efficiency & Process Analytics Dashboard',
    },
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: '🔄',
    recommendation: {
      service:
        'Intelligent automation pipelines that eliminate manual data entry, reporting, and reconciliation tasks.',
      caseStudy: 'Government agency automated 12 manual processes, saving 2,000+ hours annually.',
      dashboard: 'Automation Pipeline & Time Savings Dashboard',
    },
  },
];

export default function FixMyProblem() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const scrollToContact = () => {
    setIsOpen(false);
    setSelectedChallenge(null);
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedChallenge(null);
  };

  const handleChallengeSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleBack = () => {
    setSelectedChallenge(null);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm shadow-[0_0_30px_rgba(0,240,255,0.3)] cursor-pointer"
        whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0,240,255,0.5)' }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(0,240,255,0.2)',
            '0 0 40px rgba(0,240,255,0.4)',
            '0 0 20px rgba(0,240,255,0.2)',
          ],
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span className="hidden sm:inline">Fix My Problem</span>
      </motion.button>

      {/* Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Slide-up Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0a0e1a]/95 backdrop-blur-xl shadow-[0_-10px_60px_rgba(0,240,255,0.1)] md:left-auto md:right-6 md:bottom-6 md:rounded-2xl md:border md:max-w-md md:max-h-[70vh]"
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-3">
                  {selectedChallenge && (
                    <button
                      onClick={handleBack}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}
                  <h3 className="text-white font-bold text-lg">
                    {selectedChallenge ? selectedChallenge.label : 'What challenge are you facing?'}
                  </h3>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {!selectedChallenge ? (
                    /* Challenge Grid */
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      {challenges.map((challenge) => (
                        <motion.button
                          key={challenge.id}
                          onClick={() => handleChallengeSelect(challenge)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#00f0ff]/30 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                        >
                          <span className="text-2xl">{challenge.icon}</span>
                          <span className="text-white text-xs font-medium text-center">
                            {challenge.label}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    /* Recommendation Card */
                    <motion.div
                      key="recommendation"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Service Recommendation */}
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-[#00f0ff]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                          <span className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider">
                            Recommended Service
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedChallenge.recommendation.service}
                        </p>
                      </div>

                      {/* Case Study */}
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                          <span className="text-[#3b82f6] text-xs font-mono uppercase tracking-wider">
                            Relevant Case Study
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedChallenge.recommendation.caseStudy}
                        </p>
                      </div>

                      {/* Dashboard */}
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#22d3ee]" />
                          <span className="text-[#22d3ee] text-xs font-mono uppercase tracking-wider">
                            Explore Dashboard
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedChallenge.recommendation.dashboard}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <motion.button
                        onClick={scrollToContact}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: '0 0 30px rgba(0,240,255,0.3)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-base shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-300 cursor-pointer"
                      >
                        Book a Consultation →
                      </motion.button>

                      <p className="text-center text-gray-600 text-xs">
                        Free 30-minute strategy session • No obligation
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}