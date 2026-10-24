import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProblemDetail {
  challenge: string;
  solution: string[];
  result: string;
}

interface CaseStudyData {
  organization: string;
  industry: string;
  initials: string;
  color: string;
  problems: Record<string, ProblemDetail>;
}

const caseStudies: CaseStudyData[] = [
  {
    organization: 'City of Seattle',
    industry: 'Government',
    initials: 'CS',
    color: '#3b82f6',
    problems: {
      'Reporting Delays': {
        challenge: 'Monthly reports took 3 weeks to compile across 12 departments.',
        solution: [
          'Automated data pipelines across all departments',
          'Real-time dashboards replacing manual compilation',
          'Cross-department integration layer',
        ],
        result: 'Report time: 3 weeks → Same day',
      },
      'Data Silos': {
        challenge: "12 departments couldn't share or access each other's data.",
        solution: [
          'Unified data platform with shared schema',
          'Shared KPI framework across departments',
          'Department-level access controls with cross-visibility',
        ],
        result: 'Connected 12 departments into 1 view',
      },
      'KPI Tracking': {
        challenge: 'Leadership had no real-time visibility into city performance.',
        solution: [
          'Executive dashboard with live metrics',
          'Automated KPI calculation engine',
          'Real-time alerts for threshold breaches',
        ],
        result: '100% KPI visibility, real-time',
      },
    },
  },
  {
    organization: 'Workforce Development Council',
    industry: 'Workforce & Economic Development',
    initials: 'WDC',
    color: '#06b6d4',
    problems: {
      'Data Silos': {
        challenge: 'Critical workforce, programmatic, financial, and outcome data existed across 18 disconnected systems and data sources.',
        solution: [
          'Unified 18 disparate data sources into single enterprise environment',
          'Designed modern Azure + Snowflake workforce intelligence architecture',
          'Mapped operational processes across every department',
        ],
        result: '18 data sources unified into one platform',
      },
      'Data Governance': {
        challenge: 'Definitions varied across departments with no standardized governance framework.',
        solution: [
          'Facilitated cross-functional Data Governance Council meetings',
          'Established organization-wide data governance standards',
          'Created scalable foundation for future analytics and AI',
        ],
        result: '100% organization-wide governance established',
      },
      'Investment Visibility': {
        challenge: 'Leadership lacked a unified view of where $67M in annual investments were flowing and what outcomes were being achieved.',
        solution: [
          'Centralized Azure + Snowflake workforce intelligence platform',
          'Improved transparency into annual investment flows',
          'Single source of truth for leadership decision-making',
        ],
        result: '$67M+ investment tracked with full visibility',
      },
    },
  },
  {
    organization: 'Regional Heavy-Civil Contractor',
    industry: 'Tribal/Construction',
    initials: 'TC',
    color: '#22d3ee',
    problems: {
      'Disconnected Systems': {
        challenge: 'Cascade Civil was operating across multiple disconnected systems for payroll, operations, workforce planning, equipment management, forecasting, and finance.',
        solution: [
          'Unified payroll & union compliance automation',
          'Connected workforce planning & forecasting',
          'Integrated equipment & fleet intelligence',
        ],
        result: '5+ business functions unified',
      },
      'Manual Processes': {
        challenge: 'Critical processes relied on spreadsheets, manual validation, tribal knowledge, and siloed reporting.',
        solution: [
          'Automated timecard validation & payroll compliance',
          'Formalized EAC/WIP financial controls',
          'Data quality & governance framework',
        ],
        result: '90%+ reduction in manual validation',
      },
      'Financial Controls': {
        challenge: 'No structured system for EAC/WIP financial controls or executive decision intelligence.',
        solution: [
          'Operational reporting & executive dashboards',
          'Process automation across departments',
          'Foundation for enterprise automation & AI',
        ],
        result: '$1M–$3M+ estimated annual savings',
      },
    },
  },
];

function MiniChart({ color }: { color: string }) {
  return (
    <div className="w-full h-24 rounded-lg bg-white/[0.03] border border-white/10 p-3 flex items-end gap-1">
      {[40, 65, 45, 80, 60, 90, 75, 95].map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm"
          style={{ backgroundColor: color, opacity: 0.6 + (i * 0.05) }}
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

function AnimatedResult({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
    >
      <span className="text-emerald-400 text-lg shrink-0">✓</span>
      <span className="text-emerald-300 font-semibold text-sm">{text}</span>
    </motion.div>
  );
}

export default function CaseStudies() {
  const [selectedTags, setSelectedTags] = useState<Record<string, string | null>>({});

  const handleTagClick = (org: string, tag: string) => {
    setSelectedTags((prev) => ({
      ...prev,
      [org]: prev[org] === tag ? null : tag,
    }));
  };

  return (
    <section id="case-studies" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Proven Impact
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Real Results.{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Real Organizations.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Click a challenge to see how we solved it.
          </p>
        </motion.div>

        {/* Case Study Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {caseStudies.map((study, idx) => {
            const activeTag = selectedTags[study.organization] || null;
            const activeDetail = activeTag ? study.problems[activeTag] : null;

            return (
              <motion.div
                key={study.organization}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: `${study.color}30`, border: `2px solid ${study.color}` }}
                  >
                    {study.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{study.organization}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{study.industry}</p>
                  </div>
                </div>

                {/* Problem Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(study.problems).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(study.organization, tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                        activeTag === tag
                          ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                          : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40 hover:text-gray-200'
                      } border`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Expanded Detail */}
                <AnimatePresence mode="wait">
                  {activeDetail && (
                    <motion.div
                      key={activeTag}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-2">
                        {/* Challenge */}
                        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                          <p className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-2">
                            The Challenge
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {activeDetail.challenge}
                          </p>
                        </div>

                        {/* What We Did */}
                        <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
                          <p className="text-xs uppercase tracking-widest text-[#00f0ff] font-semibold mb-2">
                            What We Did
                          </p>
                          <ul className="space-y-1.5">
                            {activeDetail.solution.map((item, i) => (
                              <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-[#00f0ff] mt-0.5 shrink-0">→</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Result */}
                        <AnimatedResult text={activeDetail.result} />

                        {/* Mini Dashboard */}
                        <MiniChart color={study.color} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hint when no tag selected */}
                {!activeTag && (
                  <p className="text-gray-600 text-xs mt-auto pt-4 text-center italic">
                     Click a challenge tag to explore
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}