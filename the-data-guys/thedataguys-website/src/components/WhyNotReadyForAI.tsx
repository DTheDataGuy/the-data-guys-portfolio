import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { AlertTriangle, Layers, Brain, Building2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const stats = [
  {
    icon: AlertTriangle,
    stat: '87%',
    headline: 'of AI projects never make it to production',
    description: 'Because the data foundation isn\'t there.',
    accentColor: 'from-cyan-400 to-cyan-600',
    accentBorder: 'border-l-cyan-400',
  },
  {
    icon: Layers,
    stat: 'Floor 8',
    headline: 'Most organizations skip straight to Floor 8',
    description: 'Without building Floors 1–7 first.',
    accentColor: 'from-blue-400 to-blue-600',
    accentBorder: 'border-l-blue-400',
  },
  {
    icon: Brain,
    stat: 'Garbage In',
    headline: 'AI amplifies whatever you feed it',
    description: 'Bad data in = bad decisions out, faster.',
    accentColor: 'from-purple-400 to-purple-600',
    accentBorder: 'border-l-purple-400',
  },
  {
    icon: Building2,
    stat: 'Floor by Floor',
    headline: 'The Data House must be built floor by floor',
    description: 'There are no shortcuts to AI readiness.',
    accentColor: 'from-emerald-400 to-emerald-600',
    accentBorder: 'border-l-emerald-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' },
  },
};

function AnimatedCounter({ target, inView }: { target: number; inView: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, target, {
        duration: 2,
        ease: 'easeOut',
      });
      return controls.stop;
    }
  }, [inView, count, target]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [rounded]);

  return <span>{displayValue}%</span>;
}

export default function WhyNotReadyForAI() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      id="why-not-ready"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Dot grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #00f0ff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Floating glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/[0.07] blur-[100px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full bg-blue-500/[0.06] blur-[90px]"
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '50%', right: '5%' }}
        />
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full bg-purple-500/[0.05] blur-[80px]"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '15%', left: '30%' }}
        />
        <motion.div
          className="absolute w-[180px] h-[180px] rounded-full bg-emerald-500/[0.04] blur-[70px]"
          animate={{
            x: [0, -25, 40, 0],
            y: [0, 35, -25, 0],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '30%', right: '25%' }}
        />
      </div>

      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Why Most Organizations Aren&apos;t Ready For AI
            <span className="text-cyan-400">™</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Everyone wants AI. Almost no one has the data infrastructure to
            support it.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
        >
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.headline}
                variants={cardVariants}
                className="group relative rounded-2xl overflow-hidden"
              >
                {/* Card with left accent bar */}
                <div className={`relative rounded-2xl border-l-4 ${item.accentBorder} bg-[#0f172a]/90 backdrop-blur-xl p-8 h-full border border-white/5 overflow-hidden`}>
                  {/* Animated gradient border glow on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.accentColor} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none`} />

                  {/* Diagonal light sweep on hover */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent rotate-[35deg] translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                  </div>

                  {/* Inner glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Icon + Stat */}
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-shadow duration-500">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="text-2xl md:text-3xl font-bold text-cyan-300 font-mono">
                        {index === 0 ? (
                          <AnimatedCounter target={87} inView={isInView} />
                        ) : (
                          item.stat
                        )}
                      </span>
                    </div>

                    {/* Text */}
                    <h3 className="text-lg md:text-xl font-semibold text-white">
                      {item.headline}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-14"
        >
          <div className="relative inline-flex">
            {/* Pulsing glow ring behind button */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 blur-xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <a
              href="#data-house-assessment"
              className="relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
            >
              See Where You Stand
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}