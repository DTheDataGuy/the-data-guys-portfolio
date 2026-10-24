import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavSection {
  id: string;
  label: string;
}

const sections: NavSection[] = [
  { id: 'home', label: 'Overview' },
  { id: 'living-data-house', label: 'Data House' },
  { id: 'impact-framework', label: 'Framework' },
  { id: 'industry-blueprints', label: 'Industry' },
  { id: 'data-house-assessment', label: 'Assessment' },
  { id: 'roi-calculator', label: 'Calculators' },
  { id: 'transformation-roadmap', label: 'Roadmap' },
  { id: 'resource-center', label: 'Resources' },
  { id: 'contact', label: 'Book Session' },
];

export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState('home');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    const observerOptions: IntersectionObserverInit = {
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-start gap-3"
          aria-label="Page navigation"
        >
          <div className="relative rounded-full py-4 px-2 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col items-center gap-3">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                const isHovered = hoveredSection === section.id;

                return (
                  <div
                    key={section.id}
                    className="relative flex items-center"
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.6)] scale-150'
                          : 'bg-white/30 hover:bg-white/60 hover:scale-125'
                      }`}
                      aria-label={`Navigate to ${section.label}`}
                      aria-current={isActive ? 'true' : undefined}
                    />

                    {/* Label tooltip */}
                    <AnimatePresence>
                      {(isHovered || isActive) && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute left-5 whitespace-nowrap text-[10px] font-medium tracking-wide px-2 py-1 rounded-md ${
                            isActive
                              ? 'text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20'
                              : 'text-gray-400 bg-white/5 border border-white/10'
                          }`}
                        >
                          {section.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}