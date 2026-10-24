import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const failureReasons = [
  {
    number: 1,
    title: 'Nobody Defined KPIs',
    description: 'The dashboard was built before anyone agreed on what success looks like.',
  },
  {
    number: 2,
    title: 'Bad Source Data',
    description: 'Garbage in, garbage out. The underlying data was never cleaned or validated.',
  },
  {
    number: 3,
    title: 'Disconnected Systems',
    description: "Data lives in 5+ tools that don't talk to each other. Manual exports fill the gaps.",
  },
  {
    number: 4,
    title: 'No Ownership',
    description: 'Nobody is responsible for keeping the dashboard accurate or up to date.',
  },
  {
    number: 5,
    title: 'No Action Process',
    description: 'People look at the dashboard but nothing changes. No triggers, no alerts, no accountability.',
  },
  {
    number: 6,
    title: 'Built for Reporting, Not Decisions',
    description: "It shows what happened last month. It doesn't tell you what to do next.",
  },
];

export default function WhyDashboardsFail() {
  const scrollToAssessment = () => {
    const el = document.getElementById('assessment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="why-dashboards-fail" className="relative z-10 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Dashboards <span className="text-[#00f0ff]">Fail</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Six reasons your last dashboard project didn&apos;t stick.
          </p>
        </motion.div>

        {/* Failure Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {failureReasons.map((reason, i) => (
            <motion.div
              key={reason.number}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className="group relative rounded-2xl border border-[#00f0ff]/15 bg-white/[0.03] backdrop-blur-md p-6 hover:border-[#00f0ff]/35 hover:bg-[#00f0ff]/[0.04] transition-all duration-300"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-[#00f0ff]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Large number */}
                <span className="text-5xl font-bold text-[#00f0ff]/30 font-mono leading-none mb-3 block group-hover:text-[#00f0ff]/50 transition-colors duration-300">
                  {reason.number}
                </span>

                <h3 className="text-white font-bold text-base mb-2">
                  {reason.title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contrast Statement */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-10"
        >
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Dashboards don&apos;t fail because of technology.{' '}
            <span className="text-white font-semibold">
              They fail because the Data House wasn&apos;t built first.
            </span>
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <button
            onClick={scrollToAssessment}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/40 text-white font-semibold hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300"
          >
            Assess Your Data House
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}