import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, ArrowRight, FileDown } from 'lucide-react';
import { downloadPdf } from '../lib/downloadPdf';

const brokenSigns = [
  'Reports take days, not minutes',
  'Teams argue about which numbers are right',
  'One person holds all the knowledge',
  "You're still copying data between spreadsheets",
  "Leadership can't get answers without asking someone",
  'You bought a dashboard tool but nobody uses it',
];

const dashboardFailReasons = [
  'Nobody defined KPIs first',
  'Source data was never cleaned',
  "Systems don't talk to each other",
  'No one owns the data',
  'No action process exists',
  'Built for reporting, not decisions',
];

export default function BrokenDataHouseChecklist() {
  const scrollToAssessment = () => {
    const el = document.getElementById('data-house-assessment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="problem-section" className="relative z-10 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Is Your Data House <span className="text-[#00f0ff]">Broken</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            These are the signs — and why your last dashboard didn&apos;t fix them.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* LEFT - Signs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-[#00f0ff]/15 bg-white/[0.03] backdrop-blur-md p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-[#00f0ff]" />
              <h3 className="text-lg font-bold text-white">Signs Your Data House Is Broken</h3>
            </div>
            <div className="space-y-3">
              {brokenSigns.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-[#00f0ff]/20 hover:bg-[#00f0ff]/[0.03] transition-all duration-300"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00f0ff]/60 mt-2 shrink-0" />
                  <span className="text-gray-300 text-sm md:text-base">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT - Why Dashboards Won't Fix It */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-[#3b82f6]/15 bg-white/[0.03] backdrop-blur-md p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-5 h-5 text-[#3b82f6]" />
              <h3 className="text-lg font-bold text-white">Why Dashboards Alone Won&apos;t Fix It</h3>
            </div>
            <div className="space-y-3">
              {dashboardFailReasons.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-[#3b82f6]/20 hover:bg-[#3b82f6]/[0.03] transition-all duration-300"
                >
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]/60 mt-2 shrink-0" />
                  <span className="text-gray-300 text-sm md:text-base">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Contrast Statement */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-10"
        >
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Dashboards don&apos;t fail because of technology.{' '}
            <span className="text-white font-semibold">
              They fail because the Data House wasn&apos;t built first.
            </span>
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={scrollToAssessment}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#00f0ff]/20 to-[#3b82f6]/20 border border-[#00f0ff]/40 text-white font-semibold hover:from-[#00f0ff]/30 hover:to-[#3b82f6]/30 hover:border-[#00f0ff]/60 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300"
          >
            Assess Your Data House
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]/50 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] transition-all duration-300"
          >
            <FileDown className="w-4 h-4" />
            Download The Checklist
          </button>
        </motion.div>
      </div>
    </section>
  );
}