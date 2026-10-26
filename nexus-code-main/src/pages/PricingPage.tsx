import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (view: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-white text-[#242424] py-16 sm:py-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header matching Microsoft 365 */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[#0067B8] mb-2 block">
            MICROSOFT 365 · BHASHACODE PLANS
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#242424] tracking-tight">
            Compare all Microsoft Outlook & BhashaCode plans
          </h1>
          <p className="text-sm sm:text-base text-[#616161] mt-3">
            Start completely free with zero credit card required. Unlock ad-free learning, priority AI reasoning, and deep root-cause debugging with Microsoft 365.
          </p>
        </div>

        {/* Pricing Cards Grid (Exact Microsoft 365 Outlook Tiers) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 items-stretch">
          
          {/* Card 1: Free Web */}
          <div className="bg-white rounded-lg p-8 border border-[#E1DFDD] shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-block bg-[#F5F6F8] text-[#242424] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs mb-3 border border-[#E1DFDD]">
                Genuinely Free
              </div>
              <h3 className="text-xl font-bold text-[#242424] mb-1">Outlook Free Web</h3>
              <p className="text-xs text-[#616161] mb-6">
                Ideal for college coursework labs, beginners, and school students.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#242424]">₹0</span>
                <span className="text-xs text-[#616161]">/ forever</span>
              </div>

              <ul className="space-y-3 text-xs text-[#242424] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>20 AI native explanations / day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>All 8 supported native languages</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Python, Java, C++, JS, TS, Go, Rust</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Line-by-line syntax breakdown</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Interactive Ask AI in mother tongue</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Save up to 15 projects in personal library</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (user) onNavigate('workspace');
                else openAuthModal('signup');
              }}
              className="w-full py-2.5 rounded-[4px] bg-white hover:bg-[#EBF3FC] text-[#0067B8] border border-[#0067B8] font-semibold text-xs transition-colors"
            >
              {user ? 'Currently on Free Tier' : 'Use free web version'}
            </button>
          </div>

          {/* Card 2: Pro Scholar (Featured Microsoft 365 Blue) */}
          <div className="bg-white rounded-lg p-8 border-2 border-[#0067B8] shadow-lg flex flex-col justify-between relative">
            <div className="absolute -top-3 left-6 bg-[#0067B8] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-xs shadow-2xs">
              Recommended for Placements
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#242424] mb-1">Microsoft 365 Pro</h3>
              <p className="text-xs text-[#616161] mb-6">
                For interview prep, competitive programming, and deep DSA mastery.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-[#242424]">₹399</span>
                <span className="text-xs text-[#616161]">/ month ($5 USD)</span>
              </div>

              <ul className="space-y-3 text-xs text-[#242424] mb-8 font-medium">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>200 AI explanations / day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Deep algorithmic root-cause debugger</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Cross-language pseudocode export for records</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Priority low-latency server inference</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Unlimited saved projects & code versions</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                alert('Pro Plan upgrading is being rolled out for the next academic semester! Your Free Plan provides full access to all features with 20 daily explanations.');
              }}
              className="w-full py-2.5 rounded-[4px] bg-[#0067B8] hover:bg-[#005A9E] text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Try free for 1 month
            </button>
          </div>

          {/* Card 3: College Campus & Institutional */}
          <div className="bg-white rounded-lg p-8 border border-[#E1DFDD] shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-block bg-[#F5F6F8] text-[#242424] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs mb-3 border border-[#E1DFDD]">
                Higher Education
              </div>
              <h3 className="text-xl font-bold text-[#242424] mb-1">Campus & College</h3>
              <p className="text-xs text-[#616161] mb-6">
                For engineering colleges, CS departments, and state coding clubs.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-[#242424]">Custom</span>
                <span className="text-xs text-[#616161]">/ department</span>
              </div>

              <ul className="space-y-3 text-xs text-[#242424] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Custom domain & college SSO login</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Department-wide shared code labs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>Teacher review console & student progress</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#0067B8] shrink-0" />
                  <span>On-premise sandbox deployment option</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('docs')}
              className="w-full py-2.5 rounded-[4px] bg-[#F5F6F8] hover:bg-stone-200 text-[#242424] font-semibold text-xs transition-colors"
            >
              Contact Campus Team
            </button>
          </div>

        </div>

        {/* Trust & Guarantee Banner */}
        <div className="max-w-3xl mx-auto p-6 bg-[#F5F6F8] rounded-md border border-[#E1DFDD] text-center shadow-2xs">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0067B8] mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Our Free Education Commitment</span>
          </div>
          <p className="text-xs text-[#616161] leading-relaxed">
            Every core feature of BhashaCode — native line-by-line breakdown, debugger, logic explanation, and pseudocode conversion — is genuinely available in the Free tier. We never hide fundamental educational access behind a mandatory paywall.
          </p>
        </div>

      </div>
    </div>
  );
};
