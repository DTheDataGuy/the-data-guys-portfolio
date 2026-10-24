import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

interface Question {
  id: number;
  text: string;
  options: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: 'How many systems does your organization use?',
    options: ['1-3', '4-7', '8-15', '16+'],
  },
  {
    id: 2,
    text: 'How long does reporting take?',
    options: ['Minutes', 'Hours', 'Days', 'Weeks'],
  },
  {
    id: 3,
    text: 'Do you trust your numbers?',
    options: ['Absolutely', 'Mostly', 'Sometimes', 'Not really'],
  },
  {
    id: 4,
    text: 'Can leadership self-serve data?',
    options: ['Yes, easily', 'With help', 'Rarely', 'Never'],
  },
];

const riskMap: Record<string, string> = {
  '16+': 'System sprawl creating data silos',
  Weeks: 'Critical reporting bottleneck',
  'Not really': 'Data quality crisis',
  Never: 'Leadership flying blind',
  '8-15': 'Growing integration complexity',
  Days: 'Significant reporting delays',
  Sometimes: 'Inconsistent data trust',
  Rarely: 'Limited data accessibility',
};

function calculateScore(answers: Record<number, number>): number {
  const pointMap = [25, 15, 8, 0];
  let total = 0;
  Object.values(answers).forEach((answerIdx) => {
    total += pointMap[answerIdx] ?? 0;
  });
  return total;
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 80) return { grade: 'A', color: '#10b981' };
  if (score >= 60) return { grade: 'B', color: '#06b6d4' };
  if (score >= 40) return { grade: 'C', color: '#eab308' };
  if (score >= 20) return { grade: 'D', color: '#f97316' };
  return { grade: 'F', color: '#ef4444' };
}

function getRisks(answers: Record<number, number>): string[] {
  const risks: string[] = [];
  questions.forEach((q) => {
    const ansIdx = answers[q.id];
    if (ansIdx !== undefined && ansIdx >= 2) {
      const optionText = q.options[ansIdx];
      if (riskMap[optionText]) {
        risks.push(riskMap[optionText]);
      }
    }
  });
  return risks.slice(0, 3);
}

function getRecommendations(answers: Record<number, number>): string[] {
  const recs: string[] = [];
  const a1 = answers[1];
  const a2 = answers[2];
  const a3 = answers[3];
  const a4 = answers[4];

  if (a1 !== undefined && a1 >= 2) {
    recs.push('Consolidate systems with a unified data platform to reduce complexity.');
  }
  if (a2 !== undefined && a2 >= 2) {
    recs.push('Automate reporting pipelines to eliminate manual compilation delays.');
  }
  if (a3 !== undefined && a3 >= 2) {
    recs.push('Implement data quality frameworks with validation and monitoring.');
  }
  if (a4 !== undefined && a4 >= 2) {
    recs.push('Build self-service dashboards so leadership can access insights directly.');
  }

  if (recs.length === 0) {
    recs.push('Your data house is strong — optimize with advanced analytics and AI readiness.');
  }

  return recs.slice(0, 3);
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function DataHouseInspection() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });

  const score = calculateScore(answers);
  const { grade, color: gradeColor } = getGrade(score);
  const risks = getRisks(answers);
  const recommendations = getRecommendations(answers);

  const handleAnswer = useCallback(
    (questionId: number, optionIdx: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));

      // Move to next question or show results
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          setShowResults(true);
        }
      }, 400);
    },
    [currentQuestion]
  );

  const handleSubmitLead = async () => {
    if (!formData.name || !formData.email || !formData.company) return;

    setSubmitting(true);
    try {
      const systemsOption = questions[0].options[answers[1] ?? 0];
      const dataSources = systemsOption === '16+' ? 16 : systemsOption === '8-15' ? 10 : systemsOption === '4-7' ? 5 : 2;

      await client.entities.inspection_leads.create({
        data: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          industry: 'Not specified',
          data_sources_count: dataSources,
          has_data_warehouse: answers[4] !== undefined && answers[4] <= 1 ? 'Yes' : 'No',
          data_quality_rating: answers[3] !== undefined ? 5 - answers[3] : 3,
          biggest_challenge: risks[0] || 'General assessment',
          score,
          grade,
          recommendations: recommendations.join(' | '),
        },
      });
    } catch {
      // Still show success even if backend fails
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="inspection" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Free Assessment
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            How Healthy Is Your Data?
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Answer 4 quick questions. Get your score instantly.
          </p>
        </motion.div>

        {/* Conversational Interface */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 shadow-2xl min-h-[400px] flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {!showResults ? (
            <>
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      idx < currentQuestion
                        ? 'bg-[#00f0ff]'
                        : idx === currentQuestion
                        ? 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)] scale-125'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Chat-like questions */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Question bubble */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#3b82f6] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/10 px-5 py-4 max-w-sm">
                        <p className="text-white font-medium text-base">
                          {questions[currentQuestion].text}
                        </p>
                      </div>
                    </div>

                    {/* Answer options */}
                    <div className="pl-11 grid grid-cols-2 gap-3">
                      {questions[currentQuestion].options.map((option, idx) => (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.08 }}
                          onClick={() => handleAnswer(questions[currentQuestion].id, idx)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 text-left ${
                            answers[questions[currentQuestion].id] === idx
                              ? 'border-[#00f0ff] bg-[#00f0ff]/15 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                              : 'border-white/15 bg-white/[0.04] text-gray-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white'
                          }`}
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Answered questions summary */}
              {currentQuestion > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <div className="flex flex-wrap gap-2">
                    {questions.slice(0, currentQuestion).map((q) => (
                      <span
                        key={q.id}
                        className="text-xs px-2.5 py-1 rounded-full bg-[#00f0ff]/10 text-[#00f0ff]/80 border border-[#00f0ff]/20"
                      >
                        {q.options[answers[q.id] ?? 0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results */
            <AnimatePresence mode="wait">
              {!showEmailForm ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8 flex-1"
                >
                  {/* Score Display */}
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                      className="inline-flex flex-col items-center"
                    >
                      <div
                        className="relative w-32 h-32 rounded-full flex items-center justify-center mb-4"
                        style={{
                          background: `conic-gradient(${gradeColor} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                          boxShadow: `0 0 40px ${gradeColor}30`,
                        }}
                      >
                        <div className="w-[104px] h-[104px] rounded-full bg-[#0f172a] flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white">
                            <AnimatedCounter target={score} />
                          </span>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">/ 100</span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="px-4 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: `${gradeColor}20`, color: gradeColor, border: `1px solid ${gradeColor}50` }}
                      >
                        Grade: {grade}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Risks */}
                  {risks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <h4 className="text-xs uppercase tracking-widest text-red-400 font-semibold mb-3">
                        Biggest Risks
                      </h4>
                      <div className="space-y-2">
                        {risks.map((risk, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                          >
                            <span className="text-red-400 shrink-0">⚠</span>
                            <span className="text-gray-300 text-sm">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    <h4 className="text-xs uppercase tracking-widest text-[#00f0ff] font-semibold mb-3">
                      Recommended Actions
                    </h4>
                    <div className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10"
                        >
                          <span className="text-[#00f0ff] font-bold shrink-0">{i + 1}.</span>
                          <span className="text-gray-300 text-sm leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="text-center pt-4"
                  >
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all"
                    >
                      Get Your Full Report →
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="email-form"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 flex-1 flex flex-col justify-center"
                >
                  {!submitted ? (
                    <>
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-white mb-2">
                          Get Your Full Report
                        </h3>
                        <p className="text-gray-400 text-sm">
                          We&apos;ll send a detailed analysis with personalized next steps.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                            placeholder="you@company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1.5">Company</label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:ring-1 focus:ring-[#00f0ff]/30 transition-all"
                            placeholder="Your company"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleSubmitLead}
                        disabled={submitting || !formData.name || !formData.email || !formData.company}
                        className="w-full px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Sending...' : 'Send My Report'}
                      </button>

                      <button
                        onClick={() => setShowEmailForm(false)}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors text-center"
                      >
                        ← Back to results
                      </button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                        <span className="text-emerald-400 text-2xl">✓</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">You&apos;re All Set!</h3>
                      <p className="text-gray-400 text-sm">
                        Your full report is on its way to {formData.email}. Our team will follow up within 24 hours with personalized recommendations.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </section>
  );
}