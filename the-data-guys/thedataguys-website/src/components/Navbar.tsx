import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const navSections = [
  { id: 'home', label: 'Home' },
  { id: 'meet-d', label: 'About' },
  { id: 'living-data-house', label: 'Services' },
  { id: 'industry-blueprints', label: 'Industries' },
  { id: 'data-house-assessment', label: 'Assessment' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.3,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    navSections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-strong py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => scrollToSection('home')} className="flex items-center">
          <span className="text-xl font-bold gradient-text">The Data Guys<span className="text-[#00f0ff] text-[0.65em] align-super">™</span></span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="relative text-sm text-gray-300 hover:text-[#00f0ff] transition-colors duration-300 py-1"
            >
              {section.label}
              {activeSection === section.id && (
                <motion.span
                  layoutId="navbar-active-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#00f0ff] rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(0, 240, 255, 0.6)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => scrollToSection('contact')}
          className="hidden md:inline-flex btn-glow px-5 py-2.5 rounded-full text-sm"
        >
          Book a Consultation
        </button>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong mt-2 mx-4 rounded-2xl p-6 animate-slide-up">
          <div className="flex flex-col gap-4">
            {navSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-left transition-colors py-2 ${
                  activeSection === section.id
                    ? 'text-[#00f0ff]'
                    : 'text-gray-300 hover:text-[#00f0ff]'
                }`}
              >
                {section.label}
              </button>
            ))}
            <button
              onClick={() => scrollToSection('contact')}
              className="btn-glow px-5 py-2.5 rounded-full text-sm text-center mt-2"
            >
              Book a Consultation
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}