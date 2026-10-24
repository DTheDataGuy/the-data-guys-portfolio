import { motion } from 'framer-motion';

const clientsRow1 = [
  'City of Seattle',
  'King County',
  'AWS',
  'Salesforce',
  'Snowflake',
  'Microsoft',
  'DocuSign',
];

const clientsRow2 = [
  'HashiCorp',
  'Washington State',
  'Tacoma Urban League',
  'SBA',
  'SCORE',
  'Chambers of Commerce',
  'Community Orgs',
];

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getGradient(index: number): string {
  const gradients = [
    'from-cyan-400 to-blue-500',
    'from-blue-400 to-purple-500',
    'from-purple-400 to-pink-500',
    'from-cyan-300 to-emerald-400',
    'from-blue-500 to-cyan-400',
    'from-indigo-400 to-blue-500',
    'from-teal-400 to-cyan-500',
  ];
  return gradients[index % gradients.length];
}

function LogoCard({ name, index }: { name: string; index: number }) {
  return (
    <div className="flex-shrink-0 mx-4 group">
      <div
        className="flex items-center gap-4 px-8 py-5 rounded-2xl transition-all duration-500 cursor-default logo-glow"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 240, 255, 0.12)',
        }}
      >
        {/* Initial Circle - Larger */}
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-shadow duration-500`}>
          <span className="text-white text-lg font-bold">{getInitial(name)}</span>
        </div>
        {/* Name - Larger */}
        <span className="text-base font-semibold text-white/90 whitespace-nowrap tracking-wide group-hover:text-cyan-300 transition-colors duration-300">
          {name}
        </span>
      </div>
    </div>
  );
}

function ScrollRow({ clients, direction }: { clients: string[]; direction: 'left' | 'right' }) {
  const doubled = [...clients, ...clients];
  return (
    <div className="relative overflow-hidden py-4">
      {/* Wide edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/80 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#0f172a] via-[#0f172a]/80 to-transparent z-10" />
      <div
        className={`flex ${direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'}`}
        style={{ width: 'max-content' }}
      >
        {doubled.map((name, i) => (
          <LogoCard key={`${name}-${i}`} name={name} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function ClientLogos() {
  return (
    <section className="relative py-32 overflow-hidden section-dramatic">
      {/* Dramatic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      
      {/* Giant Number Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[16rem] md:text-[22rem] font-black text-white/[0.02] tracking-tight">
          40+
        </span>
      </div>

      {/* Background glows - more dramatic */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* Floating dots */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/15 animate-pulse"
          style={{
            top: `${15 + (i * 11) % 70}%`,
            left: `${8 + (i * 12) % 84}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2.5 + (i % 3)}s`,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-cyan-400 mono text-sm tracking-[0.3em] uppercase mb-6">
            Trusted Partners
          </p>
          <h2 className="text-massive bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent mb-6" style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
            Our Clients &{' '}
            <span className="gradient-shift-text">
              Partners
            </span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg md:text-xl">
            Empowering organizations across the Pacific Northwest and beyond to harness the power of their data.
          </p>
        </motion.div>
      </div>

      <motion.div
        className="space-y-6 relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ScrollRow clients={clientsRow1} direction="left" />
        <ScrollRow clients={clientsRow2} direction="right" />
      </motion.div>
    </section>
  );
}