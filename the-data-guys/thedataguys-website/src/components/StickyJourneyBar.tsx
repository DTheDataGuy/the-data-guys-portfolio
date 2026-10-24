import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JourneyStep {
  id: string;
  label: string;
  sectionId: string;
}

const journeySteps: JourneyStep[] = [
  { id: 'org', label: 'Choose Organization', sectionId: 'industry-selector' },
  { id: 'goal', label: 'Choose Goal', sectionId: 'problems-we-solve' },
  { id: 'explore', label: 'Explore House', sectionId: 'living-data-house' },
  { id: 'assess', label: 'Assess Data House', sectionId: 'data-house-assessment' },
  { id: 'roadmap', label: 'Get Roadmap', sectionId: 'transformation-roadmap' },
  { id: 'session', label: 'Book Session', sectionId: 'contact' },
];

export default function StickyJourneyBar() {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('home');
      const contactEl = document.getElementById('contact');

      if (!heroEl) return;

      const heroRect = heroEl.getBoundingClientRect();
      const heroVisible = heroRect.bottom > 200;

      let contactFullyVisible = false;
      if (contactEl) {
        const contactRect = contactEl.getBoundingClientRect();
        contactFullyVisible = contactRect.top < window.innerHeight * 0.5;
      }

      setVisible(!heroVisible && !contactFullyVisible);

      // Determine active step based on scroll position
      let currentActive = 0;
      for (let i = journeySteps.length - 1; i >= 0; i--) {
        const el = document.getElementById(journeySteps[i].sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5) {
            currentActive = i;
            break;
          }
        }
      }
      setActiveStep(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e1a]/90 backdrop-blur-xl border-t border-white/10"
        >
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              {journeySteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => scrollToSection(step.sectionId)}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="relative flex flex-col items-center gap-1.5 group flex-1"
                >
                  {/* Connector line */}
                  {index < journeySteps.length - 1 && (
                    <div className="absolute top-[9px] left-[calc(50%+8px)] right-[calc(-50%+8px)] h-px hidden md:block">
                      <div
                        className={`h-full transition-colors duration-300 ${
                          index < activeStep ? 'bg-[#00f0ff]/50' : 'bg-white/10'
                        }`}
                      />
                    </div>
                  )}

                  {/* Dot */}
                  <div
                    className={`relative w-[18px] h-[18px] rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      index <= activeStep
                        ? 'border-[#00f0ff] bg-[#00f0ff]/20'
                        : 'border-white/20 bg-transparent'
                    } ${index === activeStep ? 'shadow-[0_0_12px_rgba(0,240,255,0.4)]' : ''}`}
                  >
                    {index <= activeStep && (
                      <div className="w-2 h-2 rounded-full bg-[#00f0ff]" />
                    )}
                  </div>

                  {/* Label - hidden on mobile, shown on desktop */}
                  <span
                    className={`hidden md:block text-[10px] font-medium transition-colors duration-300 whitespace-nowrap ${
                      index <= activeStep ? 'text-[#00f0ff]' : 'text-gray-500'
                    } group-hover:text-[#00f0ff]`}
                  >
                    {step.label}
                  </span>

                  {/* Mobile tooltip on hover */}
                  <AnimatePresence>
                    {hoveredStep === index && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 md:hidden px-2 py-1 rounded bg-[#0f172a] border border-[#00f0ff]/20 text-[#00f0ff] text-[9px] whitespace-nowrap"
                      >
                        {step.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}