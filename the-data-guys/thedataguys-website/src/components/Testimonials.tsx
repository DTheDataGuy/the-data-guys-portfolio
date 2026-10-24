import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

interface Testimonial {
  metric: string;
  metricLabel: string;
  quote: string;
  author: string;
  role: string;
  orgType: string;
  orgColor: string;
}

const testimonials: Testimonial[] = [
  {
    metric: '73%',
    metricLabel: 'Faster Compliance Reporting',
    quote: 'We went from 3-week report cycles to same-day delivery. The efficiency gains cascaded across every department.',
    author: 'Director of Operations',
    role: 'State Agency',
    orgType: 'Government Agency',
    orgColor: 'from-blue-400 to-blue-600',
  },
  {
    metric: '$2.4M',
    metricLabel: 'Additional Grants Secured',
    quote: 'The data visibility showed us opportunities we were missing. We could finally prove impact with real numbers.',
    author: 'Executive Director',
    role: 'Impact Foundation',
    orgType: 'Nonprofit',
    orgColor: 'from-emerald-400 to-emerald-600',
  },
  {
    metric: '34%',
    metricLabel: 'Reduction in Cost Overruns',
    quote: 'Real-time project tracking changed everything. We catch budget issues before they become budget disasters.',
    author: 'VP of Operations',
    role: 'BuildRight Corp',
    orgType: 'Construction Firm',
    orgColor: 'from-amber-400 to-amber-600',
  },
  {
    metric: '400%',
    metricLabel: 'ROI in Year 1',
    quote: 'The investment paid for itself in the first quarter. By year-end, we had quadrupled our return.',
    author: 'President',
    role: 'Regional Chamber',
    orgType: 'Economic Development',
    orgColor: 'from-purple-400 to-purple-600',
  },
  {
    metric: '12 hrs',
    metricLabel: 'Saved Per Week',
    quote: 'Automated what used to take our entire Monday. Now we focus on growth instead of data entry.',
    author: 'Founder & CEO',
    role: 'Bloom & Co',
    orgType: 'Small Business',
    orgColor: 'from-pink-400 to-pink-600',
  },
  {
    metric: '99.4%',
    metricLabel: 'Data Accuracy Achieved',
    quote: 'From data chaos to data confidence in 90 days. Our AI tools finally work because the foundation is solid.',
    author: 'Chief Data Officer',
    role: 'Apex Industries',
    orgType: 'Enterprise',
    orgColor: 'from-cyan-400 to-cyan-600',
  },
];

function AnimatedMetric({ metric, isInView }: { metric: string; isInView: boolean }) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (!isInView) {
      setDisplayValue('');
      return;
    }

    // Parse the metric to animate numbers
    const numMatch = metric.match(/[\d.]+/);
    if (!numMatch) {
      setDisplayValue(metric);
      return;
    }

    const targetNum = parseFloat(numMatch[0]);
    const prefix = metric.slice(0, metric.indexOf(numMatch[0]));
    const suffix = metric.slice(metric.indexOf(numMatch[0]) + numMatch[0].length);
    const hasDecimal = numMatch[0].includes('.');
    const decimalPlaces = hasDecimal ? numMatch[0].split('.')[1].length : 0;

    let startTime: number | null = null;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentNum = targetNum * eased;

      if (hasDecimal) {
        setDisplayValue(`${prefix}${currentNum.toFixed(decimalPlaces)}${suffix}`);
      } else {
        setDisplayValue(`${prefix}${Math.round(currentNum)}${suffix}`);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, metric]);

  return (
    <span className="font-mono font-black text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
      {displayValue || metric}
    </span>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 overflow-hidden transition-all duration-500 hover:border-[#00f0ff]/30 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(0,240,255,0.08)]">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00f0ff]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Organization Badge */}
        <div className="relative z-10 mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${testimonial.orgColor} text-white/90 shadow-lg`}>
            {testimonial.orgType}
          </span>
        </div>

        {/* Big Metric */}
        <div className="relative z-10 mb-2">
          <AnimatedMetric metric={testimonial.metric} isInView={isInView} />
        </div>

        {/* Metric Label */}
        <p className="relative z-10 text-[#00f0ff]/80 font-medium text-sm uppercase tracking-wider mb-6">
          {testimonial.metricLabel}
        </p>

        {/* Divider */}
        <div className="relative z-10 w-12 h-[1px] bg-gradient-to-r from-[#00f0ff]/50 to-transparent mb-6" />

        {/* Quote */}
        <p className="relative z-10 text-gray-300 text-base leading-relaxed mb-6 italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        {/* Author */}
        <div className="relative z-10">
          <p className="text-white font-semibold text-sm">{testimonial.author}</p>
          <p className="text-gray-500 text-xs">{testimonial.role}</p>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#00f0ff]/[0.06] to-transparent rounded-bl-full" />
      </div>
    </motion.div>
  );
}

function CarouselView() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const totalSlides = testimonials.length;

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, totalSlides]);

  const handleDotClick = (index: number) => {
    setAutoPlay(false);
    setCurrentSlide(index);
    // Resume autoplay after 10 seconds
    setTimeout(() => setAutoPlay(true), 10000);
  };

  return (
    <div className="block md:hidden">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <TestimonialCard testimonial={testimonials[currentSlide]} index={0} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 bg-[#00f0ff]'
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {autoPlay && (
        <div className="flex justify-center mt-4">
          <div className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#00f0ff]/60"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={`progress-${currentSlide}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GridView() {
  return (
    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard key={index} testimonial={testimonial} index={index} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-44 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050810 0%, #0a0e1a 50%, #050810 100%)' }}
    >
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00f0ff]/[0.03] rounded-full blur-[180px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#3b82f6]/[0.03] rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#06b6d4]/[0.02] rounded-full blur-[200px]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 50 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={isHeaderInView ? { opacity: 1, letterSpacing: '0.3em' } : {}}
            transition={{ duration: 1 }}
            className="text-[#00f0ff] font-mono text-xs uppercase mb-4"
          >
            Measured Impact
          </motion.p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white">
            Results That Speak{' '}
            <span className="bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent">
              In Numbers
            </span>
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Every engagement is measured. Every outcome is tracked. Here&apos;s what our partners report.
          </motion.p>
        </motion.div>

        {/* Grid for desktop, Carousel for mobile */}
        <GridView />
        <CarouselView />


      </div>
    </section>
  );
}