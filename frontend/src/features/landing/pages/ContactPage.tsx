import React, { useState } from 'react';
import { toast } from 'sonner';
import { PageHero } from '../components/PageHero';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent } from '../../../components/ui/Card';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('product');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in name, email, and a message.');
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setName('');
      setEmail('');
      setMessage('');
      toast.success('Message received. We will reply at the email you provided.');
    }, 600);
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk with the TeamFlow team"
        description="Questions about workspaces, roles, or moving an existing board? Send a note — this form stays on-device and confirms immediately."
      />
      <section className="py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
                <Input
                  label="Work email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                />
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topic
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="product">Product & features</option>
                    <option value="pricing">Team or organization plan</option>
                    <option value="security">Security & access</option>
                    <option value="other">Something else</option>
                  </select>
                </label>
                <Textarea
                  label="Message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your team size and the kind of projects you run."
                />
                <Button type="submit" className="w-full" isLoading={submitting}>
                  Send message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
