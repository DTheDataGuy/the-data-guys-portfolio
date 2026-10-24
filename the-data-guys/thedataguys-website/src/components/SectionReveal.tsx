import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
}

const SectionReveal = ({ children, className = "" }: SectionRevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.98]);
  const blur = useTransform(scrollYProgress, [0, 0.2], [4, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [2, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [40, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        scale,
        filter: blur.get() > 0 ? `blur(${blur.get()}px)` : undefined,
        rotateX,
        y,
        transformPerspective: 1200,
      }}
      className={className}
    >
      <motion.div style={{ filter: useTransform(blur, (v) => `blur(${v}px)`) }}>
        {children}
      </motion.div>
    </motion.div>
  );
};

export default SectionReveal;