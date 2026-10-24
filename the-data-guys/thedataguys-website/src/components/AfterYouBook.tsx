import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    icon: '📋',
    title: 'Assessment',
    description: 'We map your current data landscape — systems, people, processes, and gaps.',
    timeline: 'Week 1-2',
  },
  {
    number: 2,
    icon: '🗺️',
    title: 'Roadmap',
    description: 'You receive a clear, prioritized strategy document your leadership can rally behind.',
    timeline: 'Week 2-3',
  },
  {
    number: 3,
    icon: '🎯',
    title: 'Prioritize Wins',
    description: 'We identify quick wins that build momentum and prove value fast.',
    timeline: 'Week 3-4',
  },
  {
    number: 4,
    icon: '🔨',
    title: 'Build',
    description: 'Dashboards, integrations, and automations get built to your exact specifications.',
    timeline: 'Week 4-6',
  },
  {
    number: 5,
    icon: '🎓',
    title: 'Train',
    description: "Your team learns to use, maintain, and extend what we've built together.",
    timeline: 'Week 5-6',
  },
  {
    number: 6,
    icon: '📈',
    title: 'Measure Impact',
    description: 'We track outcomes, refine KPIs, and ensure lasting organizational change.',
    timeline: 'Ongoing',
  },
];

export default function AfterYouBook() {
  return (
    <section id="after-you-book" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            What Happens After You{' '}
            <span className="text-[#00f0ff]">Book?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            No mystery. No pressure. Here's exactly what to expect.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line - visible on md+ */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00f0ff]/0 via-[#00f0ff]/60 to-[#00f0ff]/0 -translate-x-1/2" />

          {/* Vertical line - mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#00f0ff]/0 via-[#00f0ff]/60 to-[#00f0ff]/0" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 items-center">
                    {/* Left card or empty */}
                    {isLeft ? (
                      <div className="flex justify-end">
                        <StepCard step={step} />
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* Center circle */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-[#0a0e1a] border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                      <span className="text-[#00f0ff] font-bold text-sm">
                        {step.number}
                      </span>
                    </div>

                    {/* Right card or empty */}
                    {!isLeft ? (
                      <div className="flex justify-start">
                        <StepCard step={step} />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start gap-4">
                    {/* Circle */}
                    <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#0a0e1a] border-2 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                      <span className="text-[#00f0ff] font-bold text-sm">
                        {step.number}
                      </span>
                    </div>

                    {/* Card */}
                    <div className="flex-1">
                      <StepCard step={step} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-20"
        >
          <p className="text-gray-300 text-lg mb-6">Ready to start?</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#00f0ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00f0ff]/90 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-300"
          >
            Book Your Free Strategy Session
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <div className="max-w-sm w-full p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg hover:border-[#00f0ff]/30 transition-colors duration-300">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{step.icon}</span>
        <h3 className="text-white font-semibold text-lg">{step.title}</h3>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed mb-3">
        {step.description}
      </p>
      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
        {step.timeline}
      </span>
    </div>
  );
}