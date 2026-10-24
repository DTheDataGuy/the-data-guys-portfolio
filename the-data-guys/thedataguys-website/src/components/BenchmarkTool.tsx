import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ChevronDown } from 'lucide-react';

const industryOptions = [
  'Nonprofit',
  'Government Agency',
  'Construction',
  'Chamber of Commerce',
  'Economic Development',
  'Small Business',
  'Enterprise',
];

const sizeOptions = ['1-10', '11-50', '51-200', '200+'];
const systemOptions = ['1-5', '6-10', '11-20', '20+'];
const reportingOptions = ['Manual', 'Semi-automated', 'Automated'];
const aiOptions = ['None', 'Exploring', 'Implementing', 'Advanced'];

function getScore(options: string[], value: string): number {
  const idx = options.indexOf(value);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / options.length) * 100);
}

function ProgressBar({ label, userScore, avgScore }: { label: string; userScore: number; avgScore: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-xs text-gray-500">Industry Avg: {avgScore}%</span>
      </div>
      <div className="relative h-4 rounded-full bg-white/[0.05] border border-white/[0.08] overflow-hidden">
        {/* Industry average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10"
          style={{ left: `${avgScore}%` }}
        />
        {/* User score bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${userScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] relative"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
        </motion.div>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#00f0ff]">You: {userScore}%</span>
        <span className={userScore >= avgScore ? 'text-green-400' : 'text-amber-400'}>
          {userScore >= avgScore ? 'Above Average' : 'Below Average'}
        </span>
      </div>
    </div>
  );
}

function SelectField({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-400 font-medium">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#00f0ff]/50 transition-colors cursor-pointer"
        >
          <option value="" className="bg-[#0f172a]">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0f172a]">{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default function BenchmarkTool() {
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [systems, setSystems] = useState('');
  const [reporting, setReporting] = useState('');
  const [aiUsage, setAiUsage] = useState('');

  const isComplete = industry && size && systems && reporting && aiUsage;

  const scores = useMemo(() => {
    if (!isComplete) return null;
    const reportingScore = getScore(reportingOptions, reporting);
    const aiScore = getScore(aiOptions, aiUsage);
    const systemsScore = getScore(systemOptions, systems);
    const forecastScore = Math.round((reportingScore + aiScore + systemsScore) / 3);

    // Industry averages (simulated based on industry type)
    const avgBase = industry === 'Enterprise' ? 65 : industry === 'Government Agency' ? 45 : 40;
    return {
      reporting: { user: reportingScore, avg: avgBase + 5 },
      ai: { user: aiScore, avg: avgBase - 10 },
      forecasting: { user: forecastScore, avg: avgBase },
    };
  }, [industry, size, systems, reporting, aiUsage, isComplete]);

  return (
    <section id="benchmark-tool" className="relative py-28 bg-[#0a0e1a] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <BarChart3 className="w-3.5 h-3.5" />
            Interactive Benchmark
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Compare Yourself To{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Similar Organizations
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See how your data maturity stacks up against others in your industry.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="p-8 rounded-3xl bg-white/[0.03] border border-[#00f0ff]/10 backdrop-blur-md"
        >
          {/* Input fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <SelectField label="Industry" options={industryOptions} value={industry} onChange={setIndustry} />
            <SelectField label="Company Size" options={sizeOptions} value={size} onChange={setSize} />
            <SelectField label="Number of Systems" options={systemOptions} value={systems} onChange={setSystems} />
            <SelectField label="Current Reporting" options={reportingOptions} value={reporting} onChange={setReporting} />
            <SelectField label="AI Usage" options={aiOptions} value={aiUsage} onChange={setAiUsage} />
          </div>

          {/* Results */}
          {scores ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 pt-6 border-t border-white/[0.06]"
            >
              <h3 className="text-white font-bold text-lg">Your Results</h3>
              <ProgressBar label="Reporting Maturity" userScore={scores.reporting.user} avgScore={scores.reporting.avg} />
              <ProgressBar label="Data Readiness" userScore={scores.ai.user} avgScore={scores.ai.avg} />
              <ProgressBar label="Forecasting Capability" userScore={scores.forecasting.user} avgScore={scores.forecasting.avg} />

              <div className="mt-6 p-4 rounded-xl bg-[#00f0ff]/[0.05] border border-[#00f0ff]/20">
                <p className="text-sm text-gray-300">
                  <span className="text-[#00f0ff] font-semibold">Recommendation:</span>{' '}
                  {scores.ai.user < scores.ai.avg
                    ? 'Your AI readiness is below average. Start by automating your reporting pipeline before investing in AI.'
                    : scores.reporting.user < scores.reporting.avg
                    ? 'Focus on upgrading your reporting infrastructure to unlock better forecasting capabilities.'
                    : 'You\'re ahead of the curve! Consider advanced AI implementations to maximize your data advantage.'}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8 border-t border-white/[0.06]">
              <p className="text-gray-500 text-sm">Complete all fields above to see your benchmark results.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}