import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Heart, Landmark, Users, HardHat, TrendingUp, Building } from 'lucide-react';

const industries = [
  { id: 'small-business', label: 'Small Business', icon: Building2, description: 'Growing companies ready to scale with data' },
  { id: 'nonprofit', label: 'Nonprofit', icon: Heart, description: 'Mission-driven organizations tracking impact' },
  { id: 'government', label: 'Government Agency', icon: Landmark, description: 'Public sector modernizing operations' },
  { id: 'chamber', label: 'Chamber of Commerce', icon: Users, description: 'Membership organizations driving value' },
  { id: 'construction', label: 'Construction Company', icon: HardHat, description: 'Firms managing complex project data' },
  { id: 'economic-dev', label: 'Economic Development', icon: TrendingUp, description: 'Organizations measuring community growth' },
  { id: 'enterprise', label: 'Enterprise', icon: Building, description: 'Large organizations optimizing at scale' },
];

const industryConfirmations: Record<string, string> = {
  'nonprofit': "You selected: Nonprofit / Foundation. We'll show examples related to grant reporting, program outcomes, funder reports, impact dashboards, and community measurement.",
  'construction': "You selected: Construction / Project-Based Firm. We'll show examples related to job cost, labor utilization, safety, project controls, forecasting, and budget visibility.",
  'government': "You selected: Government / Public Agency. We'll show examples related to service delivery, departmental budgets, compliance reporting, and transparency dashboards.",
  'economic-dev': "You selected: Economic Development Organization. We'll show examples related to business support, capital deployment, job creation, and neighborhood investment.",
  'small-business': "You selected: Small Business. We'll show examples related to revenue tracking, customer insights, workflow automation, and weekly KPI dashboards.",
  'enterprise': "You selected: Enterprise / Large Organization. We'll show examples related to system integration, data governance, executive reporting, and cross-department visibility.",
  'chamber': "You selected: Chamber of Commerce. We'll show examples related to member engagement, event ROI, retention analytics, and community impact tracking.",
};

export default function IndustrySelector() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('tdg-industry');
    if (stored) setSelected(stored);
  }, []);

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem('tdg-industry', id);
    // Smooth scroll to next section
    setTimeout(() => {
      const next = document.getElementById('problems-we-solve');
      if (next) next.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  return (
    <section id="industry-selector" className="relative py-24 bg-[#0a0e1a] overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Which Best Describes{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              You?
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Select your organization type and we&apos;ll tailor your experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {industries.map((industry, i) => {
            const isSelected = selected === industry.id;
            return (
              <motion.button
                key={industry.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(industry.id)}
                className={`relative group p-6 rounded-2xl text-left transition-all duration-300 border backdrop-blur-md ${
                  isSelected
                    ? 'bg-[#00f0ff]/[0.12] border-[#00f0ff]/60 shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-[#00f0ff]/30'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="industry-selected"
                    className="absolute inset-0 rounded-2xl border-2 border-[#00f0ff]/50"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isSelected ? 'bg-[#00f0ff]/20' : 'bg-white/[0.05] group-hover:bg-[#00f0ff]/10'
                }`}>
                  <industry.icon className={`w-6 h-6 transition-colors duration-300 ${
                    isSelected ? 'text-[#00f0ff]' : 'text-gray-400 group-hover:text-[#00f0ff]/70'
                  }`} />
                </div>

                <h3 className={`font-bold text-base mb-1 transition-colors duration-300 ${
                  isSelected ? 'text-[#00f0ff]' : 'text-white'
                }`}>
                  {industry.label}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {industry.description}
                </p>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00f0ff] flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic confirmation box */}
        <AnimatePresence>
          {selected && industryConfirmations[selected] && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-6 overflow-hidden"
            >
              <div className="rounded-2xl p-6 bg-white/[0.05] backdrop-blur-xl border border-[#00f0ff]/30 shadow-[0_0_40px_rgba(0,240,255,0.08)]">
                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  {industryConfirmations[selected]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}