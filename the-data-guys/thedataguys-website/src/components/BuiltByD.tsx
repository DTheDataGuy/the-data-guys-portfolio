import { motion } from 'framer-motion';
import { Award, Shield, Building2, Users, DollarSign } from 'lucide-react';

const credentials = [
  { icon: Shield, label: 'Former AWS Analytics Specialist' },
  { icon: Building2, label: 'Seattle CTAB Commissioner' },
  { icon: Users, label: 'WA AI Task Force' },
  { icon: Award, label: '40 Under 40 Honoree' },
  { icon: DollarSign, label: '$400M+ Systems Built' },
];

export default function BuiltByD() {
  return (
    <section className="relative py-6 bg-[#0a0e1a]">
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-6"
      >
        <div className="relative border border-[#00f0ff]/10 backdrop-blur-xl p-5 md:p-6 overflow-hidden mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[24px] pr-[24px] pb-[24px] pl-[24px] rounded-2xl text-[16px] font-normal text-[#FFFFFF] bg-[#FFFFFF05] opacity-100">
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/[0.03] via-transparent to-[#3b82f6]/[0.03] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Heading with Avatar */}
            <div className="flex flex-row items-center gap-3">
              <div className="relative flex-shrink-0 w-16 h-16 min-w-[64px] min-h-[64px]">
                <div className="absolute inset-0 rounded-full bg-[#00f0ff]/20 blur-md" />
                <img
                  src="/assets/d-avatar.jpeg"
                  alt="Dei'Marlon Scisney, founder of The Data Guys"
                  width={64}
                  height={64}
                  loading="lazy"
                  onError={(e) => console.error('BuiltByD avatar failed to load:', e)}
                  className="relative w-16 h-16 min-w-[64px] min-h-[64px] rounded-full object-cover border-2 border-[#00f0ff]/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-[#06b6d4]"
                />
              </div>
              <h3 className="text-base md:text-lg font-bold text-white tracking-wide">
                Built By <span className="text-[#00f0ff]">D. The Data Guy™</span>
              </h3>
            </div>

            {/* Credentials Row */}
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-2">
              {credentials.map((cred, i) => (
                <motion.div
                  key={cred.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-1.5"
                >
                  <cred.icon className="w-3.5 h-3.5 text-[#00f0ff]/70" />
                  <span className="text-xs md:text-sm text-gray-300 font-medium whitespace-nowrap">
                    {cred.label}
                  </span>
                  {i < credentials.length - 1 && (
                    <span className="ml-2 w-1 h-1 rounded-full bg-[#00f0ff]/30" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}