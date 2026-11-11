import React from 'react';
import { Shield, Lock, Layers, Eye } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Card, CardContent } from '../../../components/ui/Card';

const items = [
  {
    icon: Lock,
    title: 'JWT dual-token auth',
    body: 'Access and refresh tokens keep sessions short-lived while you stay signed in across the dashboard.',
  },
  {
    icon: Layers,
    title: 'Strict multi-tenancy',
    body: 'Workspace IDs scope every project, task, comment, and invitation. You cannot browse another team’s board.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    body: 'Owner, Admin, Member, and Viewer are enforced on the API, not only hidden in the UI.',
  },
  {
    icon: Eye,
    title: 'Invitation tokens',
    body: 'People join through signed invitation links. Pending invites show in-app until they are accepted or revoked.',
  },
];

export const SecurityPage: React.FC = () => {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Access control is part of the product"
        description="TeamFlow isolates workspaces, signs every session, and checks roles before a board or task is returned."
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <FinalCtaSection />
    </>
  );
};

export default SecurityPage;
