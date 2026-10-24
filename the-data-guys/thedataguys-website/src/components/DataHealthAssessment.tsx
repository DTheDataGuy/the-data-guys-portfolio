import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Shield, Users, FileText, Layers, Database, HardDrive, BarChart3, TrendingUp, Target, ChevronRight, RotateCcw } from 'lucide-react';
import { useAssessment } from '@/contexts/AssessmentContext';

interface AssessmentArea {
  id: string;
  label: string;
  question: string;
  icon: React.ReactNode;
}

interface FloorData {
  number: number;
  name: string;
  emoji: string;
  description: string;
  symptoms: string[];
  diagnosis: string;
  recommendation: string;
}

interface FloorScore {
  name: string;
  emoji: string;
  score: number;
}

interface RoofScore {
  name: string;
  emoji: string;
  score: number;
}

const floorDiagnosisData: FloorData[] = [
  {
    number: 1,
    name: 'Governance',
    emoji: '🏛',
    description: 'Data policies, standards & compliance',
    symptoms: ['No data policies', 'No clear ownership', 'Inconsistent definitions', 'No audit trail', 'Compliance gaps'],
    diagnosis: 'Your organization lacks formal data policies and standards. Definitions are inconsistent, there\'s no audit trail, and compliance gaps put you at risk.',
    recommendation: 'Establish a data governance framework with clear policies, data dictionaries, ownership matrices, and compliance checkpoints.',
  },
  {
    number: 2,
    name: 'People',
    emoji: '👥',
    description: 'Data roles, skills & culture',
    symptoms: ['No dedicated data roles', 'Staff resistance to tools', 'Tribal knowledge only', 'High turnover in data tasks', 'No training programs'],
    diagnosis: 'You have no dedicated data roles and rely on tribal knowledge. Staff resist new tools, turnover disrupts data continuity, and there are no training programs.',
    recommendation: 'Create dedicated data roles, launch a data literacy program, and document institutional knowledge before it walks out the door.',
  },
  {
    number: 3,
    name: 'Processes',
    emoji: '⚙',
    description: 'Documented workflows & SOPs',
    symptoms: ['Undocumented workflows', 'Manual handoffs', 'Inconsistent data entry', 'No SOPs', 'Bottlenecks in approvals'],
    diagnosis: 'Your workflows are undocumented, handoffs are manual, data entry is inconsistent, and bottlenecks slow everything down.',
    recommendation: 'Map and document core data workflows. Create SOPs for critical processes and eliminate manual handoffs where possible.',
  },
  {
    number: 4,
    name: 'Systems',
    emoji: '🔗',
    description: 'Integrations & single source of truth',
    symptoms: ['Duplicate data entry', "CRM doesn't talk to accounting", 'Excel exports everywhere', 'Staff manually moving information', 'No single source of truth'],
    diagnosis: "Your systems don't talk to each other. Staff manually move data between tools, creating duplicates and errors with no single source of truth.",
    recommendation: 'Audit your tool stack, identify integration gaps, and plan a path to a centralized data architecture.',
  },
  {
    number: 5,
    name: 'Ingestion',
    emoji: '📥',
    description: 'Data intake & collection methods',
    symptoms: ['Paper forms still in use', 'Manual data re-entry', 'No API connections', 'Delayed data availability', 'Missing intake protocols'],
    diagnosis: 'Data enters your organization through paper forms and manual re-entry. There are no API connections, causing delays and missing intake protocols.',
    recommendation: 'Digitize intake processes, establish API connections to key sources, and create standardized intake protocols.',
  },
  {
    number: 6,
    name: 'Storage',
    emoji: '🗄',
    description: 'Data organization & accessibility',
    symptoms: ['Data scattered across drives', 'No central database', 'Duplicate records everywhere', 'No backup strategy', "Can't find historical data"],
    diagnosis: "Data is scattered across drives and tools with no central database. Duplicates are everywhere, there's no backup strategy, and historical data is lost.",
    recommendation: 'Consolidate into a central database, implement deduplication, establish backup policies, and create a data catalog.',
  },
  {
    number: 7,
    name: 'Processing',
    emoji: '⚙',
    description: 'Data quality & transformation',
    symptoms: ['Dirty data in reports', 'No validation rules', 'Manual transformations', 'Inconsistent formats', 'No data quality checks'],
    diagnosis: 'Reports contain dirty data because there are no validation rules. Transformations are manual, formats are inconsistent, and quality is never checked.',
    recommendation: 'Implement data validation rules, automate transformations, standardize formats, and schedule regular quality audits.',
  },
  {
    number: 8,
    name: 'Visualization',
    emoji: '📊',
    description: 'Dashboards & reporting access',
    symptoms: ['No dashboards', 'Reports take days to create', "Leadership can't self-serve", "Metrics aren't standardized", 'No real-time visibility'],
    diagnosis: "You have no dashboards, reports take days, leadership can't self-serve data, metrics aren't standardized, and there's no real-time visibility.",
    recommendation: 'Build automated dashboards connected to live data, standardize KPIs, and enable leadership self-service analytics.',
  },
];

const exampleFloorScores: FloorScore[] = [
  { name: 'Governance', emoji: '🏛', score: 75 },
  { name: 'People', emoji: '👥', score: 55 },
  { name: 'Processes', emoji: '⚙', score: 45 },
  { name: 'Systems', emoji: '🔗', score: 40 },
  { name: 'Ingestion', emoji: '📥', score: 50 },
  { name: 'Storage', emoji: '🗄', score: 60 },
  { name: 'Processing', emoji: '⚙', score: 35 },
  { name: 'Visualization', emoji: '📊', score: 70 },
];

const exampleRoofScores: RoofScore[] = [
  { name: 'Decision Intelligence', emoji: '🧠', score: 45 },
  { name: 'Automation', emoji: '⚡', score: 30 },
  { name: 'AI Readiness', emoji: '🤖', score: 20 },
];

const assessmentAreas: AssessmentArea[] = [
  { id: 'governance', label: 'Governance', question: 'Do you have formal data policies, definitions, and compliance standards documented and enforced?', icon: <Shield className="w-4 h-4" /> },
  { id: 'people', label: 'People', question: 'Do you have dedicated data roles, training programs, and a culture that embraces data tools?', icon: <Users className="w-4 h-4" /> },
  { id: 'processes', label: 'Processes', question: 'Are your data workflows documented, repeatable, and free of manual bottlenecks?', icon: <FileText className="w-4 h-4" /> },
  { id: 'systems', label: 'Systems', question: 'Do your major systems automatically exchange information without manual intervention?', icon: <Layers className="w-4 h-4" /> },
  { id: 'ingestion', label: 'Ingestion', question: 'Is data captured digitally at the source with API connections and standardized intake protocols?', icon: <Database className="w-4 h-4" /> },
  { id: 'storage', label: 'Storage', question: 'Is your data centralized, deduplicated, backed up, and easily accessible?', icon: <HardDrive className="w-4 h-4" /> },
  { id: 'processing', label: 'Processing', question: 'Do you have validation rules, automated transformations, and regular data quality checks?', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'visualization', label: 'Visualization', question: 'Can leadership self-serve real-time dashboards with standardized metrics?', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'automation', label: 'Automation', question: 'Are repetitive data tasks automated with triggers and scheduled pipelines?', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'ai-readiness', label: 'AI Readiness', question: 'Is your data clean, structured, and accessible enough to power AI and machine learning?', icon: <Target className="w-4 h-4" /> },
];

const scaleLabels: Record<number, string> = {
  1: 'Critical',
  2: 'Weak',
  3: 'Developing',
  4: 'Strong',
  5: 'Excellent',
};

const steps = [
  [0, 1, 2],    // Step 1: Governance, People, Processes
  [3, 4, 5],    // Step 2: Systems, Ingestion, Storage
  [6, 7],       // Step 3: Processing, Visualization
  [8, 9],       // Step 4: Automation, AI Readiness
];

function getClassification(score: number): { label: string; color: string } {
  if (score < 40) return { label: 'Foundation Risk', color: 'text-red-400' };
  if (score < 60) return { label: 'Reporting Ready', color: 'text-yellow-400' };
  if (score < 80) return { label: 'Integration Ready', color: 'text-blue-400' };
  return { label: 'Intelligence Ready', color: 'text-green-400' };
}

function getScoreColor(score: number): { text: string; bg: string; glow: string } {
  if (score >= 80) return { text: 'text-green-400', bg: 'bg-green-500', glow: 'shadow-green-500/20' };
  if (score >= 60) return { text: 'text-cyan-400', bg: 'bg-cyan-500', glow: 'shadow-cyan-500/20' };
  if (score >= 40) return { text: 'text-yellow-400', bg: 'bg-yellow-500', glow: 'shadow-yellow-500/20' };
  return { text: 'text-red-400', bg: 'bg-red-500', glow: 'shadow-red-500/20' };
}

function DataHouseHealthScore() {
  const totalScore = 54;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
          Data House Health Score™
        </h3>
        <p className="text-gray-400 text-sm">
          Example assessment for a mid-size nonprofit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">
        {/* Circular Score */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[140px] h-[140px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="text-3xl font-black text-white"
              >
                {totalScore}
              </motion.span>
              <span className="text-xs text-gray-400 font-mono">/100</span>
            </div>
          </div>
          <p className="text-xs text-cyan-400/70 font-mono mt-2 uppercase tracking-wider">
            Overall Score
          </p>
        </div>

        {/* Per-floor bars */}
        <div className="space-y-2">
          {exampleFloorScores.map((floor, idx) => {
            const colors = getScoreColor(floor.score);
            return (
              <motion.div
                key={floor.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.08, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <span className="text-base w-6 text-center">{floor.emoji}</span>
                <span className="text-xs text-gray-300 font-medium w-28 truncate">
                  {floor.name}
                </span>
                <div className="flex-1 h-5 rounded-full bg-white/[0.05] overflow-hidden relative">
                  <motion.div
                    className={`h-full rounded-full ${colors.bg} opacity-80`}
                    initial={{ width: 0 }}
                    animate={{ width: `${floor.score}%` }}
                    transition={{ delay: 0.4 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className={`text-xs font-mono font-bold w-8 text-right ${colors.text}`}>
                  {floor.score}
                </span>
              </motion.div>
            );
          })}

          {/* Roof Score Section */}
          <div className="pt-3 mt-2 border-t border-white/[0.06]">
            <p className="text-[10px] font-mono text-[#00f0ff]/50 uppercase tracking-wider mb-2 pl-9">
              🏠 Roof Score
            </p>
            {exampleRoofScores.map((item, idx) => {
              const colors = getScoreColor(item.score);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + idx * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 mb-1.5"
                >
                  <span className="text-base w-6 text-center">{item.emoji}</span>
                  <span className="text-xs text-gray-300 font-medium w-28 truncate">
                    {item.name}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-white/[0.05] overflow-hidden relative">
                    <motion.div
                      className={`h-full rounded-full ${colors.bg} opacity-80`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ delay: 1.0 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold w-8 text-right ${colors.text}`}>
                    {item.score}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-white/[0.06]">
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500" /> 80-100 Strong
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500" /> 60-79 Developing
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
          <span className="w-2 h-2 rounded-full bg-yellow-500" /> 40-59 Needs Work
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
          <span className="w-2 h-2 rounded-full bg-red-500" /> 0-39 Critical
        </span>
      </div>
    </motion.div>
  );
}

function HouseVisualization({ scores }: { scores: Record<string, number> }) {
  const floors = [
    { areas: ['automation', 'ai-readiness'], label: 'Roof (AI)', position: 'top' },
    { areas: ['visualization'], label: 'Visualization', position: 'upper-top' },
    { areas: ['processing'], label: 'Processing', position: 'upper' },
    { areas: ['storage'], label: 'Storage', position: 'mid-upper' },
    { areas: ['ingestion'], label: 'Ingestion', position: 'middle' },
    { areas: ['systems'], label: 'Systems', position: 'mid-lower' },
    { areas: ['processes'], label: 'Processes', position: 'lower' },
    { areas: ['people'], label: 'People', position: 'base-upper' },
    { areas: ['governance'], label: 'Governance', position: 'base' },
  ];

  return (
    <div className="relative w-full max-w-[240px] mx-auto">
      {/* Roof */}
      <div className="flex justify-center mb-1">
        <div className="w-0 h-0 border-l-[120px] border-r-[120px] border-b-[40px] border-l-transparent border-r-transparent border-b-[#00f0ff]/20" />
      </div>
      {/* Floors */}
      <div className="space-y-1">
        {floors.map((floor, idx) => {
          const avgScore = floor.areas.reduce((sum, a) => sum + (scores[a] || 1), 0) / floor.areas.length;
          const intensity = avgScore / 5;
          return (
            <motion.div
              key={floor.label}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
              className="relative h-8 rounded-sm border border-white/10 flex items-center justify-center overflow-hidden"
              style={{
                background: `rgba(0, 240, 255, ${intensity * 0.3})`,
                boxShadow: intensity > 0.6 ? `0 0 ${intensity * 20}px rgba(0, 240, 255, ${intensity * 0.3})` : 'none',
              }}
            >
              <span className="text-[9px] font-mono text-white/70 uppercase tracking-wider z-10">
                {floor.label}
              </span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/10 to-transparent"
                style={{ opacity: intensity }}
              />
            </motion.div>
          );
        })}
      </div>
      {/* Ground */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent mt-1" />
    </div>
  );
}

function FloorDiagnosis({ selectedFloor, onSelectFloor }: { selectedFloor: number | null; onSelectFloor: (floor: number) => void }) {
  return (
    <div className="mb-10">
      <div className="text-center mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          Which Floor Needs The Most Work?
        </h3>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          Every data problem traces back to a specific floor of your Data House. Select the area where you feel the most pain.
        </p>
      </div>

      {/* Floor Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {floorDiagnosisData.map((floor) => {
          const isSelected = selectedFloor === floor.number;
          return (
            <motion.button
              key={floor.number}
              onClick={() => onSelectFloor(floor.number)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 rounded-xl border text-left transition-all duration-300 backdrop-blur-md ${
                isSelected
                  ? 'border-[#00f0ff]/60 bg-[#00f0ff]/[0.08] shadow-[0_0_25px_rgba(0,240,255,0.15)]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="floor-glow"
                  className="absolute inset-0 rounded-xl border-2 border-[#00f0ff]/40"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <span className="text-2xl mb-2 block">{floor.emoji}</span>
                <p className="text-[10px] font-mono text-[#00f0ff]/60 uppercase tracking-wider mb-0.5">
                  Floor {floor.number}
                </p>
                <p className="text-white text-sm font-semibold leading-tight">{floor.name}</p>
                <p className="text-gray-400 text-[11px] mt-1">{floor.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Diagnosis Panel */}
      <AnimatePresence mode="wait">
        {selectedFloor !== null && (
          <motion.div
            key={`diagnosis-${selectedFloor}`}
            initial={{ opacity: 0, y: 15, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.04] backdrop-blur-xl p-5 md:p-6">
              {(() => {
                const floor = floorDiagnosisData.find((f) => f.number === selectedFloor);
                if (!floor) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{floor.emoji}</span>
                      <div>
                        <p className="text-[#00f0ff] text-sm font-bold mb-1">
                          You may have a Floor {floor.number} ({floor.name}) problem.
                        </p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {floor.diagnosis}
                        </p>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="pl-12">
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                        Common symptoms
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {floor.symptoms.map((symptom, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] font-medium"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pl-12">
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <ChevronRight className="w-4 h-4 text-[#00f0ff] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-mono text-[#00f0ff]/70 uppercase tracking-wider mb-1">
                            Recommended next step
                          </p>
                          <p className="text-gray-200 text-sm">{floor.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatingSlider({ value, onChange, areaLabel }: { value: number; onChange: (v: number) => void; areaLabel: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono">{scaleLabels[value]}</span>
        <span className="text-xs text-[#00f0ff] font-mono font-bold">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={`${areaLabel}-${n}`}
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-lg border transition-all duration-200 text-xs font-bold ${
              n <= value
                ? 'bg-[#00f0ff]/20 border-[#00f0ff]/50 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

const FLOOR_RECOMMENDATIONS: Record<string, { floor: string; emoji: string; bullets: string[] }> = {
  governance: {
    floor: 'Governance',
    emoji: '🏛',
    bullets: [
      'Create a data ownership matrix — define who owns each KPI.',
      'Establish naming standards and data dictionaries.',
      'Document access controls, compliance requirements, and audit trails.',
    ],
  },
  people: {
    floor: 'People',
    emoji: '👥',
    bullets: [
      'Create dedicated data roles and identify champions in each department.',
      'Launch a data literacy and training program for all staff.',
      'Document tribal knowledge before it walks out the door.',
    ],
  },
  processes: {
    floor: 'Processes',
    emoji: '⚙',
    bullets: [
      'Map your current data workflows end-to-end.',
      'Create SOPs for recurring reports and data tasks.',
      'Eliminate manual handoffs and approval bottlenecks.',
    ],
  },
  systems: {
    floor: 'Systems',
    emoji: '🔗',
    bullets: [
      'Audit your current tool stack for redundancy and gaps.',
      'Identify integration points between CRM, accounting, and operations.',
      'Plan a path to a single source of truth.',
    ],
  },
  ingestion: {
    floor: 'Ingestion',
    emoji: '📥',
    bullets: [
      'Digitize all paper-based intake processes.',
      'Establish API connections to key data sources.',
      'Create standardized intake protocols with validation at point of entry.',
    ],
  },
  storage: {
    floor: 'Storage',
    emoji: '🗄',
    bullets: [
      'Consolidate scattered data into a central database.',
      'Implement deduplication and proper backup strategies.',
      'Define retention rules and create a searchable data catalog.',
    ],
  },
  processing: {
    floor: 'Processing',
    emoji: '⚙',
    bullets: [
      'Implement data validation rules at every transformation step.',
      'Automate manual data transformations and format standardization.',
      'Schedule regular data quality audits and anomaly detection.',
    ],
  },
  visualization: {
    floor: 'Visualization',
    emoji: '📊',
    bullets: [
      'Define your top 10 KPIs that drive decisions.',
      'Build automated dashboards connected to live data sources.',
      'Enable leadership self-service with standardized metrics.',
    ],
  },
  automation: {
    floor: 'Automation',
    emoji: '⚡',
    bullets: [
      'Identify your top 3 repetitive data tasks for automation.',
      'Set up automated alerts for exceptions and anomalies.',
      'Create scheduled data refreshes and pipeline triggers.',
    ],
  },
  'ai-readiness': {
    floor: 'AI Readiness',
    emoji: '🤖',
    bullets: [
      'Assess data quality and completeness for ML model training.',
      'Ensure data is structured, labeled, and accessible via APIs.',
      'Build feedback loops to measure AI model outcomes and iterate.',
    ],
  },
};

function PersonalizedRecommendations({ scores }: { scores: Record<string, number> }) {
  const LOW_THRESHOLD = 3; // 3 or below on 1-5 scale
  const lowAreas = assessmentAreas.filter((a) => (scores[a.id] || 1) <= LOW_THRESHOLD);
  const allStrong = lowAreas.length === 0;

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
      className="rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] backdrop-blur-xl p-5 md:p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <ChevronRight className="w-4 h-4 text-[#00f0ff]" />
        <p className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider font-bold">
          Personalized Recommendations
        </p>
      </div>

      {allStrong ? (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-white font-semibold text-sm mb-1">
            Your Data House is strong!
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Let&apos;s talk about advanced analytics and AI — you&apos;re ready for the next level.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToContact}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          >
            Book Strategy Session →
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {lowAreas.map((area) => {
            const rec = FLOOR_RECOMMENDATIONS[area.id];
            if (!rec) return null;
            const score = scores[area.id] || 1;
            const scoreColor = score <= 1 ? 'text-red-400' : score <= 2 ? 'text-orange-400' : 'text-yellow-400';
            return (
              <div
                key={area.id}
                className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{rec.emoji}</span>
                    <span className="text-white font-semibold text-sm">{rec.floor}</span>
                  </span>
                  <span className={`text-xs font-mono font-bold ${scoreColor}`}>
                    {score}/5
                  </span>
                </div>
                <ul className="space-y-1.5 pl-7">
                  {rec.bullets.map((bullet, i) => (
                    <li key={i} className="text-gray-300 text-xs leading-relaxed flex items-start gap-2">
                      <span className="text-[#00f0ff] mt-0.5 shrink-0">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* CTA */}
          <div className="pt-3 text-center border-t border-white/[0.06]">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToContact}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              Get Your Full Roadmap → Book Strategy Session
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function DataHealthAssessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const { saveFloorProgress, isLoggedIn } = useAssessment();

  const handleScoreChange = (areaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [areaId]: value }));
  };

  const canProceed = steps[currentStep].every((idx) => scores[assessmentAreas[idx].id] !== undefined);

  // Save progress to backend when results are shown
  useEffect(() => {
    if (!showResults || !isLoggedIn) return;

    const floorMapping: { areaIds: string[]; floorNumber: number; floorName: string }[] = [
      { areaIds: ['governance'], floorNumber: 1, floorName: 'Governance' },
      { areaIds: ['people'], floorNumber: 2, floorName: 'People' },
      { areaIds: ['processes'], floorNumber: 3, floorName: 'Processes' },
      { areaIds: ['systems'], floorNumber: 4, floorName: 'Systems' },
      { areaIds: ['ingestion'], floorNumber: 5, floorName: 'Ingestion' },
      { areaIds: ['storage'], floorNumber: 6, floorName: 'Storage' },
      { areaIds: ['processing'], floorNumber: 7, floorName: 'Processing' },
      { areaIds: ['visualization'], floorNumber: 8, floorName: 'Visualization' },
      { areaIds: ['automation', 'ai-readiness'], floorNumber: 9, floorName: 'Roof' },
    ];

    floorMapping.forEach(({ areaIds, floorNumber, floorName }) => {
      const avgScore = areaIds.reduce((sum, id) => sum + (scores[id] || 1), 0) / areaIds.length;
      const normalizedScore = Math.round(avgScore * 20); // Convert 1-5 to 0-100
      saveFloorProgress(floorNumber, floorName, normalizedScore, true);
    });
  }, [showResults, isLoggedIn, scores, saveFloorProgress]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setScores({});
    setShowResults(false);
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Calculate results
  const allScores = assessmentAreas.map((a) => scores[a.id] || 1);
  const avgRaw = allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const healthScore = Math.round(avgRaw * 20);
  const classification = getClassification(healthScore);

  // Sub-scores by area group (Data House floors + Roof)
  const subScores = [
    { label: 'Governance & People', areas: ['governance', 'people'] },
    { label: 'Processes & Systems', areas: ['processes', 'systems'] },
    { label: 'Ingestion & Storage', areas: ['ingestion', 'storage'] },
    { label: 'Processing & Visualization', areas: ['processing', 'visualization'] },
    { label: 'Roof (AI & Automation)', areas: ['automation', 'ai-readiness'] },
  ];

  // Priority repairs (3 weakest)
  const sortedAreas = [...assessmentAreas]
    .map((a) => ({ ...a, score: scores[a.id] || 1 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <section id="data-house-assessment" ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.02] blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <Shield className="w-3.5 h-3.5" />
            Data House Assessment™
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            How Strong Is Your{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Data House?
            </span>
          </h2>
          <p className="text-base md:text-lg max-w-xl mx-auto px-4 md:px-0 text-center text-gray-400">
            Most organizations try to build dashboards, automation, and AI on a weak foundation. Find out where your foundation is strong, and where it needs work.
          </p>
        </motion.div>

        {/* Data House Health Score™ */}
        <DataHouseHealthScore />

        {/* Floor Diagnosis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <FloorDiagnosis selectedFloor={selectedFloor} onSelectFloor={setSelectedFloor} />
        </motion.div>

        {/* Divider */}
        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#0a0e1a] px-4 text-xs font-mono text-gray-400 uppercase tracking-wider">
              Full Assessment
            </span>
          </div>
        </div>

        {/* Assessment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8"
              >
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                    <span className="text-xs text-[#00f0ff]/60 font-mono">
                      {Math.round(((currentStep + 1) / steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6]"
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Scale explanation */}
                <div className="mb-6 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-gray-400 text-xs font-mono text-center">
                    <span className="text-gray-400">1</span> = Not started &nbsp;|&nbsp; <span className="text-gray-400">2</span> = Informal &nbsp;|&nbsp; <span className="text-gray-400">3</span> = Some structure &nbsp;|&nbsp; <span className="text-gray-400">4</span> = Mostly consistent &nbsp;|&nbsp; <span className="text-gray-400">5</span> = Documented and trusted
                  </p>
                </div>

                {/* Questions for this step */}
                <div className="space-y-6">
                  {steps[currentStep].map((areaIdx) => {
                    const area = assessmentAreas[areaIdx];
                    return (
                      <div key={area.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff]">
                            {area.icon}
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-sm">{area.label}</h4>
                            <p className="text-gray-400 text-xs">{area.question}</p>
                          </div>
                        </div>
                        <RatingSlider
                          value={scores[area.id] || 0}
                          onChange={(v) => handleScoreChange(area.id, v)}
                          areaLabel={area.id}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={canProceed ? { scale: 1.02 } : {}}
                    whileTap={canProceed ? { scale: 0.98 } : {}}
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  >
                    {currentStep < steps.length - 1 ? 'Continue My Assessment' : 'See Results'}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="p-6 md:p-8"
              >
                {/* Results Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 mb-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                    <span className="text-[#00f0ff] text-sm font-semibold">Your Data House Report</span>
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-black text-white">Your Data House Health Score™</h3>
                </div>

                {/* Score + Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] p-5 text-center"
                  >
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Health Score</p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="text-4xl font-black text-[#00f0ff]"
                    >
                      {healthScore}
                      <span className="text-lg text-[#00f0ff]/60">/100</span>
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/[0.03] p-5 text-center"
                  >
                    <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Classification</p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring' }}
                      className={`text-2xl font-black ${classification.color}`}
                    >
                      {classification.label}
                    </motion.p>
                  </motion.div>
                </div>

                {/* Sub-scores */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5 mb-6"
                >
                  <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-3">Sub-Scores by Floor</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subScores.map((group) => {
                      const avg = group.areas.reduce((sum, a) => sum + (scores[a] || 1), 0) / group.areas.length;
                      const pct = Math.round(avg * 20);
                      return (
                        <div key={group.label} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-gray-300 text-xs font-medium">{group.label}</span>
                          <span className={`text-xs font-mono font-bold ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-blue-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {pct}/100
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* House Visualization */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 mb-6"
                >
                  <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-4 text-center">Your Data House</p>
                  <HouseVisualization scores={scores} />
                </motion.div>

                {/* Priority Repairs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="rounded-xl border border-orange-500/20 bg-orange-500/[0.03] p-5 mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-orange-400" />
                    <p className="text-orange-400 text-xs font-mono uppercase tracking-wider font-bold">Priority Repairs</p>
                  </div>
                  <div className="space-y-2">
                    {sortedAreas.map((area, i) => (
                      <div key={area.id} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm flex items-center gap-2">
                          <span className="text-orange-400 font-bold">{i + 1}.</span>
                          <span className="text-[#00f0ff]/60">{area.icon}</span>
                          {area.label}
                        </span>
                        <span className="text-orange-400 text-xs font-mono font-bold">{area.score}/5</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Personalized Recommendations */}
                <PersonalizedRecommendations scores={scores} />

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,240,255,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToContact}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                  >
                    Get My 30-Day Fix Plan →
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetAssessment}
                    className="px-6 py-3.5 rounded-xl border border-white/10 text-gray-400 font-semibold text-sm hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retake Assessment
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}