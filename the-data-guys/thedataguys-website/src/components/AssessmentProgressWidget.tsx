import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAssessment } from '@/contexts/AssessmentContext';

const FLOORS = [
  { number: 9, name: 'Roof', emoji: '🏠', label: 'AI & Automation' },
  { number: 8, name: 'Visualization', emoji: '📊', label: 'Visualization' },
  { number: 7, name: 'Processing', emoji: '⚙', label: 'Processing' },
  { number: 6, name: 'Storage', emoji: '🗄', label: 'Storage' },
  { number: 5, name: 'Ingestion', emoji: '📥', label: 'Ingestion' },
  { number: 4, name: 'Systems', emoji: '🔗', label: 'Systems' },
  { number: 3, name: 'Processes', emoji: '⚙', label: 'Processes' },
  { number: 2, name: 'People', emoji: '👥', label: 'People' },
  { number: 1, name: 'Governance', emoji: '🏛', label: 'Governance' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return 'from-green-400 to-green-600';
  if (score >= 60) return 'from-cyan-400 to-cyan-600';
  if (score >= 40) return 'from-yellow-400 to-yellow-600';
  return 'from-red-400 to-red-600';
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-green-500/50';
  if (score >= 60) return 'border-cyan-500/50';
  if (score >= 40) return 'border-yellow-500/50';
  return 'border-red-500/50';
}

export default function AssessmentProgressWidget() {
  const { progress, isLoggedIn, isLoading } = useAssessment();
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't show if not logged in or no progress yet
  if (!isLoggedIn || isLoading || progress.length === 0) {
    return null;
  }

  const completedCount = progress.filter((p) => p.completed).length;
  const totalFloors = 9;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative"
          >
            {/* Collapse button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0f172a] border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors z-10"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Main widget */}
            <div className="w-[140px] rounded-2xl border border-white/10 bg-[#0a0e1a]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.08)] overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-white/[0.06] text-center">
                <p className="text-[9px] font-mono text-[#00f0ff]/70 uppercase tracking-wider">Data House</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {completedCount}/{totalFloors} floors
                </p>
              </div>

              {/* Floors */}
              <div className="p-2 space-y-1">
                {/* Roof triangle */}
                <div className="flex justify-center mb-1">
                  <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#00f0ff]/10" />
                </div>

                {FLOORS.map((floor) => {
                  const floorProgress = progress.find((p) => p.floor_number === floor.number);
                  const isCompleted = floorProgress?.completed;
                  const score = floorProgress?.score ?? 0;

                  return (
                    <motion.div
                      key={floor.number}
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: (9 - floor.number) * 0.05, duration: 0.3 }}
                      className={`relative h-7 rounded-sm border flex items-center justify-between px-2 overflow-hidden transition-all duration-300 ${
                        isCompleted
                          ? `${getScoreBorderColor(score)} bg-white/[0.03]`
                          : 'border-white/[0.06] bg-white/[0.01]'
                      }`}
                    >
                      {/* Fill bar */}
                      {isCompleted && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getScoreColor(score)} opacity-20 rounded-sm`}
                        />
                      )}

                      <span className="text-[9px] text-gray-400 font-mono relative z-10 truncate">
                        {floor.emoji} {floor.number === 9 ? 'Roof' : `F${floor.number}`}
                      </span>

                      {isCompleted && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[9px] font-mono font-bold text-[#00f0ff] relative z-10"
                        >
                          {score}
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}

                {/* Ground line */}
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent mt-1" />
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-white/[0.06] text-center">
                <p className="text-[9px] font-mono text-gray-500">
                  {completedCount === totalFloors ? '✅ Complete!' : 'In Progress...'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => setIsExpanded(true)}
            className="w-10 h-10 rounded-full bg-[#0a0e1a]/90 backdrop-blur-xl border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/50 transition-all shadow-[0_0_20px_rgba(0,240,255,0.1)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}