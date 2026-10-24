import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart3, Lightbulb, DollarSign, Target, Zap, TrendingUp, Heart, HardHat, Landmark, ChevronDown } from 'lucide-react';

interface EducationalCard {
  id: string;
  title: string;
  preview: string;
  fullContent: string;
  icon: React.ReactNode;
}

const cards: EducationalCard[] = [
  {
    id: 'data-house',
    title: 'What is a Data House™?',
    preview: 'Your organization runs on data like a house runs on its foundation. Without a solid base, everything built on top is unstable.',
    fullContent: 'The Data House™ is a framework for understanding how data flows through your organization. Just like a physical house needs a strong foundation, walls, and roof, your data needs governance, clean collection, proper storage, and intelligent analysis layers. Most organizations skip the foundation and jump straight to dashboards,which is like putting a roof on sand. The Data House framework ensures you build each layer correctly before adding the next.',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: 'dashboards-fail',
    title: 'Why Dashboards Fail',
    preview: 'Most organizations build dashboards before fixing their data. The result? Beautiful charts showing inaccurate information.',
    fullContent: '80% of dashboard projects fail to deliver value because they visualize dirty, incomplete, or disconnected data. A dashboard is only as good as the data feeding it. Before investing in visualization tools, you need clean data pipelines, consistent collection processes, and validated sources. Organizations that fix their data foundation first see 5x more value from their dashboards than those who rush to visualization.',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: 'impact-intelligence',
    title: 'What Is Impact Intelligence?',
    preview: 'Impact Intelligence goes beyond tracking activities to measuring meaningful change in people\'s lives and communities.',
    fullContent: 'Impact Intelligence is the practice of measuring outcomes, not just outputs. Instead of counting how many people attended a workshop, you measure how their behavior changed afterward. Instead of tracking hours worked, you measure results delivered. This shift from activity tracking to outcome measurement transforms how organizations make decisions, allocate resources, and prove their value to stakeholders and funders.',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    id: 'cost-bad-data',
    title: 'The Cost Of Bad Data',
    preview: 'The average organization wastes 30% of revenue on decisions made with bad data. That\'s not a typo.',
    fullContent: 'IBM estimates that bad data costs the US economy $3.1 trillion annually. For individual organizations, poor data quality leads to wrong decisions, wasted marketing spend, lost customers, compliance failures, and missed opportunities. A mid-size company with $5M revenue typically wastes $1.5M on bad-data decisions. Fixing data quality isn\'t just an IT project,it\'s a revenue recovery initiative.',
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: 'measure-impact',
    title: 'How To Measure Impact',
    preview: 'The difference between outputs and outcomes is the difference between counting and understanding.',
    fullContent: 'Outputs are what you do: events held, emails sent, products shipped. Outcomes are what changed because of what you did: skills gained, revenue increased, communities improved. To measure impact, define your intended outcomes first, then work backward to identify leading indicators. Track both short-term changes (knowledge gained) and long-term shifts (behavior change, system improvement). This creates a chain of evidence from activity to impact.',
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: 'prepare-automation',
    title: 'How To Prepare For Automation',
    preview: 'You need clean data before automation works. Automating a broken process just creates broken results faster.',
    fullContent: 'Automation amplifies whatever you feed it. If your data is messy, automation will create mess at scale. Before automating any process, ensure: data inputs are consistent and validated, the process is documented and standardized, exception handling is defined, and success metrics are clear. Organizations that clean their data first see 10x ROI on automation investments compared to those who automate dirty processes.',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'data-revenue',
    title: 'How Data Creates Revenue',
    preview: 'Real examples of data-driven revenue growth: from customer segmentation to predictive pricing.',
    fullContent: 'Data creates revenue in four ways: better customer targeting (20-30% conversion improvement), optimized pricing (5-15% margin increase), reduced churn (identifying at-risk customers 60 days earlier), and new product development (data-informed features ship 3x faster). A construction company used project data to identify their most profitable job types and grew revenue 40% by focusing on them. A nonprofit used donor behavior data to increase giving by 25%.',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'nonprofit-mistakes',
    title: 'Common Nonprofit Data Mistakes',
    preview: 'Tracking activities instead of outcomes is the #1 mistake nonprofits make with their data.',
    fullContent: 'Nonprofits often track what\'s easy (attendance, hours served) instead of what matters (lives changed, skills gained). Other common mistakes: using spreadsheets as databases, not connecting program data to financial data, reporting only what funders ask for instead of what drives improvement, and treating data as a compliance requirement rather than a strategic asset. Fixing these mistakes typically reveals 2-3x more impact than organizations realize they\'re creating.',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 'construction-mistakes',
    title: 'Construction Reporting Mistakes',
    preview: 'Disconnected project systems mean you can\'t see true job costs until it\'s too late.',
    fullContent: 'Construction companies typically use 5-8 disconnected systems: estimating, project management, accounting, time tracking, equipment, and safety. When these don\'t talk to each other, you can\'t see real-time job costs, change order impact, or labor efficiency. By the time you discover a project is over budget, you\'ve already lost the margin. Connected data systems give you weekly cost visibility instead of quarterly surprises.',
    icon: <HardHat className="w-5 h-5" />,
  },
  {
    id: 'government-challenges',
    title: 'Government Data Challenges',
    preview: 'Balancing compliance requirements with actionable insight is the core tension in public sector data.',
    fullContent: 'Government agencies face unique data challenges: legacy systems that don\'t integrate, compliance requirements that prioritize documentation over insight, siloed departments with duplicate data, and public accountability demands. The solution isn\'t more reporting,it\'s smarter data architecture that satisfies compliance automatically while surfacing actionable insights for decision-makers. Modern data infrastructure can serve both masters without doubling the work.',
    icon: <Landmark className="w-5 h-5" />,
  },
];

function CardItem({ card, index }: { card: EducationalCard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-[#00f0ff]/20 transition-all duration-300 cursor-pointer group"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff] flex-shrink-0 group-hover:bg-[#00f0ff]/20 transition-colors">
            {card.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-white font-bold text-sm group-hover:text-[#00f0ff] transition-colors">
                {card.title}
              </h4>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </motion.div>
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed ml-12">
          {card.preview}
        </p>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/[0.05] ml-12">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {card.fullContent}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LearnDataStrategy() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="learn-data-strategy" ref={sectionRef} className="relative py-28 md:py-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.02] blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            Free Knowledge
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Learn Data Strategy{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              in 5 Minutes
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Knowledge that usually costs $5,000 in consulting fees. Free.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, idx) => (
            <CardItem key={card.id} card={card} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}