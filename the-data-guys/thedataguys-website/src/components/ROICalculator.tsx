import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, Users, TrendingDown, ArrowRight } from 'lucide-react';

export default function ROICalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [hourlyWage, setHourlyWage] = useState(45);
  const [employees, setEmployees] = useState(3);

  const results = useMemo(() => {
    const annualCost = hoursPerWeek * hourlyWage * employees * 52;
    const annualSavings = annualCost * 0.7;
    const fiveYearSavings = annualSavings * 5;
    return { annualCost, annualSavings, fiveYearSavings };
  }, [hoursPerWeek, hourlyWage, employees]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="roi-calculator" className="relative z-10 py-20 md:py-28 bg-[#0a0e1a]">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-4">
            <TrendingDown size={12} />
            HIDDEN COST CALCULATOR
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            What Is Manual Reporting{' '}
            <span className="bg-gradient-to-r from-red-400 to-[#00f0ff] bg-clip-text text-transparent">
              Costing You?
            </span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            See how much time and money your organization wastes on manual data work.
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 md:p-10"
        >
          {/* Inputs */}
          <div className="space-y-8 mb-10">
            {/* Hours per week */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                  <Clock size={16} className="text-[#00f0ff]/70" />
                  Hours per week spent on reporting
                </label>
                <span className="text-[#00f0ff] font-bold text-lg font-mono">{hoursPerWeek}h</span>
              </div>
              <input
                type="range"
                min={1}
                max={80}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,240,255,0.5)] [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00f0ff] [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1h</span>
                <span>80h</span>
              </div>
            </div>

            {/* Hourly wage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                  <DollarSign size={16} className="text-[#00f0ff]/70" />
                  Average hourly wage of reporting staff
                </label>
                <span className="text-[#00f0ff] font-bold text-lg font-mono">${hourlyWage}</span>
              </div>
              <input
                type="range"
                min={15}
                max={150}
                value={hourlyWage}
                onChange={(e) => setHourlyWage(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,240,255,0.5)] [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00f0ff] [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>$15</span>
                <span>$150</span>
              </div>
            </div>

            {/* Number of employees */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                  <Users size={16} className="text-[#00f0ff]/70" />
                  Number of employees involved
                </label>
                <span className="text-[#00f0ff] font-bold text-lg font-mono">{employees}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,240,255,0.5)] [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00f0ff] [&::-moz-range-thumb]:border-0"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent mb-10" />

          {/* Results */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${hoursPerWeek}-${hourlyWage}-${employees}`}
              initial={{ opacity: 0.7, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
            >
              <div className="text-center p-5 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Annual Reporting Cost</p>
                <p className="text-2xl md:text-3xl font-black text-red-400 font-mono">
                  {formatCurrency(results.annualCost)}
                </p>
              </div>
              <div className="text-center p-5 rounded-xl bg-[#00f0ff]/[0.06] border border-[#00f0ff]/20">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Annual Savings (70%)</p>
                <p className="text-2xl md:text-3xl font-black text-[#00f0ff] font-mono drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  {formatCurrency(results.annualSavings)}
                </p>
              </div>
              <div className="text-center p-5 rounded-xl bg-[#00f0ff]/[0.08] border border-[#00f0ff]/30">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">5-Year Savings</p>
                <p className="text-2xl md:text-3xl font-black text-[#00f0ff] font-mono drop-shadow-[0_0_16px_rgba(0,240,255,0.5)]">
                  {formatCurrency(results.fiveYearSavings)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CTA */}
          <div className="text-center">
            <motion.button
              onClick={() => scrollTo('contact')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Eliminate This Waste <ArrowRight size={18} />
            </motion.button>
          </div>
        </motion.div>

        {/* Revenue Impact Examples */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-center text-xl md:text-2xl font-bold text-white mb-8">
            Real Revenue Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: 'Chamber',
                detail: '$45K investment → $310K annual operational value',
                highlight: '7x ROI',
              },
              {
                label: 'Nonprofit',
                detail: '3x grant reporting efficiency → $1.2M additional funding opportunities',
                highlight: '$1.2M',
              },
              {
                label: 'Construction',
                detail: '$12M cost avoidance through integrated project intelligence',
                highlight: '$12M',
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="rounded-xl border border-[#00f0ff]/15 bg-white/[0.02] backdrop-blur-sm p-5 hover:border-[#00f0ff]/30 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.5)]" />
                  <span className="text-white font-bold text-sm uppercase tracking-wider">{card.label}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-3">{card.detail}</p>
                <span className="inline-block px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold font-mono">
                  {card.highlight}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}