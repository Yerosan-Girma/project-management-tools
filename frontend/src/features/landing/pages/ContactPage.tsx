import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Mail, Send, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent } from '../../../components/ui/Card';
import { apiClient } from '../../../services/api';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('product');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in your name, work email, and a message.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/contact', {
        name: name.trim(),
        email: email.trim(),
        topic,
        message: message.trim(),
      });
      setSentSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      toast.success(res.data?.message || 'Message received! Platform admin has been notified.');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Failed to deliver message. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk with the TeamFlow team"
        description="Questions about workspaces, roles, or enterprise deployment? Send a note — our platform administrators receive your inquiry via email immediately and will follow up directly."
      />
      <section className="py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-2xl border-slate-200/80 shadow-xl dark:border-slate-800">
            <CardContent className="p-6 sm:p-8">
              {sentSuccess ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message delivered!</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Your inquiry has been emailed directly to our platform leadership team. A confirmation has also been dispatched to your email address.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button variant="outline" onClick={() => setSentSuccess(false)}>
                      Send another message
                    </Button>
                    <a href="/">
                      <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Return to home
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="flex items-center gap-2 rounded-xl bg-primary-50/60 p-3 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-300">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>Inquiries are forwarded directly to TeamFlow platform administrators.</span>
                  </div>

                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    required
                  />
                  <Input
                    label="Work email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    required
                  />
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Topic
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="product">Product &amp; features</option>
                      <option value="pricing">Team or organization plan</option>
                      <option value="security">Security &amp; access</option>
                      <option value="other">Something else</option>
                    </select>
                  </label>
                  <Textarea
                    label="Message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your team size, project workflows, or questions."
                    required
                  />
                  <Button type="submit" className="w-full" isLoading={submitting} leftIcon={<Send className="h-4 w-4" />}>
                    Send message to platform admin
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
