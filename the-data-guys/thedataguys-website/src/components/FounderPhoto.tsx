import { motion } from 'framer-motion';

interface FounderPhotoProps {
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-8 h-8',
  md: 'w-14 h-14',
  lg: 'w-24 h-24',
  xl: 'w-40 h-40',
};

const textSizeClasses: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

export default function FounderPhoto({ src, size = 'md', className = '' }: FounderPhotoProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#00f0ff] to-[#3b82f6] p-[2px] shadow-[0_0_20px_rgba(0,240,255,0.3)] ${className}`}
    >
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
        {src ? (
          <img
            src={src}
            alt="Dei'Marlon Scisney, founder of The Data Guys"
            loading="lazy"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[#0a0e1a] flex items-center justify-center">
            <span
              className={`${textSizeClasses[size]} font-black bg-gradient-to-br from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent`}
            >
              D
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}