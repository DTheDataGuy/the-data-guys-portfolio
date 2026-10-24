import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersona } from '../contexts/PersonaContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ROIBenchmark {
  metric: string;
  change: string;
  positive: boolean;
}

interface IndustryBlueprint {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  typicalSystems: string[];
  typicalKPIs: string[];
  commonProblems: string[];
  recommendedStartingPoint: string[];
  architectureFlow: string[];
  outcomes: string[];
  roiBenchmarks: ROIBenchmark[];
  quickWins: string[];
  expectedOutcome12Month: string;
  commonReports: string[];
  recommendedFirstDashboard: string;
  recommendedFirstAutomation: string;
  recommendedArchitecture: string;
}

// ─── Industry Blueprint Data ─────────────────────────────────────────────────

const blueprints: IndustryBlueprint[] = [
  {
    id: 'construction',
    name: 'Construction Data House™',
    emoji: '🏗️',
    tagline: 'From project chaos to predictive project intelligence',
    typicalSystems: ['HCSS', 'Procore', 'Viewpoint', 'Workday', 'QuickBooks', 'Power BI'],
    typicalKPIs: [
      'Labor Utilization',
      'Equipment Utilization',
      'Cost To Complete',
      'Budget Variance',
      'Schedule Variance',
      'Safety Incidents',
      'Cash Flow Forecast',
    ],
    commonProblems: [
      'Disconnected payroll',
      'Manual forecasting',
      'No visibility across projects',
      'Late reporting',
      'Poor labor forecasting',
    ],
    recommendedStartingPoint: [
      'Project Controls Dashboard',
      'Labor Analytics',
      'Executive Reporting Layer',
    ],
    architectureFlow: ['HCSS', 'Procore', 'Data Warehouse', 'Power BI', 'Executive Dashboard'],
    outcomes: [
      '12% labor utilization increase',
      '60% forecast accuracy improvement',
      '90% reporting time reduction',
    ],
    roiBenchmarks: [
      { metric: 'Reporting Reduction', change: '-90%', positive: true },
      { metric: 'Forecast Accuracy', change: '+35%', positive: true },
      { metric: 'Labor Utilization', change: '+20%', positive: true },
      { metric: 'Cost Avoidance', change: '$2M+/year', positive: true },
    ],
    quickWins: [
      'Daily labor utilization report',
      'Project cost tracker',
      'Automated safety compliance log',
    ],
    expectedOutcome12Month: 'Zero surprise cost overruns, labor optimized across all projects, executive visibility complete',
    commonReports: ['Project Cost vs Budget', 'Safety Incident Tracker', 'Equipment Utilization', 'Subcontractor Performance'],
    recommendedFirstDashboard: 'Project Financial Health Dashboard',
    recommendedFirstAutomation: 'Daily safety report generation from field data',
    recommendedArchitecture: 'Hub-and-spoke with field data collection apps feeding central warehouse',
  },
  {
    id: 'government',
    name: 'Government Data House™',
    emoji: '🏛️',
    tagline: 'From siloed departments to unified citizen intelligence',
    typicalSystems: ['Tyler Technologies', 'Permitting Systems', 'GIS', 'Financial Systems'],
    typicalKPIs: [
      'Service Response Time',
      'Budget Utilization',
      'Permit Processing Time',
      'Citizen Satisfaction',
      'Resource Allocation Efficiency',
    ],
    commonProblems: [
      'Siloed departments',
      'Manual reporting to state/federal',
      'No cross-department visibility',
      'Legacy systems',
    ],
    recommendedStartingPoint: [
      'Cross-Department Dashboard',
      'Resource Allocation',
      'Citizen Services Analytics',
    ],
    architectureFlow: ['Tyler', 'Permitting', 'GIS', 'Warehouse', 'Executive Dashboard'],
    outcomes: [
      'Reduced reporting burden',
      'Improved transparency',
      'Better resource allocation',
    ],
    roiBenchmarks: [
      { metric: 'Response Time', change: '-40%', positive: true },
      { metric: 'Transparency Score', change: '+60%', positive: true },
      { metric: 'Budget Visibility', change: '+80%', positive: true },
      { metric: 'Citizen Satisfaction', change: '+25%', positive: true },
    ],
    quickWins: [
      'Automated monthly council reports',
      'Real-time budget dashboard',
      'Department KPI scorecard',
    ],
    expectedOutcome12Month: 'Full transparency dashboards public, council reports automated, citizen satisfaction measured continuously',
    commonReports: ['Budget vs Actuals', 'Service Delivery Metrics', 'Constituent Satisfaction', 'Compliance Status'],
    recommendedFirstDashboard: 'Department Performance Scorecard',
    recommendedFirstAutomation: 'Monthly compliance reporting from multiple systems',
    recommendedArchitecture: 'Federated data mesh with department-level ownership and central catalog',
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit Data House™',
    emoji: '🤝',
    tagline: 'From fragmented tools to measurable impact',
    typicalSystems: [
      'Salesforce',
      'Survey Tools',
      'Financial Systems (QuickBooks/Sage)',
      'Grant Management',
    ],
    typicalKPIs: [
      'Program Outcomes',
      'Cost Per Outcome',
      'Donor Retention',
      'Grant Compliance Rate',
      'Participant Engagement',
    ],
    commonProblems: [
      "Can't prove impact",
      'Manual grant reporting',
      'Disconnected program data',
      'No outcome measurement',
    ],
    recommendedStartingPoint: [
      'Impact Dashboard',
      'Grant Reporting Automation',
      'Funder Dashboard',
    ],
    architectureFlow: ['Salesforce', 'Survey Tools', 'Financial Systems', 'Impact Warehouse', 'Funder Dashboard'],
    outcomes: [
      '3x reporting efficiency',
      'Faster grant reporting',
      'Clear outcome measurement',
    ],
    roiBenchmarks: [
      { metric: 'Grant Compliance', change: '+95%', positive: true },
      { metric: 'Funder Reporting', change: '-70% time', positive: true },
      { metric: 'Program Outcomes', change: '+45%', positive: true },
      { metric: 'Board Reporting', change: '-80% time', positive: true },
    ],
    quickWins: [
      'Automated funder reports',
      'Program comparison dashboard',
      'Board-ready impact summary',
    ],
    expectedOutcome12Month: 'Impact proven to every funder, programs optimized by data, board fully informed in real-time',
    commonReports: ['Program Outcomes Report', 'Donor Impact Summary', 'Grant Compliance', 'Participant Demographics'],
    recommendedFirstDashboard: 'Program Impact Dashboard',
    recommendedFirstAutomation: 'Quarterly grant reporting with auto-populated metrics',
    recommendedArchitecture: 'Integrated CRM + program data with impact measurement layer',
  },
  {
    id: 'economic-development',
    name: 'Economic Development Data House™',
    emoji: '📊',
    tagline: 'From scattered public data to community intelligence',
    typicalSystems: ['CRM', 'Financial Systems', 'Workforce Data', 'Census/BLS Data'],
    typicalKPIs: [
      'Jobs Created',
      'Investment Attracted',
      'Business Retention Rate',
      'Workforce Participation',
      'ROI per Dollar Invested',
    ],
    commonProblems: [
      "Can't prove ROI of programs",
      'Manual tracking',
      'No longitudinal data',
      'Disconnected workforce data',
    ],
    recommendedStartingPoint: [
      'Investment Tracking Dashboard',
      'Job Creation Analytics',
      'Economic Impact Measurement',
    ],
    architectureFlow: ['CRM', 'Workforce Data', 'Financial Systems', 'Analytics Warehouse', 'Impact Dashboard'],
    outcomes: [
      'Investment tracking',
      'Job creation reporting',
      'Economic impact measurement',
    ],
    roiBenchmarks: [
      { metric: 'Business Growth Tracking', change: '+55%', positive: true },
      { metric: 'Job Creation Measurement', change: '+40%', positive: true },
      { metric: 'Investment ROI', change: '+65%', positive: true },
      { metric: 'Community Impact', change: '+50%', positive: true },
    ],
    quickWins: [
      'Business pipeline tracker',
      'Job creation dashboard',
      'Investment impact scorecard',
    ],
    expectedOutcome12Month: 'Every dollar of investment tracked to outcomes, businesses supported with data, community impact quantified',
    commonReports: ['Business Retention Tracker', 'Job Creation Summary', 'Investment Pipeline', 'Community Impact'],
    recommendedFirstDashboard: 'Economic Vitality Scorecard',
    recommendedFirstAutomation: 'Annual impact report generation from business survey data',
    recommendedArchitecture: 'Longitudinal tracking system with business lifecycle stages',
  },
  {
    id: 'education',
    name: 'Education Data House™',
    emoji: '🎓',
    tagline: 'From compliance-driven data to student-centered analytics',
    typicalSystems: ['PowerSchool', 'Canvas', 'Infinite Campus', 'State Reporting Systems'],
    typicalKPIs: [
      'Graduation Rate',
      'Attendance Trends',
      'Assessment Proficiency',
      'Intervention Success',
      'Equity Gaps',
    ],
    commonProblems: [
      'Data used only for compliance not improvement',
      "Can't identify at-risk students early",
      'Manual state reporting',
      'No early warning system',
    ],
    recommendedStartingPoint: [
      'Student Success Dashboard',
      'Early Warning System',
      'State Reporting Automation',
    ],
    architectureFlow: ['PowerSchool', 'Canvas', 'State Systems', 'Data Warehouse', 'Student Dashboard'],
    outcomes: [
      '45% faster state reporting',
      'Early at-risk identification',
      'Improved equity tracking',
    ],
    roiBenchmarks: [
      { metric: 'Student Outcome Tracking', change: '+50%', positive: true },
      { metric: 'Compliance Reporting', change: '-60% time', positive: true },
      { metric: 'Resource Allocation', change: '+30%', positive: true },
      { metric: 'Enrollment Forecasting', change: '+40%', positive: true },
    ],
    quickWins: [
      'Student progress dashboard',
      'Enrollment trend tracker',
      'Resource utilization report',
    ],
    expectedOutcome12Month: "Every student's progress tracked, resources allocated by need, compliance automated",
    commonReports: ['Student Progress Report', 'Attendance Trends', 'Assessment Proficiency', 'Resource Utilization'],
    recommendedFirstDashboard: 'Student Success Early Warning Dashboard',
    recommendedFirstAutomation: 'State compliance reporting with auto-populated student data',
    recommendedArchitecture: 'Student data lake with real-time event streaming from LMS/SIS',
  },
  {
    id: 'small-business',
    name: 'Small Business Data House™',
    emoji: '🏪',
    tagline: 'From gut decisions to data-driven growth',
    typicalSystems: ['QuickBooks', 'HubSpot', 'Shopify', 'Google Analytics', 'Excel'],
    typicalKPIs: [
      'Revenue Growth',
      'Customer Acquisition Cost',
      'Customer Lifetime Value',
      'Cash Flow',
      'Profit Margins',
    ],
    commonProblems: [
      'No visibility into true profitability',
      'Decisions based on gut feeling',
      'Scattered data across tools',
      'No forecasting capability',
    ],
    recommendedStartingPoint: [
      'Revenue Dashboard',
      'Customer Analytics',
      'Cash Flow Forecasting',
    ],
    architectureFlow: ['QuickBooks', 'CRM', 'Analytics', 'Data Layer', 'Growth Dashboard'],
    outcomes: [
      'Complete financial visibility',
      'Customer behavior insights',
      'Predictive cash flow',
    ],
    roiBenchmarks: [
      { metric: 'Revenue Visibility', change: '+70%', positive: true },
      { metric: 'Cash Flow Forecasting', change: '+45%', positive: true },
      { metric: 'Customer Retention', change: '+25%', positive: true },
      { metric: 'Operational Efficiency', change: '+35%', positive: true },
    ],
    quickWins: [
      'Revenue dashboard',
      'Customer analytics report',
      'Cash flow forecast',
    ],
    expectedOutcome12Month: 'Complete financial visibility, customer behavior understood, growth decisions backed by data',
    commonReports: ['Revenue by Channel', 'Customer Acquisition Funnel', 'Cash Flow Forecast', 'Profit Margin by Product'],
    recommendedFirstDashboard: 'Revenue & Profitability Dashboard',
    recommendedFirstAutomation: 'Weekly financial summary email from QuickBooks + CRM data',
    recommendedArchitecture: 'Lightweight ETL connecting QuickBooks, CRM, and analytics into a single dashboard layer',
  },
];

// ─── Architecture Flow Diagram ───────────────────────────────────────────────

function ArchitectureFlowDiagram({ nodes }: { nodes: string[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap py-3">
      {nodes.map((node, i) => (
        <div key={node} className="flex items-center gap-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="px-3 py-2 rounded-lg bg-[#00f0ff]/[0.08] border border-[#00f0ff]/25 text-white text-xs font-mono whitespace-nowrap"
          >
            {node}
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.05, duration: 0.2 }}
              className="text-[#00f0ff] text-sm font-bold"
            >
              →
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section Icons ───────────────────────────────────────────────────────────

function SystemsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );
}

function KPIIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function PainIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function OutcomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ArchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

// ─── Blueprint Card Component ────────────────────────────────────────────────

function BlueprintCard({
  blueprint,
  isExpanded,
  onToggle,
  isPersonaMatch,
}: {
  blueprint: IndustryBlueprint;
  isExpanded: boolean;
  onToggle: () => void;
  isPersonaMatch: boolean;
}) {
  return (
    <motion.div
      layout
      className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isExpanded
          ? 'border-[#00f0ff]/40 bg-[#00f0ff]/[0.04] shadow-[0_0_40px_rgba(0,240,255,0.1)] col-span-1 md:col-span-2 lg:col-span-3'
          : isPersonaMatch
            ? 'border-[#00f0ff]/30 bg-[#00f0ff]/[0.05] shadow-[0_0_20px_rgba(0,240,255,0.08)] hover:border-[#00f0ff]/40'
            : 'border-white/10 bg-white/[0.03] hover:border-[#00f0ff]/30 hover:bg-white/[0.05] hover:shadow-[0_0_20px_rgba(0,240,255,0.05)]'
      }`}
      onClick={onToggle}
    >
      {/* Persona Match Indicator */}
      {isPersonaMatch && !isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-[#00f0ff] text-[9px] font-mono uppercase tracking-wider"
        >
          Your Industry
        </motion.div>
      )}

      {/* Card Header */}
      <div className="p-6 flex items-center gap-4">
        <span className="text-4xl">{blueprint.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg">{blueprint.name}</h3>
          <p className="text-gray-400 text-sm truncate">{blueprint.tagline}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0"
        >
          <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* Expanded Blueprint Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pb-8 space-y-6">
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Typical Systems */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#00f0ff]">
                    <SystemsIcon />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Typical Systems</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {blueprint.typicalSystems.map((system) => (
                      <span
                        key={system}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-gray-300 text-xs font-medium"
                      >
                        {system}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Typical KPIs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <KPIIcon />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Typical KPIs</h4>
                  </div>
                  <div className="space-y-1.5">
                    {blueprint.typicalKPIs.map((kpi) => (
                      <div key={kpi} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400/80 shrink-0" />
                        <span className="text-gray-300 text-sm">{kpi}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Problems */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <PainIcon />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Common Problems</h4>
                  </div>
                  <div className="space-y-1.5">
                    {blueprint.commonProblems.map((problem) => (
                      <div key={problem} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400/80 shrink-0" />
                        <span className="text-gray-300 text-sm">{problem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROI Benchmarks - NEW */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-sm font-semibold uppercase tracking-wider">ROI Benchmarks</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {blueprint.roiBenchmarks.map((benchmark) => (
                    <div
                      key={benchmark.metric}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 flex flex-col items-center min-w-[120px]"
                    >
                      <span className="text-emerald-400 font-bold text-lg font-mono">{benchmark.change}</span>
                      <span className="text-gray-400 text-[11px] text-center mt-0.5">{benchmark.metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture Flow - Full Width */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#00f0ff]">
                  <ArchIcon />
                  <h4 className="text-sm font-semibold uppercase tracking-wider">Architecture Flow</h4>
                </div>
                <div className="px-4 py-3 rounded-xl bg-[#00f0ff]/[0.04] border border-[#00f0ff]/20 overflow-x-auto">
                  <ArchitectureFlowDiagram nodes={blueprint.architectureFlow} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recommended Starting Point */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <RoadmapIcon />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Recommended Starting Point</h4>
                  </div>
                  <div className="space-y-2">
                    {blueprint.recommendedStartingPoint.map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-[10px] font-bold shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-gray-300 text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Wins (30-60 Days) - NEW */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Quick Wins (30-60 Days)</h4>
                  </div>
                  <div className="space-y-2">
                    {blueprint.quickWins.map((win, i) => (
                      <div key={win} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Outcomes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <OutcomeIcon />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Expected Outcomes</h4>
                  </div>
                  <div className="space-y-2">
                    {blueprint.outcomes.map((outcome) => (
                      <div key={outcome} className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-emerald-300 text-sm font-medium">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 12-Month Vision - NEW */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#00f0ff]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h4 className="text-sm font-semibold uppercase tracking-wider">12-Month Vision</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-[#00f0ff]/[0.04] border border-[#00f0ff]/20 border-l-4 border-l-[#00f0ff]/50">
                    <p className="text-gray-200 text-sm italic leading-relaxed">
                      &ldquo;{blueprint.expectedOutcome12Month}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Deeper Recommendations - NEW */}
              {blueprint.commonReports && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-violet-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Deeper Recommendations</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Common Reports */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Common Reports</p>
                      <div className="flex flex-wrap gap-1.5">
                        {blueprint.commonReports.map((report) => (
                          <span key={report} className="px-2.5 py-1 rounded-md bg-violet-500/[0.08] border border-violet-500/20 text-violet-300 text-xs">
                            {report}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Recommended First Dashboard */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Recommended First Dashboard</p>
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00f0ff] shrink-0" />
                        {blueprint.recommendedFirstDashboard}
                      </p>
                    </div>
                    {/* Recommended First Automation */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Recommended First Automation</p>
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        {blueprint.recommendedFirstAutomation}
                      </p>
                    </div>
                    {/* Recommended Architecture */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                      <p className="text-gray-400 text-[10px] font-mono uppercase tracking-wider mb-2">Recommended Architecture</p>
                      <p className="text-white text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        {blueprint.recommendedArchitecture}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA inside blueprint */}
              <div className="pt-2 flex justify-center">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold text-sm hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
                >
                  Get Your {blueprint.name}
                  <span className="text-lg">→</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChooseIndustry() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { persona } = usePersona();

  // Auto-expand matching blueprint when persona changes
  useEffect(() => {
    if (persona) {
      const matchingBlueprint = blueprints.find((b) => b.id === persona);
      if (matchingBlueprint) {
        setExpandedId(matchingBlueprint.id);
      }
    }
  }, [persona]);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="industry-blueprints" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
            <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase">
              Industry Data House™ Blueprints
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/[0.08] border border-green-500/20 text-green-400 text-[10px] font-mono tracking-wider uppercase">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Based On Real Implementations
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Every industry needs a Data House.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Here's what yours looks like.
            </span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Blueprints for your exact industry. Click to explore the systems, architecture, KPIs, and
            recommended starting point for your sector.
          </p>
        </motion.div>

        {/* Blueprint Cards Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {blueprints.map((blueprint, i) => (
            <motion.div
              key={blueprint.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={
                expandedId === blueprint.id
                  ? 'col-span-1 md:col-span-2 lg:col-span-3'
                  : ''
              }
            >
              <BlueprintCard
                blueprint={blueprint}
                isExpanded={expandedId === blueprint.id}
                onToggle={() => handleToggle(blueprint.id)}
                isPersonaMatch={persona === blueprint.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}