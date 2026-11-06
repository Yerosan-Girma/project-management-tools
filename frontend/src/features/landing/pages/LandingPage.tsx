import React from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { HeroSection } from '../components/HeroSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { ProductPreview } from '../components/ProductPreview';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FaqSection } from '../components/FaqSection';
import { LandingFooter } from '../components/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-primary-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ProductPreview />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
