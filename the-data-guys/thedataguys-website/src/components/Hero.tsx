import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import MagneticButton from './MagneticButton';

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

function AnimatedCounter({ target, suffix = '', prefix = '', decimals = 0, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.round(latest).toString();
  });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, target, {
        duration,
        ease: 'easeOut',
      });
      return () => controls.stop();
    }
  }, [isInView, target, duration, motionValue]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

function DataFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
    }

    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particleCount = Math.min(50, Math.floor(window.innerWidth / 25));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '0, 240, 255' : '59, 130, 246',
      });
    }

    const animateFn = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animateFn);
    };
    animateFn();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-[1] pointer-events-none" />;
}

function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00f0ff]/[0.08] blur-[100px] animate-orb-drift" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/[0.10] blur-[120px] animate-orb-drift-reverse" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-[#8b5cf6]/[0.06] blur-[80px] animate-orb-drift-slow" />
    </div>
  );
}

const benefits = [
  'Connect disconnected systems',
  'Reduce reporting time',
  'Eliminate spreadsheet chaos',
  'Measure outcomes and impact',
  'Prepare for AI the right way',
];

const heroStats = [
  { target: 400, suffix: 'M+', prefix: '$', label: 'Funding Tracked Through Data Systems', decimals: 0 },
  { target: 99.4, suffix: '%', prefix: '', label: 'Workshop Satisfaction Score', decimals: 1 },
  { target: 250, suffix: '+', prefix: '', label: 'Business Leaders Trained', decimals: 0 },
  { target: 40, suffix: '+', prefix: '', label: 'Organizations Supported', decimals: 0 },
];

const trustOrgs = ['🏛 Government Agencies', '🏗 Construction Firms', '🤝 Nonprofits', '📈 Economic Development', '💼 Chambers of Commerce', '🏢 Growing Businesses'];

const microcopy = [
  'Takes less than 3 minutes',
  'Personalized score',
  'Free improvement roadmap',
  'No sales pressure',
];

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen bg-[#0a0e1a]">
      {/* Background layers - all low z-index */}
      <div className="absolute inset-0 z-[0] bg-gradient-to-b from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <GradientOrbs />
      <DataFlowCanvas />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-[#0a0e1a]/60" />

      {/* Main Content - HIGH z-index, no animation delays */}
      <div className="relative z-[50] w-full max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Eyebrow */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs md:text-sm font-mono tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            THE DATA HOUSE™ FRAMEWORK
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-black leading-[1.0] mb-6 tracking-tight hero-headline">
          <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent">
            The Data Guys™ Help You Get Your Data House In Order
          </span>
        </h1>



        {/* Benefits Row */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-10">
          {benefits.map((benefit) => (
            <span
              key={benefit}
              className="inline-flex items-center gap-1.5 text-sm text-gray-300"
            >
              <span className="text-[#00f0ff] font-bold">✓</span>
              {benefit}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton>
              <button
                onClick={() => scrollTo('data-house-assessment')}
                className="group inline-flex items-center gap-2 btn-glow px-8 py-4 rounded-full text-base md:text-lg font-bold relative overflow-hidden cta-pulse"
              >
                <span className="relative z-10">Get My Free Data House Score™</span>
              </button>
            </MagneticButton>

            <MagneticButton>
              <button
                onClick={() => scrollTo('living-data-house')}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full text-base md:text-lg font-bold border-2 border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/60 transition-all duration-300 relative overflow-hidden cta-border-glow"
              >
                <span className="relative z-10">Explore The Framework™</span>
              </button>
            </MagneticButton>
          </div>

          {/* Microcopy under CTA */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {microcopy.map((item) => (
              <span key={item} className="text-xs text-white/40 flex items-center gap-1">
                <span className="text-[#00f0ff]/60">✓</span> {item}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-10">
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="hover-lift glass-card rounded-xl p-4 md:p-5 text-center cursor-default"
            >
              <div className="text-2xl md:text-3xl font-black text-[#00f0ff] font-mono mb-1">
                <AnimatedCounter
                  target={stat.target}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                  duration={2.2}
                />
              </div>
              <div className="text-xs md:text-sm text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-white/30 font-mono mb-4">Built for:</p>
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-2 max-w-4xl mx-auto">
            {trustOrgs.map((org, i) => (
              <span key={org} className="flex items-center text-xs md:text-sm text-gray-400/80 font-medium">
                {org}
                {i < trustOrgs.length - 1 && (
                  <span className="ml-2 w-1 h-1 rounded-full bg-[#00f0ff]/30" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[50] animate-bounce">
        <ChevronDown className="text-[#00f0ff] opacity-50" size={28} />
      </div>
    </section>
  );
}