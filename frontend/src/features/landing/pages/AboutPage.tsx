import React from 'react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Card, CardContent } from '../../../components/ui/Card';

const values = [
  {
    title: 'One workspace per team',
    body: 'Software, product, ops, and client work should not share a messy board. Isolation is the default.',
  },
  {
    title: 'Live, not refresh',
    body: 'If a teammate moves a card, you should see it. Socket updates are part of the product, not an add-on.',
  },
  {
    title: 'Roles you can explain',
    body: 'Owner, Admin, Member, Viewer — permissions that match how companies already talk about access.',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="TeamFlow is a project platform, not a pile of widgets"
        description="We built the dashboard first: workspaces, projects, Kanban, tasks, calendar, team, and analytics. The marketing site now matches that same product."
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {values.map((item) => (
            <Card key={item.title} hoverable className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <FinalCtaSection />
    </>
  );
};

export default AboutPage;
