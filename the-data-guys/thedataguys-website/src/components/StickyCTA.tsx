import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import MagneticButton from './MagneticButton';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (roughly 100vh)
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Desktop: bottom-right pill */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="hidden md:block fixed bottom-6 right-6 z-[9999]"
          >
            <MagneticButton strength={4}>
              <a
                href="https://calendly.com/thedataguys-info/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#0a0e1a]/80 border border-[#00f0ff]/40 backdrop-blur-xl text-[#00f0ff] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:border-[#00f0ff]/70 transition-all duration-300 cursor-pointer no-underline"
              >
                <Calendar size={16} />
                Book Strategy Session
              </a>
            </MagneticButton>
          </motion.div>

          {/* Mobile: full-width bottom bar */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] p-3 bg-[#0a0e1a]/90 border-t border-[#00f0ff]/20 backdrop-blur-xl"
          >
            <MagneticButton strength={3}>
              <a
                href="https://calendly.com/thedataguys-info/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] no-underline"
              >
                <Calendar size={16} />
                Book Free Session
              </a>
            </MagneticButton>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}