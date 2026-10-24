import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Story {
  before: string;
  after: string;
  metric: string;
}

const stories: Story[] = [
  {
    before: 'We spent 30 hours a month on reporting.',
    after: 'Reports generate automatically every morning.',
    metric: '30hrs → 2hrs',
  },
  {
    before: 'No one trusted the data.',
    after: 'Leadership uses dashboards daily for decisions.',
    metric: '0% → 94% trust',
  },
  {
    before: 'Our AI project failed after 6 months.',
    after: 'AI assistant answers questions in seconds.',
    metric: '$500K saved',
  },
  {
    before: '5 days to respond to citizen requests.',
    after: 'Same-day response with automated routing.',
    metric: '5 days → Same day',
  },
  {
    before: "We couldn't prove our program impact.",
    after: 'Funders see real-time impact dashboards.',
    metric: '+$2M funding',
  },
];

function StoryCard({ story, index }: { story: Story; index: number }) {
  const [showAfter, setShowAfter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
      className="relative"
    >
      <div
        className={`rounded-2xl border backdrop-blur-sm p-6 md:p-8 transition-all duration-500 ${
          showAfter
            ? 'border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] shadow-[0_0_30px_rgba(0,240,255,0.05)]'
            : 'border-orange-500/20 bg-orange-500/[0.03] shadow-[0_0_30px_rgba(249,115,22,0.05)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Toggle */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowAfter(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                !showAfter
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:text-gray-300'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setShowAfter(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                showAfter
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                  : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:text-gray-300'
              }`}
            >
              After
            </button>
          </div>

          {/* Quote */}
          <div className="flex-1 min-h-[3rem] flex items-center">
            <motion.p
              key={showAfter ? 'after' : 'before'}
              initial={{ opacity: 0, x: showAfter ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`text-lg md:text-xl font-medium italic ${
                showAfter ? 'text-[#00f0ff]/90' : 'text-orange-300/90'
              }`}
            >
              &ldquo;{showAfter ? story.after : story.before}&rdquo;
            </motion.p>
          </div>

          {/* Metric Badge */}
          <motion.div
            animate={{
              scale: showAfter ? 1.05 : 1,
              borderColor: showAfter ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)',
            }}
            transition={{ duration: 0.3 }}
            className={`shrink-0 px-4 py-2 rounded-xl border text-center transition-colors duration-500 ${
              showAfter
                ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            <p className={`text-sm font-black font-mono transition-colors duration-500 ${
              showAfter ? 'text-[#00f0ff]' : 'text-white/70'
            }`}>
              {story.metric}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BeforeAfterStories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="before-after" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0a0e1a] to-[#0f172a]" />
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div ref={sectionRef} className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-[#00f0ff] font-mono text-sm tracking-[0.3em] uppercase mb-4">
            Real Results
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            The <span className="bg-gradient-to-r from-orange-400 to-[#00f0ff] bg-clip-text text-transparent">Transformation</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Real stories from real organizations.
          </p>
        </motion.div>

        <div className="space-y-5">
          {stories.map((story, i) => (
            <StoryCard key={i} story={story} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm">
            Every transformation starts with a single decision to fix the foundation.
          </p>
        </motion.div>
      </div>
    </section>
  );
}