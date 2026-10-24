import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Clock, DollarSign, Copy, Timer, AlertTriangle, ArrowRight, Calculator } from 'lucide-react';

const costCards = [
  {
    title: 'Manual Reporting',
    metric: '$140,400/year',
    description: 'Staff hours spent compiling reports that should be automated',
    icon: Clock,
  },
  {
    title: 'Missed Funding Opportunities',
    metric: '$250,000+/year',
    description: "Grants lost because you couldn't prove impact fast enough",
    icon: DollarSign,
  },
  {
    title: 'Duplicate Work',
    metric: '20-40% productivity loss',
    description: 'Teams rebuilding what already exists in disconnected systems',
    icon: Copy,
  },
  {
    title: 'Delayed Decisions',
    metric: 'Weeks instead of hours',
    description: 'Leadership waiting on data that should be at their fingertips',
    icon: Timer,
  },
  {
    title: 'Poor Data Quality',
    metric: 'Costly mistakes and rework',
    description: 'Bad data leading to wrong decisions and wasted resources',
    icon: AlertTriangle,
  },
];

function AnimatedNumber({ value, prefix = '$', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false });
  const prevValue = useRef(0);

  useEffect(() => {
    if (!isInView) return;

    const start = prevValue.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, isInView]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export default function BrokenDataHouseCost() {
  const [hours, setHours] = useState(10);
  const [wage, setWage] = useState(45);
  const [staff, setStaff] = useState(3);

  const weeklyCost = hours * wage * staff;
  const monthlyCost = Math.round(weeklyCost * 4.33);
  const annualCost = weeklyCost * 52;
  const threeYearCost = annualCost * 3;

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="broken-data-cost" className="relative z-10 py-20 md:py-28">
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
            What Does A Broken Data House <span className="text-[#00f0ff]">Cost?</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            People buy pain relief. Not dashboards. Calculate your manual tax below.
          </p>
        </motion.div>

        {/* Interactive Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16"
        >
          {/* Inputs Card */}
          <div className="rounded-2xl border border-[#00f0ff]/20 bg-white/[0.03] backdrop-blur-md p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-[#00f0ff]" />
              </div>
              <h3 className="text-white font-semibold text-lg">Your Manual Tax Calculator</h3>
            </div>

            {/* Hours per week slider */}
            <div className="mb-6">
              <label className="flex items-center justify-between text-sm text-gray-300 mb-2">
                <span>Hours/week on manual reporting</span>
                <span className="text-[#00f0ff] font-mono font-bold">{hours}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={40}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#1e293b] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)] [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00f0ff] [&::-moz-range-thumb]:border-0"
                style={{
                  background: `linear-gradient(to right, #00f0ff ${((hours - 1) / 39) * 100}%, #1e293b ${((hours - 1) / 39) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1h</span>
                <span>40h</span>
              </div>
            </div>

            {/* Average hourly wage */}
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2">
                Average hourly wage of reporting staff
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00f0ff] font-bold">$</span>
                <input
                  type="number"
                  min={15}
                  max={200}
                  value={wage}
                  onChange={(e) => setWage(Math.max(15, Number(e.target.value)))}
                  className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#0f172a] border border-[#00f0ff]/20 text-white font-mono focus:outline-none focus:border-[#00f0ff]/60 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>
            </div>

            {/* Number of staff */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Number of staff involved in reporting
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={staff}
                onChange={(e) => setStaff(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#00f0ff]/20 text-white font-mono focus:outline-none focus:border-[#00f0ff]/60 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="rounded-2xl border border-[#00f0ff]/30 bg-gradient-to-br from-[#00f0ff]/[0.05] to-[#3b82f6]/[0.03] backdrop-blur-md p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg mb-6">Your Manual Reporting Cost</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-gray-400 text-sm">Weekly</span>
                  <span className="text-white font-bold text-lg font-mono">
                    <AnimatedNumber value={weeklyCost} />
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-gray-400 text-sm">Monthly</span>
                  <span className="text-white font-bold text-lg font-mono">
                    <AnimatedNumber value={monthlyCost} />
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-[#00f0ff]/[0.05] border border-[#00f0ff]/20">
                  <span className="text-gray-300 text-sm font-medium">Annual</span>
                  <span className="text-[#00f0ff] font-bold text-2xl font-mono drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                    <AnimatedNumber value={annualCost} />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-red-500/[0.08] border border-red-500/20">
              <p className="text-red-300/90 text-sm leading-relaxed">
                In 3 years, that&apos;s{' '}
                <span className="text-red-300 font-bold font-mono">
                  <AnimatedNumber value={threeYearCost} />
                </span>{' '}
                spent on manual work that could be automated.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Industry Averages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h3 className="text-xl font-semibold text-white mb-6 text-center">
            What other organizations are losing:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {costCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className="group relative rounded-2xl border border-[#00f0ff]/15 bg-white/[0.03] backdrop-blur-md p-6 hover:border-[#00f0ff]/35 hover:bg-[#00f0ff]/[0.04] transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-2xl bg-[#00f0ff]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#00f0ff]" />
                      </div>
                      <h3 className="text-white font-semibold text-sm">{card.title}</h3>
                    </div>

                    <p className="text-[#00f0ff] font-bold text-xl md:text-2xl mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                      {card.metric}
                    </p>

                    <p className="text-gray-400 text-sm leading-relaxed">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
            onClick={scrollToContact}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/40 text-white font-semibold hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300"
          >
            Stop Paying The Manual Tax → Book Strategy Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}