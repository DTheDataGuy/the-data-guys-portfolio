import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@metagptx/web-sdk';

type Stage = 'intro' | 'questions' | 'calculating' | 'lead-capture' | 'results';

interface Question {
  category: string;
  question: string;
  options: string[];
}

const questions: Question[] = [
  {
    category: 'Data Collection',
    question: 'How does your organization currently collect and capture data?',
    options: [
      'Mostly manual processes (spreadsheets, paper forms)',
      'Some digital tools but inconsistent across departments',
      'Standardized digital collection with some automation',
      'Fully automated, real-time data capture across all touchpoints',
    ],
  },
  {
    category: 'Centralization',
    question: 'How centralized is your organization\'s data?',
    options: [
      'Data lives in isolated silos with no central access',
      'Some shared drives but no unified data platform',
      'Central data warehouse with most key data sources connected',
      'Unified data lakehouse with real-time integration across all sources',
    ],
  },
  {
    category: 'Data Quality',
    question: 'How would you rate your data quality and consistency?',
    options: [
      'Frequent duplicates, errors, and inconsistencies',
      'Some quality checks but issues still common',
      'Automated quality rules with regular monitoring',
      'Comprehensive data quality framework with near-zero defects',
    ],
  },
  {
    category: 'Governance',
    question: 'What level of data governance does your organization have?',
    options: [
      'No formal governance — anyone can change anything',
      'Basic access controls but no documented policies',
      'Defined roles, policies, and compliance frameworks',
      'Mature governance with automated enforcement and auditing',
    ],
  },
  {
    category: 'Reporting',
    question: 'How does your organization handle reporting and analytics?',
    options: [
      'Ad-hoc reports created manually when requested',
      'Some dashboards but mostly static and outdated',
      'Self-service BI with regularly updated dashboards',
      'Real-time analytics with predictive insights and alerts',
    ],
  },
  {
    category: 'Automation',
    question: 'What is your current level of process automation?',
    options: [
      'Almost everything is done manually',
      'A few automated workflows in isolated areas',
      'Key business processes automated with orchestration',
      'Intelligent automation with ML-driven optimization',
    ],
  },
  {
    category: 'AI Strategy',
    question: 'How defined is your organization\'s AI strategy?',
    options: [
      'No AI strategy — haven\'t considered it yet',
      'Exploring AI possibilities but no concrete plan',
      'Defined AI roadmap with pilot projects underway',
      'AI embedded in operations with clear ROI metrics',
    ],
  },
  {
    category: 'Leadership Alignment',
    question: 'How aligned is leadership on data and AI investment?',
    options: [
      'Leadership doesn\'t see data as a priority',
      'Some interest but competing priorities limit investment',
      'Leadership champions data with dedicated budget',
      'Data-first culture driven from the top with full organizational buy-in',
    ],
  },
];

function getMaturityLevel(score: number): { level: string; color: string; description: string } {
  if (score <= 25) return { level: 'Foundational', color: '#ef4444', description: 'Your organization is in the early stages of data maturity. There\'s significant opportunity to build a strong foundation.' };
  if (score <= 50) return { level: 'Developing', color: '#f59e0b', description: 'You\'ve started the journey but key gaps remain. Focused investment in data infrastructure will unlock major value.' };
  if (score <= 75) return { level: 'Advanced', color: '#06b6d4', description: 'Strong data foundations are in place. You\'re well-positioned to accelerate AI adoption with targeted improvements.' };
  return { level: 'AI-Ready', color: '#00f0ff', description: 'Your data house is in order. You\'re positioned to fully leverage AI for competitive advantage.' };
}

function getRecommendations(answers: number[]): { strengths: string[]; gaps: string[]; nextSteps: string[] } {
  const categories = questions.map((q) => q.category);
  const strengths: string[] = [];
  const gaps: string[] = [];
  const nextSteps: string[] = [];

  answers.forEach((score, i) => {
    if (score >= 3) {
      strengths.push(categories[i]);
    } else {
      gaps.push(categories[i]);
    }
  });

  if (gaps.includes('Data Collection')) nextSteps.push('Implement automated data capture systems');
  if (gaps.includes('Centralization')) nextSteps.push('Build a unified data platform or warehouse');
  if (gaps.includes('Data Quality')) nextSteps.push('Establish data quality monitoring and cleansing pipelines');
  if (gaps.includes('Governance')) nextSteps.push('Define data governance policies and assign data stewards');
  if (gaps.includes('Reporting')) nextSteps.push('Deploy self-service BI tools with real-time dashboards');
  if (gaps.includes('Automation')) nextSteps.push('Identify high-impact processes for automation');
  if (gaps.includes('AI Strategy')) nextSteps.push('Develop a phased AI roadmap with clear success metrics');
  if (gaps.includes('Leadership Alignment')) nextSteps.push('Conduct executive data literacy workshops');

  if (nextSteps.length === 0) nextSteps.push('Continue optimizing and scaling your AI initiatives');

  return { strengths, gaps, nextSteps };
}

const roadmapPhases = [
  { phase: 1, title: 'Foundation', description: 'Data collection & centralization', icon: '🏗️' },
  { phase: 2, title: 'Quality', description: 'Governance & data quality', icon: '✅' },
  { phase: 3, title: 'Intelligence', description: 'Analytics & automation', icon: '📊' },
  { phase: 4, title: 'AI-Ready', description: 'AI strategy & deployment', icon: '🎯' },
];

const client = createClient();

export default function Assessment() {
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalScore = Math.round((answers.reduce((a, b) => a + b, 0) / (questions.length * 4)) * 100);
  const maturity = getMaturityLevel(totalScore);
  const recommendations = getRecommendations(answers);

  const handleAnswer = useCallback((scoreIndex: number) => {
    const newAnswers = [...answers, scoreIndex + 1];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setStage('calculating');
      setTimeout(() => setStage('lead-capture'), 2000);
    }
  }, [answers, currentQuestion]);

  const handleLeadSubmit = async () => {
    if (!leadEmail) return;
    setIsSubmitting(true);
    try {
      await client.entities.assessment_leads.create({
        data: {
          name: leadName,
          email: leadEmail,
          company: leadCompany,
          score: totalScore,
          maturity_level: maturity.level,
          answers: JSON.stringify(answers),
        },
      });
    } catch {
      // Silently continue to results even if submission fails
    }
    setIsSubmitting(false);
    setStage('results');
  };

  const resetAssessment = () => {
    setStage('intro');
    setCurrentQuestion(0);
    setAnswers([]);
    setLeadName('');
    setLeadEmail('');
    setLeadCompany('');
  };

  return (
    <section id="assessment" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <p className="text-cyan-400 mono text-sm tracking-widest uppercase mb-3">
                Interactive Assessment
              </p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Get Your Data House In Order™
                <br />
                <span className="gradient-text">Data Readiness Assessment</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto mb-4 text-lg">
                Discover where your organization stands on the path to data readiness.
                Answer 8 quick questions to receive your personalized Data Readiness Score
                and actionable roadmap.
              </p>
              <p className="text-cyan-300/60 italic mb-8 text-sm max-w-lg mx-auto">
                "Before AI can transform your organization, you must first get your data house in order."
              </p>
              <button
                onClick={() => setStage('questions')}
                className="btn-glow px-8 py-4 rounded-xl text-lg font-bold"
              >
                Start Assessment →
              </button>
              <p className="text-white/30 text-sm mt-4">Takes about 2 minutes</p>
            </motion.div>
          )}

          {stage === 'questions' && (
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-white/50 mb-2">
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>{Math.round(((currentQuestion) / questions.length) * 100)}% Complete</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    initial={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                    animate={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="glass-strong rounded-2xl p-8 md:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs mono">
                    {questions[currentQuestion].category}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-8">
                  {questions[currentQuestion].question}
                </h3>
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="w-full text-left p-4 rounded-xl glass-card border border-white/5 hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center text-sm font-bold text-white/50 group-hover:text-cyan-400 transition-colors">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-white/80 group-hover:text-white transition-colors text-sm md:text-base">
                          {option}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'calculating' && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-3 rounded-full border-2 border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Responses</h3>
              <p className="text-white/50">Calculating your Data Readiness Score...</p>
            </motion.div>
          )}

          {stage === 'lead-capture' && (
            <motion.div
              key="lead-capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto"
            >
              <div className="glass-strong rounded-2xl p-8 md:p-10 text-center">
                {/* Decorative glow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <span className="text-2xl">🔓</span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    Unlock Your Full Data Readiness Report
                  </h3>
                  <p className="text-white/50 text-sm mb-8">
                    Get personalized recommendations, a detailed breakdown of your scores,
                    and a custom roadmap tailored to your organization.
                  </p>

                  <div className="space-y-4 text-left">
                    {/* Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-white text-sm transition-colors placeholder-transparent"
                      />
                      <label className="absolute left-4 top-2 text-[11px] text-cyan-400/70 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/30 peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-cyan-400/70 pointer-events-none">
                        Name
                      </label>
                    </div>

                    {/* Email Field */}
                    <div className="relative">
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-white text-sm transition-colors placeholder-transparent"
                      />
                      <label className="absolute left-4 top-2 text-[11px] text-cyan-400/70 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/30 peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-cyan-400/70 pointer-events-none">
                        Email *
                      </label>
                    </div>

                    {/* Company Field */}
                    <div className="relative">
                      <input
                        type="text"
                        value={leadCompany}
                        onChange={(e) => setLeadCompany(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:outline-none text-white text-sm transition-colors placeholder-transparent"
                      />
                      <label className="absolute left-4 top-2 text-[11px] text-cyan-400/70 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-white/30 peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-cyan-400/70 pointer-events-none">
                        Company
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleLeadSubmit}
                    disabled={!leadEmail || isSubmitting}
                    className="w-full mt-6 btn-glow px-6 py-4 rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      'Unlock My Report →'
                    )}
                  </button>

                  <button
                    onClick={() => setStage('results')}
                    className="mt-4 text-white/30 hover:text-white/60 text-xs transition-colors underline underline-offset-2"
                  >
                    Skip — view basic results
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 print-results"
            >
              {/* Score */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Your Data Readiness Score</h2>
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={maturity.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - totalScore / 100) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{totalScore}</span>
                    <span className="text-white/50 text-sm">/ 100</span>
                  </div>
                </div>
                <span
                  className="inline-block px-4 py-2 rounded-full text-sm font-bold border"
                  style={{ color: maturity.color, borderColor: `${maturity.color}40`, backgroundColor: `${maturity.color}10` }}
                >
                  {maturity.level}
                </span>
                <p className="text-white/60 mt-4 max-w-lg mx-auto">{maturity.description}</p>
              </div>

              {/* Category Breakdown */}
              <div className="glass-strong rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-4">Category Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {questions.map((q, i) => (
                    <div key={q.category} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02]">
                      <div className="flex-1">
                        <p className="text-sm text-white/80">{q.category}</p>
                        <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${((answers[i] || 0) / 4) * 100}%`,
                              backgroundColor: (answers[i] || 0) >= 3 ? '#00f0ff' : (answers[i] || 0) >= 2 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold mono" style={{ color: (answers[i] || 0) >= 3 ? '#00f0ff' : (answers[i] || 0) >= 2 ? '#f59e0b' : '#ef4444' }}>
                        {answers[i] || 0}/4
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                    <span>✓</span> Strengths
                  </h4>
                  {recommendations.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {recommendations.strengths.map((s) => (
                        <li key={s} className="text-white/70 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/40 text-sm">Focus on building your foundation first.</p>
                  )}
                </div>
                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                    <span>△</span> Areas for Growth
                  </h4>
                  {recommendations.gaps.length > 0 ? (
                    <ul className="space-y-2">
                      {recommendations.gaps.map((g) => (
                        <li key={g} className="text-white/70 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/40 text-sm">Excellent — no major gaps identified!</p>
                  )}
                </div>
              </div>

              {/* Recommended Next Steps */}
              <div className="glass-strong rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-4">Recommended Next Steps</h3>
                <div className="space-y-3">
                  {recommendations.nextSteps.map((step, i) => (
                    <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400 font-bold">
                        {i + 1}
                      </span>
                      <span className="text-white/70 text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap */}
              <div className="glass-strong rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-6">Your Path to AI-Ready</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {roadmapPhases.map((phase) => {
                    const phaseScore = totalScore / 25;
                    const isActive = phase.phase <= Math.ceil(phaseScore);
                    const isCurrent = phase.phase === Math.ceil(phaseScore);
                    return (
                      <div
                        key={phase.phase}
                        className={`text-center p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'border-cyan-400/40 bg-cyan-500/10 glow-border'
                            : isActive
                            ? 'border-cyan-500/20 bg-white/[0.02]'
                            : 'border-white/5 bg-white/[0.01] opacity-50'
                        }`}
                      >
                        <div className="text-2xl mb-2">{phase.icon}</div>
                        <p className="text-sm font-bold text-white">{phase.title}</p>
                        <p className="text-xs text-white/50 mt-1">{phase.description}</p>
                        {isCurrent && (
                          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                            You are here
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center space-y-4">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-cyan-400/30 transition-all text-sm"
                >
                  📄 Download Report
                </button>
                <div>
                  <a
                    href="#contact"
                    className="btn-glow inline-block px-8 py-4 rounded-xl text-lg font-bold"
                  >
                    Schedule Your Free Data Strategy Session
                  </a>
                </div>
                <button
                  onClick={resetAssessment}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  ← Retake Assessment
                </button>
              </div>

              {/* Philosophy */}
              <div className="text-center pt-8 border-t border-white/5">
                <p className="text-cyan-300/50 italic text-sm max-w-md mx-auto">
                  "Before AI can transform your organization, you must first get your data house in order."
                </p>
                <p className="text-white/30 text-xs mt-2">, The Data Guys™ Philosophy</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}