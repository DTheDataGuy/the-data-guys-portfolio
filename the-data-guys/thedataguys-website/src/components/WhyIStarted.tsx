import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export default function WhyIStarted() {
  return (
    <section id="why-i-started" className="relative py-28 bg-[#0a0e1a] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00f0ff]/[0.02] via-transparent to-[#3b82f6]/[0.02]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/[0.03] blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-2">
            Why I Started{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              The Data Guys™
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative p-8 md:p-12 rounded-3xl bg-white/[0.03] border border-[#00f0ff]/10 backdrop-blur-md"
        >
          {/* Quote icon */}
          <div className="absolute -top-5 left-8 md:left-12 w-10 h-10 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
            <Quote className="w-5 h-5 text-[#00f0ff]" />
          </div>

          {/* Quote text */}
          <blockquote className="text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed font-light italic mb-8">
            &ldquo;When I worked at AWS, I saw companies spend millions on software and still struggle to answer basic questions:{' '}
            <span className="text-[#00f0ff] font-normal not-italic">What is working?</span>{' '}
            <span className="text-[#00f0ff] font-normal not-italic">Where is money going?</span>{' '}
            <span className="text-[#00f0ff] font-normal not-italic">What should we do next?</span>
            <br /><br />
            The problem wasn&apos;t technology. The problem was{' '}
            <span className="text-white font-semibold not-italic">visibility</span>.
            <br /><br />
            The Data Guys™ was built to solve that.&rdquo;
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f0ff]/30 to-[#3b82f6]/30 border border-[#00f0ff]/20 flex items-center justify-center">
              <span className="text-[#00f0ff] font-bold text-lg">D</span>
            </div>
            <div>
              <p className="text-white font-bold text-base">Dei&apos;Marlon Scisney</p>
              <p className="text-gray-400 text-sm">Founder & CEO, The Data Guys™</p>
              <p className="text-gray-500 text-xs mt-0.5">40 Under 40 Honoree · AI Task Force Member</p>
            </div>
          </div>

          {/* Decorative line */}
          <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}