import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Users, BarChart3 } from 'lucide-react';

const credentials = [
  { label: 'Former AWS Analytics Specialist', icon: Shield },
  { label: 'WA State AI Task Force', icon: Shield },
  { label: 'Seattle Community Tech Advisory Board', icon: Award },
  { label: '40 Under 40 Honoree', icon: Award },
];

const industries = [
  'Government',
  'Economic Development',
  'Construction',
  'Workforce',
  'Nonprofits',
  'Small Business',
];

const stats = [
  { label: 'Funding Tracked', value: 400, prefix: '$', suffix: 'M+', icon: BarChart3 },
  { label: 'Organizations Supported', value: 79, prefix: '', suffix: '+', icon: Users },
  { label: 'Leaders Trained', value: 250, prefix: '', suffix: '+', icon: Users },
  { label: 'Dashboards Built', value: 100, prefix: '', suffix: '+', icon: BarChart3 },
];

function AnimatedCounter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="text-[#00f0ff] font-bold text-lg md:text-xl">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function TrustStrip() {
  return (
    <section className="relative z-10 py-12 bg-[#0a0e1a]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Credentials Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-6"
        >
          {credentials.map((cred, i) => {
            const Icon = cred.icon;
            return (
              <motion.span
                key={cred.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00f0ff]/[0.05] border border-[#00f0ff]/20 text-[#00f0ff]/80 text-xs font-medium"
              >
                <Icon className="w-3 h-3" />
                {cred.label}
              </motion.span>
            );
          })}
        </motion.div>

        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center text-gray-400 text-sm md:text-base font-medium uppercase tracking-wider mb-6"
        >
          Trusted By Organizations Across
        </motion.p>

        {/* Industry Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          {industries.map((industry, i) => (
            <motion.span
              key={industry}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-[#00f0ff]/15 backdrop-blur-sm text-gray-300 text-sm font-medium hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/[0.06] transition-all duration-300 cursor-default"
            >
              {industry}
            </motion.span>
          ))}
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <Icon className="w-4 h-4 text-[#00f0ff]/60 mb-1" />
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                <span className="text-gray-500 text-xs text-center">{stat.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}