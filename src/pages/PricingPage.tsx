import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import PricingSection from '@/components/ui/pricing-section';
import { FeedbackDialog, FeedbackTopic } from '../components/landing/FeedbackDialog';

interface PricingPageProps {
  onNavigate: (view: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [dialog, setDialog] = useState<{ open: boolean; topic: FeedbackTopic }>({ open: false, topic: 'pro' });

  const handleSelectPlan = (plan: string) => {
    if (plan === 'Free') {
      // No account needed to start; signing up is offered inside the workspace when saving
      onNavigate('workspace');
    } else if (plan === 'Pro') {
      // Checkout is not open yet: collect an early-access request instead of pretending to charge
      setDialog({ open: true, topic: 'pro' });
    } else {
      setDialog({ open: true, topic: 'campus' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <PricingSection onSelectPlan={handleSelectPlan} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {/* Trust & Guarantee Banner */}
        <div className="p-7 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Our Free Education Commitment</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Every core learning feature — line-by-line explanations, step-by-step execution, live variables, the 3D view and all
            guided lessons — is free. Pro will add extra practice material and higher limits; it will never take away what is free today.
          </p>
        </div>
      </div>

      <FeedbackDialog open={dialog.open} initialTopic={dialog.topic} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
    </div>
  );
};
