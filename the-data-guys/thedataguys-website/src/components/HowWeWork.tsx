import { motion } from 'framer-motion';
import { Search, ClipboardCheck, Map, Wrench, GraduationCap, RefreshCw, TrendingUp, Clock } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Discovery',
    description: 'Understand your current state, goals, and challenges',
    icon: Search,
  },
  {
    number: 2,
    title: 'Assessment',
    description: 'Evaluate your Data House™ across all 8 floors',
    icon: ClipboardCheck,
  },
  {
    number: 3,
    title: 'Strategy',
    description: 'Build your custom roadmap and prioritize quick wins',
    icon: Map,
  },
  {
    number: 4,
    title: 'Implementation',
    description: 'Connect systems, build dashboards, automate workflows',
    icon: Wrench,
  },
  {
    number: 5,
    title: 'Training',
    description: 'Empower your team to use and maintain the system',
    icon: GraduationCap,
  },
  {
    number: 6,
    title: 'Optimization',
    description: 'Refine, expand, and improve continuously',
    icon: RefreshCw,
  },
  {
    number: 7,
    title: 'Impact Measurement',
    description: 'Prove ROI and demonstrate value to stakeholders',
    icon: TrendingUp,
  },
];

export default function HowWeWork() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="how-we-work" className="relative z-10 py-20 md:py-28 bg-[#0a0e1a]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            How We{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Work
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            A proven process from discovery to measurable impact
          </p>
        </motion.div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#00f0ff]/40 via-[#3b82f6]/30 to-[#00f0ff]/40 hidden md:block" />

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex items-start gap-5 md:gap-6 group"
              >
                {/* Step number circle */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl bg-white/[0.04] border border-[#00f0ff]/20 backdrop-blur-sm flex items-center justify-center group-hover:border-[#00f0ff]/50 group-hover:bg-[#00f0ff]/[0.08] transition-all duration-300">
                  <step.icon className="w-5 h-5 md:w-6 md:h-6 text-[#00f0ff]/70 group-hover:text-[#00f0ff] transition-colors duration-300" />
                </div>

                {/* Content card */}
                <div className="flex-1 p-4 md:p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm group-hover:border-[#00f0ff]/20 group-hover:bg-white/[0.05] transition-all duration-300">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[#00f0ff]/60 text-xs font-mono">0{step.number}</span>
                    <h3 className="text-white font-bold text-base md:text-lg">{step.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm md:text-base">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Typical Timelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-[#00f0ff]/70 text-xs font-mono uppercase tracking-wider mb-3">
              <Clock size={14} />
              Typical Timelines
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              How Long Does This Take?
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {[
              { name: 'Assessment', timeline: '2–4 weeks' },
              { name: 'Dashboard Project', timeline: '4–8 weeks' },
              { name: 'Automation Project', timeline: '6–12 weeks' },
              { name: 'Data Strategy', timeline: '4–6 weeks' },
              { name: 'Enterprise Transformation', timeline: '3–12 months' },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm text-center hover:border-[#00f0ff]/20 hover:bg-white/[0.05] transition-all duration-300"
              >
                <p className="text-white font-semibold text-sm mb-1.5">{item.name}</p>
                <p className="text-[#00f0ff] font-mono text-xs font-bold">{item.timeline}</p>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Every engagement starts with a free strategy session.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={() => scrollTo('contact')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base md:text-lg font-bold bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff]/60 hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Start With Discovery →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}