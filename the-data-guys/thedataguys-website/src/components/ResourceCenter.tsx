import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, BarChart3, Layout, Target, HardHat, Building2, Landmark, Shield, GraduationCap, Store, Users, ClipboardList, Database, BookOpen, PieChart, Zap, Settings, Briefcase, UserCheck, Workflow, Search } from 'lucide-react';
import { usePersona, type PersonaType } from '../contexts/PersonaContext';
import { downloadPdf, previewPdf, downloadDashboardPdf, previewDashboardPdf } from '../lib/downloadPdf';

interface Resource {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  pages: number;
  learnings: string[];
  category: string;
  whoFor: string;
  industryTags: string[];
}

const categories = [
  'All',
  'Start Here',
  'Governance',
  'People',
  'Processes',
  'Systems',
  'Ingestion',
  'Storage',
  'Processing',
  'Visualization',
  'AI & Automation',
];

const resources: Resource[] = [
  {
    id: 'checklist',
    title: 'Data House Checklist',
    description: 'Evaluate all 8 floors of your Data House plus the Roof with this comprehensive assessment tool.',
    icon: FileText,
    pages: 14,
    learnings: [
      'Score each floor of your Data House from Governance to Visualization',
      'Identify critical gaps blocking organizational decisions',
      'Get a prioritized action plan for your first 90 days',
      'Benchmark against industry standards for your sector',
    ],
    category: 'Start Here',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'impact-guide',
    title: 'Impact Measurement Guide',
    description: 'Learn how to measure and communicate the true impact of your programs through data visualization.',
    icon: BarChart3,
    pages: 22,
    learnings: [
      'Define meaningful outcomes beyond activity counts',
      'Build logic models that connect programs to community impact',
      'Create compelling impact narratives for funders and boards',
      'Set up automated impact tracking dashboards',
    ],
    category: 'Visualization',
    whoFor: 'Nonprofits & Government',
    industryTags: ['nonprofit', 'government', 'economic-development'],
  },
  {
    id: 'dashboard-template',
    title: 'Dashboard Planning Template',
    description: 'Plan your executive dashboard with our proven layout and KPI framework.',
    icon: Layout,
    pages: 8,
    learnings: [
      'Choose the right KPIs for executive vs. operational views',
      'Design dashboard layouts that drive action, not just reporting',
      'Map data sources to visualization types',
    ],
    category: 'Start Here',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'nonprofit-kpi',
    title: 'Nonprofit KPI Starter Kit',
    description: 'Essential KPIs for nonprofits including program outcomes and donor metrics.',
    icon: Target,
    pages: 16,
    learnings: [
      'Track program effectiveness with outcome-based metrics',
      'Measure donor retention and fundraising efficiency',
      'Report grant compliance metrics automatically',
      'Align board reporting with strategic goals',
    ],
    category: 'Visualization',
    whoFor: 'Nonprofits',
    industryTags: ['nonprofit'],
  },
  {
    id: 'construction-kpi',
    title: 'Construction KPI Starter Kit',
    description: 'Track project health, labor utilization, and budget performance effectively.',
    icon: HardHat,
    pages: 18,
    learnings: [
      'Monitor project profitability in real-time across all jobs',
      'Track labor utilization and crew productivity',
      'Automate budget vs. actual reporting for stakeholders',
      'Predict project delays before they happen',
    ],
    category: 'Visualization',
    whoFor: 'Construction Firms',
    industryTags: ['construction'],
  },
  {
    id: 'econ-dev-kpi',
    title: 'Economic Development KPI Starter Kit',
    description: 'Measure community impact, job creation, and investment outcomes.',
    icon: Building2,
    pages: 12,
    learnings: [
      'Quantify economic impact of development programs',
      'Track job creation, retention, and wage growth',
      'Measure return on public investment',
    ],
    category: 'Visualization',
    whoFor: 'Economic Development',
    industryTags: ['economic-development', 'government'],
  },
  {
    id: 'gov-reporting',
    title: 'Government Reporting Framework',
    description: 'Streamline compliance reporting with automated data collection templates.',
    icon: Landmark,
    pages: 20,
    learnings: [
      'Automate federal and state compliance reporting',
      'Build audit-ready data trails across departments',
      'Reduce reporting time by 80% with template workflows',
      'Meet DEIA, equity, and transparency requirements',
    ],
    category: 'Processes',
    whoFor: 'Government Agencies',
    industryTags: ['government'],
  },
  {
    id: 'governance-starter',
    title: 'Data Governance Starter Guide',
    description: 'Establish policies, ownership, and quality standards from day one.',
    icon: Shield,
    pages: 10,
    learnings: [
      'Define data ownership and stewardship roles',
      'Create quality standards and validation rules',
      'Build a governance framework that scales with your org',
    ],
    category: 'Start Here',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'gov-kpi-kit',
    title: 'Government KPI Kit',
    description: 'Essential metrics for public sector transparency and performance.',
    icon: Landmark,
    pages: 16,
    learnings: [
      'Track citizen satisfaction and service delivery metrics',
      'Measure departmental efficiency and budget utilization',
      'Report on transparency and accountability KPIs',
      'Align metrics with federal reporting requirements',
    ],
    category: 'Visualization',
    whoFor: 'Government Agencies',
    industryTags: ['government'],
  },
  {
    id: 'education-kpi-kit',
    title: 'Education KPI Kit',
    description: 'Track student outcomes, program effectiveness, and institutional performance.',
    icon: GraduationCap,
    pages: 18,
    learnings: [
      'Measure student retention and graduation rates',
      'Track program effectiveness across departments',
      'Monitor institutional performance benchmarks',
      'Report on equity and access metrics',
    ],
    category: 'Visualization',
    whoFor: 'Educational Institutions',
    industryTags: ['education'],
  },
  {
    id: 'small-biz-kpi-kit',
    title: 'Small Business KPI Kit',
    description: 'The 15 metrics every growing business needs to track.',
    icon: Store,
    pages: 12,
    learnings: [
      'Identify the 15 most critical growth metrics',
      'Set up automated tracking without expensive tools',
      'Benchmark against industry averages for your size',
      'Create a weekly scorecard for decision-making',
    ],
    category: 'Visualization',
    whoFor: 'Small Businesses',
    industryTags: ['construction', 'economic-development'],
  },
  {
    id: 'chamber-kpi-kit',
    title: 'Chamber of Commerce KPI Kit',
    description: 'Measure member engagement, economic impact, and program ROI.',
    icon: Building2,
    pages: 14,
    learnings: [
      'Track member engagement and retention rates',
      'Quantify economic impact of chamber programs',
      'Measure event ROI and sponsorship effectiveness',
      'Report program outcomes to stakeholders',
    ],
    category: 'Visualization',
    whoFor: 'Chambers of Commerce',
    industryTags: ['economic-development'],
  },
  {
    id: 'workforce-kpi-kit',
    title: 'Workforce Development KPI Kit',
    description: 'Track training outcomes, placement rates, and employer satisfaction.',
    icon: Users,
    pages: 16,
    learnings: [
      'Measure training completion and certification rates',
      'Track job placement and retention outcomes',
      'Monitor employer satisfaction and partnership health',
      'Report on wage growth and career advancement',
    ],
    category: 'People',
    whoFor: 'Workforce Programs',
    industryTags: ['economic-development', 'government', 'education'],
  },
  {
    id: 'data-governance-template',
    title: 'Data Governance Template',
    description: 'A ready-to-use framework for data ownership, standards, and accountability.',
    icon: Shield,
    pages: 20,
    learnings: [
      'Define clear data ownership across departments',
      'Establish data quality standards and validation rules',
      'Create accountability structures for data stewardship',
      'Build scalable governance policies from day one',
    ],
    category: 'Governance',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'data-dictionary-template',
    title: 'Data Dictionary Template',
    description: 'Document every field, table, and definition in your organization.',
    icon: Database,
    pages: 12,
    learnings: [
      'Catalog every data field with clear definitions',
      'Map relationships between tables and systems',
      'Standardize naming conventions across teams',
      'Create a living reference for all data stakeholders',
    ],
    category: 'Storage',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'kpi-governance-matrix',
    title: 'KPI Governance Matrix',
    description: 'Map every metric to an owner, source, frequency, and action threshold.',
    icon: ClipboardList,
    pages: 10,
    learnings: [
      'Assign clear ownership for every metric',
      'Define data sources and refresh frequencies',
      'Set action thresholds that trigger decisions',
      'Eliminate orphaned or unmaintained KPIs',
    ],
    category: 'Governance',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'dashboard-requirements-workbook',
    title: 'Dashboard Requirements Workbook',
    description: 'Plan your next dashboard project with this structured requirements template.',
    icon: PieChart,
    pages: 14,
    learnings: [
      'Gather stakeholder requirements systematically',
      'Define user personas and their data needs',
      'Map KPIs to visualizations and layouts',
      'Create a phased delivery roadmap',
    ],
    category: 'Visualization',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'automation-readiness-checklist',
    title: 'Automation Readiness Checklist',
    description: 'Determine which processes are ready for automation and which need data first.',
    icon: Zap,
    pages: 10,
    learnings: [
      'Identify high-impact automation candidates',
      'Assess data readiness for each process',
      'Prioritize by effort vs. impact',
      'Build a phased automation roadmap',
    ],
    category: 'AI & Automation',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'data-integration-playbook',
    title: 'Data Integration Playbook',
    description: 'Connect your systems without breaking everything. A practical integration guide.',
    icon: Settings,
    pages: 18,
    learnings: [
      'Map data flows between your core systems',
      'Choose the right integration patterns (API, ETL, CDC)',
      'Avoid common integration pitfalls',
      'Build resilient data pipelines',
    ],
    category: 'Systems',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'executive-reporting-template',
    title: 'Executive Reporting Template',
    description: 'Give your leadership team the numbers that matter in a format they can act on.',
    icon: Briefcase,
    pages: 12,
    learnings: [
      'Design one-page executive summaries',
      'Choose metrics that drive decisions not just awareness',
      'Set up automated report generation',
      'Create exception-based alerting',
    ],
    category: 'Visualization',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'stakeholder-alignment-guide',
    title: 'Stakeholder Alignment Guide',
    description: 'Get buy-in for your data initiative from every level of the organization.',
    icon: UserCheck,
    pages: 14,
    learnings: [
      'Map stakeholder interests and concerns',
      'Build a compelling data ROI narrative',
      'Create a communication cadence for updates',
      'Handle resistance and change management',
    ],
    category: 'People',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'nonprofit-funder-dashboard-guide',
    title: 'Funder Dashboard Guide',
    description: 'Build dashboards that make funders say yes to your next grant application.',
    icon: BarChart3,
    pages: 16,
    learnings: [
      'Design funder-facing impact dashboards',
      'Connect program data to outcome metrics',
      'Automate quarterly funder reporting',
      'Showcase ROI per dollar invested',
    ],
    category: 'Visualization',
    whoFor: 'Nonprofits',
    industryTags: ['nonprofit'],
  },
  {
    id: 'construction-safety-analytics',
    title: 'Construction Safety Analytics Guide',
    description: 'Use data to prevent incidents before they happen.',
    icon: HardHat,
    pages: 14,
    learnings: [
      'Track leading vs. lagging safety indicators',
      'Build predictive safety models from historical data',
      'Automate OSHA compliance reporting',
      'Create crew-level safety scorecards',
    ],
    category: 'Ingestion',
    whoFor: 'Construction Firms',
    industryTags: ['construction'],
  },
  {
    id: 'data-workflow-automation',
    title: 'Data Workflow Automation Guide',
    description: 'Eliminate manual data entry and repetitive reporting tasks.',
    icon: Workflow,
    pages: 16,
    learnings: [
      'Identify repetitive data tasks costing you hours',
      'Choose the right automation tools for your stack',
      'Build automated data quality checks',
      'Set up self-healing data pipelines',
    ],
    category: 'Processing',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'data-audit-template',
    title: 'Data Audit Template',
    description: 'Conduct a full audit of your data landscape in one structured exercise.',
    icon: Search,
    pages: 12,
    learnings: [
      'Inventory all data sources and systems',
      'Assess data quality across dimensions',
      'Identify gaps, duplicates, and orphaned data',
      'Create a remediation priority list',
    ],
    category: 'Ingestion',
    whoFor: 'Any Organization',
    industryTags: ['nonprofit', 'construction', 'government', 'economic-development', 'education'],
  },
  {
    id: 'gov-equity-reporting',
    title: 'Government Equity Reporting Guide',
    description: 'Measure and report on equity, access, and inclusion with data.',
    icon: Landmark,
    pages: 18,
    learnings: [
      'Define equity metrics for your community',
      'Build disaggregated data views by demographics',
      'Create public-facing equity dashboards',
      'Meet federal DEIA reporting requirements',
    ],
    category: 'Processes',
    whoFor: 'Government Agencies',
    industryTags: ['government'],
  },
];

// Map persona to the best matching floor-based category filter
const personaToCategoryMap: Record<NonNullable<PersonaType>, string> = {
  nonprofit: 'Visualization',
  construction: 'Ingestion',
  government: 'Processes',
  'economic-development': 'Visualization',
  education: 'People',
};

const HOMEPAGE_LIMIT = 6;

export default function ResourceCenter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const { persona } = usePersona();

  // Auto-select category when persona changes
  useEffect(() => {
    if (persona) {
      const matchingCategory = personaToCategoryMap[persona];
      if (matchingCategory) {
        setActiveCategory(matchingCategory);
        setShowAll(false);
      }
    }
  }, [persona]);

  const filteredResources = activeCategory === 'All'
    ? resources
    : resources.filter((r) => r.category === activeCategory);

  // Sort: persona-matching resources first when showing "All"
  const sortedResources = activeCategory === 'All' && persona
    ? [...filteredResources].sort((a, b) => {
        const aMatch = a.industryTags.includes(persona) ? 0 : 1;
        const bMatch = b.industryTags.includes(persona) ? 0 : 1;
        return aMatch - bMatch;
      })
    : filteredResources;

  const displayedResources = showAll
    ? sortedResources
    : sortedResources.slice(0, HOMEPAGE_LIMIT);

  const hasMore = sortedResources.length > HOMEPAGE_LIMIT;

  const handleAction = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="resource-center"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.02] blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Free Resources
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Data Resource Center™
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Free tools organized by Data House™ floor to start fixing your foundation today. No email required to preview.
          </p>
          {persona && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[#00f0ff]/70 text-sm mt-3 font-medium"
            >
              Showing resources tailored for your industry
            </motion.p>
          )}
        </motion.div>

        {/* Recommended First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-4 h-4 text-[#00f0ff]" />
            <p className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider font-bold">
              Recommended First
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'checklist', title: 'Data House Checklist', desc: 'Evaluate all 8 floors of your Data House plus the Roof with this comprehensive assessment tool.', icon: FileText, action: downloadPdf },
              { id: 'dashboard-template', title: 'Dashboard Planning Template', desc: 'Plan your executive dashboard with our proven layout and KPI framework.', icon: Layout, action: downloadDashboardPdf },
              { id: 'nonprofit-kpi', title: 'KPI Starter Kit', desc: 'Essential KPIs including program outcomes, donor metrics, and operational health.', icon: Target, action: handleAction },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#00f0ff]/25 bg-gradient-to-br from-[#00f0ff]/[0.06] to-[#3b82f6]/[0.03] backdrop-blur-xl p-6 hover:border-[#00f0ff]/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.1)] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/30 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#00f0ff]" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">{item.desc}</p>
                  <button
                    onClick={item.action}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#00f0ff]/[0.1] text-[#00f0ff] border border-[#00f0ff]/25 hover:bg-[#00f0ff]/20 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Free
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category Tabs - Floor-based */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowAll(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                  : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Featured Resource */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="rounded-2xl border border-[#00f0ff]/20 bg-gradient-to-r from-[#00f0ff]/[0.05] to-[#3b82f6]/[0.05] backdrop-blur-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/30 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-[#00f0ff]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[10px] text-[#00f0ff] font-mono uppercase tracking-wider">
                    Start Here
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg md:text-xl mb-1">
                  Data House Checklist™
                </h3>
                <p className="text-gray-400 text-sm">
                  Best for any organization trying to understand which floor of their Data House needs the most work.
                </p>
              </div>
              <button
                onClick={downloadPdf}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/25 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Starter Checklist
              </button>
            </div>
          </div>
        </motion.div>

        {/* Resource Grid - Limited to HOMEPAGE_LIMIT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {displayedResources.map((resource, index) => {
            const Icon = resource.icon;
            const isRecommended = persona ? resource.industryTags.includes(persona) : false;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
                className={`relative rounded-xl border backdrop-blur-xl p-5 md:p-6 hover:border-[#00f0ff]/25 hover:bg-white/[0.05] transition-all duration-300 group ${
                  isRecommended
                    ? 'border-[#00f0ff]/20 bg-[#00f0ff]/[0.03]'
                    : 'border-white/[0.08] bg-white/[0.03]'
                }`}
              >
                {/* Recommended badge */}
                {isRecommended && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-[#00f0ff] text-[9px] font-mono uppercase tracking-wider"
                  >
                    Recommended
                  </motion.div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_12px_rgba(0,240,255,0.15)] transition-shadow">
                    <Icon className="w-5 h-5 text-[#00f0ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-white font-bold text-sm">
                        {resource.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[10px] text-gray-400 font-mono whitespace-nowrap">
                        PDF • {resource.pages} Pages
                      </span>
                    </div>
                    {/* Category & Who it's for tags */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#00f0ff]/[0.06] border border-[#00f0ff]/15 text-[10px] text-[#00f0ff]/80 font-mono whitespace-nowrap">
                        {resource.category}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-medium">
                        {resource.whoFor}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed mb-3">
                      {resource.description}
                    </p>

                    {/* What you'll learn */}
                    <ul className="space-y-1.5 mb-4">
                      {resource.learnings.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-gray-300">
                          <span className="text-[#00f0ff] mt-0.5 shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {resource.id === 'checklist' ? (
                        <button
                          onClick={previewPdf}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] text-gray-300 border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </button>
                      ) : resource.id === 'dashboard-template' ? (
                        <button
                          onClick={previewDashboardPdf}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] text-gray-300 border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </button>
                      ) : (
                        <button
                          onClick={handleAction}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] text-gray-300 border border-white/10 hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </button>
                      )}
                      {resource.id === 'checklist' ? (
                        <button
                          onClick={downloadPdf}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00f0ff]/[0.08] text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/15 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PDF →
                        </button>
                      ) : resource.id === 'dashboard-template' ? (
                        <button
                          onClick={downloadDashboardPdf}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00f0ff]/[0.08] text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/15 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Free →
                        </button>
                      ) : (
                        <button
                          onClick={handleAction}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00f0ff]/[0.08] text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/15 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Free →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Resources Button */}
        {hasMore && !showAll && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-8"
          >
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white/[0.05] text-gray-300 border border-white/15 hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all duration-300"
            >
              View All {sortedResources.length} Resources
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Get Instant Access CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-xs mb-3">
            All resources are free. Enter your email at checkout for instant access.
          </p>
        </motion.div>
      </div>
    </section>
  );
}