import { useState } from 'react';
import FloatingOrbs from '@/components/FloatingOrbs';
import ParticleGrid from '@/components/ParticleGrid';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SplashScreen from '@/components/SplashScreen';
import BuiltByD from '@/components/BuiltByD';
import WhyNotReadyForAI from '@/components/WhyNotReadyForAI';
import OrganizationalIntelligenceFramework from '@/components/OrganizationalIntelligenceFramework';
import DataHealthAssessment from '@/components/DataHealthAssessment';
import ImpactEquationCalculator from '@/components/ImpactEquationCalculator';
import RealClientStories from '@/components/RealClientStories';
import ChooseIndustry from '@/components/ChooseIndustry';
import ResourceCenter from '@/components/ResourceCenter';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import MouseGlow from '@/components/MouseGlow';
import StickyCTA from '@/components/StickyCTA';
import FloatingNav from '@/components/FloatingNav';
import AuroraBackground from '@/components/AuroraBackground';
import AmbientLightRays from '@/components/AmbientLightRays';
import AssessmentProgressWidget from '@/components/AssessmentProgressWidget';
import { AssessmentProvider } from '@/contexts/AssessmentContext';

import ParticleBurst from '@/components/ParticleBurst';
import EnergyDivider from '@/components/EnergyDivider';

export default function Index() {
  const [showSplash, setShowSplash] = useState(false);

  return (
    <AssessmentProvider>
    <div className="min-h-screen bg-[#0a0e1a]">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="opacity-100">
        {/* Background effects */}
        <FloatingOrbs />
        <ParticleGrid />
        <div className="noise-overlay" />
        <div className="scanlines" />
        <MouseGlow />
        <AuroraBackground />
        <AmbientLightRays />

        {/* Navigation */}
        <header>
          <Navbar />
        </header>

        <main>
          {/* 1. Hero */}
          <Hero />

          {/* Particle burst transition */}
          <ParticleBurst />

          {/* 2. Built By D - Trust Strip */}
          <BuiltByD />

          {/* 2.5 Why Not Ready For AI */}
          <WhyNotReadyForAI />

          <EnergyDivider />

          {/* 4. The Framework - The Data House™ */}
          <OrganizationalIntelligenceFramework />

          <EnergyDivider />

          {/* 5. Data Health Assessment */}
          <DataHealthAssessment />

          <EnergyDivider />

          {/* 6. Impact Calculator */}
          <ImpactEquationCalculator />

          <EnergyDivider />

          {/* 7. Real Client Stories */}
          <RealClientStories />

          <EnergyDivider />

          {/* 8. Industry Blueprints */}
          <ChooseIndustry />

          <EnergyDivider />

          {/* 9. Resources */}
          <ResourceCenter />

          <EnergyDivider />

          {/* 10. Book Session / Contact */}
          <Contact />
        </main>

        {/* Footer */}
        <footer>
          <Footer />
        </footer>

        {/* Floating Progress Navigation */}
        <FloatingNav />

        {/* Sticky CTA */}
        <StickyCTA />

        {/* Assessment Progress Widget */}
        <AssessmentProgressWidget />
      </div>
    </div>
    </AssessmentProvider>
  );
}