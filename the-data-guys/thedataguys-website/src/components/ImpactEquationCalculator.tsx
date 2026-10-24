import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, Calendar, Download } from 'lucide-react';
import { usePersona, type PersonaType } from '@/contexts/PersonaContext';

/* ─── Persona-specific configuration ─── */
interface PersonaLabels {
  valueLabel: string;
  valueDescription: string;
  valueExample: number;
  unitsLabel: string;
  unitsDescription: string;
  unitsExample: number;
  durationLabel: string;
  durationDescription: string;
  durationExample: number;
  confidenceDescription: string;
  confidenceExample: number;
  exampleNarrative: string;
}

const PERSONA_CONFIG: Record<NonNullable<PersonaType> | 'default', PersonaLabels> = {
  nonprofit: {
    valueLabel: 'Annual Value Per Participant',
    valueDescription: 'The estimated dollar value of outcomes created for each person your program serves annually (e.g., increased earnings, cost savings, improved health outcomes).',
    valueExample: 1500,
    unitsLabel: 'Participants Served',
    unitsDescription: 'Total number of individuals directly benefiting from your programs or services each year.',
    unitsExample: 500,
    durationLabel: 'Years of Impact',
    durationDescription: 'How many years the benefits continue after a participant completes your program.',
    durationExample: 3,
    confidenceDescription: 'How strong is the evidence that your program caused the outcomes (vs. other factors)?',
    confidenceExample: 60,
    exampleNarrative: 'If each participant creates $1,500 of annual value, 500 participants are served, impact lasts 3 years, and evidence suggests 60% attribution',
  },
  construction: {
    valueLabel: 'Annual Value Per Project',
    valueDescription: 'The estimated dollar value of efficiency gains, cost savings, or revenue increase per project when data systems are optimized.',
    valueExample: 75000,
    unitsLabel: 'Projects Influenced',
    unitsDescription: 'Number of active projects that benefit from improved data infrastructure and decision-making.',
    unitsExample: 12,
    durationLabel: 'Years of Benefit',
    durationDescription: 'How long the operational improvements continue delivering value across your project pipeline.',
    durationExample: 4,
    confidenceDescription: 'How confident are you that data improvements (vs. market conditions) drove the results?',
    confidenceExample: 70,
    exampleNarrative: 'If each project gains $75,000 in annual value, 12 projects are influenced, benefits last 4 years, and evidence suggests 70% attribution',
  },
  government: {
    valueLabel: 'Annual Value Per Resident',
    valueDescription: 'The estimated dollar value of improved services, reduced waste, or better outcomes delivered per resident through data-driven governance.',
    valueExample: 200,
    unitsLabel: 'Residents Impacted',
    unitsDescription: 'Total population served by the programs or services improved through better data infrastructure.',
    unitsExample: 25000,
    durationLabel: 'Years of Impact',
    durationDescription: 'How many years the policy or service improvements continue benefiting residents.',
    durationExample: 5,
    confidenceDescription: 'How strong is the evidence linking data improvements to resident outcomes?',
    confidenceExample: 50,
    exampleNarrative: 'If each resident receives $200 of annual value, 25,000 residents are impacted, impact lasts 5 years, and evidence suggests 50% attribution',
  },
  'economic-development': {
    valueLabel: 'Annual Value Per Business',
    valueDescription: 'The estimated economic value created per business through workforce development, investment attraction, or ecosystem improvements.',
    valueExample: 50000,
    unitsLabel: 'Businesses Supported',
    unitsDescription: 'Number of local businesses that benefit from your economic development data initiatives.',
    unitsExample: 40,
    durationLabel: 'Years of Growth',
    durationDescription: 'How many years the economic development outcomes sustain growth in the community.',
    durationExample: 4,
    confidenceDescription: 'How confident are you that your initiatives (vs. market trends) drove economic outcomes?',
    confidenceExample: 55,
    exampleNarrative: 'If each business gains $50,000 in annual value, 40 businesses are supported, growth lasts 4 years, and evidence suggests 55% attribution',
  },
  education: {
    valueLabel: 'Annual Value Per Student',
    valueDescription: 'The estimated dollar value of improved outcomes per student (e.g., higher graduation rates, better career readiness, reduced dropout costs).',
    valueExample: 3000,
    unitsLabel: 'Students Reached',
    unitsDescription: 'Total number of students whose educational outcomes improve through data-informed interventions.',
    unitsExample: 800,
    durationLabel: 'Years of Benefit',
    durationDescription: 'How many years the educational improvements continue benefiting students after intervention.',
    durationExample: 4,
    confidenceDescription: 'How strong is the evidence that data-driven changes caused improved student outcomes?',
    confidenceExample: 65,
    exampleNarrative: 'If each student gains $3,000 in annual value, 800 students are reached, benefits last 4 years, and evidence suggests 65% attribution',
  },
  default: {
    valueLabel: 'Annual Value Per Participant',
    valueDescription: 'The estimated dollar value of outcomes created for each person or entity your organization serves annually.',
    valueExample: 1500,
    unitsLabel: 'Participants Served',
    unitsDescription: 'Total number of individuals or entities directly benefiting from your programs or services.',
    unitsExample: 500,
    durationLabel: 'Years of Impact',
    durationDescription: 'How many years the benefits continue delivering value.',
    durationExample: 3,
    confidenceDescription: 'How strong is the evidence that your work caused the outcomes?',
    confidenceExample: 60,
    exampleNarrative: 'If each participant creates $1,500 of annual value, 500 participants are served, impact lasts 3 years, and evidence suggests 60% attribution',
  },
};

/* ─── Industry Presets ─── */
interface IndustryPreset {
  id: string;
  label: string;
  emoji: string;
  valuePerUnit: number;
  units: number;
  duration: number;
  confidence: number;
}

const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'nonprofit',
    label: 'Nonprofit',
    emoji: '💚',
    valuePerUnit: 2500,
    units: 500,
    duration: 3,
    confidence: 60,
  },
  {
    id: 'construction',
    label: 'Construction',
    emoji: '🏗️',
    valuePerUnit: 85000,
    units: 12,
    duration: 4,
    confidence: 70,
  },
  {
    id: 'government',
    label: 'Government',
    emoji: '🏛️',
    valuePerUnit: 300,
    units: 450,
    duration: 5,
    confidence: 50,
  },
  {
    id: 'economic-dev',
    label: 'Economic Dev',
    emoji: '📈',
    valuePerUnit: 50000,
    units: 200,
    duration: 4,
    confidence: 55,
  },
  {
    id: 'education',
    label: 'Education',
    emoji: '🎓',
    valuePerUnit: 4000,
    units: 2000,
    duration: 4,
    confidence: 65,
  },
  {
    id: 'small-business',
    label: 'Small Business',
    emoji: '🏪',
    valuePerUnit: 15000,
    units: 8,
    duration: 3,
    confidence: 70,
  },
];

/* ─── Animated number display ─── */
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef(displayValue);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const duration = 600;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(startRef.current + (value - startRef.current) * eased));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="tabular-nums">{formatCurrency(displayValue)}</span>;
}

/* ─── Tooltip label component ─── */
function TooltipLabel({ label, tooltip }: { label: string; tooltip: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex items-center gap-1.5 relative">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-gray-400 hover:text-[#00f0ff] transition-colors"
        type="button"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-20 w-60 p-2.5 rounded-lg bg-[#1e293b] border border-white/10 shadow-xl">
          <p className="text-gray-300 text-xs leading-relaxed">{tooltip}</p>
          <div className="absolute left-4 top-full w-2 h-2 bg-[#1e293b] border-r border-b border-white/10 transform rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */
function formatCurrency(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

function formatShortValue(val: number, prefix = '', suffix = ''): string {
  if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M${suffix}`;
  if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(0)}K${suffix}`;
  return `${prefix}${val.toLocaleString()}${suffix}`;
}

/* ─── Main Component ─── */
export default function ImpactEquationCalculator() {
  const { persona } = usePersona();
  const config = useMemo(
    () => PERSONA_CONFIG[persona ?? 'default'],
    [persona]
  );

  const [valuePerUnit, setValuePerUnit] = useState(config.valueExample);
  const [units, setUnits] = useState(config.unitsExample);
  const [duration, setDuration] = useState(config.durationExample);
  const [confidence, setConfidence] = useState(config.confidenceExample);

  // Reset values when persona changes
  useEffect(() => {
    setValuePerUnit(config.valueExample);
    setUnits(config.unitsExample);
    setDuration(config.durationExample);
    setConfidence(config.confidenceExample);
  }, [config]);

  const impactValue = Math.round((valuePerUnit * units * duration * confidence) / 100);

  const exampleImpact = Math.round(
    (config.valueExample * config.unitsExample * config.durationExample * config.confidenceExample) / 100
  );

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine max for value slider based on persona
  const valueMax = persona === 'government' ? 1000 : persona === 'construction' ? 500000 : persona === 'economic-development' ? 200000 : 50000;
  const valueStep = persona === 'government' ? 10 : persona === 'construction' ? 5000 : persona === 'economic-development' ? 2500 : 100;
  const unitsMax = persona === 'government' ? 100000 : persona === 'construction' ? 100 : persona === 'economic-development' ? 200 : 5000;
  const unitsStep = persona === 'government' ? 500 : persona === 'construction' ? 1 : persona === 'economic-development' ? 5 : 10;

  return (
    <section id="impact-equation" className="relative py-24 md:py-32 bg-[#0a0e1a] overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            📊 Interactive Tool
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Impact Equation™ Calculator
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Quantify the potential value of getting your data systems right, in language that makes sense for your organization.
          </p>
        </motion.div>

        {/* Industry Presets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
          <p className="text-white text-sm font-semibold text-center mb-1">
            Quick Start: Choose your industry
          </p>
          <p className="text-gray-400 text-xs text-center mb-4">
            or enter your own numbers below
          </p>
          <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {INDUSTRY_PRESETS.map((preset) => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setValuePerUnit(preset.valuePerUnit);
                  setUnits(preset.units);
                  setDuration(preset.duration);
                  setConfidence(preset.confidence);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border bg-white/[0.04] border-white/10 text-gray-300 hover:border-[#00f0ff]/50 hover:bg-[#00f0ff]/[0.08] hover:text-[#00f0ff] backdrop-blur-sm whitespace-nowrap"
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Formula Display - persona-specific */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
        >
          <p className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-3 text-center">
            The Data Guys™ Impact Formula
          </p>
          <p className="text-white text-sm md:text-base text-center leading-relaxed">
            <span className="text-[#00f0ff] font-bold">Estimated Impact</span>{' '}
            <span className="text-gray-400">=</span>{' '}
            <span className="text-[#22d3ee]">{config.valueLabel}</span>{' '}
            <span className="text-gray-400">×</span>{' '}
            <span className="text-[#22d3ee]">{config.unitsLabel}</span>{' '}
            <span className="text-gray-400">×</span>{' '}
            <span className="text-[#22d3ee]">{config.durationLabel}</span>{' '}
            <span className="text-gray-400">×</span>{' '}
            <span className="text-[#22d3ee]">Attribution Confidence</span>
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="rounded-2xl bg-white/[0.05] border border-[#00f0ff]/15 backdrop-blur-md p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Value Per Unit */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <TooltipLabel
                  label={config.valueLabel}
                  tooltip={config.valueDescription}
                />
                <span className="text-[#00f0ff] font-mono text-sm font-bold">
                  {formatShortValue(valuePerUnit, '$')}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                {config.valueDescription}
              </p>
              <input
                type="range"
                min={0}
                max={valueMax}
                step={valueStep}
                value={valuePerUnit}
                onChange={(e) => setValuePerUnit(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#00f0ff] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$0</span>
                <span>{formatShortValue(valueMax, '$')}</span>
              </div>
            </div>

            {/* Units Affected */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <TooltipLabel
                  label={config.unitsLabel}
                  tooltip={config.unitsDescription}
                />
                <span className="text-[#00f0ff] font-mono text-sm font-bold">
                  {units.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                {config.unitsDescription}
              </p>
              <input
                type="range"
                min={1}
                max={unitsMax}
                step={unitsStep}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#00f0ff] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>{unitsMax.toLocaleString()}</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <TooltipLabel
                  label={config.durationLabel}
                  tooltip={config.durationDescription}
                />
                <span className="text-[#00f0ff] font-mono text-sm font-bold">
                  {duration} {duration === 1 ? 'year' : 'years'}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                {config.durationDescription}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#00f0ff] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00f0ff] [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 year</span>
                <span>10 years</span>
              </div>
            </div>

            {/* Attribution Confidence */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <TooltipLabel
                  label="Attribution Confidence"
                  tooltip={config.confidenceDescription}
                />
                <span className="text-[#00f0ff] font-mono text-sm font-bold">
                  {confidence}%
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                {config.confidenceDescription}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Low Evidence', value: 30, icon: '📋' },
                  { label: 'Moderate Evidence', value: 60, icon: '📈' },
                  { label: 'Strong Evidence', value: 85, icon: '🎯' },
                  { label: 'Verified Impact', value: 95, icon: '✅' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setConfidence(preset.value)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                      confidence === preset.value
                        ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-[#00f0ff]/40 hover:text-gray-300'
                    }`}
                  >
                    {preset.icon} {preset.label} ({preset.value}%)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="text-center p-6 rounded-xl bg-gradient-to-r from-[#00f0ff]/[0.08] to-[#3b82f6]/[0.08] border border-[#00f0ff]/20 shadow-[0_0_40px_rgba(0,240,255,0.08)]">
            <p className="text-gray-400 text-sm font-mono uppercase tracking-wider mb-2">
              💰 Estimated Impact Value
            </p>
            <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#00f0ff] via-[#06b6d4] to-[#3b82f6] bg-clip-text text-transparent">
              <AnimatedNumber value={impactValue} />
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Over {duration} {duration === 1 ? 'year' : 'years'} at {confidence}% attribution confidence
            </p>
          </div>

          {/* Worked Example Explanation */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">📊</span>
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                  How It Works: Example
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {config.exampleNarrative}, estimated impact value equals{' '}
                  <span className="text-[#00f0ff] font-bold">{formatCurrency(exampleImpact)}</span>.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 mt-4 px-2">
            <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-gray-400 text-xs leading-relaxed">
              This is an estimate for planning purposes. A full impact model requires verified data, assumptions, and attribution review.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm"
            >
              <Download className="w-4 h-4" />
              Download Impact Report
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToContact}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#00f0ff]/40 text-[#00f0ff] font-bold text-sm hover:bg-[#00f0ff]/10 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book Strategy Session
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}