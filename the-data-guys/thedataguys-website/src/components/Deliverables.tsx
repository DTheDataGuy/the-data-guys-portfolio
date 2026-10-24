import { motion } from 'framer-motion';

const deliverables = [
  {
    title: 'Current-State Assessment',
    description: 'A complete picture of where your data lives today',
  },
  {
    title: 'System Inventory',
    description: 'Every tool, database, and platform mapped and documented',
  },
  {
    title: 'Data Flow Map',
    description: 'Visual diagram of how data moves through your organization',
  },
  {
    title: 'Governance Framework',
    description: 'Who owns what, access rules, and quality standards',
  },
  {
    title: 'KPI Framework',
    description: 'The exact metrics that matter for your industry and goals',
  },
  {
    title: 'Executive Roadmap',
    description: 'Strategic plan your leadership team can rally behind',
  },
  {
    title: 'Prioritized 90-Day Plan',
    description: 'Immediate actions ranked by impact and feasibility',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Deliverables() {
  return (
    <section id="deliverables" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            What You'll Actually Walk Away With
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            People buy deliverables. Not services. Here's exactly what you receive.
          </p>
        </motion.div>

        {/* Package Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 md:p-10"
        >
          {/* Card Header */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Data Strategy Engagement
            </h3>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#00f0ff]/40" />
          </div>

          {/* Deliverables List */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-5"
          >
            {deliverables.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="flex items-start gap-4"
              >
                {/* Checkmark */}
                <span className="flex-shrink-0 mt-0.5 text-[#00f0ff] text-lg font-bold">
                  ✓
                </span>
                {/* Content */}
                <div>
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="text-gray-400"> — {item.description}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">
                <span className="text-white font-medium">Timeline:</span> 4-6 weeks
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-white font-medium">Investment:</span> Custom based on scope
              </p>
            </div>

            {/* CTA Button */}
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-sm text-[#0a0e1a] bg-gradient-to-r from-[#00f0ff] to-[#00c8ff] hover:shadow-[0_0_24px_rgba(0,240,255,0.4)] transition-shadow duration-300"
            >
              Book Your Strategy Session
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}