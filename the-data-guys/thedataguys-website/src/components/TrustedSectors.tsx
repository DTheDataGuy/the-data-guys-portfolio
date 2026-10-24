import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = ['Enterprise', 'Government', 'Community'] as const;
type Tab = (typeof tabs)[number];

const sectorData: Record<Tab, string[]> = {
  Enterprise: ['AWS', 'Microsoft', 'Databricks', 'Power BI', 'Snowflake', 'Tableau'],
  Government: [
    'City of Seattle',
    'WA Governor\'s Office',
    'King County',
    'Seattle CTAB',
    'WA State DSHS',
    'Commerce Department',
  ],
  Community: [
    'Urban League',
    'El Centro de la Raza',
    'Boys & Girls Club',
    'United Way',
    'Goodwill',
    'YMCA',
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, y: -5, transition: { duration: 0.15 } },
};

export default function TrustedSectors() {
  const [activeTab, setActiveTab] = useState<Tab>('Enterprise');

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
            Trusted Across{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Public, Private, and Community
            </span>{' '}
            Sectors
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            From Fortune 500 partners to local nonprofits, organizations trust us to transform their data infrastructure.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-2 mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 rounded-full bg-white/[0.08] border border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab-underline"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#00f0ff] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Content Grid */}
        <div className="min-h-[200px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full"
            >
              {sectorData[activeTab].map((org) => (
                <motion.div
                  key={org}
                  variants={badgeVariants}
                  className="group relative flex items-center justify-center px-5 py-4 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-[#00f0ff]/30 transition-all duration-300 cursor-default"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-[#00f0ff]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 text-gray-200 font-medium text-sm md:text-base text-center group-hover:text-white transition-colors duration-300">
                    {org}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}