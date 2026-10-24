import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface PainPoint {
  pain: string;
  solution: string;
  icon: string;
}

const painPoints: PainPoint[] = [
  {
    pain: 'Reporting Takes Too Long',
    solution: 'We automate it.',
    icon: '⏱',
  },
  {
    pain: "Nobody Trusts The Numbers",
    solution: 'We establish a single source of truth.',
    icon: '🔢',
  },
  {
    pain: "Systems Don't Talk",
    solution: 'We connect them.',
    icon: '🔌',
  },
  {
    pain: "Impact Can't Be Proven",
    solution: 'We measure outcomes.',
    icon: '📊',
  },
  {
    pain: 'AI Feels Overwhelming',
    solution: 'We prepare the foundation.',
    icon: '🧩',
  },
];

export default function WhyClientsHireUs() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="why-clients-hire-us"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.02] blur-[130px]" />
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
            Pain Points
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Why Organizations Hire Us
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            We solve the problems that keep leaders up at night.
          </p>
        </motion.div>

        {/* Pain Point Cards */}
        <div className="space-y-4">
          {painPoints.map((item, index) => (
            <motion.div
              key={item.pain}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              whileHover={{ x: 8 }}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 md:p-6 hover:border-[#00f0ff]/25 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center text-xl group-hover:bg-[#00f0ff]/[0.08] group-hover:border-[#00f0ff]/20 transition-all duration-300">
                  {item.icon}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="text-white/70 font-semibold text-base md:text-lg group-hover:text-white/90 transition-colors">
                    &ldquo;{item.pain}&rdquo;
                  </p>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#00f0ff] hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-[#00f0ff] font-bold text-sm md:text-base">
                      {item.solution}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300"
          >
            Tell Us Your Challenge
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}