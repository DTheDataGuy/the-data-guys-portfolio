import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface ReadinessLevel {
  level: number;
  title: string;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
  capabilities: string[];
}

const readinessLevels: ReadinessLevel[] = [
  {
    level: 1,
    title: 'Basic Automation',
    color: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.3)',
    icon: '⚡',
    description: 'Eliminate repetitive manual tasks and establish reliable data flows',
    capabilities: [
      'Automated reports & scheduled refreshes',
      'Simple alerts & threshold notifications',
      'Workflow triggers & rule-based actions',
      'Data validation & quality checks',
    ],
  },
  {
    level: 2,
    title: 'Predictive Analytics',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    icon: '📈',
    description: 'Leverage historical data to anticipate outcomes and detect patterns',
    capabilities: [
      'Demand forecasting & trend analysis',
      'Anomaly detection & early warnings',
      'Customer behavior prediction',
      'Recommendation engines',
    ],
  },
  {
    level: 3,
    title: 'Generative AI',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    icon: '🧠',
    description: 'Deploy intelligent systems that create, reason, and act autonomously',
    capabilities: [
      'Content generation & summarization',
      'Intelligent assistants & copilots',
      'Autonomous decision-making',
      'Custom AI models & fine-tuning',
    ],
  },
];

interface Floor {
  id: string;
  floor: number | string;
  name: string;
  icon: string;
  description: string;
  symptoms: string[];
  goodLooksLike: string[];
  isRoof?: boolean;
}

const floors: Floor[] = [
  {
    id: 'governance',
    floor: 1,
    name: 'Governance',
    icon: '🏛',
    description: 'Policies, standards, and accountability structures that define how data is managed',
    symptoms: [
      'No data policies',
      'No clear ownership',
      'Inconsistent definitions',
      'No audit trail',
      'Compliance gaps',
    ],
    goodLooksLike: [
      'Clear data ownership matrix',
      'Documented policies',
      'Regular audits',
      'Compliance automated',
      'Standards enforced',
    ],
  },
  {
    id: 'people',
    floor: 2,
    name: 'People',
    icon: '👥',
    description: 'The humans responsible for collecting, managing, and using data',
    symptoms: [
      'No dedicated data roles',
      'Staff resistance to tools',
      'Tribal knowledge only',
      'High turnover in data tasks',
      'No training programs',
    ],
    goodLooksLike: [
      'Dedicated data stewards',
      'Regular training',
      'Data literacy programs',
      'Clear RACI matrix',
      'Culture of data-driven decisions',
    ],
  },
  {
    id: 'processes',
    floor: 3,
    name: 'Processes',
    icon: '⚙',
    description: 'Documented workflows for how data moves through the organization',
    symptoms: [
      'Undocumented workflows',
      'Manual handoffs',
      'Inconsistent data entry',
      'No SOPs',
      'Bottlenecks in approvals',
    ],
    goodLooksLike: [
      'Documented SOPs',
      'Automated workflows',
      'Standardized data entry',
      'Clear escalation paths',
      'Regular process reviews',
    ],
  },
  {
    id: 'systems',
    floor: 4,
    name: 'Systems',
    icon: '🔗',
    description: 'The tools and platforms that house and move your data',
    symptoms: [
      'Duplicate data entry',
      "CRM doesn't talk to accounting",
      'Excel exports everywhere',
      'Staff manually moving information',
      'No single source of truth',
    ],
    goodLooksLike: [
      'Integrated tech stack',
      'Single source of truth',
      'Automated syncing',
      'Scalable architecture',
      'Role-based access',
    ],
  },
  {
    id: 'ingestion',
    floor: 5,
    name: 'Ingestion',
    icon: '📥',
    description: 'How data enters your ecosystem from internal and external sources',
    symptoms: [
      'Paper forms still in use',
      'Manual data re-entry',
      'No API connections',
      'Delayed data availability',
      'Missing intake protocols',
    ],
    goodLooksLike: [
      'Automated data capture',
      'API-first approach',
      'Real-time feeds',
      'Validated at entry',
      'Multiple source support',
    ],
  },
  {
    id: 'storage',
    floor: 6,
    name: 'Storage',
    icon: '🗄',
    description: 'Where data lives — databases, warehouses, lakes, and archives',
    symptoms: [
      'Data scattered across drives',
      'No central database',
      'Duplicate records everywhere',
      'No backup strategy',
      "Can't find historical data",
    ],
    goodLooksLike: [
      'Centralized warehouse',
      'Proper data modeling',
      'Automated backups',
      'Clear retention policies',
      'Scalable infrastructure',
    ],
  },
  {
    id: 'processing',
    floor: 7,
    name: 'Processing',
    icon: '⚙',
    description: 'Cleaning, transforming, and preparing data for use',
    symptoms: [
      'Dirty data in reports',
      'No validation rules',
      'Manual transformations',
      'Inconsistent formats',
      'No data quality checks',
    ],
    goodLooksLike: [
      'Automated ETL pipelines',
      'Data quality rules',
      'Consistent transformations',
      'Error handling',
      'Monitoring dashboards',
    ],
  },
  {
    id: 'visualization',
    floor: 8,
    name: 'Visualization',
    icon: '📊',
    description: 'Dashboards, reports, and visual tools that surface insights',
    symptoms: [
      'No dashboards',
      'Reports take days to create',
      "Leadership can't self-serve",
      "Metrics aren't standardized",
      'No real-time visibility',
    ],
    goodLooksLike: [
      'Self-serve dashboards',
      'Real-time metrics',
      'Executive KPI views',
      'Drill-down capability',
      'Automated reporting',
    ],
  },
  {
    id: 'roof',
    floor: '🏠',
    name: 'Decision Intelligence / Automation / AI Readiness',
    icon: '✨',
    description: 'The pinnacle — where AI, automation, and intelligent decision-making become possible because every floor below is solid',
    isRoof: true,
    symptoms: [
      'AI projects fail or stall',
      'Automation breaks constantly',
      'No trust in model outputs',
      "Can't scale what works",
      'Decisions still gut-driven',
    ],
    goodLooksLike: [
      'AI models trained on clean data',
      'Automation runs reliably',
      'Predictive insights trusted',
      'Scalable intelligence layer',
      'Data-driven culture organization-wide',
    ],
  },
];

// Unique color identity for each floor - warm earth at bottom to cool cyan/purple at top
const floorStyles = [
  { // F1 - Governance: Deep slate with amber accent
    bg: 'linear-gradient(135deg, #1e1b2e 0%, #1a1630 50%, #0f172a 100%)',
    bgSelected: 'linear-gradient(135deg, #2a2440 0%, #1e1b35 50%, #151030 100%)',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    borderIdle: 'rgba(245, 158, 11, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 60%)',
  },
  { // F2 - People: Navy with orange accent
    bg: 'linear-gradient(135deg, #1a1d35 0%, #151830 50%, #0f1528 100%)',
    bgSelected: 'linear-gradient(135deg, #222640 0%, #1a1d38 50%, #121830 100%)',
    accent: '#fb923c',
    accentGlow: 'rgba(251, 146, 60, 0.4)',
    borderIdle: 'rgba(251, 146, 60, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(251, 146, 60, 0.06) 0%, transparent 60%)',
  },
  { // F3 - Processes: Dark blue with yellow accent
    bg: 'linear-gradient(135deg, #161d38 0%, #121a33 50%, #0d152b 100%)',
    bgSelected: 'linear-gradient(135deg, #1e2542 0%, #182038 50%, #101a30 100%)',
    accent: '#facc15',
    accentGlow: 'rgba(250, 204, 21, 0.4)',
    borderIdle: 'rgba(250, 204, 21, 0.2)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(250, 204, 21, 0.05) 0%, transparent 60%)',
  },
  { // F4 - Systems: Blue with emerald accent
    bg: 'linear-gradient(135deg, #0f1e3a 0%, #0c1a35 50%, #091528 100%)',
    bgSelected: 'linear-gradient(135deg, #142645 0%, #0f203d 50%, #0a1a30 100%)',
    accent: '#34d399',
    accentGlow: 'rgba(52, 211, 153, 0.4)',
    borderIdle: 'rgba(52, 211, 153, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(52, 211, 153, 0.06) 0%, transparent 60%)',
  },
  { // F5 - Ingestion: Cyan-blue with teal accent
    bg: 'linear-gradient(135deg, #0c2035 0%, #091d32 50%, #061828 100%)',
    bgSelected: 'linear-gradient(135deg, #102840 0%, #0c2238 50%, #081c2e 100%)',
    accent: '#2dd4bf',
    accentGlow: 'rgba(45, 212, 191, 0.4)',
    borderIdle: 'rgba(45, 212, 191, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(45, 212, 191, 0.06) 0%, transparent 60%)',
  },
  { // F6 - Storage: Teal-dark with cyan accent
    bg: 'linear-gradient(135deg, #0a2230 0%, #081f2e 50%, #051a25 100%)',
    bgSelected: 'linear-gradient(135deg, #0e2a3a 0%, #0a2432 50%, #071e28 100%)',
    accent: '#22d3ee',
    accentGlow: 'rgba(34, 211, 238, 0.4)',
    borderIdle: 'rgba(34, 211, 238, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(34, 211, 238, 0.06) 0%, transparent 60%)',
  },
  { // F7 - Processing: Cyan-blue with sky accent
    bg: 'linear-gradient(135deg, #0a1e38 0%, #081c35 50%, #05182c 100%)',
    bgSelected: 'linear-gradient(135deg, #0e2642 0%, #0a2038 50%, #071c2e 100%)',
    accent: '#38bdf8',
    accentGlow: 'rgba(56, 189, 248, 0.4)',
    borderIdle: 'rgba(56, 189, 248, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(56, 189, 248, 0.06) 0%, transparent 60%)',
  },
  { // F8 - Visualization: Blue-purple with violet accent
    bg: 'linear-gradient(135deg, #121835 0%, #0f1530 50%, #0a1028 100%)',
    bgSelected: 'linear-gradient(135deg, #1a2040 0%, #141a38 50%, #0e1430 100%)',
    accent: '#8b5cf6',
    accentGlow: 'rgba(139, 92, 246, 0.4)',
    borderIdle: 'rgba(139, 92, 246, 0.25)',
    innerGlow: 'radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
  },
];



// Ambient floating particles
function AmbientParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + (i * 6.5) % 80}%`,
            top: `${5 + (i * 11) % 90}%`,
            background: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#a855f7' : '#f59e0b',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, i % 2 === 0 ? 15 : -15, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Roof aurora effect
function RoofAurora() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, rgba(168,85,247,0.08), rgba(0,240,255,0.05), rgba(59,130,246,0.06), rgba(168,85,247,0.08))',
          backgroundSize: '300% 300%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Sparkle particles inside roof */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + i * 11}%`,
            top: `${20 + (i * 7) % 60}%`,
            background: i % 2 === 0 ? '#a855f7' : '#00f0ff',
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient border for roof
function AnimatedBorder() {
  return (
    <div className="absolute inset-0 rounded-2xl pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          padding: '2px',
          background: 'conic-gradient(from 0deg, #a855f7, #00f0ff, #3b82f6, #ec4899, #a855f7)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
        animate={{
          background: [
            'conic-gradient(from 0deg, #a855f7, #00f0ff, #3b82f6, #ec4899, #a855f7)',
            'conic-gradient(from 120deg, #a855f7, #00f0ff, #3b82f6, #ec4899, #a855f7)',
            'conic-gradient(from 240deg, #a855f7, #00f0ff, #3b82f6, #ec4899, #a855f7)',
            'conic-gradient(from 360deg, #a855f7, #00f0ff, #3b82f6, #ec4899, #a855f7)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default function OrganizationalIntelligenceFramework() {
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [highlightedFloor, setHighlightedFloor] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const floorCardRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  // Smooth scroll to expanded panel when a floor is selected
  useEffect(() => {
    if (selectedFloor && detailPanelRef.current) {
      setTimeout(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 450);
    }
  }, [selectedFloor]);

  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const buildingX = useTransform(mouseX, [-400, 400], [-4, 4]);
  const buildingY = useTransform(mouseY, [-400, 400], [-3, 3]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (buildingRef.current) {
        const rect = buildingRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleFloorClick = (id: string) => {
    setSelectedFloor(selectedFloor === id ? null : id);
  };

  const handleElevatorClick = (id: string) => {
    handleFloorClick(id);
    // Scroll to the corresponding floor card
    floorCardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Trigger highlight animation
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    setHighlightedFloor(id);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedFloor(null);
    }, 1200);
  };

  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const activeFloor = floors.find((f) => f.id === selectedFloor);

  // Display floors from top (roof) to bottom (floor 1) for the building visualization
  const displayFloors = [...floors].reverse();

  // Roof pill tooltip texts
  const roofTooltips = {
    intelligence: 'AI-powered insights that drive strategic decisions',
    automation: 'Eliminate manual work with intelligent workflows',
    aiReadiness: "Your organization's preparedness for AI adoption",
  };

  // Get the accent color for the selected floor (for detail panel)
  const getSelectedAccent = () => {
    if (!activeFloor) return '#00f0ff';
    if (activeFloor.isRoof) return '#a855f7';
    const idx = (activeFloor.floor as number) - 1;
    return floorStyles[idx]?.accent ?? '#00f0ff';
  };

  const selectedAccent = getSelectedAccent();

  return (
    <section
      id="living-data-house"
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-[#0a0e1a] overflow-hidden"
    >
      {/* Blueprint grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Large radial glow behind building */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.04) 0%, rgba(168,85,247,0.02) 40%, transparent 70%)',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Ambient floating particles */}
      <AmbientParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            Proprietary Framework
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            The Data House™ Framework
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The foundation every organization must build before dashboards, automation, or AI can succeed.
          </p>
        </motion.div>

        {/* Building Visualization */}
        <motion.div
          ref={buildingRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ x: buildingX, y: buildingY }}
          className="mb-8 relative"
        >
          {/* === DESKTOP BUILDING === */}
          <div className="hidden md:block">
            <div className="relative max-w-[720px] mx-auto">
              {/* Large ambient glow behind building */}
              <motion.div
                className="absolute -inset-16 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.05) 0%, rgba(168,85,247,0.03) 30%, transparent 60%)',
                }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />



              {/* Building structure */}
              <div className="relative z-10 flex">
                {/* Left elevator panel */}
                <div className="shrink-0 w-16 flex flex-col items-center pt-[80px] pb-4 relative">
                  {/* Floor indicators - rendered in reverse order (roof at top) */}
                  {displayFloors.map((floor) => {
                    if (floor.isRoof) return null;
                    const floorIdx = (floor.floor as number) - 1;
                    const style = floorStyles[floorIdx];
                    const isSelected = selectedFloor === floor.id;
                    return (
                      <motion.div
                        key={`indicator-${floor.id}`}
                        className="relative z-10 mb-[10px] last:mb-0"
                        style={{ marginTop: floor.floor === 8 ? '0px' : '0px' }}
                      >
                        <motion.div
                          className="w-10 h-7 rounded-md flex items-center justify-center text-[10px] font-bold font-mono border cursor-pointer transition-all duration-300"
                          style={{
                            background: isSelected ? `${style.accent}30` : `${style.accent}10`,
                            borderColor: isSelected ? `${style.accent}80` : `${style.accent}30`,
                            color: isSelected ? style.accent : `${style.accent}80`,
                            boxShadow: isSelected ? `0 0 12px ${style.accentGlow}` : 'none',
                          }}
                          whileHover={{
                            scale: 1.1,
                            boxShadow: `0 0 10px ${style.accentGlow}`,
                          }}
                          onClick={() => handleElevatorClick(floor.id)}
                        >
                          F{floor.floor as number}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Main building column */}
                <div className="flex-1 flex flex-col">
                  {displayFloors.map((floor, index) => {
                    const isSelected = selectedFloor === floor.id;
                    const floorIndex = floor.isRoof ? -1 : (floor.floor as number) - 1;
                    const style = floor.isRoof ? null : floorStyles[floorIndex];

                    if (floor.isRoof) {
                      // === ROOF - Crystalline Crown ===
                      return (
                        <motion.div
                          key={floor.id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="relative mb-3"
                        >
                          <motion.button
                            onClick={() => handleFloorClick(floor.id)}
                            whileHover={{ scale: 1.02, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative w-full rounded-2xl cursor-pointer overflow-hidden transition-all duration-500 ${
                              isSelected
                                ? 'shadow-[0_0_60px_rgba(168,85,247,0.3),0_0_100px_rgba(0,240,255,0.15)]'
                                : 'hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]'
                            }`}
                            style={{
                              minHeight: '90px',
                              background: isSelected
                                ? 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(0,240,255,0.08) 30%, rgba(59,130,246,0.08) 60%, rgba(236,72,153,0.06) 100%)'
                                : 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(0,240,255,0.04) 30%, rgba(59,130,246,0.04) 60%, rgba(168,85,247,0.03) 100%)',
                            }}
                          >
                            {/* Animated border */}
                            <AnimatedBorder />

                            {/* Aurora effect inside */}
                            <RoofAurora />

                            <div className="relative px-6 py-6 flex items-center gap-4 z-10">
                              {/* Roof badge */}
                              <motion.div
                                className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-[#a855f7]/30 to-[#00f0ff]/20 border-[#a855f7]/60 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                                    : 'bg-[#a855f7]/10 border-[#a855f7]/25'
                                }`}
                                animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                ✨
                              </motion.div>

                              {/* Roof pills */}
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="relative group">
                                  <motion.span
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-300 ${
                                      isSelected
                                        ? 'bg-[#00f0ff]/15 border-[#00f0ff]/50 text-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                                        : 'bg-white/[0.05] border-white/[0.15] text-gray-300 hover:border-[#00f0ff]/30'
                                    }`}
                                    animate={isSelected ? { boxShadow: ['0 0 8px rgba(0,240,255,0.2)', '0 0 16px rgba(0,240,255,0.4)', '0 0 8px rgba(0,240,255,0.2)'] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    🧠 Decision Intelligence
                                  </motion.span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#1e293b] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                                    {roofTooltips.intelligence}
                                  </div>
                                </div>
                                <div className="relative group">
                                  <motion.span
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-300 ${
                                      isSelected
                                        ? 'bg-[#3b82f6]/15 border-[#3b82f6]/50 text-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                        : 'bg-white/[0.05] border-white/[0.15] text-gray-300 hover:border-[#3b82f6]/30'
                                    }`}
                                    animate={isSelected ? { boxShadow: ['0 0 8px rgba(59,130,246,0.2)', '0 0 16px rgba(59,130,246,0.4)', '0 0 8px rgba(59,130,246,0.2)'] } : {}}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                                  >
                                    ⚡ Automation
                                  </motion.span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#1e293b] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                                    {roofTooltips.automation}
                                  </div>
                                </div>
                                <div className="relative group">
                                  <motion.span
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-300 ${
                                      isSelected
                                        ? 'bg-[#a855f7]/15 border-[#a855f7]/50 text-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                        : 'bg-white/[0.05] border-white/[0.15] text-gray-300 hover:border-[#a855f7]/30'
                                    }`}
                                    animate={isSelected ? { boxShadow: ['0 0 8px rgba(168,85,247,0.2)', '0 0 16px rgba(168,85,247,0.4)', '0 0 8px rgba(168,85,247,0.2)'] } : {}}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
                                  >
                                    🤖 AI Readiness
                                  </motion.span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#1e293b] border border-white/10 text-gray-300 text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg">
                                    {roofTooltips.aiReadiness}
                                  </div>
                                </div>
                              </div>

                              {/* Active indicator */}
                              {isSelected && (
                                <motion.div
                                  layoutId="desktopFloorIndicator"
                                  className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                />
                              )}
                            </div>
                          </motion.button>
                        </motion.div>
                      );
                    }

                    // === REGULAR FLOORS ===
                    const floorNum = floor.floor as number;
                    const isLast = floorNum === 1;
                    const isHighlighted = highlightedFloor === floor.id;

                    return (
                      <motion.div
                        key={floor.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: index * 0.08 + 0.4, duration: 0.4 }}
                        className="relative mb-[10px]"
                      >
                        <motion.button
                          ref={(el) => { floorCardRefs.current[floor.id] = el; }}
                          onClick={() => handleFloorClick(floor.id)}
                          whileHover={{
                            y: -2,
                            scale: 1.01,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.99 }}
                          animate={
                            isHighlighted
                              ? { boxShadow: [`0 0 0px transparent`, `0 0 30px ${style!.accentGlow}`, `0 0 0px transparent`] }
                              : {}
                          }
                          transition={isHighlighted ? { duration: 1.2, ease: 'easeInOut' } : undefined}
                          className={`relative w-full flex items-center gap-4 px-5 py-4 border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm ${
                            isLast ? 'rounded-b-xl' : 'rounded-lg'
                          } ${
                            isSelected
                              ? 'border-transparent'
                              : 'border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                          style={{
                            background: isSelected ? style!.bgSelected : style!.bg,
                            borderLeftWidth: '3px',
                            borderLeftColor: isSelected ? style!.accent : style!.borderIdle,
                            boxShadow: isSelected
                              ? `0 0 30px ${style!.accentGlow}, inset 0 0 30px ${style!.accent}08`
                              : 'none',
                          }}
                        >
                          {/* Inner glow gradient */}
                          <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                            style={{
                              background: style!.innerGlow,
                              opacity: isSelected ? 1 : 0.5,
                            }}
                          />

                          {/* Hover glow overlay */}
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `radial-gradient(ellipse at 30% 50%, ${style!.accent}10, transparent 60%)`,
                            }}
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          />



                          {/* Icon */}
                          <span className="text-2xl shrink-0 relative z-10 drop-shadow-[0_0_8px_rgba(0,240,255,0.2)]">
                            {floor.icon}
                          </span>

                          {/* Name & description */}
                          <div className="flex-1 text-left relative z-10">
                            <span
                              className="text-sm font-bold tracking-wide transition-colors duration-300"
                              style={{ color: isSelected ? style!.accent : '#e2e8f0' }}
                            >
                              {floor.name}
                            </span>
                            <span className="hidden lg:block text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                              {floor.description}
                            </span>
                          </div>

                          {/* Floor number on right */}
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all duration-300"
                            style={{
                              color: isSelected ? style!.accent : `${style!.accent}70`,
                              borderColor: isSelected ? `${style!.accent}50` : `${style!.accent}20`,
                              background: isSelected ? `${style!.accent}15` : 'transparent',
                            }}
                          >
                            F{floorNum}
                          </span>

                          {/* Active indicator */}
                          {isSelected && (
                            <motion.div
                              layoutId="desktopFloorIndicator"
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-lg"
                              style={{
                                background: style!.accent,
                                boxShadow: `0 0 12px ${style!.accentGlow}`,
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            />
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Foundation base */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 }}
                className="relative mt-4 ml-16"
              >
                {/* Ground plane - wider horizontal gradient */}
                <div className="relative h-[3px] rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.5) 30%, rgba(34,211,238,0.4) 50%, rgba(168,85,247,0.5) 70%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>

                {/* Reflection effect - faded mirror */}
                <div className="relative h-8 overflow-hidden opacity-20">
                  <div
                    className="absolute inset-x-0 top-0 h-16"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(245,158,11,0.15), transparent)',
                      transform: 'scaleY(-1)',
                      filter: 'blur(4px)',
                    }}
                  />
                </div>

                {/* Foundation label */}
                <div className="flex justify-center mt-1">
                  <motion.span
                    className="relative text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] px-6 py-1.5 border border-white/[0.06] rounded-full bg-white/[0.02]"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-[#f59e0b]/40 mr-2">◆</span>
                    Foundation
                    <span className="text-[#f59e0b]/40 ml-2">◆</span>
                  </motion.span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* === MOBILE BUILDING === */}
          <div className="flex md:hidden flex-col items-center">
            <div className="relative w-full">
              {/* Mobile ambient glow */}
              <motion.div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.04) 0%, transparent 70%)',
                }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Mobile building container */}
              <div className="relative z-10 flex flex-col">
                {displayFloors.map((floor, index) => {
                  const isSelected = selectedFloor === floor.id;
                  const floorIndex = floor.isRoof ? -1 : (floor.floor as number) - 1;
                  const style = floor.isRoof ? null : floorStyles[floorIndex];

                  if (floor.isRoof) {
                    return (
                      <motion.button
                        key={floor.id}
                        onClick={() => handleFloorClick(floor.id)}
                        initial={{ opacity: 0, y: -10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative w-full rounded-xl border-2 mb-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-[#a855f7]/50 shadow-[0_0_30px_rgba(168,85,247,0.25)]'
                            : 'border-[#a855f7]/20 hover:border-[#a855f7]/40'
                        }`}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(0,240,255,0.08))'
                            : 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(0,240,255,0.03))',
                        }}
                      >
                        <RoofAurora />
                        <div className="relative z-10 px-4 py-4 flex items-center gap-3">
                          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm border ${
                            isSelected
                              ? 'bg-[#a855f7]/20 border-[#a855f7]/50 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                              : 'bg-[#a855f7]/10 border-[#a855f7]/20'
                          }`}>
                            ✨
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSelected
                                ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff]'
                                : 'bg-white/[0.05] border-white/[0.1] text-gray-300'
                            }`}>
                              🧠 Intelligence
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSelected
                                ? 'bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#3b82f6]'
                                : 'bg-white/[0.05] border-white/[0.1] text-gray-300'
                            }`}>
                              ⚡ Automation
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSelected
                                ? 'bg-[#a855f7]/15 border-[#a855f7]/40 text-[#a855f7]'
                                : 'bg-white/[0.05] border-white/[0.1] text-gray-300'
                            }`}>
                              🤖 AI
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  }

                  const floorNum = floor.floor as number;
                  const isLast = floorNum === 1;

                  return (
                    <motion.button
                      key={floor.id}
                      onClick={() => handleFloorClick(floor.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.06 + 0.3, duration: 0.3 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative w-full flex items-center gap-3 px-4 py-3.5 mb-[6px] border transition-all duration-300 cursor-pointer rounded-lg ${
                        isLast ? 'rounded-b-xl' : ''
                      } ${
                        isSelected
                          ? 'border-transparent'
                          : 'border-white/[0.05]'
                      }`}
                      style={{
                        background: isSelected ? style!.bgSelected : style!.bg,
                        borderLeftWidth: '3px',
                        borderLeftColor: isSelected ? style!.accent : style!.borderIdle,
                        boxShadow: isSelected ? `0 0 20px ${style!.accentGlow}` : 'none',
                      }}
                    >
                      {/* Floor badge */}
                      <div
                        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold font-mono border"
                        style={{
                          background: isSelected ? `${style!.accent}25` : `${style!.accent}10`,
                          borderColor: isSelected ? `${style!.accent}60` : `${style!.accent}25`,
                          color: isSelected ? style!.accent : `${style!.accent}80`,
                        }}
                      >
                        F{floorNum}
                      </div>
                      <span className="text-lg shrink-0">{floor.icon}</span>
                      <span
                        className="text-xs font-bold tracking-wider transition-colors duration-300"
                        style={{ color: isSelected ? style!.accent : '#cbd5e1' }}
                      >
                        {floor.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Mobile foundation */}
              <div className="flex justify-center mt-4">
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.2em] px-3 py-1 border border-white/[0.05] rounded-full bg-white/[0.02]">
                  ◆ Foundation ◆
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Expanded Detail Panel */}
        <AnimatePresence mode="wait">
          {activeFloor && (
            <motion.div
              ref={detailPanelRef}
              key={activeFloor.id}
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div
                className="relative mt-8 rounded-2xl border bg-white/[0.04] backdrop-blur-lg p-6 md:p-8"
                style={{
                  borderColor: `${selectedAccent}40`,
                  boxShadow: `0 0 50px ${selectedAccent}10`,
                }}
              >
                {/* Animated corner accents with selected floor color */}
                <motion.div
                  className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 rounded-tl-lg"
                  style={{ borderColor: `${selectedAccent}60` }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 rounded-tr-lg"
                  style={{ borderColor: `${selectedAccent}60` }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
                <motion.div
                  className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 rounded-bl-lg"
                  style={{ borderColor: `${selectedAccent}60` }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                />
                <motion.div
                  className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 rounded-br-lg"
                  style={{ borderColor: `${selectedAccent}60` }}
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                />

                {/* Floor header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-xl border flex items-center justify-center"
                    style={{
                      background: `${selectedAccent}15`,
                      borderColor: `${selectedAccent}30`,
                    }}
                  >
                    <span className="text-2xl">{activeFloor.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                      {!activeFloor.isRoof && (
                        <span
                          className="text-sm font-mono"
                          style={{ color: `${selectedAccent}90` }}
                        >
                          Floor {activeFloor.floor}
                        </span>
                      )}
                      {activeFloor.isRoof ? 'The Roof' : activeFloor.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {activeFloor.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Symptoms */}
                  <div className="rounded-xl bg-red-500/[0.05] border border-red-500/20 p-5">
                    <h4 className="text-red-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      Symptoms of Weakness
                    </h4>
                    <ul className="space-y-2.5">
                      {activeFloor.symptoms.map((item, i) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="text-gray-400 text-sm flex items-start gap-2"
                        >
                          <span className="text-red-400/70 mt-0.5 shrink-0">✗</span>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* What Good Looks Like */}
                  <div
                    className="rounded-xl border p-5"
                    style={{
                      background: `${selectedAccent}06`,
                      borderColor: `${selectedAccent}25`,
                    }}
                  >
                    <h4
                      className="text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2"
                      style={{ color: selectedAccent }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: selectedAccent }}
                      />
                      What Good Looks Like
                    </h4>
                    <ul className="space-y-2.5">
                      {activeFloor.goodLooksLike.map((item, i) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="text-gray-300 text-sm flex items-start gap-2"
                        >
                          <span className="mt-0.5 shrink-0" style={{ color: `${selectedAccent}cc` }}>✓</span>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Readiness Levels - Only shown for Roof */}
                {activeFloor.isRoof && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-8"
                  >
                    <div className="rounded-2xl border border-[#00f0ff]/20 bg-gradient-to-br from-white/[0.03] to-[#00f0ff]/[0.02] backdrop-blur-md p-6 md:p-8">
                      {/* Section Header */}
                      <div className="text-center mb-8">
                        <h4 className="text-white font-bold text-lg md:text-xl mb-2">
                          What AI Readiness Actually Means
                        </h4>
                        <p className="text-gray-400 text-sm max-w-lg mx-auto">
                          AI readiness isn&apos;t binary — it&apos;s a progression. Each level builds on the last, requiring stronger data foundations beneath it.
                        </p>
                      </div>

                      {/* Progression Diagram */}
                      <div className="relative flex flex-col md:flex-row items-stretch gap-4 md:gap-0 mb-2">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[24px] left-[16.67%] right-[16.67%] h-[2px] z-0">
                          <div className="relative w-full h-full bg-white/[0.08] rounded-full overflow-hidden">
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                background: 'linear-gradient(90deg, #22d3ee, #3b82f6, #a855f7)',
                              }}
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>

                        {/* Connecting Line (Mobile) */}
                        <div className="md:hidden absolute left-6 top-[24px] bottom-[calc(100%-24px)] w-[2px] z-0">
                          <div className="relative w-full h-full bg-white/[0.08] rounded-full overflow-hidden">
                            <motion.div
                              className="absolute inset-x-0 top-0 rounded-full"
                              style={{
                                background: 'linear-gradient(180deg, #22d3ee, #3b82f6, #a855f7)',
                              }}
                              initial={{ height: '0%' }}
                              animate={{ height: '100%' }}
                              transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
                            />
                          </div>
                        </div>

                        {readinessLevels.map((level, idx) => (
                          <motion.div
                            key={level.level}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + idx * 0.25, duration: 0.5 }}
                            className="relative z-10 flex-1 flex flex-col items-center md:items-center"
                          >
                            {/* Level Node */}
                            <motion.div
                              className="relative w-12 h-12 rounded-full flex items-center justify-center mb-4 border-2"
                              style={{
                                borderColor: level.color,
                                background: `radial-gradient(circle, ${level.color}15, transparent)`,
                              }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                delay: 0.7 + idx * 0.3,
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                              }}
                            >
                              <span className="text-xl">{level.icon}</span>
                              {/* Pulse ring */}
                              <motion.div
                                className="absolute inset-0 rounded-full border"
                                style={{ borderColor: level.color }}
                                animate={{
                                  scale: [1, 1.5, 1.5],
                                  opacity: [0.6, 0, 0],
                                }}
                                transition={{
                                  duration: 2.5,
                                  repeat: Infinity,
                                  delay: idx * 0.5,
                                  ease: 'easeOut',
                                }}
                              />
                            </motion.div>

                            {/* Level Card */}
                            <div
                              className="w-full rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                              style={{
                                borderColor: `${level.color}30`,
                                background: `linear-gradient(135deg, ${level.color}08, transparent)`,
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    color: level.color,
                                    background: `${level.color}15`,
                                  }}
                                >
                                  LEVEL {level.level}
                                </span>
                              </div>
                              <h5
                                className="font-bold text-sm mb-1.5"
                                style={{ color: level.color }}
                              >
                                {level.title}
                              </h5>
                              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                                {level.description}
                              </p>
                              <ul className="space-y-1.5">
                                {level.capabilities.map((cap, capIdx) => (
                                  <motion.li
                                    key={cap}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + idx * 0.25 + capIdx * 0.08 }}
                                    className="text-gray-400 text-xs flex items-start gap-1.5"
                                  >
                                    <span
                                      className="mt-1 w-1 h-1 rounded-full shrink-0"
                                      style={{ background: level.color }}
                                    />
                                    {cap}
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Bottom note */}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="text-center text-gray-500 text-xs font-mono mt-6 tracking-wider"
                      >
                        Each level requires all 8 floors below to be progressively stronger →
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-center text-gray-500 text-xs font-mono mt-10 tracking-wider"
        >
          {selectedFloor
            ? 'Click another floor to explore • Click again to collapse'
            : 'Click any floor to explore the details'}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm mb-5">
            Most organizations have cracks across multiple floors. The good news? Every floor can be strengthened.
          </p>
          <a
            href="#data-house-assessment"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0a0e1a] shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-shadow"
          >
            Assess My Data House
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}