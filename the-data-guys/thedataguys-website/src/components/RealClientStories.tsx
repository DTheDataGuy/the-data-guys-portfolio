import { useRef, useMemo, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePersona, type PersonaType } from '../contexts/PersonaContext';

interface HeadlineMetric {
  value: string;
  label: string;
}

interface CaseStudy {
  id: string;
  title: string;
  icon: string;
  industry: string;
  systems: string;
  timeline: string;
  headlineMetrics: HeadlineMetric[];
  problem: string;
  solution: string;
  results: string[];
  quote: string;
  quoteAuthor: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 'wdc',
    title: 'Workforce Development Council of Seattle-King County',
    icon: '🏛️',
    industry: 'Workforce & Economic Development',
    systems: 'Azure • Snowflake • Power BI • Microsoft Fabric • Workforce Case Management Systems',
    timeline: '18 Months',
    headlineMetrics: [
      { value: '$67M+', label: 'Annual Investment Tracked' },
      { value: '18', label: 'Data Sources Unified' },
      { value: '100%', label: 'Governance Established' },
    ],
    problem:
      'Critical workforce, programmatic, financial, and outcome data existed across 18 disconnected systems. Reporting was highly manual, definitions varied across departments, and leadership lacked a unified view of investments, services, and outcomes.',
    solution:
      'Partnered with executive leadership to establish data governance, map operational processes, and implement a modern Azure + Snowflake workforce intelligence architecture unifying 18 data sources into a single enterprise reporting environment.',
    results: [
      '✔ $67M+ investment tracked',
      '✔ 18 data sources unified',
      '✔ Organization-wide governance established',
      '✔ Single source of truth for leadership',
    ],
    quote: "The work wasn't simply about building dashboards. It was about creating the governance, processes, systems, and data foundation necessary for organizational intelligence.",
    quoteAuthor: 'Chief Impact Officer',
  },
  {
    id: 'cascade-civil',
    title: 'Regional Heavy-Civil Contractor',
    icon: '🏗️',
    industry: 'Construction',
    systems: 'Procore • HCSS • CostPoint • Smartsheet • Power BI • Trainual',
    timeline: '8+ Months',
    headlineMetrics: [
      { value: '$1M–$3M+', label: 'Annual Impact' },
      { value: '5+', label: 'Business Functions Unified' },
      { value: '90%+', label: 'Reduction In Manual Validation' },
    ],
    problem:
      'Cascade Civil was operating across multiple disconnected systems for payroll, operations, workforce planning, equipment management, forecasting, and finance. Critical processes relied on spreadsheets, manual validation, tribal knowledge, and siloed reporting.',
    solution:
      'Designed and implemented a modern operational intelligence ecosystem connecting payroll & union compliance, workforce planning & forecasting, equipment & fleet intelligence, EAC/WIP financial controls, operational reporting, data quality & governance, process automation, and executive decision intelligence.',
    results: [
      '✔ Automated timecard validation & payroll compliance',
      '✔ Real-time equipment intelligence dashboard',
      '✔ Workforce forecasting & crew resource planning',
      '✔ Formalized EAC/WIP financial controls',
      '✔ Estimated $1M–$3M+ annual savings & risk reduction',
      '✔ Foundation for enterprise automation & AI',
    ],
    quote: "We didn't just gain visibility. We gained control. Payroll, workforce planning, finance, equipment, and operations are now connected through a structured system that allows leadership to make decisions with confidence.",
    quoteAuthor: 'VP of Operations',
  },
  {
    id: 'digital-equity',
    title: 'Digital Equity Initiative',
    icon: '📡',
    industry: 'Economic Development',
    systems: 'Custom Platform • Tableau • Survey Tools',
    timeline: '8 Months',
    headlineMetrics: [
      { value: '250+', label: 'Staff Trained' },
      { value: '40+', label: 'Dashboards Built' },
      { value: '50+', label: 'Communities Connected' },
    ],
    problem:
      'Tracking broadband adoption, digital literacy, and device distribution across 50+ communities with no unified system.',
    solution:
      'Impact measurement platform connecting community data to outcomes and policy decisions with automated reporting.',
    results: [
      '✔ 250+ leaders trained',
      '✔ Community-wide impact visibility',
      '✔ Data-driven policy recommendations',
      '✔ 50+ communities connected',
    ],
    quote: "They helped us prove our impact in a way that funders and policymakers could actually understand. That changed everything for our program.",
    quoteAuthor: 'Executive Director',
  },
  {
    id: 'small-biz-ops',
    title: 'Small Business Operations Dashboard',
    icon: '🏪',
    industry: 'Small Business',
    systems: 'HubSpot • QuickBooks • Google Sheets',
    timeline: '3 Months',
    headlineMetrics: [
      { value: '100%', label: 'Revenue Visibility' },
      { value: '75%', label: 'Faster Decisions' },
      { value: '10hrs', label: 'Saved Weekly' },
    ],
    problem:
      'Revenue, customer, and operations data lived in disconnected spreadsheets and tools. No single view of business health.',
    solution:
      'Connected CRM, accounting, and sales data into one unified dashboard with automated weekly reporting.',
    results: [
      '✔ Weekly reporting automated',
      '✔ Revenue visibility improved 100%',
      '✔ Profitable services identified',
      '✔ Decision time reduced 75%',
    ],
    quote: "I used to spend my Sundays pulling numbers together. Now I check my phone and know exactly where we stand. It's been life-changing.",
    quoteAuthor: 'Business Owner',
  },
];

// Map persona types to industry strings used in case studies
const personaToIndustry: Record<NonNullable<PersonaType>, string[]> = {
  nonprofit: ['Nonprofit', 'Workforce & Economic Development'],
  construction: ['Construction'],
  government: ['Government'],
  'economic-development': ['Economic Development', 'Small Business', 'Workforce & Economic Development'],
  education: ['Education'],
};

export default function RealClientStories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const { persona } = usePersona();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort stories: matching persona stories first, then the rest
  const sortedStudies = useMemo(() => {
    if (!persona) return caseStudies;
    const matchingIndustries = personaToIndustry[persona] || [];
    const matching = caseStudies.filter((s) =>
      matchingIndustries.some((ind) => s.industry.toLowerCase() === ind.toLowerCase())
    );
    const nonMatching = caseStudies.filter(
      (s) => !matchingIndustries.some((ind) => s.industry.toLowerCase() === ind.toLowerCase())
    );
    return [...matching, ...nonMatching];
  }, [persona]);

  const isMatchingStudy = (study: CaseStudy): boolean => {
    if (!persona) return false;
    const matchingIndustries = personaToIndustry[persona] || [];
    return matchingIndustries.some((ind) => study.industry.toLowerCase() === ind.toLowerCase());
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section
      id="real-client-stories"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] rounded-full bg-[#3b82f6]/[0.03] blur-[120px]" />
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
            Client Success
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Real Client Stories
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Not metrics. Stories. Real transformations with measurable outcomes.
          </p>
          {persona && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#00f0ff]/70 text-sm mt-3 font-medium"
            >
              Showing stories most relevant to your industry first
            </motion.p>
          )}
        </motion.div>

        {/* Case Study Cards - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedStudies.map((study, index) => {
            const isRecommended = isMatchingStudy(study);
            const isExpanded = expandedId === study.id;
            return (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                className={`relative rounded-2xl border backdrop-blur-xl p-5 md:p-6 hover:border-[#00f0ff]/30 transition-all duration-300 group ${
                  isRecommended
                    ? 'border-[#00f0ff]/30 bg-[#00f0ff]/[0.04] shadow-[0_0_20px_rgba(0,240,255,0.08)]'
                    : 'border-white/[0.08] bg-white/[0.03]'
                }`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-mono uppercase tracking-wider"
                  >
                    ✦ Recommended for you
                  </motion.div>
                )}

                {/* Header Row: Icon + Title + Industry */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 flex items-center justify-center text-xl group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-shadow">
                    {study.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm md:text-base truncate">
                      {study.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-[#00f0ff]/[0.08] border border-[#00f0ff]/15 text-[#00f0ff] text-[10px] font-mono uppercase tracking-wider shrink-0">
                    {study.industry}
                  </span>
                </div>

                {/* Headline Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {study.headlineMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg bg-[#00f0ff]/[0.06] border border-[#00f0ff]/15 px-2 py-2.5 text-center"
                    >
                      <p className="text-lg md:text-xl font-black text-[#00f0ff]">
                        {metric.value}
                      </p>
                      <p className="text-gray-400 text-[9px] md:text-[10px] font-mono uppercase tracking-wider leading-tight mt-0.5">
                        {metric.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Read Story Button */}
                <button
                  onClick={() => toggleExpand(study.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00f0ff] hover:text-[#00f0ff]/80 transition-colors"
                >
                  {isExpanded ? 'Hide Story' : 'Read Story'}
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-white/[0.06] space-y-4">
                        {/* Systems & Timeline */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-gray-400 text-[10px] font-mono">
                            {study.timeline}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-gray-400 text-[10px] font-mono">
                            {study.systems}
                          </span>
                        </div>

                        {/* Problem */}
                        <div>
                          <h4 className="text-red-400/80 text-[10px] font-mono uppercase tracking-wider mb-1.5">
                            The Problem
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {study.problem}
                          </p>
                        </div>

                        {/* Solution */}
                        <div>
                          <h4 className="text-[#00f0ff]/80 text-[10px] font-mono uppercase tracking-wider mb-1.5">
                            Our Solution
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {study.solution}
                          </p>
                        </div>

                        {/* Results */}
                        <div className="rounded-xl bg-[#00f0ff]/[0.04] border border-[#00f0ff]/10 p-4">
                          <h4 className="text-emerald-400/80 text-[10px] font-mono uppercase tracking-wider mb-2">
                            Results
                          </h4>
                          <div className="grid grid-cols-2 gap-1.5">
                            {study.results.map((result) => (
                              <p key={result} className="text-[#00f0ff] text-xs font-medium">
                                {result}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Quote */}
                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                          <p className="text-xs font-normal italic text-gray-300 mb-2">
                            &ldquo;{study.quote}&rdquo;
                          </p>
                          <p className="text-gray-400 text-[10px] font-mono">
                            — {study.quoteAuthor}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-12"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-white/[0.05] text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] transition-all"
          >
            Want Results Like These? Let&apos;s Talk
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