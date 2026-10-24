import { motion } from 'framer-motion';
import { ClipboardCheck, BarChart2, Map, CalendarCheck } from 'lucide-react';

const steps = [
  { icon: ClipboardCheck, label: 'Take Assessment', href: '#data-house-assessment' },
  { icon: BarChart2, label: 'Get Your Score', href: '#data-house-assessment' },
  { icon: Map, label: 'See Your Roadmap', href: '#roadmap' },
  { icon: CalendarCheck, label: 'Book Strategy Session', href: '#contact' },
];

export default function PrimaryJourney() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id.replace('#', ''));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="relative z-10 py-6 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl border border-[#00f0ff]/15 bg-white/[0.02] backdrop-blur-xl p-4 md:p-6 shadow-[0_0_40px_rgba(0,240,255,0.05)]">
          {/* Background gradient line connecting steps */}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 bg-gradient-to-r from-[#00f0ff]/20 via-[#06b6d4]/30 to-[#3b82f6]/20 hidden md:block" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-2 relative">
            {steps.map((step, i) => (
              <motion.button
                key={step.label}
                onClick={() => scrollTo(step.href)}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="group flex flex-col items-center gap-2 py-3 px-2 rounded-xl hover:bg-[#00f0ff]/[0.05] transition-all duration-300 cursor-pointer relative"
              >
                {/* Step number circle */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#3b82f6]/10 border border-[#00f0ff]/30 flex items-center justify-center group-hover:border-[#00f0ff]/60 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all duration-300">
                    <step.icon className="w-5 h-5 text-[#00f0ff] group-hover:text-white transition-colors duration-300" />
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0a0e1a] border border-[#00f0ff]/40 flex items-center justify-center text-[10px] font-bold text-[#00f0ff] font-mono">
                    {i + 1}
                  </span>
                </div>

                <span className="text-xs md:text-sm font-medium text-gray-300 group-hover:text-[#00f0ff] transition-colors duration-300 text-center leading-tight">
                  {step.label}
                </span>

                {/* Arrow connector (visible on md+ between items) */}
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden md:block text-[#00f0ff]/30 text-lg">
                    →
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}