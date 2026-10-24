import { motion } from 'framer-motion';
import { Cloud, Heart, Landmark, TrendingUp, Users, HardHat, Coins, Wifi } from 'lucide-react';

const impactAreas = [
  { icon: Heart, label: 'Nonprofits' },
  { icon: Landmark, label: 'Government' },
  { icon: TrendingUp, label: 'Economic Development' },
  { icon: Users, label: 'Workforce' },
  { icon: Wifi, label: 'Digital Equity' },
  { icon: HardHat, label: 'Construction' },
  { icon: Coins, label: 'Workforce Development' },
];

export default function EnterpriseCommunity() {
  return (
    <section id="enterprise-community" className="relative py-28 bg-[#0a0e1a] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] rounded-full bg-[#00f0ff]/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Enterprise Systems.{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Community Impact.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            We bring the same data practices used by billion-dollar organizations to nonprofits,
            public agencies, workforce programs, chambers of commerce, and community initiatives.
          </p>
        </motion.div>

        {/* Flow visualization */}
        <div className="flex flex-col items-center gap-8">
          {/* Source: Enterprise */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-white/[0.05] border border-[#00f0ff]/20 backdrop-blur-md"
          >
            <Cloud className="w-8 h-8 text-[#00f0ff]" />
            <div>
              <p className="text-white font-bold text-lg">Enterprise Data Architecture</p>
              <p className="text-gray-400 text-sm">Cloud-grade methodology & best practices</p>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-px h-16 bg-gradient-to-b from-[#00f0ff]/60 to-[#00f0ff]/20 relative"
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r border-[#00f0ff]/40" />
          </motion.div>

          {/* Label */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[#00f0ff] font-mono text-sm uppercase tracking-widest"
          >
            Applied To
          </motion.p>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-px h-8 bg-gradient-to-b from-[#00f0ff]/20 to-[#00f0ff]/60 relative"
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-b border-r border-[#00f0ff]/40" />
          </motion.div>

          {/* Impact areas grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-4xl">
            {impactAreas.map((area, i) => (
              <motion.div
                key={area.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-[#00f0ff]/30 hover:bg-white/[0.06] transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center">
                  <area.icon className="w-5 h-5 text-[#00f0ff]" />
                </div>
                <span className="text-white text-sm font-medium text-center">{area.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}