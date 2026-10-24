import { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface SelectionOption {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

interface PhaseTask {
  label: string;
  detail: string;
}

interface TransformationPhase {
  id: number;
  title: string;
  weeks: string;
  color: string;
  glowColor: string;
  tasks: PhaseTask[];
  outcome: string;
  outcomeIcon: string;
}

const industryOptions: SelectionOption[] = [
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', description: 'Clinics, hospitals, health systems' },
  { id: 'nonprofit', label: 'Nonprofit', icon: '💚', description: 'Foundations, community orgs' },
  { id: 'finance', label: 'Finance', icon: '🏦', description: 'Banking, insurance, fintech' },
  { id: 'education', label: 'Education', icon: '🎓', description: 'K-12, higher ed, edtech' },
  { id: 'government', label: 'Government', icon: '🏛️', description: 'Local, state, federal agencies' },
  { id: 'retail', label: 'Retail & E-Commerce', icon: '🛍️', description: 'Stores, DTC, marketplaces' },
];

const painPointOptions: SelectionOption[] = [
  { id: 'spreadsheets', label: 'Drowning in Spreadsheets', icon: '📋' },
  { id: 'disconnected', label: 'Disconnected Systems', icon: '🔌' },
  { id: 'reporting-delays', label: 'Reporting Takes Days', icon: '⏳' },
  { id: 'no-visibility', label: 'No Real-Time Visibility', icon: '🙈' },
  { id: 'manual-processes', label: 'Manual Data Entry', icon: '✍️' },
  { id: 'ai-not-ready', label: 'Not Ready for AI', icon: '🧩' },
];

const goalOptions: SelectionOption[] = [
  { id: 'automated-reporting', label: 'Automated Reporting', icon: '⏱️' },
  { id: 'realtime-dashboards', label: 'Real-Time Dashboards', icon: '📊' },
  { id: 'predictive-analytics', label: 'Predictive Analytics', icon: '📈' },
  { id: 'ai-operations', label: 'AI-Powered Operations', icon: '⚙️' },
  { id: 'unified-data', label: 'Single Source of Truth', icon: '🏗️' },
  { id: 'self-service', label: 'Self-Service Analytics', icon: '🎯' },
];

function getTransformationPhases(
  painPoints: Set<string>,
  goals: Set<string>
): TransformationPhase[] {
  const phase1Tasks: PhaseTask[] = [
    { label: 'Inventory all systems', detail: 'Map every tool, database, and spreadsheet in your org' },
    { label: 'Identify data owners', detail: 'Assign accountability for each data source' },
    { label: 'Audit data quality', detail: 'Score completeness, accuracy, and freshness' },
    { label: 'Map current workflows', detail: 'Document how data flows between teams today' },
  ];

  const phase2Tasks: PhaseTask[] = [
    { label: 'Connect CRM to warehouse', detail: 'Pipe customer data into your central hub' },
    { label: 'Connect Finance systems', detail: 'Unify revenue, expenses, and forecasts' },
    { label: 'Connect Forms & intake', detail: 'Automate data capture from all entry points' },
    { label: 'Establish governance rules', detail: 'Set naming conventions, access controls, refresh cadences' },
  ];

  if (painPoints.has('disconnected')) {
    phase2Tasks[0] = { label: 'Integrate disconnected systems', detail: 'Build pipelines between your siloed tools' };
  }

  const phase3Tasks: PhaseTask[] = [
    { label: 'Build executive dashboards', detail: 'Real-time KPIs your leadership actually uses' },
    { label: 'Automate weekly reports', detail: 'Eliminate manual report generation forever' },
    { label: 'Enable forecasting models', detail: 'Predict trends before they happen' },
    { label: 'Train team on self-service', detail: 'Empower your team to answer their own questions' },
  ];

  if (goals.has('ai-operations')) {
    phase3Tasks[2] = { label: 'Deploy AI recommendation engine', detail: 'Let machine learning surface insights automatically' };
  }
  if (goals.has('predictive-analytics')) {
    phase3Tasks[2] = { label: 'Activate predictive models', detail: 'Forecast revenue, churn, and demand with ML' };
  }

  return [
    {
      id: 1,
      title: 'Discovery & Audit',
      weeks: 'Weeks 1–2',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.3)',
      tasks: phase1Tasks,
      outcome: 'Full Visibility Into Your Data Landscape',
      outcomeIcon: '🗺️',
    },
    {
      id: 2,
      title: 'Connect & Unify',
      weeks: 'Weeks 3–5',
      color: '#00f0ff',
      glowColor: 'rgba(0, 240, 255, 0.3)',
      tasks: phase2Tasks,
      outcome: 'Single Source of Truth',
      outcomeIcon: '🎯',
    },
    {
      id: 3,
      title: 'Automate & Predict',
      weeks: 'Weeks 6–8',
      color: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      tasks: phase3Tasks,
      outcome: '10+ Hours/Week Saved, AI-Ready Foundation',
      outcomeIcon: '🎯',
    },
  ];
}

function estimateROI(painPoints: Set<string>, goals: Set<string>): { hours: number; percentage: number; weeks: number } {
  let hours = 10;
  let percentage = 30;

  if (painPoints.has('manual-processes')) hours += 8;
  if (painPoints.has('reporting-delays')) hours += 5;
  if (painPoints.has('spreadsheets')) hours += 6;
  if (painPoints.has('disconnected')) hours += 4;
  if (painPoints.has('no-visibility')) percentage += 10;

  if (goals.has('automated-reporting')) hours += 4;
  if (goals.has('ai-operations')) percentage += 15;
  if (goals.has('predictive-analytics')) percentage += 12;
  if (goals.has('self-service')) hours += 3;

  const weeks = 8;
  return { hours: Math.min(hours, 40), percentage: Math.min(percentage, 85), weeks };
}

export default function RoadmapBuilder() {
  const [industry, setIndustry] = useState<string | null>(null);
  const [painPoints, setPainPoints] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<number>(1);
  const [showPlan, setShowPlan] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const phases = useMemo(() => getTransformationPhases(painPoints, goals), [painPoints, goals]);
  const roi = useMemo(() => estimateROI(painPoints, goals), [painPoints, goals]);

  const togglePainPoint = (id: string) => {
    setPainPoints((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGoal = (id: string) => {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canProceed = () => {
    if (step === 1) return industry !== null;
    if (step === 2) return painPoints.size > 0;
    if (step === 3) return goals.size > 0;
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setShowPlan(true);
    }
  };

  const handleBack = () => {
    if (showPlan) {
      setShowPlan(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="roadmap" ref={sectionRef} className="relative py-28 md:py-36 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00f0ff]/[0.03] blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#a855f7]/[0.02] blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#f59e0b]/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Your Transformation Plan
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-white">
            Show Me My{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Future
            </span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Answer 3 quick questions. Get a phased roadmap with specific weeks, tasks, and expected outcomes.
          </p>
        </motion.div>

        {/* Progress Indicator */}
        {!showPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-12"
          >
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    s === step
                      ? 'bg-[#00f0ff] text-[#0a0e1a] shadow-[0_0_20px_rgba(0,240,255,0.5)]'
                      : s < step
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                      : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-[2px] transition-all duration-500 ${s < step ? 'bg-[#00f0ff]/50' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {!showPlan && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              {/* Step 1: Industry */}
              {step === 1 && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-8">
                    What industry are you in?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {industryOptions.map((option, i) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={() => setIndustry(option.id)}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-md ${
                          industry === option.id
                            ? 'bg-[#00f0ff]/10 border-[#00f0ff]/50 shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                            : 'bg-white/[0.03] border-white/10 hover:border-[#00f0ff]/30 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="text-3xl block mb-2">{option.icon}</span>
                        <span className={`font-semibold block ${industry === option.id ? 'text-[#00f0ff]' : 'text-white'}`}>
                          {option.label}
                        </span>
                        <span className="text-xs text-gray-500 mt-1 block">{option.description}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Pain Points */}
              {step === 2 && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-3">
                    What&apos;s holding you back?
                  </h3>
                  <p className="text-gray-400 text-center text-sm mb-8">Select all that apply</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {painPointOptions.map((option, i) => {
                      const isActive = painPoints.has(option.id);
                      return (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => togglePainPoint(option.id)}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-md ${
                            isActive
                              ? 'bg-red-500/10 border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                              : 'bg-white/[0.03] border-white/10 hover:border-red-400/30 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className="text-3xl block mb-2">{option.icon}</span>
                          <span className={`font-semibold block text-sm ${isActive ? 'text-red-300' : 'text-white'}`}>
                            {option.label}
                          </span>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-red-400/20 border border-red-400 flex items-center justify-center"
                              >
                                <span className="text-red-300 text-xs">✓</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Goals */}
              {step === 3 && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-3">
                    Where do you want to be?
                  </h3>
                  <p className="text-gray-400 text-center text-sm mb-8">Select your top priorities</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {goalOptions.map((option, i) => {
                      const isActive = goals.has(option.id);
                      return (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => toggleGoal(option.id)}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-md ${
                            isActive
                              ? 'bg-[#00f0ff]/10 border-[#00f0ff]/50 shadow-[0_0_25px_rgba(0,240,255,0.2)]'
                              : 'bg-white/[0.03] border-white/10 hover:border-[#00f0ff]/30 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className="text-3xl block mb-2">{option.icon}</span>
                          <span className={`font-semibold block text-sm ${isActive ? 'text-[#00f0ff]' : 'text-white'}`}>
                            {option.label}
                          </span>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center"
                              >
                                <span className="text-[#00f0ff] text-xs">✓</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-center gap-4 mt-10">
                {step > 1 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl border border-white/20 text-gray-300 font-medium hover:border-white/40 hover:text-white transition-all"
                  >
                    ← Back
                  </motion.button>
                )}
                <motion.button
                  whileHover={canProceed() ? { scale: 1.05, boxShadow: '0 0 30px rgba(0,240,255,0.3)' } : {}}
                  whileTap={canProceed() ? { scale: 0.95 } : {}}
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                    canProceed()
                      ? 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] shadow-[0_0_20px_rgba(0,240,255,0.2)] cursor-pointer'
                      : 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  {step === 3 ? 'Generate My Plan →' : 'Next →'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transformation Plan */}
        <AnimatePresence>
          {showPlan && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              {/* Plan Header */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                  <span className="text-[#00f0ff] font-mono text-xs tracking-wider uppercase">Plan Generated</span>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-black text-white mb-2"
                >
                  Your 8-Week Transformation
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400"
                >
                  From chaos to clarity — here&apos;s exactly how we get you there.
                </motion.p>
              </div>

              {/* Back button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleBack}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <span>←</span> Edit selections
              </motion.button>

              {/* Phase Cards */}
              <div className="space-y-8">
                {phases.map((phase, phaseIndex) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + phaseIndex * 0.3 }}
                    className="relative"
                  >
                    {/* Connecting line between phases */}
                    {phaseIndex < phases.length - 1 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 + phaseIndex * 0.3 }}
                        className="absolute left-8 top-full w-[2px] h-8 origin-top"
                        style={{ background: `linear-gradient(to bottom, ${phase.color}40, transparent)` }}
                      />
                    )}

                    {/* Phase Card */}
                    <div
                      className="relative rounded-2xl border backdrop-blur-xl overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                        borderColor: `${phase.color}30`,
                      }}
                    >
                      {/* Glow effect */}
                      <div
                        className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-30"
                        style={{ background: phase.color }}
                      />

                      <div className="relative p-6 md:p-8">
                        {/* Phase Header */}
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            {/* Phase number badge */}
                            <motion.div
                              animate={{
                                boxShadow: [
                                  `0 0 10px ${phase.glowColor}`,
                                  `0 0 25px ${phase.glowColor}`,
                                  `0 0 10px ${phase.glowColor}`,
                                ],
                              }}
                              transition={{ duration: 2.5, repeat: Infinity }}
                              className="w-14 h-14 rounded-xl flex items-center justify-center border"
                              style={{
                                background: `${phase.color}15`,
                                borderColor: `${phase.color}50`,
                              }}
                            >
                              <span className="font-black text-lg" style={{ color: phase.color }}>
                                {phase.id}
                              </span>
                            </motion.div>
                            <div>
                              <h4 className="text-xl md:text-2xl font-bold text-white">{phase.title}</h4>
                              <span
                                className="font-mono text-xs tracking-wider uppercase"
                                style={{ color: phase.color }}
                              >
                                {phase.weeks}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="md:ml-auto flex items-center gap-3">
                            <div className="w-32 h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5, delay: 1 + phaseIndex * 0.4 }}
                                className="h-full rounded-full"
                                style={{ background: `linear-gradient(to right, ${phase.color}80, ${phase.color})` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tasks Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                          {phase.tasks.map((task, taskIndex) => (
                            <motion.div
                              key={taskIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 + phaseIndex * 0.3 + taskIndex * 0.1 }}
                              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                            >
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ borderColor: `${phase.color}60` }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: phase.color }}
                                />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{task.label}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{task.detail}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Expected Outcome */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + phaseIndex * 0.3 }}
                          className="flex items-center gap-3 p-4 rounded-xl border"
                          style={{
                            background: `${phase.color}08`,
                            borderColor: `${phase.color}25`,
                          }}
                        >
                          <span className="text-2xl">{phase.outcomeIcon}</span>
                          <div>
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-0.5">
                              Expected Outcome
                            </p>
                            <p className="font-bold" style={{ color: phase.color }}>
                              {phase.outcome}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ROI Estimate */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
                className="mt-12 p-6 md:p-8 rounded-2xl border border-[#00f0ff]/20 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(168,85,247,0.03) 100%)',
                }}
              >
                <h4 className="text-lg font-bold text-white mb-4 text-center">
                  Estimated Impact After {roi.weeks} Weeks
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.4, type: 'spring' }}
                      className="text-3xl md:text-4xl font-black text-[#00f0ff]"
                    >
                      {roi.hours}+
                    </motion.p>
                    <p className="text-gray-400 text-sm mt-1">Hours Saved / Week</p>
                  </div>
                  <div className="text-center">
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.6, type: 'spring' }}
                      className="text-3xl md:text-4xl font-black text-[#a855f7]"
                    >
                      {roi.percentage}%
                    </motion.p>
                    <p className="text-gray-400 text-sm mt-1">Faster Decision-Making</p>
                  </div>
                  <div className="text-center">
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.8, type: 'spring' }}
                      className="text-3xl md:text-4xl font-black text-[#f59e0b]"
                    >
                      100%
                    </motion.p>
                    <p className="text-gray-400 text-sm mt-1">AI-Ready Foundation</p>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                className="text-center mt-12"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0,240,255,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToContact}
                  className="px-10 py-4 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.2)] hover:shadow-[0_0_50px_rgba(0,240,255,0.4)] transition-all duration-300"
                >
                  Get Your Custom Plan →
                </motion.button>
                <p className="text-gray-500 text-xs mt-4 font-mono max-w-md mx-auto">
                  This is a sample roadmap. Your actual plan will be customized based on a deep-dive into your systems and goals.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}