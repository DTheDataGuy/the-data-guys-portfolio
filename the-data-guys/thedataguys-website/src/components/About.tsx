import { motion } from 'framer-motion';

const credentials = [
  { label: 'Founder & CEO', icon: '📌' },
  { label: 'Former AWS Data & Machine Learning Specialist', icon: '☁️' },
  { label: "Governor's AI Task Force", icon: '🏛️' },
  { label: 'Seattle CTAB Commissioner', icon: '📋' },
  { label: 'Puget Sound Business Journal 40 Under 40', icon: '🏆' },
];

const storyBlocks = [
  "When I was helping organizations at AWS, I noticed a pattern. Organizations spent millions on software. Millions on consultants. Millions on AI. But they still couldn't answer basic questions: What is working? Where is money being spent? Which programs are creating impact? What should we do next?",
  "The problem wasn't AI. The problem was data foundations.",
  "That's why I created The Data Guys™.",
  "Today we help organizations build those foundations,connecting systems, automating workflows, creating visibility, and preparing organizations for AI adoption. From local nonprofits to multi-billion-dollar enterprises, the mission remains the same: Get Your Data House In Order™.",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function About() {
  return (
    <section id="about" className="relative py-28 md:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 gradient-mesh-bg" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[#00f0ff] mono text-sm tracking-[0.3em] uppercase mb-4">
            The Founder
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Meet <span className="gradient-text">D. The Data Guy™</span>
          </h2>
        </motion.div>

        {/* Founder Section */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
          {/* Founder Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-4 flex justify-center"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-2 bg-gradient-to-br from-[#00f0ff] via-[#3b82f6] to-[#a855f7] rounded-full opacity-50 blur-md animate-pulse" />
              {/* Avatar circle */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-2 border-[#00f0ff]/30 flex items-center justify-center">
                <span className="text-5xl md:text-6xl font-black bg-gradient-to-br from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
                  DS
                </span>
              </div>
              {/* Floating badge */}
              <motion.div
                className="absolute -bottom-4 -right-4 bg-[#0a0e1a]/90 backdrop-blur-xl border border-[#00f0ff]/40 rounded-xl px-4 py-2 shadow-2xl shadow-[#00f0ff]/10"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[#00f0ff] font-bold text-sm">Dei&apos;Marlon Scisney</p>
                <p className="text-gray-400 text-xs">Founder &amp; CEO</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Story Blocks */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="lg:col-span-8 space-y-6"
          >
            {storyBlocks.map((block, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={`relative pl-6 ${
                  i === 1
                    ? 'border-l-4 border-red-400/60'
                    : i === 2
                      ? 'border-l-4 border-[#00f0ff]'
                      : i === storyBlocks.length - 1
                        ? 'border-l-4 border-emerald-400/60'
                        : 'border-l-2 border-white/10'
                }`}
              >
                <p
                  className={`text-lg md:text-xl leading-relaxed ${
                    i === 1
                      ? 'text-red-300 font-semibold italic'
                      : i === 2
                        ? 'text-[#00f0ff] font-bold'
                        : i === storyBlocks.length - 1
                          ? 'text-white font-semibold'
                          : 'text-gray-300'
                  }`}
                >
                  &ldquo;{block}&rdquo;
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {credentials.map((cred, i) => (
            <motion.div
              key={cred.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card rounded-xl px-5 py-3 flex items-center gap-2"
            >
              <span className="text-lg">{cred.icon}</span>
              <span className="text-sm md:text-base text-gray-200 font-medium">
                {cred.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}