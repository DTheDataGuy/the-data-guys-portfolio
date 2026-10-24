import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const questions = [
  'What needs attention right now?',
  'What is behind schedule?',
  'Which program creates the most impact?',
  'What projects are over budget?',
  'What should we do next?',
  'What happens if we do nothing?',
];

export default function DecisionIntelligence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="decision-intelligence"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#3b82f6]/[0.03] blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Decision Intelligence
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-3 text-white">
            We Don&apos;t Build Dashboards™
          </h2>
          <p className="text-xl md:text-2xl font-bold text-[#00f0ff]">
            We Build Better Decisions™
          </p>
        </motion.div>

        {/* Questions intro */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center text-gray-400 text-base md:text-lg mb-10"
        >
          Questions your leadership should answer in{' '}
          <span className="text-white font-bold">30 seconds</span>:
        </motion.p>

        {/* Question Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {questions.map((question, index) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/[0.05] transition-all duration-300"
            >
              {/* Pulse glow on hover */}
              <div className="absolute inset-0 rounded-xl bg-[#00f0ff]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              <div className="relative flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] text-xs font-mono font-bold">
                  {index + 1}
                </span>
                <p className="text-white text-sm md:text-base font-medium leading-snug pt-0.5">
                  {question}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contrast Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="text-center"
        >
          <div className="rounded-2xl border border-[#00f0ff]/20 bg-[#0a0e1a]/80 backdrop-blur-xl p-7 md:p-10 mb-8 shadow-[0_0_40px_rgba(0,240,255,0.06)]">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              If your team can&apos;t answer these instantly, you don&apos;t have a dashboard problem.
              <br />
              <span className="text-white font-black text-lg md:text-xl mt-2 inline-block">
                You have a Decision Intelligence problem.
              </span>
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow"
          >
            Build Your Decision Layer
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}