import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Loader2, Smile, Frown, Lightbulb, School, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type FeedbackTopic = 'love' | 'problem' | 'idea' | 'campus' | 'pro';

interface FeedbackDialogProps {
  open: boolean;
  initialTopic?: FeedbackTopic;
  onClose: () => void;
}

const TOPICS: { key: FeedbackTopic; label: string; icon: React.FC<{ className?: string }>; placeholder: string }[] = [
  { key: 'love', label: 'I like it', icon: Smile, placeholder: 'What did you enjoy?' },
  { key: 'problem', label: 'Problem', icon: Frown, placeholder: 'What went wrong? What were you trying to do?' },
  { key: 'idea', label: 'Idea', icon: Lightbulb, placeholder: 'What would make this more useful for you?' },
  { key: 'campus', label: 'For my college', icon: School, placeholder: 'Tell us about your college or class: name, city, number of students, and what you teach.' },
];

/** Pro early access is a focused sign-up, not one of the selectable feedback topics */
const PRO_TOPIC = { key: 'pro' as const, label: 'Pro early access', icon: Sparkles, placeholder: 'Optional: what would you use Pro for? (placement prep, daily practice, college course…)' };

/** Feedback / contact form that actually sends to the server. */
export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, initialTopic = 'love', onClose }) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState<FeedbackTopic>(initialTopic);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic(initialTopic);
    setStatus('idle');
    setError('');
    setName((n) => n || user?.name || '');
    setEmail((e) => e || user?.email || '');
  }, [open, initialTopic]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const label = topic === 'pro' ? PRO_TOPIC.label : TOPICS.find((t) => t.key === topic)?.label || topic;
      const text = message.trim() || (topic === 'pro' ? 'Please notify me when Pro launches.' : '');
      const res = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: `[${label}] ${text}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your message.');
      setStatus('sent');
      setMessage('');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Could not send your message. Please try again.');
    }
  };

  const isPro = topic === 'pro';
  const current = isPro ? PRO_TOPIC : TOPICS.find((t) => t.key === topic)!;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h2 id="feedback-title" className="text-lg font-bold text-slate-900">
              {isPro ? 'Get Pro early access' : topic === 'campus' ? 'Bring it to your classroom' : 'Send us feedback'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isPro ? 'No payment now. We will email you when Pro opens, with the early-access price.' : 'We read every message.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="mt-3 text-base font-semibold text-slate-900">{isPro ? "You're on the early-access list!" : 'Thank you — message sent.'}</p>
            <p className="text-sm text-slate-500 mt-1">
              {isPro ? 'We will email you when Pro opens. Everything in Free keeps working in the meantime.' : topic === 'campus' ? 'Our team will reply to you by email.' : 'Your feedback helps us improve.'}
            </p>
            <button onClick={onClose} className="mt-6 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="px-6 pb-6 pt-5 space-y-4">
            {!isPro && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TOPICS.map(({ key, label, icon: Icon }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setTopic(key)}
                  aria-pressed={topic === key}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                    topic === key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Name</span>
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Email</span>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">{isPro ? 'Anything we should know? (optional)' : 'Message'}</span>
              <textarea
                required={!isPro}
                rows={4}
                maxLength={4900}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={current.placeholder}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </label>
            {status === 'error' && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              {status === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'sending' ? 'Sending…' : isPro ? 'Join early access' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
