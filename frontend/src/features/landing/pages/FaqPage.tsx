import React from 'react';
import { PageHero } from '../components/PageHero';
import { FaqSection } from '../components/FaqSection';
import { FinalCtaSection } from '../components/FinalCtaSection';

export const FaqPage: React.FC = () => {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Answers for teams evaluating TeamFlow"
        description="Roles, isolation, boards, and billing — the questions we hear before a team moves their work onto the platform."
      />
      <FaqSection showAllLink={false} showHeading={false} />
      <FinalCtaSection />
    </>
  );
};

export default FaqPage;
