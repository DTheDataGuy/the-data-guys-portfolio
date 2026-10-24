import { motion } from 'framer-motion';
import { Linkedin, Mail } from 'lucide-react';

const footerColumns = [
  {
    title: 'Explore',
    links: [
      { label: 'The Data House™', href: '#living-data-house' },
      { label: 'Data House Assessment', href: '#data-house-assessment' },
      { label: 'Impact Calculator', href: '#impact-equation' },
      { label: 'Industry Blueprints', href: '#industry-blueprints' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Data House Checklist', href: '#resource-center' },
      { label: 'KPI Starter Kits', href: '#resource-center' },
      { label: 'Governance Guide', href: '#resource-center' },
      { label: 'Free Resources', href: '#resource-center' },
    ],
  },
  {
    title: 'Industries',
    links: [
      { label: 'Construction', href: '#industry-blueprints' },
      { label: 'Nonprofits', href: '#industry-blueprints' },
      { label: 'Government', href: '#industry-blueprints' },
      { label: 'Economic Development', href: '#industry-blueprints' },
      { label: 'Small Business', href: '#industry-blueprints' },
    ],
  },
  {
    title: 'Work With Us',
    links: [
      { label: 'Book Strategy Session', href: 'https://calendly.com/thedataguys-info/30min', external: true },
      { label: 'Ask D.', href: '#ask-d' },
      { label: 'Contact', href: '#contact' },
      { label: 'Case Studies', href: '#real-client-stories' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative py-16 md:py-20 overflow-hidden">
      {/* Dark glass background */}
      <div className="absolute inset-0 bg-[#060a14]/90 backdrop-blur-xl border-t border-white/[0.05]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Logo + Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-black bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent mb-2">
              The Data Guys<span className="text-[#00f0ff] text-xs align-super">™</span>
            </h3>
            <p className="text-gray-400 text-xs font-mono tracking-wider uppercase mb-4">
              Getting Your Data House In Order
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Linkedin, href: 'https://www.linkedin.com/in/deimarlon?utm_source=share_via&utm_content=profile&utm_medium=member_ios' },
                { icon: Mail, href: 'mailto:info@thedataguys.org' },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-all duration-300"
                >
                  <social.icon size={14} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="text-white font-bold text-sm mb-4">{column.title}</h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...('external' in link && link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-gray-400 text-xs hover:text-[#00f0ff] transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.05]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs">
              © 2025 The Data Guys™. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}