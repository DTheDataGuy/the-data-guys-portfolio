import { motion } from 'framer-motion';

const credentials = [
  { label: 'Former AWS', icon: '☁️' },
  { label: 'AI Task Force', icon: '🤖' },
  { label: '40 Under 40', icon: '🏆' },
  { label: '$400M+ Tracked', icon: '💰' },
  { label: '40+ Orgs Served', icon: '🏢' },
  { label: '250+ Trained', icon: '🎓' },
];

export default function BuiltByDStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative py-6 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="/assets/d-avatar.jpeg"
            alt="Dei'Marlon Scisney, founder of The Data Guys"
            loading="lazy"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-[#00f0ff]/30"
          />
          <p className="text-gray-400 text-xs font-mono uppercase tracking-wider">
            Built by Dei'Marlon Scisney — Your Data Architect
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {credentials.map((cred, i) => (
            <motion.div
              key={cred.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-gray-300 text-xs"
            >
              <span>{cred.icon}</span>
              <span>{cred.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}