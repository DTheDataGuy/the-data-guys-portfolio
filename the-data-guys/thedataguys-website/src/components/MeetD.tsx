import { motion } from 'framer-motion';
import FounderPhoto from './FounderPhoto';
import { Award, Cloud, Users, GraduationCap, Building2, Brain, Trophy, Rocket } from 'lucide-react';

const credentials = [
  { icon: Cloud, label: 'Former AWS Analytics Specialist' },
  { icon: Award, label: 'Built systems supporting $400M+ in funding' },
  { icon: Building2, label: '79+ organizations served' },
  { icon: GraduationCap, label: '250+ leaders trained' },
  { icon: Users, label: 'Seattle CTAB Commissioner' },
  { icon: Brain, label: 'WA State AI Task Force Member' },
  { icon: Trophy, label: '40 Under 40 Honoree' },
  { icon: Rocket, label: 'Founded at age 26' },
];

export default function MeetD() {
  const scrollToAskD = () => {
    const el = document.getElementById('ask-d');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="meet-d" className="relative z-10 py-16 md:py-24 bg-[#0a0e1a]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Why Listen To <span className="text-[#00f0ff]">Me</span>?
          </h2>
          <p className="text-gray-400 text-lg">
            D. The Data Guy™ | Dei&apos;Marlon Scisney
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-8 md:p-12"
        >
          {/* Glow accent */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#3b82f6]/10 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left - Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="shrink-0"
            >
              <FounderPhoto src="/assets/dei-headshot.png" size="xl" />
            </motion.div>

            {/* Right - Credentials Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {credentials.map((cred, i) => (
                  <motion.div
                    key={cred.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-[#00f0ff]/10 hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/[0.04] transition-all duration-300"
                  >
                    <cred.icon className="w-4 h-4 text-[#00f0ff] shrink-0" />
                    <span className="text-gray-300 text-sm font-medium">{cred.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                onClick={scrollToAskD}
                className="inline-flex items-center gap-2 text-[#00f0ff] font-semibold text-sm hover:gap-3 transition-all duration-300 group"
              >
                Ask D a Question
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Philosophy Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative mt-10 rounded-xl border border-[#00f0ff]/15 bg-gradient-to-br from-[#00f0ff]/[0.04] to-transparent backdrop-blur-sm p-6 md:p-8"
          >
            <div className="absolute top-4 left-6 text-[#00f0ff]/30 text-4xl font-serif leading-none">&ldquo;</div>
            <p className="relative text-gray-300 text-base md:text-lg leading-relaxed italic pl-6">
              Most organizations don&apos;t need more dashboards. They need stronger foundations. I&apos;ve spent my career proving that the right data infrastructure transforms how organizations make decisions, measure impact, and serve their communities.
            </p>
            <div className="mt-4 pl-6">
              <span className="text-[#00f0ff] text-sm font-semibold">— Dei&apos;Marlon Scisney</span>
              <span className="text-gray-500 text-sm ml-2">Founder, The Data Guys™</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}