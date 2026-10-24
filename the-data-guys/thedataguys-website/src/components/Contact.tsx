import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Send, Mail, MapPin, Phone, Linkedin, Calendar, Loader2 } from 'lucide-react';
import { createClient } from '@metagptx/web-sdk';
import MagneticButton from './MagneticButton';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const bgRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    orgType: '',
    challenge: '',
    systems: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const client = createClient();
      const response = await client.apiCall.invoke({
        url: '/api/v1/contact/send-email',
        method: 'POST',
        data: {
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          orgType: formData.orgType,
          challenge: formData.challenge,
          systems: formData.systems,
        },
      });

      if (response.data?.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', organization: '', orgType: '', challenge: '', systems: '' });
        setTimeout(() => {
          window.open('https://calendly.com/thedataguys-info/30min', '_blank');
          setSubmitted(false);
        }, 1500);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    } catch {
      setErrorMessage('Failed to send your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'john@company.com' },
    { key: 'organization', label: 'Organization', type: 'text', placeholder: 'Acme Corp' },
  ];

  const orgTypes = ['Nonprofit', 'Government', 'Construction', 'Economic Development', 'Small Business', 'Enterprise', 'Other'];

  const contactCards = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'info@thedataguys.org',
      gradient: 'from-[#00f0ff] to-[#3b82f6]',
    },
    {
      icon: Phone,
      title: 'Call Us',
      detail: 'Schedule a call',
      gradient: 'from-[#3b82f6] to-[#8b5cf6]',
    },
    {
      icon: MapPin,
      title: 'Nationwide',
      detail: 'Serving clients everywhere',
      gradient: 'from-[#8b5cf6] to-[#00f0ff]',
    },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative py-28 md:py-36 overflow-hidden"
    >
      {/* Animated Mesh Gradient Background */}
      <div className="animated-mesh" />

      {/* Animated Background Ring */}
      <motion.div
        style={{ rotate: bgRotate, scale: bgScale }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none"
      >
        <div className="absolute inset-0 rounded-full border-2 border-[#00f0ff]/15 animate-pulse" />
        <div className="absolute inset-8 rounded-full border border-[#3b82f6]/10" />
        <div className="absolute inset-16 rounded-full border border-[#8b5cf6]/8" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Dramatic Split Layout Header */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16">
          {/* Left - Massive Bold Headline */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:sticky lg:top-32"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-8"
            >
              <span className="relative inline-flex items-center gap-2 px-6 py-2 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/5 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
                <span className="text-[#00f0ff] mono text-sm tracking-widest uppercase font-medium">
                  Start Your Journey
                </span>
              </span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] mb-8">
              <span className="block gradient-shift-text">
                Book Your Free
              </span>
              <span className="block text-white mt-2">
                Data House Strategy Session™
              </span>
            </h2>

            <p className="text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed mb-8">
              Walk away with a clear understanding of what systems need to connect, where reporting is breaking down, and what your first 30 days should look like.
            </p>

            <p className="text-gray-400 text-sm mb-6 italic">
              Not a sales pitch. A real strategy conversation.
            </p>

            {/* Calendly CTA */}
            <motion.a
              href="https://calendly.com/thedataguys-info/30min"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#8b5cf6] text-white font-bold text-lg shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] hover:scale-105 transition-all duration-300 mb-4"
            >
              <Calendar size={20} />
              Book a Free Strategy Session
            </motion.a>

            {/* Session Bullets */}
            <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 mb-8">
              {['System Mapping', 'Data House Score', 'Gap Analysis', '90-Day Roadmap'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-sm text-gray-300 font-medium">
                  <span className="text-[#00f0ff]">✓</span> {item}
                </span>
              ))}
            </div>

            {/* What Happens During Your Session */}
            <div className="relative group inline-block mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#8b5cf6] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative px-8 py-6 bg-[#0a0e1a] border border-[#00f0ff]/30 rounded-2xl backdrop-blur-xl">
                <p className="text-white font-bold text-lg mb-4">What Happens During Your Session?</p>
                <ul className="space-y-2.5 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>System Mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>Data House Score</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>Reporting Gap Analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>Quick Win Opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>Data Readiness Snapshot</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00f0ff] mt-0.5">✔</span>
                    <span>90-Day Action Plan</span>
                  </li>
                </ul>
                <p className="text-gray-400 text-xs mt-4">Walk away with a clear picture of where you stand and what to do next.</p>
                <p className="text-gray-400 text-xs mt-2">No commitment • 100% free • Personalized roadmap</p>
              </div>
            </div>

            {/* Contact Info Cards */}
            <div className="mt-12 space-y-4">
              {contactCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className="relative group/card cursor-pointer"
                >
                  <div className={`absolute -inset-px bg-gradient-to-r ${card.gradient} rounded-2xl opacity-0 group-hover/card:opacity-30 transition-opacity duration-300 blur-sm`} />
                  <div className="relative bg-[#0a0e1a]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 group-hover/card:border-[#00f0ff]/30 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                        <card.icon className="text-white" size={22} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{card.title}</p>
                        <p className="text-gray-400 text-sm">{card.detail}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Contact Form */}
          <motion.form
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onSubmit={handleSubmit}
            className="relative group"
          >
            {/* Form glow border */}
            <div className="absolute -inset-px bg-gradient-to-br from-[#00f0ff]/30 via-[#3b82f6]/20 to-[#8b5cf6]/30 rounded-3xl opacity-50 group-hover:opacity-80 transition-opacity blur-sm" />
            <div className="relative bg-[#0a0e1a]/90 backdrop-blur-2xl border border-[#00f0ff]/10 rounded-3xl p-8 md:p-12">
              <h3 className="text-2xl font-bold text-white mb-8">Book Your Data House Session</h3>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-5">
                {formFields.map((field, index) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="relative"
                  >
                    <label
                      className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                        focusedField === field.key || formData[field.key as keyof typeof formData]
                          ? 'top-2 text-xs text-[#00f0ff]'
                          : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'
                      }`}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full bg-[#0f172a]/80 border-2 rounded-2xl px-5 pt-7 pb-4 text-white text-lg transition-all duration-300 outline-none ${
                        focusedField === field.key
                          ? 'border-[#00f0ff]/60 shadow-[0_0_40px_rgba(0,240,255,0.12)]'
                          : 'border-white/[0.06] hover:border-[#00f0ff]/20'
                      }`}
                      required={field.key !== 'organization'}
                      disabled={isSubmitting}
                    />
                  </motion.div>
                ))}

                {/* Organization Type Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="relative"
                >
                  <label
                    className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      focusedField === 'orgType' || formData.orgType
                        ? 'top-2 text-xs text-[#00f0ff]'
                        : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'
                    }`}
                  >
                    Organization Type
                  </label>
                  <select
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                    onFocus={() => setFocusedField('orgType')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-[#0f172a]/80 border-2 rounded-2xl px-5 pt-7 pb-4 text-white text-lg transition-all duration-300 outline-none appearance-none ${
                      focusedField === 'orgType'
                        ? 'border-[#00f0ff]/60 shadow-[0_0_40px_rgba(0,240,255,0.12)]'
                        : 'border-white/[0.06] hover:border-[#00f0ff]/20'
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="" disabled className="bg-[#0f172a] text-gray-500"></option>
                    {orgTypes.map((type) => (
                      <option key={type} value={type} className="bg-[#0f172a] text-white">{type}</option>
                    ))}
                  </select>
                </motion.div>

                {/* Biggest Data Challenge textarea */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.75 }}
                  className="relative"
                >
                  <label
                    className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      focusedField === 'challenge' || formData.challenge
                        ? 'top-2 text-xs text-[#00f0ff]'
                        : 'top-6 text-gray-400 text-base'
                    }`}
                  >
                    Biggest Data Challenge
                  </label>
                  <textarea
                    value={formData.challenge}
                    onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                    onFocus={() => setFocusedField('challenge')}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                    className={`w-full bg-[#0f172a]/80 border-2 rounded-2xl px-5 pt-8 pb-4 text-white text-lg transition-all duration-300 outline-none resize-none ${
                      focusedField === 'challenge'
                        ? 'border-[#00f0ff]/60 shadow-[0_0_40px_rgba(0,240,255,0.12)]'
                        : 'border-white/[0.06] hover:border-[#00f0ff]/20'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                </motion.div>

                {/* Current Systems Used */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="relative"
                >
                  <label
                    className={`absolute left-5 transition-all duration-300 pointer-events-none ${
                      focusedField === 'systems' || formData.systems
                        ? 'top-2 text-xs text-[#00f0ff]'
                        : 'top-1/2 -translate-y-1/2 text-gray-400 text-base'
                    }`}
                  >
                    Current Systems Used
                  </label>
                  <input
                    type="text"
                    value={formData.systems}
                    onChange={(e) => setFormData({ ...formData, systems: e.target.value })}
                    onFocus={() => setFocusedField('systems')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-[#0f172a]/80 border-2 rounded-2xl px-5 pt-7 pb-4 text-white text-lg transition-all duration-300 outline-none ${
                      focusedField === 'systems'
                        ? 'border-[#00f0ff]/60 shadow-[0_0_40px_rgba(0,240,255,0.12)]'
                        : 'border-white/[0.06] hover:border-[#00f0ff]/20'
                    }`}
                    placeholder=""
                    disabled={isSubmitting}
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <MagneticButton className="w-full" strength={3}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative w-full py-6 rounded-2xl text-lg font-bold overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#8b5cf6] transition-transform duration-300 group-hover/btn:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#8b5cf6] blur-xl opacity-50 group-hover/btn:opacity-80 transition-opacity" />
                      <span className="relative z-10 flex items-center justify-center gap-3 text-white">
                        {submitted ? (
                          <span className="flex items-center gap-2">
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-2xl"
                            >
                              ✓
                            </motion.span>
                            Session Booked Successfully!
                          </span>
                        ) : isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={20} className="animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <>
                            <Send size={20} />
                            Book My Data House Session
                          </>
                        )}
                      </span>
                    </button>
                  </MagneticButton>
                </motion.div>
              </div>
            </div>
          </motion.form>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-32 pt-12 border-t border-[#00f0ff]/10 relative"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />

          <div className="flex flex-col items-center gap-8">
            {/* Large Logo */}
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                The Data Guys<span className="text-[#00f0ff] text-lg align-super">™</span>
              </h3>
              <p className="text-gray-400 text-sm mt-2 mono tracking-wider">
                GETTING YOUR DATA HOUSE IN ORDER
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-wrap justify-center gap-8">
              {['Home', 'About', 'Services', 'Case Studies', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-400 text-sm hover:text-[#00f0ff] transition-colors duration-300 relative group/link"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#00f0ff] group-hover/link:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* Social Links */}
            <div className="flex gap-4">
              {[
                { icon: Linkedin, href: 'https://www.linkedin.com/in/deimarlon?utm_source=share_via&utm_content=profile&utm_medium=member_ios' },
                { icon: Mail, href: 'mailto:info@thedataguys.org' },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="w-10 h-10 rounded-xl bg-[#0f172a] border border-[#00f0ff]/10 flex items-center justify-center text-gray-400 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all duration-300"
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-gray-400 text-sm">
              © 2026 The Data Guys™. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}