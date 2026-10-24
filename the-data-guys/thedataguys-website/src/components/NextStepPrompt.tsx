import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface NextStepPromptProps {
  text: string;
  targetId: string;
}

export default function NextStepPrompt({ text, targetId }: NextStepPromptProps) {
  const scrollTo = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative py-8 flex justify-center"
    >
      <button
        onClick={scrollTo}
        className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-[#00f0ff]/15 backdrop-blur-md hover:bg-[#00f0ff]/[0.06] hover:border-[#00f0ff]/30 transition-all duration-300 cursor-pointer"
      >
        <span className="text-gray-400 group-hover:text-[#00f0ff] text-sm md:text-base font-medium transition-colors duration-300">
          {text}
        </span>
        <ArrowDown className="w-4 h-4 text-[#00f0ff]/60 group-hover:text-[#00f0ff] transition-colors duration-300 animate-bounce" />
      </button>
    </motion.div>
  );
}