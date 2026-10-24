import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Map, ChevronRight, ChevronLeft, CheckCircle2, Building2, Users2, Target, Wrench, AlertCircle } from 'lucide-react';

interface WizardQuestion {
  id: string;
  question: string;
  type: 'single' | 'multi';
  options: string[];
  icon: React.ReactNode;
}

const questions: WizardQuestion[] = [
  {
    id: 'industry',
    question: 'What industry are you in?',
    type: 'single',
    options: ['Small Business', 'Nonprofit', 'Government', 'Construction', 'Economic Development', 'Chamber', 'Enterprise'],
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'size',
    question: 'How large is your organization?',
    type: 'single',
    options: ['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees'],
    icon: <Users2 className="w-5 h-5" />,
  },
  {
    id: 'goal',
    question: 'What is your primary goal?',
    type: 'single',
    options: ['Grow Revenue', 'Save Time', 'Measure Impact', 'Improve Operations', 'Build a Foundation for AI'],
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'systems',
    question: 'Which systems do you currently use?',
    type: 'multi',
    options: ['CRM', 'Accounting', 'Payroll', 'HR', 'Project Management', 'Forms', 'Website', 'POS', 'Custom Software'],
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    id: 'pain',
    question: 'What is your biggest pain point?',
    type: 'single',
    options: ['Manual reporting', 'Disconnected systems', "Can't measure outcomes", 'No single source of truth', 'Slow decisions'],
    icon: <AlertCircle className="w-5 h-5" />,
  },
];

interface RoadmapPhase {
  name: string;
  timeline: string;
  tasks: string[];
}

function generateRoadmap(answers: Record<string, string | string[]>): RoadmapPhase[] {
  const industry = answers.industry as string;
  const goal = answers.goal as string;
  const pain = answers.pain as string;
  const systems = (answers.systems as string[]) || [];

  // Phase 1: Foundation
  const phase1Tasks: string[] = [];
  if (pain === 'No single source of truth' || pain === 'Disconnected systems') {
    phase1Tasks.push('Audit all current data sources and create a system inventory');
  } else {
    phase1Tasks.push('Map current data flows and identify gaps');
  }
  if (systems.length < 3) {
    phase1Tasks.push('Identify and implement core operational tools');
  } else {
    phase1Tasks.push('Document data ownership and governance policies');
  }
  if (industry === 'Nonprofit' || industry === 'Government') {
    phase1Tasks.push('Define impact metrics and outcome indicators');
  } else {
    phase1Tasks.push('Establish KPIs aligned with business objectives');
  }

  // Phase 2: Integration
  const phase2Tasks: string[] = [];
  if (systems.includes('CRM') && systems.includes('Accounting')) {
    phase2Tasks.push('Connect CRM and financial systems for unified customer view');
  } else if (systems.includes('CRM')) {
    phase2Tasks.push('Integrate CRM with operational workflows');
  } else {
    phase2Tasks.push('Implement central data repository connecting all systems');
  }
  if (pain === 'Manual reporting') {
    phase2Tasks.push('Automate data collection from primary sources');
  } else {
    phase2Tasks.push('Build automated data pipelines between key systems');
  }
  phase2Tasks.push('Implement data quality checks and validation rules');

  // Phase 3: Visibility
  const phase3Tasks: string[] = [];
  if (goal === 'Measure Impact') {
    phase3Tasks.push('Build impact measurement dashboard with outcome tracking');
  } else if (goal === 'Grow Revenue') {
    phase3Tasks.push('Create revenue analytics dashboard with pipeline visibility');
  } else {
    phase3Tasks.push('Deploy operational dashboard with real-time metrics');
  }
  phase3Tasks.push('Set up automated reporting and alert systems');
  if (industry === 'Construction') {
    phase3Tasks.push('Implement project-level cost and timeline tracking');
  } else if (industry === 'Nonprofit') {
    phase3Tasks.push('Build funder reporting with outcome visualization');
  } else {
    phase3Tasks.push('Create executive summary views for leadership');
  }

  // Phase 4: Impact Intelligence
  const phase4Tasks: string[] = [];
  if (goal === 'Build a Foundation for AI') {
    phase4Tasks.push('Deploy AI-powered insights and predictive analytics');
  } else {
    phase4Tasks.push('Implement intelligent recommendations based on data patterns');
  }
  phase4Tasks.push('Build automated decision-support workflows');
  if (industry === 'Enterprise' || (answers.size as string)?.includes('200+')) {
    phase4Tasks.push('Scale data infrastructure for cross-department intelligence');
  } else {
    phase4Tasks.push('Create self-service analytics for team empowerment');
  }

  return [
    { name: 'Data Foundation', timeline: 'Weeks 1-4', tasks: phase1Tasks },
    { name: 'Integration', timeline: 'Weeks 5-8', tasks: phase2Tasks },
    { name: 'Visibility', timeline: 'Weeks 9-12', tasks: phase3Tasks },
    { name: 'Impact Intelligence', timeline: 'Weeks 13-16', tasks: phase4Tasks },
  ];
}

function getExpectedOutcomes(answers: Record<string, string | string[]>): string[] {
  const goal = answers.goal as string;
  const industry = answers.industry as string;

  const outcomes: string[] = [];

  if (goal === 'Grow Revenue') {
    outcomes.push('15-30% increase in revenue visibility and pipeline accuracy');
  } else if (goal === 'Save Time') {
    outcomes.push('20+ hours/week saved on manual reporting and data entry');
  } else if (goal === 'Measure Impact') {
    outcomes.push('Clear outcome metrics proving program effectiveness');
  } else if (goal === 'Improve Operations') {
    outcomes.push('40% reduction in operational bottlenecks and delays');
  } else {
    outcomes.push('Scalable data infrastructure within 16 weeks');
  }

  if (industry === 'Nonprofit') {
    outcomes.push('Automated funder reports with real outcome data');
  } else if (industry === 'Construction') {
    outcomes.push('Real-time project cost tracking across all jobs');
  } else if (industry === 'Government') {
    outcomes.push('Compliance-ready reporting with citizen impact metrics');
  } else {
    outcomes.push('Single source of truth accessible to all stakeholders');
  }

  outcomes.push('Data-driven decision making embedded in daily operations');

  return outcomes;
}

const roadmapPreviewItems = [
  '16-week implementation plan',
  'Recommended first systems to connect',
  'Reporting improvements',
  'Automation opportunities',
  'Expected outcomes',
  'Next-step recommendations',
];

export default function TransformationRoadmap() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showRoadmap, setShowRoadmap] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const handleSingleSelect = (value: string) => {
    const q = questions[currentQuestion];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 250);
    } else {
      setTimeout(() => setShowRoadmap(true), 300);
    }
  };

  const handleMultiToggle = (value: string) => {
    const q = questions[currentQuestion];
    const current = (answers[q.id] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setAnswers((prev) => ({ ...prev, [q.id]: updated }));
  };

  const handleMultiNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowRoadmap(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const resetWizard = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowRoadmap(false);
  };

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const roadmap = showRoadmap ? generateRoadmap(answers) : [];
  const outcomes = showRoadmap ? getExpectedOutcomes(answers) : [];
  const currentQ = questions[currentQuestion];
  const multiSelected = (answers[currentQ?.id] as string[]) || [];

  return (
    <section id="transformation-roadmap" ref={sectionRef} className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.03] blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00f0ff]/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3b82f6]/[0.08] border border-[#3b82f6]/20 text-[#3b82f6] text-xs font-mono tracking-wider uppercase mb-6">
            <Map className="w-3.5 h-3.5" />
            Transformation Roadmap™
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Your Transformation{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#00f0ff] bg-clip-text text-transparent">
              Roadmap™
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Answer 5 questions. Get a phased plan to fix your Data House.
          </p>
        </motion.div>

        {/* Preview Card - visible before wizard starts */}
        {!showRoadmap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 md:p-6 mb-8"
          >
            <p className="text-white font-bold text-sm mb-3">Your roadmap will include:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roadmapPreviewItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wizard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!showRoadmap ? (
              <motion.div
                key={`q-${currentQuestion}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="p-6 md:p-8"
              >
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-[#3b82f6]/60 font-mono">
                      {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#00f0ff]"
                      animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[#3b82f6]">
                    {currentQ.icon}
                  </div>
                  <h3 className="text-white text-xl md:text-2xl font-bold">{currentQ.question}</h3>
                </div>

                {/* Options */}
                {currentQ.type === 'single' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt) => (
                      <motion.button
                        key={opt}
                        whileHover={{ scale: 1.02, borderColor: 'rgba(59,130,246,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSingleSelect(opt)}
                        className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          answers[currentQ.id] === opt
                            ? 'border-[#3b82f6]/50 bg-[#3b82f6]/10 text-[#3b82f6]'
                            : 'border-white/10 bg-white/[0.02] hover:bg-[#3b82f6]/[0.05] text-white'
                        }`}
                      >
                        <span className="font-semibold text-sm">{opt}</span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {currentQ.options.map((opt) => {
                        const selected = multiSelected.includes(opt);
                        return (
                          <motion.button
                            key={opt}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleMultiToggle(opt)}
                            className={`text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                              selected
                                ? 'border-[#3b82f6]/50 bg-[#3b82f6]/10'
                                : 'border-white/10 bg-white/[0.02] hover:bg-[#3b82f6]/[0.05]'
                            }`}
                          >
                            <span className={`font-semibold text-sm ${selected ? 'text-[#3b82f6]' : 'text-white'}`}>
                              {selected && <CheckCircle2 className="w-3.5 h-3.5 inline mr-2" />}
                              {opt}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="text-gray-500 text-xs mb-4">Select all that apply, then click Next.</p>
                  </>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={handleBack}
                    disabled={currentQuestion === 0}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-medium hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  {currentQ.type === 'multi' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleMultiNext}
                      disabled={multiSelected.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#00f0ff] text-[#0a0e1a] font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {currentQuestion < questions.length - 1 ? 'Next' : 'Generate Roadmap'}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="roadmap-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="p-6 md:p-8"
              >
                {/* Roadmap Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 mb-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
                    <span className="text-[#3b82f6] text-sm font-semibold">Your Personalized Roadmap</span>
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-black text-white">16-Week Transformation Plan</h3>
                </div>

                {/* Phases */}
                <div className="space-y-4 mb-8">
                  {roadmap.map((phase, idx) => (
                    <motion.div
                      key={phase.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.15 }}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#00f0ff] flex items-center justify-center text-[#0a0e1a] text-xs font-black">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm">{phase.name}</h4>
                          <span className="text-[#00f0ff]/60 text-xs font-mono">{phase.timeline}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 ml-11">
                        {phase.tasks.map((task, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2 text-gray-300 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]/50 mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                {/* Expected Outcomes */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-5 mb-6"
                >
                  <p className="text-green-400 text-xs font-mono uppercase tracking-wider font-bold mb-3">Expected Outcomes</p>
                  <ul className="space-y-2">
                    {outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={scrollToContact}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#00f0ff] text-[#0a0e1a] font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  >
                    Start My Transformation →
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetWizard}
                    className="px-6 py-3.5 rounded-xl border border-white/10 text-gray-400 font-semibold text-sm hover:border-white/20 hover:text-white transition-all"
                  >
                    Start Over
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