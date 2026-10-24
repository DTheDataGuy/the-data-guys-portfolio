import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Quote } from 'lucide-react';

interface ResultCard {
  id: number;
  metric: string;
  metricValue: number;
  metricSuffix: string;
  metricPrefix: string;
  problem: string;
  approach: string;
  outcome: string;
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
}

const results: ResultCard[] = [
  {
    id: 1,
    metric: 'Faster Reporting',
    metricValue: 73,
    metricSuffix: '%',
    metricPrefix: '',
    problem: 'A regional government agency spent 40+ hours weekly compiling reports manually from disconnected spreadsheets and legacy systems.',
    approach: 'Built automated data pipelines connecting 12 source systems into a unified warehouse with real-time dashboards.',
    outcome: 'Reporting time dropped from 40 hours to 11 hours weekly — a 73% reduction — freeing staff for strategic analysis.',
    quote: 'We went from dreading Monday reports to having insights ready before we even ask for them.',
    quoteAuthor: 'Director of Operations',
    quoteRole: 'Regional Government Agency',
  },
  {
    id: 2,
    metric: 'Additional Funding Secured',
    metricValue: 2.4,
    metricSuffix: 'M',
    metricPrefix: '$',
    problem: 'A nonprofit struggled to demonstrate program impact to funders, relying on anecdotal evidence and delayed annual reports.',
    approach: 'Implemented real-time impact tracking with automated outcome measurement and compelling data visualizations for grant applications.',
    outcome: 'Secured $2.4M in additional funding within 8 months by proving measurable community impact with data.',
    quote: 'For the first time, we could show funders exactly what their dollars accomplished — in real time.',
    quoteAuthor: 'Executive Director',
    quoteRole: 'Community Development Nonprofit',
  },
  {
    id: 3,
    metric: 'ROI on Data Investment',
    metricValue: 400,
    metricSuffix: '%',
    metricPrefix: '',
    problem: 'A mid-size construction firm invested in multiple software tools but saw no measurable return — data sat unused in silos.',
    approach: 'Unified project, financial, and workforce data into a single intelligence layer with predictive project analytics.',
    outcome: 'Generated 400% ROI within 18 months through reduced project overruns, optimized crew scheduling, and proactive risk management.',
    quote: 'We finally stopped guessing which projects would go over budget. Now we know weeks in advance.',
    quoteAuthor: 'VP of Operations',
    quoteRole: 'Regional Construction Firm',
  },
  {
    id: 4,
    metric: 'Less Manual Work',
    metricValue: 90,
    metricSuffix: '%',
    metricPrefix: '',
    problem: 'An economic development organization had staff manually entering data into 6 different systems, creating errors and burnout.',
    approach: 'Designed automated data flows with validation rules, eliminating duplicate entry and implementing smart form integrations.',
    outcome: '90% reduction in manual data work, with error rates dropping from 12% to under 0.5%.',
    quote: 'My team went from data entry clerks to strategic analysts overnight. Morale has never been higher.',
    quoteAuthor: 'Program Manager',
    quoteRole: 'Economic Development Organization',
  },
  {
    id: 5,
    metric: 'Data Accuracy Achieved',
    metricValue: 99.4,
    metricSuffix: '%',
    metricPrefix: '',
    problem: 'A chamber of commerce discovered their member database had 30%+ inaccuracies, causing failed communications and lost renewals.',
    approach: 'Implemented data quality scoring, automated deduplication, and real-time validation with member self-service portals.',
    outcome: 'Achieved 99.4% data accuracy, recovered 200+ lost member records, and increased renewal rates by 23%.',
    quote: 'We stopped losing members to bad data. Every record now tells us exactly how to serve them better.',
    quoteAuthor: 'Membership Director',
    quoteRole: 'Metropolitan Chamber of Commerce',
  },
];

function AnimatedCounter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Number((value * eased).toFixed(1)));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  const displayValue = Number.isInteger(value) ? Math.round(count) : count.toFixed(1);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
      {prefix}{displayValue}{suffix}
    </div>
  );
}

export default function RealResultsProof() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleCard = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="real-results" className="relative py-24 md:py-32 bg-[#0a0e1a] overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Proven Results
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Real Results From Data Systems We&apos;ve Built
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Click any metric to see the full story — the problem, our approach, and the measurable outcome.
          </p>
        </motion.div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-xl border cursor-pointer transition-all duration-300 ${
                expandedId === result.id
                  ? 'bg-white/[0.06] border-[#00f0ff]/30 shadow-[0_0_30px_rgba(0,240,255,0.08)] md:col-span-2 lg:col-span-3'
                  : 'bg-white/[0.03] border-white/[0.06] hover:border-[#00f0ff]/20 hover:bg-white/[0.05]'
              }`}
              onClick={() => toggleCard(result.id)}
              layout
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <AnimatedCounter
                      value={result.metricValue}
                      prefix={result.metricPrefix}
                      suffix={result.metricSuffix}
                    />
                    <p className="text-gray-400 text-sm mt-1 font-medium">{result.metric}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedId === result.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === result.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-white/[0.06] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-red-500/[0.05] border border-red-500/10">
                          <h4 className="text-red-400 text-xs font-mono uppercase tracking-wider mb-2">Problem</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{result.problem}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-[#00f0ff]/[0.05] border border-[#00f0ff]/10">
                          <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-2">Approach</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{result.approach}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/10">
                          <h4 className="text-emerald-400 text-xs font-mono uppercase tracking-wider mb-2">Outcome</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{result.outcome}</p>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] flex gap-3">
                        <Quote className="w-5 h-5 text-[#00f0ff]/40 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-300 text-sm italic leading-relaxed mb-2">
                            &ldquo;{result.quote}&rdquo;
                          </p>
                          <p className="text-gray-500 text-xs">
                            — {result.quoteAuthor}, {result.quoteRole}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}