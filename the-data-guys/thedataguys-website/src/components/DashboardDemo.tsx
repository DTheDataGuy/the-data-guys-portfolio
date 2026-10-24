import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { HardHat, FileCheck, TrendingUp, Users, Wifi, Info } from 'lucide-react';
import { usePersona, type PersonaType } from '../contexts/PersonaContext';

interface MetricDef {
  label: string;
  value: string;
  trend: number;
  bar: number;
  explanation: string;
}

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ElementType;
  metrics: MetricDef[];
  chartData: { label: string; value: number; color: string }[];
  insight: string;
  helpsAnswer: string[];
}

const dashboards: DashboardTab[] = [
  {
    id: 'construction',
    label: 'Construction Operations',
    icon: HardHat,
    metrics: [
      { label: 'Active Projects', value: '34', trend: 12, bar: 85, explanation: 'Count of all projects currently in execution phase, tracked via project management integrations and milestone status.' },
      { label: 'On-Time Delivery', value: '91%', trend: 5, bar: 91, explanation: 'Derived from schedule adherence, milestone completion rates, and project delay tracking across all active engagements.' },
      { label: 'Budget Utilization', value: '87%', trend: -2, bar: 87, explanation: 'Percentage of allocated budget spent vs. planned spend curve, aggregated from cost tracking and procurement data.' },
      { label: 'Safety Score', value: '98.2%', trend: 1, bar: 98, explanation: 'Composite score from incident reports, near-miss tracking, safety audit results, and compliance checklist completion.' },
    ],
    chartData: [
      { label: 'Labor', value: 78, color: '#00f0ff' },
      { label: 'Materials', value: 65, color: '#3b82f6' },
      { label: 'Equipment', value: 82, color: '#06b6d4' },
      { label: 'Subcontract', value: 71, color: '#8b5cf6' },
      { label: 'Overhead', value: 45, color: '#22d3ee' },
    ],
    insight: 'Labor utilization up 12% this quarter. 3 projects ahead of schedule.',
    helpsAnswer: [
      'What projects need attention this week?',
      'Where are we over budget?',
      'How is labor being allocated?',
      'What can we forecast for next quarter?',
    ],
  },
  {
    id: 'grant',
    label: 'Grant Compliance',
    icon: FileCheck,
    metrics: [
      { label: 'Active Grants', value: '18', trend: 3, bar: 72, explanation: 'Total grants currently in active period with remaining deliverables, pulled from grant management and reporting systems.' },
      { label: 'Compliance Rate', value: '99.4%', trend: 0.2, bar: 99, explanation: 'Percentage of compliance requirements met on-time across all active grants, including documentation and reporting deadlines.' },
      { label: 'Funds Deployed', value: '$12.8M', trend: 8, bar: 76, explanation: 'Total grant funds disbursed to date vs. total awarded, tracked through financial systems and expenditure reports.' },
      { label: 'Reports On-Time', value: '100%', trend: 5, bar: 100, explanation: 'Percentage of required funder reports submitted by their deadline, measured across all grant reporting cycles.' },
    ],
    chartData: [
      { label: 'Federal', value: 85, color: '#00f0ff' },
      { label: 'State', value: 72, color: '#3b82f6' },
      { label: 'Foundation', value: 91, color: '#06b6d4' },
      { label: 'Corporate', value: 68, color: '#8b5cf6' },
      { label: 'Local', value: 55, color: '#22d3ee' },
    ],
    insight: 'Zero compliance findings in last 3 audits. $2.1M in new awards pending.',
    helpsAnswer: [
      'Which grants are due for reporting?',
      'Are we meeting outcome targets?',
      'What documentation is missing?',
      'How do we prove impact to funders?',
    ],
  },
  {
    id: 'economic',
    label: 'Economic Impact',
    icon: TrendingUp,
    metrics: [
      { label: 'Jobs Created', value: '1,247', trend: 18, bar: 83, explanation: 'Net new positions created through supported programs, verified via employer surveys, payroll data, and workforce system records.' },
      { label: 'Capital Invested', value: '$48M', trend: 22, bar: 78, explanation: 'Total private and public capital deployed in the region, aggregated from investment tracking, loan disbursements, and grant awards.' },
      { label: 'Businesses Assisted', value: '156', trend: 9, bar: 65, explanation: 'Unique businesses receiving technical assistance, training, or funding support, tracked through CRM and program enrollment data.' },
      { label: 'ROI on Public $', value: '8.2x', trend: 15, bar: 82, explanation: 'Return on public investment calculated as total economic output generated per dollar of public funding invested in programs.' },
    ],
    chartData: [
      { label: 'Manufacturing', value: 88, color: '#00f0ff' },
      { label: 'Technology', value: 76, color: '#3b82f6' },
      { label: 'Healthcare', value: 65, color: '#06b6d4' },
      { label: 'Retail', value: 52, color: '#8b5cf6' },
      { label: 'Construction', value: 71, color: '#22d3ee' },
    ],
    insight: 'Regional GDP contribution up 3.2%. 42 new businesses launched this year.',
    helpsAnswer: [
      'How many jobs were created?',
      'Where is investment flowing?',
      'Which businesses received support?',
      "What's the ROI of our programs?",
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce Outcomes',
    icon: Users,
    metrics: [
      { label: 'Enrolled', value: '892', trend: 14, bar: 89, explanation: 'Total participants currently enrolled across all workforce development programs, tracked through intake and registration systems.' },
      { label: 'Completion Rate', value: '84%', trend: 6, bar: 84, explanation: 'Percentage of enrolled participants who complete their full program curriculum, measured at cohort graduation milestones.' },
      { label: 'Job Placement', value: '91%', trend: 3, bar: 91, explanation: 'Percentage of program completers who secure employment within 90 days, verified through employer confirmations and follow-up surveys.' },
      { label: 'Avg Wage Increase', value: '34%', trend: 8, bar: 68, explanation: 'Average percentage increase in hourly wage from pre-program baseline to post-placement, tracked via wage verification records.' },
    ],
    chartData: [
      { label: 'IT/Tech', value: 92, color: '#00f0ff' },
      { label: 'Healthcare', value: 87, color: '#3b82f6' },
      { label: 'Trades', value: 79, color: '#06b6d4' },
      { label: 'Business', value: 71, color: '#8b5cf6' },
      { label: 'Manufacturing', value: 65, color: '#22d3ee' },
    ],
    insight: 'Cohort 7 showing highest placement rate. Average time-to-hire: 23 days.',
    helpsAnswer: [
      'Are participants improving?',
      'Which programs have highest completion?',
      'Where are employment gaps?',
      'What outcomes can we report?',
    ],
  },
  {
    id: 'digital-equity',
    label: 'Digital Equity',
    icon: Wifi,
    metrics: [
      { label: 'Households Connected', value: '4,218', trend: 28, bar: 70, explanation: 'Number of households that gained new broadband connectivity through program interventions, verified via ISP activation records.' },
      { label: 'Digital Literacy', value: '76%', trend: 12, bar: 76, explanation: 'Percentage of program participants demonstrating proficiency in core digital skills assessments post-training completion.' },
      { label: 'Device Distribution', value: '2,890', trend: 15, bar: 82, explanation: 'Total computing devices (laptops, tablets) distributed to qualifying households, tracked through inventory and recipient verification.' },
      { label: 'Coverage Gap Closed', value: '62%', trend: 9, bar: 62, explanation: 'Percentage reduction in identified coverage gaps within target service areas, measured against baseline connectivity mapping.' },
    ],
    chartData: [
      { label: 'Broadband', value: 72, color: '#00f0ff' },
      { label: 'Devices', value: 81, color: '#3b82f6' },
      { label: 'Training', value: 68, color: '#06b6d4' },
      { label: 'Affordability', value: 55, color: '#8b5cf6' },
      { label: 'Accessibility', value: 63, color: '#22d3ee' },
    ],
    insight: '28% increase in connected households. 3 new community hotspots activated.',
    helpsAnswer: [
      'Which communities lack access?',
      'Where are programs reaching?',
      "What's the adoption rate?",
      'How do we measure digital inclusion?',
    ],
  },
];

// Map persona to the most relevant dashboard tab
const personaToDashboardMap: Record<NonNullable<PersonaType>, string> = {
  nonprofit: 'grant',
  construction: 'construction',
  government: 'grant',
  'economic-development': 'economic',
  education: 'workforce',
};

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!isInView) return;
    // Simple reveal animation
    setDisplay('');
    const timer = setTimeout(() => setDisplay(value), 100);
    return () => clearTimeout(timer);
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
}

function MetricTooltip({ explanation, isVisible }: { explanation: string; isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 5, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50"
        >
          <div className="rounded-xl border border-[#00f0ff]/20 bg-[#0a0e1a]/95 backdrop-blur-xl p-3 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-[#00f0ff] shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-300 leading-relaxed">{explanation}</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#0a0e1a]/95 border-r border-b border-[#00f0ff]/20" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DashboardDemo() {
  const [activeTab, setActiveTab] = useState('construction');
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const { persona } = usePersona();
  const activeDashboard = dashboards.find((d) => d.id === activeTab) || dashboards[0];

  // Auto-select dashboard tab when persona changes
  useEffect(() => {
    if (persona) {
      const matchingTab = personaToDashboardMap[persona];
      if (matchingTab) {
        setActiveTab(matchingTab);
        setActiveMetric(null);
      }
    }
  }, [persona]);

  return (
    <section id="dashboard-demo" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Interactive Experience
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Industry <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">Dashboards</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            See what organizational intelligence looks like for your industry.
          </p>
          {persona && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#00f0ff]/70 text-sm mt-3 font-medium"
            >
              Showing the dashboard most relevant to your selected industry
            </motion.p>
          )}
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00f0ff]/20 bg-[#00f0ff]/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-[#00f0ff]/80 font-medium tracking-wide">
              Built From Actual Client Engagement Patterns
            </span>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            const isPersonaMatch = persona ? personaToDashboardMap[persona] === dashboard.id : false;
            return (
              <button
                key={dashboard.id}
                onClick={() => setActiveTab(dashboard.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${
                  activeTab === dashboard.id
                    ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{dashboard.label}</span>
                {isPersonaMatch && activeTab !== dashboard.id && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Hint text */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Info className="w-3 h-3 text-[#00f0ff]/60" />
              <span className="text-[10px] text-gray-500 tracking-wide">Click any metric to learn how it&apos;s calculated</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeDashboard.metrics.map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className={`relative rounded-xl border bg-white/[0.03] backdrop-blur-sm p-5 transition-all duration-300 cursor-pointer select-none ${
                    activeMetric === `${activeTab}-${metric.label}`
                      ? 'border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                      : 'border-white/10 hover:border-[#00f0ff]/20'
                  }`}
                  onClick={() =>
                    setActiveMetric(
                      activeMetric === `${activeTab}-${metric.label}` ? null : `${activeTab}-${metric.label}`
                    )
                  }
                >
                  <MetricTooltip
                    explanation={metric.explanation}
                    isVisible={activeMetric === `${activeTab}-${metric.label}`}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{metric.label}</p>
                    <span className={`text-[10px] font-mono ${metric.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {metric.trend >= 0 ? '' : '↓'} {Math.abs(metric.trend)}%
                    </span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white">
                    <AnimatedNumber value={metric.value} />
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6]"
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.bar}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart + Insight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bar Chart */}
              <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6">
                <h4 className="text-sm font-semibold text-white mb-1">Performance by Category</h4>
                <p className="text-[10px] text-gray-500 mb-6">Current period utilization rates</p>
                <div className="space-y-4">
                  {activeDashboard.chartData.map((item, i) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-white font-mono">{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insight Panel */}
              <div className="rounded-2xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] backdrop-blur-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                    <span className="text-[10px] text-[#00f0ff] uppercase tracking-wider font-mono">Live Insight</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    {activeDashboard.insight}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#00f0ff]/10">
                  <p className="text-[10px] text-gray-500">
                    Updated in real-time from connected data sources
                  </p>
                </div>
              </div>
            </div>

            {/* This dashboard helps you answer */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-purple-400 text-sm font-bold">?</span>
                </div>
                <h4 className="text-white font-bold text-sm">This dashboard helps you answer:</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeDashboard.helpsAnswer.map((question, i) => (
                  <motion.div
                    key={question}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
                  >
                    <span className="text-[#00f0ff] text-xs shrink-0">→</span>
                    <span className="text-gray-300 text-xs">{question}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-gray-500 text-sm">
            This is what clarity looks like. Imagine this for <span className="text-[#00f0ff]">your</span> organization.
          </p>
        </motion.div>
      </div>
    </section>
  );
}