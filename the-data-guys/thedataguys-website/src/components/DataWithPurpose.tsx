import { motion } from 'framer-motion';

interface ImpactArea {
  icon: string;
  title: string;
}

const impactAreas: ImpactArea[] = [
  { icon: '🎓', title: 'Workforce Development' },
  { icon: '🏠', title: 'Affordable Housing' },
  { icon: '📡', title: 'Digital Equity' },
  { icon: '📈', title: 'Economic Mobility' },
  { icon: '🏪', title: 'Small Business Growth' },
  { icon: '🏛️', title: 'Public Sector Accountability' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function DataWithPurpose() {
  return (
    <section id="purpose" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#1a0a2e] to-[#0a0e1a]" />
      <div className="absolute inset-0 gradient-mesh-bg" />

      {/* Accent orbs */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-[#a855f7]/[0.06] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-[#00f0ff]/[0.05] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-6"
        >
          <p className="text-[#a855f7] mono text-sm tracking-[0.3em] uppercase mb-4">
            Community Impact
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Data With{' '}
            <span className="bg-gradient-to-r from-[#a855f7] via-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Purpose™
            </span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 text-lg md:text-xl text-center max-w-3xl mx-auto mb-14"
        >
          The Data Guys™ believes data should create both business value and community impact.
        </motion.p>

        {/* Impact Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16"
        >
          {impactAreas.map((area) => (
            <motion.div
              key={area.title}
              variants={itemVariants}
              className="glass-card rounded-xl p-6 text-center group hover:border-[#a855f7]/30 transition-colors duration-300"
            >
              <span className="text-3xl mb-3 block">{area.icon}</span>
              <h3 className="text-white font-semibold text-base">
                {area.title}
              </h3>
            </motion.div>
          ))}
        </motion.div>

        {/* Closing Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-xl md:text-2xl font-bold text-white/90 border-l-4 border-[#a855f7] pl-6 inline-block text-left">
            That differentiates us from every generic AI consultancy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}