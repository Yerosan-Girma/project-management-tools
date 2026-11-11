import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { ProductPreview } from '../components/ProductPreview';
import { ProjectTypesSection } from '../components/ProjectTypesSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HowItWorksSection } from '../components/HowItWorksSection';
import { FaqSection } from '../components/FaqSection';
import { FinalCtaSection } from '../components/FinalCtaSection';

export const LandingPage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <ProductPreview />
      <ProjectTypesSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FaqSection limit={4} />
      <FinalCtaSection />
    </>
  );
};

export default LandingPage;
