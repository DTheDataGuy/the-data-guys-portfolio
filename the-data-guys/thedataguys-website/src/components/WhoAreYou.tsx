import { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePersona, type PersonaType } from '@/contexts/PersonaContext';
import { Check } from 'lucide-react';

interface PersonaOption {
  id: NonNullable<PersonaType>;
  emoji: string;
  label: string;
  painPoints: string[];
}

const personas: PersonaOption[] = [
  {
    id: 'nonprofit',
    emoji: '📊',
    label: 'Nonprofit / Foundation',
    painPoints: [
      'Struggling to prove program impact to funders',
      'Disconnected data across grants & programs',
      'Manual reporting consuming staff time',
    ],
  },
  {
    id: 'construction',
    emoji: '🏗️',
    label: 'Construction',
    painPoints: [
      'Project cost overruns from poor data visibility',
      'Siloed job-site and back-office systems',
      'Safety & compliance tracking gaps',
    ],
  },
  {
    id: 'government',
    emoji: '🏛️',
    label: 'Government',
    painPoints: [
      'Citizen service data scattered across departments',
      'Compliance reporting is time-intensive',
      'Budget allocation lacks real-time insights',
    ],
  },
  {
    id: 'economic-development',
    emoji: '📈',
    label: 'Economic Development',
    painPoints: [
      'No unified view of community growth metrics',
      'Workforce data disconnected from outcomes',
      'Difficulty measuring program ROI',
    ],
  },
  {
    id: 'education',
    emoji: '🎓',
    label: 'Education',
    painPoints: [
      'Student outcome data lives in multiple systems',
      'Hard to identify at-risk students early',
      'Enrollment & retention trends unclear',
    ],
  },
];

const confirmationItems = (label: string) => [
  `Showing ${label} dashboards`,
  `Showing ${label} KPIs`,
  `Showing ${label} case studies`,
  `Showing ${label} resources`,
];

export default function WhoAreYou() {
  const { persona, setPersona } = usePersona();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const selectedPersona = personas.find((p) => p.id === persona);

  return (
    <section
      id="who-are-you"
      ref={sectionRef}
      className="relative py-20 md:py-28 px-6 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#00f0ff]/[0.02] blur-[150px]" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Personalize Your Experience
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-white">
            Who Are You?
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Select your organization type and we&apos;ll tailor dashboards, KPIs, and resources to your world.
          </p>
        </motion.div>

        {/* Persona Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((p, index) => {
            const isSelected = persona === p.id;
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.08 }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPersona(p.id)}
                className={`relative rounded-2xl p-6 text-left backdrop-blur-xl transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'border-[#00f0ff]/70 bg-[#00f0ff]/[0.08] shadow-[0_0_40px_rgba(0,240,255,0.2)]'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-[#00f0ff]/30 hover:bg-white/[0.05]'
                }`}
              >
                {/* Checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#00f0ff] flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-[#0a0e1a]" strokeWidth={3} />
                  </motion.div>
                )}

                <div className="text-3xl mb-3">{p.emoji}</div>
                <h3
                  className={`font-bold text-base mb-3 ${
                    isSelected ? 'text-[#00f0ff]' : 'text-white'
                  }`}
                >
                  {p.label}
                </h3>
                <ul className="space-y-1.5">
                  {p.painPoints.map((point) => (
                    <li
                      key={point}
                      className="text-gray-400 text-xs leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-[#00f0ff]/60 mt-0.5 shrink-0">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.button>
            );
          })}
        </div>

        {/* Confirmation Section */}
        <AnimatePresence>
          {selectedPersona && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-10 overflow-hidden"
            >
              <div className="rounded-2xl bg-white/[0.03] border border-[#00f0ff]/20 backdrop-blur-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{selectedPersona.emoji}</span>
                  <span className="text-white font-semibold text-lg">
                    Personalized for{' '}
                    <span className="text-[#00f0ff]">{selectedPersona.label}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {confirmationItems(selectedPersona.label).map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#00f0ff]/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-[#00f0ff]" strokeWidth={3} />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}