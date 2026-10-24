import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Package, TrendingUp, Star, 
  Layers, Compass, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface Level {
  id: number;
  name: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  actions: string[];
  timeline: string;
  outcomes: string[];
}

const levels: Level[] = [
  {
    id: 1,
    name: 'Activity',
    tagline: 'We measure what happened.',
    icon: Activity,
    color: '#ef4444',
    actions: [
      'Implement basic event tracking across systems',
      'Create standardized activity logs',
      'Establish baseline metrics for all departments',
      'Deploy automated data collection pipelines',
    ],
    timeline: '2-4 months',
    outcomes: ['Complete visibility into organizational activities', 'Elimination of data blind spots', 'Foundation for advanced analytics'],
  },
  {
    id: 2,
    name: 'Outputs',
    tagline: 'We measure what we delivered.',
    icon: Package,
    color: '#f97316',
    actions: [
      'Define output metrics for each team and project',
      'Build automated reporting dashboards',
      'Implement quality scoring for deliverables',
      'Create output-to-resource efficiency ratios',
    ],
    timeline: '3-5 months',
    outcomes: ['Clear accountability for deliverables', 'Resource optimization insights', 'Performance benchmarking capability'],
  },
  {
    id: 3,
    name: 'Outcomes',
    tagline: 'We measure improvements.',
    icon: TrendingUp,
    color: '#eab308',
    actions: [
      'Map outputs to measurable outcomes',
      'Implement before/after comparison frameworks',
      'Build outcome attribution models',
      'Create stakeholder satisfaction tracking',
    ],
    timeline: '4-6 months',
    outcomes: ['Evidence-based program evaluation', 'Clear ROI on initiatives', 'Data-driven resource allocation'],
  },
  {
    id: 4,
    name: 'Impact',
    tagline: 'We measure meaningful change.',
    icon: Star,
    color: '#22c55e',
    actions: [
      'Develop long-term impact measurement frameworks',
      'Implement longitudinal tracking systems',
      'Build community/stakeholder impact dashboards',
      'Create impact storytelling with data',
    ],
    timeline: '4-8 months',
    outcomes: ['Compelling impact narratives for funders', 'Strategic alignment with mission', 'Increased stakeholder confidence'],
  },
  {
    id: 5,
    name: 'Predictive',
    tagline: 'We forecast future outcomes.',
    icon: Layers,
    color: '#3b82f6',
    actions: [
      'Deploy machine learning prediction models',
      'Build scenario planning tools',
      'Implement early warning systems',
      'Create predictive resource allocation',
    ],
    timeline: '5-9 months',
    outcomes: ['Proactive decision-making', 'Risk mitigation before issues arise', 'Optimized future planning'],
  },
  {
    id: 6,
    name: 'Prescriptive',
    tagline: 'We recommend actions.',
    icon: Compass,
    color: '#00f0ff',
    actions: [
      'Build AI-powered recommendation engines',
      'Implement automated decision support systems',
      'Create real-time optimization algorithms',
      'Deploy autonomous action triggers',
    ],
    timeline: '6-12 months',
    outcomes: ['Autonomous optimization at scale', 'AI-augmented strategic decisions', 'Maximum organizational intelligence'],
  },
];

export default function ImpactMaturityModel() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const targetLevel = selectedLevel ? Math.min(selectedLevel + 2, 6) : null;

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="impact-maturity" className="relative py-24 md:py-32 bg-[#0a0e1a] overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-[#00f0ff]/[0.03] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Self-Assessment
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Impact Maturity Model™
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Where are you today? Click your current level to see your personalized growth path.
          </p>
        </motion.div>

        {/* Level Steps */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {levels.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              onClick={() => setSelectedLevel(level.id)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 rounded-xl border text-center transition-all duration-300 ${
                selectedLevel === level.id
                  ? 'bg-white/[0.08] border-[#00f0ff]/50 shadow-[0_0_25px_rgba(0,240,255,0.15)]'
                  : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-all ${
                  selectedLevel === level.id ? 'shadow-[0_0_15px_rgba(0,240,255,0.3)]' : ''
                }`}
                style={{ backgroundColor: `${level.color}20`, border: `1px solid ${level.color}40` }}
              >
                <level.icon className="w-5 h-5" style={{ color: level.color }} />
              </div>
              <div className="text-xs font-mono text-gray-500 mb-1">Level {level.id}</div>
              <div className="text-white text-sm font-bold mb-1">{level.name}</div>
              <div className="text-gray-500 text-xs leading-tight">{level.tagline}</div>
            </motion.button>
          ))}
        </div>

        {/* Gap Analysis Panel */}
        <AnimatePresence>
          {selectedLevel && targetLevel && (
            <motion.div
              initial={{ opacity: 0, y: 30, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 30, height: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-white/[0.04] border border-[#00f0ff]/20 backdrop-blur-md p-6 md:p-8">
                {/* Current vs Target */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">Current Level</div>
                    <div className="text-2xl font-black text-white">
                      Level {selectedLevel}: {levels[selectedLevel - 1].name}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#00f0ff] hidden md:block" />
                  <div className="text-center">
                    <div className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-1">Recommended Target</div>
                    <div className="text-2xl font-black bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
                      Level {targetLevel}: {levels[targetLevel - 1].name}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recommended Actions */}
                  <div className="md:col-span-2">
                    <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-4">
                      Recommended Actions to Reach Level {targetLevel}
                    </h4>
                    <div className="space-y-3">
                      {levels[targetLevel - 1].actions.map((action, i) => (
                        <motion.div
                          key={action}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#00f0ff] mt-0.5 shrink-0" />
                          <span className="text-gray-300 text-sm">{action}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline & Outcomes */}
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-2">
                        Estimated Timeline
                      </h4>
                      <p className="text-white text-xl font-bold">{levels[targetLevel - 1].timeline}</p>
                      <p className="text-gray-500 text-xs mt-1">With dedicated implementation</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <h4 className="text-[#00f0ff] text-xs font-mono uppercase tracking-wider mb-3">
                        Expected Outcomes
                      </h4>
                      <ul className="space-y-2">
                        {levels[targetLevel - 1].outcomes.map((outcome) => (
                          <li key={outcome} className="text-gray-400 text-xs flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={scrollToContact}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm"
                  >
                    Get Your Personalized Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}