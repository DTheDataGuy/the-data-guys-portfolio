import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, DollarSign, Users, Wifi } from 'lucide-react';

const dashboards = [
  {
    client: 'Seattle Sports Commission',
    type: 'Economic Impact Dashboard',
    description: 'Real-time tracking of event-driven economic impact across the greater Seattle region.',
    icon: TrendingUp,
    gradient: 'from-[#00f0ff]/20 via-[#3b82f6]/15 to-[#8b5cf6]/10',
  },
  {
    client: 'Regional Heavy-Civil Contractor',
    type: 'Operational Intelligence Ecosystem',
    description: 'Enterprise-wide system connecting payroll, workforce planning, equipment intelligence, EAC/WIP financial controls, and executive decision dashboards.',
    icon: LayoutDashboard,
    gradient: 'from-[#3b82f6]/20 via-[#06b6d4]/15 to-[#00f0ff]/10',
  },
  {
    client: 'Workforce Development Council',
    type: 'Workforce Intelligence Dashboard',
    description: 'Unified workforce investment tracking across 18 data sources with governance standards and outcome visibility.',
    icon: DollarSign,
    gradient: 'from-[#8b5cf6]/20 via-[#3b82f6]/15 to-[#00f0ff]/10',
  },
  {
    client: 'Workforce Development',
    type: 'Workforce Dashboard',
    description: 'Training outcomes, employment placement rates, and program effectiveness metrics.',
    icon: Users,
    gradient: 'from-[#06b6d4]/20 via-[#00f0ff]/15 to-[#3b82f6]/10',
  },
  {
    client: 'Digital Equity Initiative',
    type: 'Digital Equity Dashboard',
    description: 'Broadband access mapping, digital literacy program tracking, and equity gap analysis.',
    icon: Wifi,
    gradient: 'from-[#00f0ff]/20 via-[#06b6d4]/15 to-[#3b82f6]/10',
  },
];

export default function RealDashboards() {
  return (
    <section id="real-dashboards" className="relative py-28 bg-[#0a0e1a] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00f0ff]/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-4">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Client Work
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/[0.08] border border-green-500/20 text-green-400 text-[10px] font-mono tracking-wider uppercase mb-6 ml-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Built From Actual Client Engagements
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Real Dashboards{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              We&apos;ve Built
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Production systems delivering daily value to organizations across industries.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dashboards.map((dashboard, i) => (
            <motion.div
              key={dashboard.client}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-[#00f0ff]/30 transition-all duration-300"
            >
              {/* Dashboard preview placeholder */}
              <div className={`h-36 bg-gradient-to-br ${dashboard.gradient} relative overflow-hidden`}>
                {/* Simulated dashboard elements */}
                <div className="absolute inset-4 flex flex-col gap-2 opacity-40">
                  <div className="flex gap-2">
                    <div className="h-2 w-16 rounded bg-white/30" />
                    <div className="h-2 w-10 rounded bg-white/20" />
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="rounded bg-white/10" />
                    <div className="rounded bg-white/15" />
                    <div className="rounded bg-white/10" />
                  </div>
                  <div className="h-8 rounded bg-white/10 flex items-end px-2 pb-1 gap-1">
                    <div className="w-2 h-3 rounded-t bg-white/30" />
                    <div className="w-2 h-5 rounded-t bg-white/40" />
                    <div className="w-2 h-4 rounded-t bg-white/30" />
                    <div className="w-2 h-6 rounded-t bg-white/50" />
                    <div className="w-2 h-3 rounded-t bg-white/30" />
                  </div>
                </div>
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-[#00f0ff]/0 group-hover:bg-[#00f0ff]/[0.05] transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center flex-shrink-0">
                    <dashboard.icon className="w-4.5 h-4.5 text-[#00f0ff]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm leading-tight">{dashboard.client}</h3>
                    <p className="text-[#00f0ff]/70 text-xs font-mono mt-0.5">{dashboard.type}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{dashboard.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}