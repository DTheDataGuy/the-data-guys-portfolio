import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowNode {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bullets: string[];
}

const flowNodes: FlowNode[] = [
  {
    id: 'people',
    name: 'PEOPLE',
    emoji: '👥',
    description: 'The humans who create, manage, and use data',
    bullets: [
      'Data owners identified',
      'Roles defined',
      'Training planned',
      'Culture of data literacy',
    ],
  },
  {
    id: 'process',
    name: 'PROCESS',
    emoji: '⚙️',
    description: 'How work gets done and data flows through it',
    bullets: [
      'Workflows documented',
      'Handoffs mapped',
      'Bottlenecks identified',
      'Standards established',
    ],
  },
  {
    id: 'systems',
    name: 'SYSTEMS',
    emoji: '🔗',
    description: 'The tools and platforms that hold your data',
    bullets: [
      'System inventory complete',
      'Integrations mapped',
      'Gaps identified',
      'Architecture planned',
    ],
  },
  {
    id: 'data',
    name: 'DATA',
    emoji: '📊',
    description: 'The raw information your organization collects',
    bullets: [
      'Sources cataloged',
      'Quality assessed',
      'Definitions agreed',
      'Governance in place',
    ],
  },
  {
    id: 'insights',
    name: 'INSIGHTS',
    emoji: '💡',
    description: 'Patterns and meaning extracted from clean data',
    bullets: [
      'Dashboards built',
      'Trends identified',
      'Anomalies flagged',
      'Context provided',
    ],
  },
  {
    id: 'decisions',
    name: 'DECISIONS',
    emoji: '🎯',
    description: 'Choices informed by reliable intelligence',
    bullets: [
      'Evidence-based choices',
      'Faster response times',
      'Risk-aware planning',
      'Strategic alignment',
    ],
  },
  {
    id: 'actions',
    name: 'ACTIONS',
    emoji: '📋',
    description: 'Steps taken based on data-driven decisions',
    bullets: [
      'Automated triggers',
      'Workflow optimization',
      'Resource allocation',
      'Performance tracking',
    ],
  },
  {
    id: 'outcomes',
    name: 'OUTCOMES',
    emoji: '📈',
    description: 'Measurable results from informed actions',
    bullets: [
      'KPIs improving',
      'Efficiency gains',
      'Cost reductions',
      'Service improvements',
    ],
  },
  {
    id: 'impact',
    name: 'IMPACT',
    emoji: '🏆',
    description: 'The lasting change your organization creates',
    bullets: [
      'Mission advancement',
      'Community benefit',
      'Stakeholder value',
      'Sustainable growth',
    ],
  },
];

export default function ImpactIntelligenceFramework() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeClick = (id: string) => {
    setSelectedNode(selectedNode === id ? null : id);
  };

  const activeNode = flowNodes.find((n) => n.id === selectedNode);

  return (
    <section
      id="impact-framework"
      className="relative py-24 md:py-32 bg-[#0a0e1a] overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00f0ff]/[0.03] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Proprietary Framework
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Impact Intelligence Framework™
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A visual flow from people to measurable impact
          </p>
        </motion.div>

        {/* Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          {/* Desktop: flex-wrap horizontal flow */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-y-6 gap-x-2">
            {flowNodes.map((node, index) => (
              <div key={node.id} className="flex items-center">
                {/* Node Card */}
                <motion.button
                  onClick={() => handleNodeClick(node.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer min-w-[100px] ${
                    selectedNode === node.id
                      ? 'bg-[#00f0ff]/[0.12] border-[#00f0ff]/60 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
                      : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-[#00f0ff]/30'
                  }`}
                >
                  <span className="text-2xl">{node.emoji}</span>
                  <span
                    className={`text-xs font-bold tracking-wider transition-colors duration-300 ${
                      selectedNode === node.id ? 'text-[#00f0ff]' : 'text-gray-300'
                    }`}
                  >
                    {node.name}
                  </span>
                  {/* Active indicator */}
                  {selectedNode === node.id && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00f0ff]"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </motion.button>

                {/* Arrow connector */}
                {index < flowNodes.length - 1 && (
                  <motion.div
                    className="flex items-center mx-1"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <motion.span
                      className="text-[#00f0ff]/50 text-lg font-light"
                      animate={{ opacity: [0.3, 0.8, 0.3], x: [0, 3, 0] }}
                      transition={{
                        duration: 2,
                        delay: index * 0.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile: vertical stack */}
          <div className="flex md:hidden flex-col items-center gap-3">
            {flowNodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {/* Node Card */}
                <motion.button
                  onClick={() => handleNodeClick(node.id)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer w-full max-w-[260px] ${
                    selectedNode === node.id
                      ? 'bg-[#00f0ff]/[0.12] border-[#00f0ff]/60 shadow-[0_0_25px_rgba(0,240,255,0.15)]'
                      : 'bg-white/[0.04] border-white/[0.08]'
                  }`}
                >
                  <span className="text-xl">{node.emoji}</span>
                  <span
                    className={`text-sm font-bold tracking-wider transition-colors duration-300 ${
                      selectedNode === node.id ? 'text-[#00f0ff]' : 'text-gray-300'
                    }`}
                  >
                    {node.name}
                  </span>
                </motion.button>

                {/* Arrow connector */}
                {index < flowNodes.length - 1 && (
                  <motion.div
                    className="flex items-center justify-center h-6"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{
                      duration: 2,
                      delay: index * 0.15,
                      repeat: Infinity,
                    }}
                  >
                    <span className="text-[#00f0ff]/50 text-sm">↓</span>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expanded Detail Panel */}
        <AnimatePresence mode="wait">
          {activeNode && (
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-8 rounded-2xl border border-[#00f0ff]/30 bg-white/[0.04] backdrop-blur-lg p-6 md:p-8 shadow-[0_0_40px_rgba(0,240,255,0.08)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{activeNode.emoji}</span>
                  <div>
                    <h3 className="text-white font-bold text-xl">
                      {activeNode.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {activeNode.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                  {activeNode.bullets.map((bullet, i) => (
                    <motion.div
                      key={bullet}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#00f0ff] shrink-0" />
                      <span className="text-gray-300 text-sm">{bullet}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="text-center text-gray-500 text-xs font-mono mt-10 tracking-wider"
        >
          {selectedNode
            ? 'Click another node to explore • Click again to collapse'
            : 'Click any node to explore the details'}
        </motion.p>
      </div>
    </section>
  );
}