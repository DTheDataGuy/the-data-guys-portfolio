import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolCategory {
  id: string;
  name: string;
  emoji: string;
  options: string[];
}

interface SubScores {
  dataReadiness: number;
  integration: number;
  reportingMaturity: number;
  aiReadiness: number;
  governance: number;
}

// ─── Tool Categories ─────────────────────────────────────────────────────────

const toolCategories: ToolCategory[] = [
  {
    id: 'crm',
    name: 'CRM',
    emoji: '👥',
    options: ['Salesforce', 'HubSpot', 'Dynamics 365', 'None'],
  },
  {
    id: 'financial',
    name: 'Financial',
    emoji: '💰',
    options: ['QuickBooks', 'Sage', 'Workday', 'Xero', 'None'],
  },
  {
    id: 'project-management',
    name: 'Project Management',
    emoji: '📋',
    options: ['Procore', 'Monday.com', 'Asana', 'Jira', 'None'],
  },
  {
    id: 'reporting',
    name: 'Reporting',
    emoji: '📊',
    options: ['Power BI', 'Tableau', 'Excel Only', 'Google Sheets', 'None'],
  },
  {
    id: 'data-storage',
    name: 'Data Storage',
    emoji: '🗄️',
    options: ['SQL Database', 'Cloud Warehouse', 'Spreadsheets Only', "Don't Know", 'None'],
  },
  {
    id: 'communication',
    name: 'Communication',
    emoji: '💬',
    options: ['Slack', 'Teams', 'Email Only', 'None'],
  },
];

// Weak/risky selections
const weakSelections = new Set(['Excel Only', 'Google Sheets', 'Spreadsheets Only', "Don't Know", 'Email Only', 'None']);
const integratedSelections = new Set(['Salesforce', 'HubSpot', 'Dynamics 365', 'Workday', 'Power BI', 'Tableau', 'SQL Database', 'Cloud Warehouse', 'Slack', 'Teams', 'Procore', 'Jira']);

// ─── Sub-Score Calculation ───────────────────────────────────────────────────

function calculateSubScores(selections: Record<string, string>): SubScores {
  // Data Readiness: Based on data-storage selection
  let dataReadiness = 0;
  const storage = selections['data-storage'];
  if (storage === 'Cloud Warehouse') dataReadiness = 100;
  else if (storage === 'SQL Database') dataReadiness = 85;
  else if (storage === 'Spreadsheets Only') dataReadiness = 25;
  else if (storage === "Don't Know") dataReadiness = 10;
  else if (storage === 'None') dataReadiness = 5;
  else if (!storage) dataReadiness = 0;

  // Integration Score: Based on how many categories have non-None/non-weak tools
  const filledCategories = Object.entries(selections).filter(
    ([, value]) => value && !weakSelections.has(value)
  ).length;
  const integration = Math.round((filledCategories / toolCategories.length) * 100);

  // Reporting Maturity: Based on reporting selection
  let reportingMaturity = 0;
  const reporting = selections['reporting'];
  if (reporting === 'Power BI' || reporting === 'Tableau') reportingMaturity = 100;
  else if (reporting === 'Google Sheets') reportingMaturity = 40;
  else if (reporting === 'Excel Only') reportingMaturity = 30;
  else if (reporting === 'None') reportingMaturity = 5;
  else if (!reporting) reportingMaturity = 0;

  // AI Readiness: Composite of data + reporting + integration
  const aiReadiness = Math.round((dataReadiness * 0.4 + reportingMaturity * 0.3 + integration * 0.3));

  // Governance: Based on having structured tools (CRM + Financial + PM)
  let governancePoints = 0;
  const crm = selections['crm'];
  const financial = selections['financial'];
  const pm = selections['project-management'];
  if (crm && !weakSelections.has(crm)) governancePoints += 33;
  if (financial && !weakSelections.has(financial)) governancePoints += 34;
  if (pm && !weakSelections.has(pm)) governancePoints += 33;
  const governance = Math.min(100, governancePoints);

  return { dataReadiness, integration, reportingMaturity, aiReadiness, governance };
}

// ─── Overall Score Calculation ───────────────────────────────────────────────

function calculateScore(selections: Record<string, string>): number {
  const categories = Object.keys(selections);
  if (categories.length === 0) return 0;

  let score = 0;
  const totalCategories = toolCategories.length;

  categories.forEach((catId) => {
    const value = selections[catId];
    if (!value) return;
    if (integratedSelections.has(value)) {
      score += 100 / totalCategories;
    } else if (!weakSelections.has(value)) {
      score += 70 / totalCategories;
    } else if (value === 'None') {
      score += 0;
    } else {
      score += 25 / totalCategories;
    }
  });

  return Math.round(Math.min(100, score));
}

function getRisks(selections: Record<string, string>): string[] {
  const risks: string[] = [];
  const values = Object.values(selections);

  if (values.includes('Spreadsheets Only') || values.includes('Excel Only') || values.includes('Google Sheets')) {
    risks.push('No central source of truth — data scattered across spreadsheets');
  }
  if (values.includes("Don't Know")) {
    risks.push('Unknown data infrastructure — high risk of data loss');
  }
  if (values.filter((v) => v === 'None').length >= 3) {
    risks.push('Critical tool gaps — missing essential business systems');
  }
  if (!values.includes('SQL Database') && !values.includes('Cloud Warehouse')) {
    risks.push('No structured data storage — analytics impossible at scale');
  }
  if (values.includes('Email Only')) {
    risks.push('Communication bottleneck — no collaboration platform');
  }

  const noneCount = values.filter((v) => v === 'None').length;
  if (noneCount >= 2 && noneCount < 3) {
    risks.push('Data silos detected — systems not connected');
  }

  if (risks.length === 0 && Object.keys(selections).length >= 4) {
    const hasIntegrated = values.some((v) => integratedSelections.has(v));
    if (!hasIntegrated) {
      risks.push('Limited integration potential — consider modern cloud tools');
    }
  }

  return risks.slice(0, 4);
}

// ─── Next Step Recommendation ────────────────────────────────────────────────

function getNextStepRecommendation(subScores: SubScores): { area: string; advice: string } {
  const scores = [
    { area: 'Data Readiness', score: subScores.dataReadiness, advice: 'Start Here: Migrate from spreadsheets to a proper data warehouse.' },
    { area: 'Integration', score: subScores.integration, advice: 'Start Here: Connect your existing tools with automated data pipelines.' },
    { area: 'Reporting', score: subScores.reportingMaturity, advice: 'Start Here: Implement a modern BI tool with automated dashboards.' },
    { area: 'AI Readiness', score: subScores.aiReadiness, advice: 'Start Here: Strengthen your data foundation before pursuing AI.' },
    { area: 'Governance', score: subScores.governance, advice: 'Start Here: Define data ownership and establish standards.' },
  ];

  const lowest = scores.reduce((min, current) => current.score < min.score ? current : min, scores[0]);
  return { area: lowest.area, advice: lowest.advice };
}

// ─── Circular Score Component ────────────────────────────────────────────────

function CircularScore({ score, isVisible, size = 'lg' }: { score: number; isVisible: boolean; size?: 'lg' | 'sm' }) {
  const radius = size === 'lg' ? 45 : 30;
  const strokeWidth = size === 'lg' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const containerSize = size === 'lg' ? 'w-32 h-32' : 'w-16 h-16';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-sm';

  return (
    <div className={`relative ${containerSize} mx-auto`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: isVisible ? offset : circumference }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`${textSize} font-black text-white`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        {size === 'lg' && (
          <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">Score</span>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Score Card Component ────────────────────────────────────────────────

function SubScoreCard({ label, score, isVisible, delay }: { label: string; score: number; isVisible: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/10"
    >
      <CircularScore score={score} isVisible={isVisible} size="sm" />
      <span className="text-gray-400 text-[10px] font-mono uppercase tracking-wider text-center leading-tight mt-1">
        {label}
      </span>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DataStackTool() {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (categoryId: string, option: string) => {
    setSelections((prev) => {
      const updated = { ...prev };
      if (updated[categoryId] === option) {
        delete updated[categoryId];
      } else {
        updated[categoryId] = option;
      }
      return updated;
    });
  };

  const score = useMemo(() => calculateScore(selections), [selections]);
  const subScores = useMemo(() => calculateSubScores(selections), [selections]);
  const risks = useMemo(() => getRisks(selections), [selections]);
  const nextStep = useMemo(() => getNextStepRecommendation(subScores), [subScores]);

  const selectedCount = Object.keys(selections).length;
  const canShowResults = selectedCount >= 3;

  const handleShowResults = () => {
    setShowResults(true);
  };

  return (
    <section id="data-stack-tool" className="relative py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0a0e1a] to-[#0f172a]" />

      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.015] blur-[150px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Interactive Assessment
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            What&apos;s In Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Data Stack?
            </span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Select your current tools and get an instant assessment of your data readiness.
          </p>
        </motion.div>

        {/* Tool Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {toolCategories.map((category, catIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: catIndex * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category.emoji}</span>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">{category.name}</h3>
              </div>
              <div className="space-y-2">
                {category.options.map((option) => {
                  const isSelected = selections[category.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(category.id, option)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                        isSelected
                          ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                          : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-[#00f0ff] bg-[#00f0ff]/20' : 'border-white/30'
                          }`}
                        >
                          {isSelected && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2.5 h-2.5 text-[#00f0ff]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Generate Assessment Button */}
        <div className="text-center mb-10">
          <motion.button
            onClick={handleShowResults}
            disabled={!canShowResults}
            whileHover={canShowResults ? { scale: 1.03 } : {}}
            whileTap={canShowResults ? { scale: 0.97 } : {}}
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 ${
              canShowResults
                ? 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:shadow-[0_0_60px_rgba(0,240,255,0.4)]'
                : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'
            }`}
          >
            {canShowResults ? 'Generate My Assessment' : `Select at least ${3 - selectedCount} more tool${3 - selectedCount > 1 ? 's' : ''}`}
            {canShowResults && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Results Panel */}
        <AnimatePresence>
          {showResults && canShowResults && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-2xl border border-[#00f0ff]/30 bg-[#00f0ff]/[0.03] backdrop-blur-xl p-8 space-y-8"
            >
              {/* Overall Score */}
              <div className="text-center space-y-3">
                <h4 className="text-[#00f0ff] font-mono text-xs uppercase tracking-wider">Overall Stack Score</h4>
                <CircularScore score={score} isVisible={showResults} size="lg" />
                <p className="text-gray-400 text-xs">
                  {score >= 70 ? 'Strong foundation' : score >= 40 ? 'Needs improvement' : 'Critical gaps'}
                </p>
              </div>

              {/* Sub-Scores Grid */}
              <div>
                <h4 className="text-white font-mono text-xs uppercase tracking-wider text-center mb-4">
                  Dimensional Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <SubScoreCard label="Data Readiness" score={subScores.dataReadiness} isVisible={showResults} delay={0.2} />
                  <SubScoreCard label="Integration" score={subScores.integration} isVisible={showResults} delay={0.3} />
                  <SubScoreCard label="Reporting" score={subScores.reportingMaturity} isVisible={showResults} delay={0.4} />
                  <SubScoreCard label="AI Readiness" score={subScores.aiReadiness} isVisible={showResults} delay={0.5} />
                  <SubScoreCard label="Governance" score={subScores.governance} isVisible={showResults} delay={0.6} />
                </div>
              </div>

              {/* Recommended Next Step */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="rounded-xl bg-gradient-to-r from-[#00f0ff]/[0.08] to-[#3b82f6]/[0.08] border border-[#00f0ff]/20 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/15 border border-[#00f0ff]/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-[#00f0ff] font-bold text-sm mb-1">
                      Recommended Next Step — {nextStep.area}
                    </h5>
                    <p className="text-gray-300 text-sm leading-relaxed">{nextStep.advice}</p>
                  </div>
                </div>
              </motion.div>

              {/* Risks & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risks */}
                <div className="space-y-3">
                  <h4 className="text-red-400 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Risk Indicators
                  </h4>
                  <div className="space-y-2">
                    {risks.length > 0 ? (
                      risks.map((risk) => (
                        <motion.div
                          key={risk}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/20"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span className="text-gray-300 text-xs">{risk}</span>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                        <span className="text-emerald-300 text-xs">No critical risks detected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Architecture Recommendation */}
                <div className="space-y-3">
                  <h4 className="text-emerald-400 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommended Architecture
                  </h4>
                  <div className="px-4 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {score >= 75
                        ? 'Your stack has strong foundations. Focus on connecting your existing systems into a unified data warehouse for cross-platform analytics and AI readiness.'
                        : score >= 50
                          ? 'You have some solid tools but gaps in integration. Start with a central data warehouse to connect your existing systems, then layer analytics on top.'
                          : score >= 25
                            ? 'Your data infrastructure needs significant upgrades. Begin with proper data storage (cloud warehouse), then migrate from spreadsheets to integrated systems.'
                            : 'Critical infrastructure gaps detected. You need a complete data strategy starting with foundational systems: CRM, financial platform, and centralized storage.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4 text-center">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-base hover:shadow-[0_0_50px_rgba(0,240,255,0.4)] transition-all duration-300"
                >
                  Get Your Custom Roadmap → Book Strategy Session
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}