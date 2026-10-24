import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Database, ArrowDownToLine, HardDrive, Cog, BarChart3, Layers } from 'lucide-react';

interface Service {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  details: string;
  accent: string;
  accentGlow: string;
}

const services: Service[] = [
  {
    icon: Database,
    title: 'Architecture',
    subtitle: 'Design the Blueprint',
    description: 'We map your entire data ecosystem — sources, flows, storage, and access patterns.',
    details: 'Creating a scalable architecture that grows with your business. We analyze current infrastructure, identify bottlenecks, and design a future-proof data foundation that supports everything from real-time analytics to AI workloads.',
    accent: '#00f0ff',
    accentGlow: 'rgba(0, 240, 255, 0.3)',
  },
  {
    icon: ArrowDownToLine,
    title: 'Ingestion',
    subtitle: 'Capture Every Signal',
    description: 'Real-time and batch data ingestion from any source. Nothing gets lost.',
    details: 'APIs, databases, IoT devices, spreadsheets, and third-party platforms — we build robust pipelines that handle millions of events per second with guaranteed delivery and automatic schema evolution.',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.3)',
  },
  {
    icon: HardDrive,
    title: 'Storage',
    subtitle: 'Organize & Secure',
    description: 'Data lakes, warehouses, and lakehouses designed for performance.',
    details: 'Proper governance, encryption, and access controls from day one. We implement tiered storage strategies that balance cost with performance, ensuring your data is always accessible when you need it.',
    accent: '#3b82f6',
    accentGlow: 'rgba(59, 130, 246, 0.3)',
  },
  {
    icon: Cog,
    title: 'Processing',
    subtitle: 'Transform & Engineer',
    description: 'ETL/ELT pipelines that clean, transform, and enrich your raw data.',
    details: 'Automated quality checks at every stage ensure analysis-ready datasets. We build self-healing pipelines with intelligent retry logic, data lineage tracking, and real-time monitoring dashboards.',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.3)',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    subtitle: 'Visualize & Decide',
    description: 'Custom dashboards that turn complex data into clear, actionable insights.',
    details: 'Real-time monitoring and historical trend analysis. We design interactive visualizations that tell stories, enabling stakeholders at every level to make data-driven decisions with confidence.',
    accent: '#ec4899',
    accentGlow: 'rgba(236, 72, 153, 0.3)',
  },
  {
    icon: Layers,
    title: 'AI & Intelligence',
    subtitle: 'Unlock the Future',
    description: 'Machine learning, predictive analytics, and AI agents that actually work.',
    details: 'Because they have clean data to learn from. Once your data house is in order, we deploy production-grade ML models, recommendation engines, and autonomous AI agents that drive real business outcomes.',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.3)',
  },
];

function ServiceChapter({ service, index }: { service: Service; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const [expanded, setExpanded] = useState(false);
  const isOdd = index % 2 !== 0;

  const Icon = service.icon;

  return (
    <div ref={ref} className="relative min-h-[70vh] flex items-center py-16 md:py-24">
      {/* Giant watermark number */}
      <div
        className="absolute top-1/2 -translate-y-1/2 font-bold pointer-events-none select-none"
        style={{
          fontSize: 'clamp(10rem, 25vw, 20rem)',
          opacity: 0.04,
          color: service.accent,
          left: isOdd ? 'auto' : '5%',
          right: isOdd ? '5%' : 'auto',
          lineHeight: 1,
        }}
      >
        0{index + 1}
      </div>

      {/* Content */}
      <motion.div
        initial={{
          opacity: 0,
          x: isOdd ? 100 : -100,
          scale: 0.9,
          rotateY: isOdd ? -5 : 5,
        }}
        animate={isInView ? {
          opacity: 1,
          x: 0,
          scale: 1,
          rotateY: 0,
        } : {
          opacity: 0,
          x: isOdd ? 100 : -100,
          scale: 0.9,
          rotateY: isOdd ? -5 : 5,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 w-full max-w-3xl ${isOdd ? 'ml-auto mr-8 md:mr-16 lg:mr-24' : 'ml-8 md:ml-16 lg:ml-24'}`}
      >
        {/* Glowing orb behind */}
        <motion.div
          animate={isInView ? { scale: [0.8, 1.2, 1], opacity: [0, 0.6, 0.4] } : { scale: 0.8, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute -top-10 rounded-full blur-[80px] w-48 h-48 pointer-events-none"
          style={{
            background: service.accentGlow,
            left: isOdd ? 'auto' : '-2rem',
            right: isOdd ? '-2rem' : 'auto',
          }}
        />

        {/* Icon + Step indicator */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0.5, rotate: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm border"
            style={{
              background: `${service.accent}10`,
              borderColor: `${service.accent}30`,
              boxShadow: `0 0 30px ${service.accentGlow}`,
            }}
          >
            <Icon size={28} style={{ color: service.accent }} />
          </motion.div>
          <div className="mono text-sm tracking-widest uppercase" style={{ color: service.accent }}>
            Stage 0{index + 1} / 06
          </div>
        </div>

        {/* Title */}
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
          {service.title}
          <span className="block text-xl md:text-2xl font-normal mt-2" style={{ color: service.accent }}>
            {service.subtitle}
          </span>
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-6 max-w-xl">
          {service.description}
        </p>

        {/* Expandable details */}
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="text-gray-400 text-base leading-relaxed pb-4 border-l-2 pl-4" style={{ borderColor: `${service.accent}40` }}>
            {service.details}
          </p>
        </motion.div>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="group flex items-center gap-2 mono text-sm tracking-wider transition-all duration-300 hover:gap-3"
          style={{ color: service.accent }}
        >
          <span className="w-8 h-[1px] transition-all duration-300 group-hover:w-12" style={{ background: service.accent }} />
          {expanded ? 'COLLAPSE' : 'LEARN MORE'}
        </button>

        {/* Connector line to next */}
        {index < services.length - 1 && (
          <motion.div
            animate={isInView ? { scaleY: 1, opacity: 0.3 } : { scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute -bottom-16 w-[2px] h-16 origin-top"
            style={{
              background: `linear-gradient(to bottom, ${service.accent}, transparent)`,
              left: isOdd ? 'auto' : '2rem',
              right: isOdd ? '2rem' : 'auto',
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

function ProgressIndicator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3">
      {services.map((service, i) => (
        <motion.div
          key={service.title}
          animate={{
            scale: activeIndex === i ? 1.4 : 1,
            opacity: activeIndex === i ? 1 : 0.3,
          }}
          transition={{ duration: 0.3 }}
          className="relative group"
        >
          <div
            className="w-3 h-3 rounded-full border-2 transition-all duration-300"
            style={{
              borderColor: service.accent,
              background: activeIndex === i ? service.accent : 'transparent',
              boxShadow: activeIndex === i ? `0 0 12px ${service.accentGlow}` : 'none',
            }}
          />
          {/* Tooltip */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md text-xs mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm"
            style={{ background: `${service.accent}20`, color: service.accent, border: `1px solid ${service.accent}30` }}
          >
            {service.title}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PipelineLine() {
  return (
    <div className="absolute left-8 md:left-12 top-0 bottom-0 w-[2px] pointer-events-none hidden md:block">
      {/* Static line */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f0ff]/20 to-transparent" />
      {/* Animated dots flowing down */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pipeline-dot-1" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#a855f7] shadow-[0_0_6px_rgba(168,85,247,0.8)] animate-pipeline-dot-2" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3b82f6] shadow-[0_0_6px_rgba(59,130,246,0.8)] animate-pipeline-dot-3" />
    </div>
  );
}

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const headerScale = useTransform(scrollYProgress, [0, 0.1], [0.7, 1]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  // Determine active service based on scroll
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Simple intersection-based active tracking
  const handleInView = (index: number, inView: boolean) => {
    if (inView) setActiveIndex(index);
  };

  return (
    <section id="services" ref={sectionRef} className="relative py-24 md:py-40 overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#3b82f6]/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-[#a855f7]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Pipeline line */}
      <PipelineLine />

      {/* Progress Indicator */}
      <ProgressIndicator activeIndex={activeIndex} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header - Dramatic scale-up */}
        <motion.div
          style={{ scale: headerScale, opacity: headerOpacity }}
          className="text-center mb-24 md:mb-32"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[#00f0ff] mono text-sm tracking-[0.3em] uppercase mb-6"
          >
            The Process
          </motion.p>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none">
            <span className="block bg-gradient-to-r from-[#00f0ff] via-[#3b82f6] to-[#a855f7] bg-clip-text text-transparent">
              Data Pipeline
            </span>
            <span className="block text-white/90 text-3xl md:text-4xl lg:text-5xl font-light mt-4">
              Six stages to intelligence
            </span>
          </h2>
        </motion.div>

        {/* Service Chapters */}
        <div className="relative">
          {services.map((service, index) => (
            <ServiceChapterWrapper
              key={service.title}
              service={service}
              index={index}
              onInView={handleInView}
              ref={(el) => { chapterRefs.current[index] = el; }}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-center mt-24 md:mt-32"
        >
          <p className="text-gray-400 text-lg mb-6">Ready to build your data foundation?</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] mono text-sm tracking-wider hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            START YOUR PIPELINE
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// Wrapper to track inView for active index
import { forwardRef } from 'react';

const ServiceChapterWrapper = forwardRef<HTMLDivElement, {
  service: Service;
  index: number;
  onInView: (index: number, inView: boolean) => void;
}>(({ service, index, onInView }, ref) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(internalRef, { amount: 0.4 });

  // Notify parent of visibility
  if (isInView) {
    onInView(index, true);
  }

  return (
    <div ref={(el) => {
      internalRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    }}>
      <ServiceChapter service={service} index={index} />
    </div>
  );
});

ServiceChapterWrapper.displayName = 'ServiceChapterWrapper';