import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Layers,
  KeyRound,
  CheckCircle2,
  XCircle,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';

const defenseLayers = [
  {
    tier: '01',
    icon: Lock,
    title: 'Transport & Edge Security',
    description:
      'All traffic is served over TLS with strict HTTP security headers (Helmet), secure CORS origin whitelisting, and automated IP rate-limiting to prevent brute force and DDoS attacks.',
  },
  {
    tier: '02',
    icon: KeyRound,
    title: 'Dual-Token JWT Authentication',
    description:
      'Short-lived 15-minute access tokens minimize exposure windows, while refresh tokens are securely rotated in HttpOnly cookies with CSRF defense and instant session revocation.',
  },
  {
    tier: '03',
    icon: Layers,
    title: 'Strict Multi-Tenant Isolation',
    description:
      'Every project, task, board column, comment, and attachment is strictly bound to its workspace tenant UUID. Cross-tenant queries are structurally prevented by Prisma schema constraints.',
  },
  {
    tier: '04',
    icon: ShieldCheck,
    title: 'Granular RBAC & PBAC Enforcement',
    description:
      'Permissions are checked in backend middleware before any database mutation or read executes. Role inheritance ensures owners retain full governance while guests remain read-only.',
  },
];

const permissionMatrix = [
  { action: 'Platform configuration & maintenance', platformAdmin: true, owner: false, admin: false, member: false, viewer: false },
  { action: 'Manage workspace billing & delete workspace', platformAdmin: true, owner: true, admin: false, member: false, viewer: false },
  { action: 'Create projects & invite workspace members', platformAdmin: true, owner: true, admin: true, member: false, viewer: false },
  { action: 'Create, update & move tasks on Kanban boards', platformAdmin: true, owner: true, admin: true, member: true, viewer: false },
  { action: 'Post comments & upload sprint attachments', platformAdmin: true, owner: true, admin: true, member: true, viewer: false },
  { action: 'View Kanban boards, calendar & sprint tasks', platformAdmin: true, owner: true, admin: true, member: true, viewer: true },
];

export const SecurityPage: React.FC = () => {
  return (
    <>
      <PageHero
        eyebrow="Security & Governance"
        title="Enterprise-grade security built into every layer"
        description="Learn how TeamFlow protects your organization's intellectual property, sprint roadmaps, and client data with multi-tenant isolation and strict role governance."
      />

      {/* Security Architecture Overview */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Defense in Depth
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              The four-tier defense model
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Security is not an afterthought or an add-on plugin. Every request is verified through four successive layers of enforcement.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {defenseLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <div
                  key={layer.tier}
                  className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-slate-200 dark:text-slate-800">
                      {layer.tier}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{layer.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
                    {layer.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RBAC Permission Matrix Section */}
      <section className="border-y border-slate-200/70 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Role Matrix
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Granular permissions by role
            </h2>
            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              Role inheritance automatically safeguards management capabilities while giving contributors full delivery freedom.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Capability / Permission</th>
                  <th className="px-4 py-4 text-center">Platform Admin</th>
                  <th className="px-4 py-4 text-center">Owner</th>
                  <th className="px-4 py-4 text-center">Admin</th>
                  <th className="px-4 py-4 text-center">Member</th>
                  <th className="px-4 py-4 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissionMatrix.map((row, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{row.action}</td>
                    <td className="px-4 py-3.5 text-center">
                      <CheckCircle2 className="mx-auto h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.owner ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-primary-600 dark:text-primary-400" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.admin ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.member ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.viewer ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust & Compliance Callout */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
            <FileCheck2 className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Have custom compliance or security requirements?
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            We partner with organizations requiring custom data residency, dedicated hosting environments, and specialized single sign-on (SSO) integrations.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/contact">
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Contact security team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
};

export default SecurityPage;
