import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-700 via-primary-700 to-indigo-950 p-8 sm:p-14 text-center text-white shadow-2xl overflow-hidden border border-white/10">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Get Started in Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Ready to streamline your team's workflow?
            </h2>

            <p className="text-sm text-indigo-100 max-w-lg mx-auto">
              Join productive teams worldwide coordinating sprints, tasks, and projects on TeamFlow.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-indigo-950 hover:bg-slate-100 font-bold shadow-lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/25"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
