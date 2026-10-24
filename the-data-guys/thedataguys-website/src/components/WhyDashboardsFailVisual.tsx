import { motion } from 'framer-motion';

import GradientMeshCard from './GradientMeshCard';

const failureReasons = [
  {
    number: '01',
    title: 'Built Without Strategy',
    description: 'Dashboards built to look pretty instead of answer specific business questions.',
    stat: '73%',
    statLabel: 'of dashboards never get used after month 1',
    color: 'red',
  },
  {
    number: '02',
    title: 'Wrong Data Foundation',
    description: 'Garbage in, garbage out. Without clean, connected data, dashboards lie.',
    stat: '85%',
    statLabel: 'of dashboard data is stale or inaccurate',
    color: 'orange',
  },
  {
    number: '03',
    title: 'No Decision Framework',
    description: 'Pretty charts without clear "if X then do Y" decision logic built in.',
    stat: '91%',
    statLabel: 'of orgs can\'t tie dashboards to decisions',
    color: 'amber',
  },
  {
    number: '04',
    title: 'Missing the "So What?"',
    description: 'Data without context is noise. Every metric needs an action attached.',
    stat: '67%',
    statLabel: 'of executives ignore their own dashboards',
    color: 'yellow',
  },
];

export default function WhyDashboardsFailVisual() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-amber-400 font-mono text-sm tracking-[0.3em] uppercase mb-4">
            The Dashboard Trap
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Why{' '}
            <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
              Dashboards Fail
            </span>
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto px-4 md:px-0 text-center text-gray-400">
            {"You don't have a dashboard problem. You have a data foundation problem. Here's why most dashboard projects fail, and what we do differently."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {failureReasons.map((reason, i) => (
            <motion.div
              key={reason.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <GradientMeshCard className="relative rounded-2xl backdrop-blur-xl p-6 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-xs font-bold shrink-0">
                    {reason.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{reason.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{reason.description}</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/[0.05] border border-red-500/15">
                      <span className="text-red-400 font-mono font-black text-2xl">{reason.stat}</span>
                      <span className="text-gray-500 text-xs">{reason.statLabel}</span>
                    </div>
                  </div>
                </div>
              </GradientMeshCard>
            </motion.div>
          ))}
        </div>

        {/* The Solution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 rounded-2xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.03] p-8 text-center"
        >
          <h3 className="mt-[0px] mr-[0px] mb-[12px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] rounded-none text-[20px] font-bold text-center text-[#FFFFFF] bg-[#00000000] opacity-100">
            We Don't Build Dashboards™ — We Build{' '}
            <span className="text-[#00f0ff]">Better Decisions™</span>
          </h3>
          <p className="text-gray-400 text-sm max-w-xl mx-auto mb-5">
            Every visualization we create starts with: "What decision does this help you make?" 
            If it doesn't drive action, it doesn't get built.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold text-sm hover:bg-[#00f0ff]/20 transition-all duration-300"
          >
            See How We Build Decisions
            <span>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}