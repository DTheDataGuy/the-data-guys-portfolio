import { motion } from 'framer-motion';
import { Award, Shield, Building2, Trophy } from 'lucide-react';

const credentials = [
  {
    icon: Shield,
    title: 'Cloud Data Alumni',
    description: 'Enterprise-grade data & ML architecture',
    color: '#00f0ff',
  },
  {
    icon: Building2,
    title: "Governor's AI Task Force",
    description: 'Policy and governance leadership',
    color: '#3b82f6',
  },
  {
    icon: Award,
    title: 'Seattle CTAB Commissioner',
    description: 'AI and data strategy advisor',
    color: '#a855f7',
  },
  {
    icon: Trophy,
    title: '40 Under 40',
    description: 'Puget Sound Business Journal',
    color: '#ec4899',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Credibility() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden section-dramatic">
      <div className="absolute inset-0 gradient-mesh-bg opacity-40" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4">
            Why Organizations Trust{' '}
            <span className="gradient-text">The Data Guys™</span>
          </h2>
        </motion.div>

        {/* Credentials Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {credentials.map((cred) => {
            const Icon = cred.icon;
            return (
              <motion.div
                key={cred.title}
                variants={itemVariants}
                className="glass-card rounded-xl p-5 text-center group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${cred.color}15`,
                    border: `1px solid ${cred.color}30`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: cred.color }} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{cred.title}</h3>
                <p className="text-gray-400 text-xs">{cred.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}