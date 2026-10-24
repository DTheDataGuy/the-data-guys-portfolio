import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Target, ClipboardList, Clock } from 'lucide-react';

interface OutcomeTile {
  id: string;
  icon: React.ReactNode;
  before: string;
  after: string;
  label: string;
}

const outcomeTiles: OutcomeTile[] = [
  {
    id: 'decisions',
    icon: <Clock className="w-10 h-10" />,
    before: 'Weeks',
    after: 'Minutes',
    label: 'Faster Decisions',
  },
  {
    id: 'forecasts',
    icon: <Target className="w-10 h-10" />,
    before: 'Guessing',
    after: 'Predicting',
    label: 'Better Forecasts',
  },
  {
    id: 'manual',
    icon: <ClipboardList className="w-10 h-10" />,
    before: '40 Hours',
    after: '4 Hours',
    label: 'Less Manual Work',
  },
  {
    id: 'ai',
    icon: <TrendingUp className="w-10 h-10" />,
    before: 'Failed Experiments',
    after: 'Automated Intelligence',
    label: 'AI That Actually Works',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const tileVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

function OutcomeTileCard({ tile }: { tile: OutcomeTile }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      variants={tileVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative rounded-2xl p-8 bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-[#00f0ff]/30 hover:shadow-[0_0_40px_rgba(0,240,255,0.08)] transition-all duration-300 overflow-hidden group"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Particle dots */}
      <div className="absolute top-4 right-4 w-20 h-20 pointer-events-none">
        <motion.div
          animate={isInView ? { opacity: [0.2, 0.5, 0.2] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00f0ff]/40"
        />
        <motion.div
          animate={isInView ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-6 right-8 w-1 h-1 rounded-full bg-[#3b82f6]/40"
        />
        <motion.div
          animate={isInView ? { opacity: [0.2, 0.4, 0.2] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute top-10 right-3 w-1.5 h-1.5 rounded-full bg-[#00f0ff]/30"
        />
      </div>

      {/* Icon */}
      <div className="text-[#00f0ff]/70 mb-6 group-hover:text-[#00f0ff] transition-colors duration-300">
        {tile.icon}
      </div>

      {/* Label */}
      <h3 className="text-white font-bold text-lg mb-6">{tile.label}</h3>

      {/* Transformation */}
      <div className="relative">
        {/* Before */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={isInView ? { opacity: 0.4 } : { opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative"
        >
          <span className="text-gray-500 text-2xl font-bold line-through decoration-red-400/50 decoration-2">
            {tile.before}
          </span>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="my-3 h-px w-16 bg-gradient-to-r from-red-400/40 to-[#00f0ff]/60 origin-left"
        />

        {/* After */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="relative"
        >
          <span className="text-[#00f0ff] text-2xl font-black">
            {tile.after}
          </span>
          {/* Glow behind text */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.4 } : {}}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="absolute inset-0 text-2xl font-black text-[#00f0ff] blur-[8px] pointer-events-none"
            aria-hidden="true"
          >
            {tile.after}
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function WhatWeDo() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0a0e1a] to-[#0f172a]" />
      <div className="absolute inset-0 gradient-mesh-bg opacity-40" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            What Happens When Your Data{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Works?
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The transformation our clients experience.
          </p>
        </motion.div>

        {/* Outcome Tiles 2x2 Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {outcomeTiles.map((tile) => (
            <OutcomeTileCard key={tile.id} tile={tile} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}