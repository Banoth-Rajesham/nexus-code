"use client";

import React, { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import NumberFlow from "@number-flow/react";
import { Briefcase, CheckCheck, Database, Server, Sparkles, School, GraduationCap, Zap, ArrowRight } from "lucide-react";

export interface PricingFeature {
  text: string;
  icon: React.ReactNode;
  /** Planned, not built yet — shown with a "Soon" badge */
  soon?: boolean;
}

export interface PricingPlan {
  name: string;
  description: string;
  price: number;
  isCustom?: boolean;
  /** Price is announced but checkout is not open yet */
  earlyAccess?: boolean;
  buttonText: string;
  buttonVariant: "outline" | "default";
  popular?: boolean;
  features: PricingFeature[];
  /** First entry is the heading; entries ending in " (soon)" get a "Soon" badge */
  includes: string[];
}

export const NEXUS_PLANS: PricingPlan[] = [
  {
    name: "Free",
    description: "Everything you need to learn to code. Ideal for beginners, coursework labs, and students.",
    price: 0,
    buttonText: "Start coding free",
    buttonVariant: "outline",
    features: [
      { text: "Run Python, JavaScript & TypeScript in the browser", icon: <Database size={18} className="text-blue-600" /> },
      { text: "Line-by-line explanations of your code", icon: <Server size={18} className="text-blue-600" /> },
      { text: "20 AI Insights requests / day", icon: <Zap size={18} className="text-blue-600" /> },
    ],
    includes: [
      "Included free, forever:",
      "Full interactive workspace",
      "Step-by-step execution, flowcharts & 3D view",
      "All 12 guided lessons with automatic checks",
      "Save unlimited projects with a free account",
    ],
  },
  {
    name: "Pro",
    description: "For placement preparation and serious daily practice. Join early access — no payment needed today.",
    price: 99,
    earlyAccess: true,
    buttonText: "Join Pro early access",
    buttonVariant: "default",
    popular: true,
    features: [
      { text: "200 AI Insights requests / day", icon: <Sparkles size={18} className="text-blue-600" /> },
      { text: "Placement prep track: interview problems with 3D walkthroughs", icon: <Briefcase size={18} className="text-blue-600" />, soon: true },
      { text: "Shareable skill certificates for your resume", icon: <GraduationCap size={18} className="text-blue-600" />, soon: true },
    ],
    includes: [
      "Everything in Free, plus:",
      "Higher daily AI Insights limit",
      "Advanced lessons: data structures & algorithms (soon)",
      "Weekly progress report (soon)",
      "Early-access price locked for early members",
    ],
  },
  {
    name: "Campus",
    description: "For colleges, schools, training institutes, and programming lab faculty.",
    price: 0,
    isCustom: true,
    buttonText: "Talk to us",
    buttonVariant: "outline",
    features: [
      { text: "Accounts for your whole class", icon: <School size={18} className="text-blue-600" /> },
      { text: "Lessons mapped to your syllabus", icon: <GraduationCap size={18} className="text-blue-600" /> },
      { text: "Teacher dashboard with student progress", icon: <Server size={18} className="text-blue-600" />, soon: true },
    ],
    includes: [
      "Everything in Pro, plus:",
      "Faculty onboarding session",
      "Auto-checked class assignments (soon)",
      "Priority email support",
    ],
  },
];

const SoonBadge = () => (
  <span className="ml-2 shrink-0 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-amber-700">
    Soon
  </span>
);

interface PricingSectionProps {
  plans?: PricingPlan[];
  onSelectPlan?: (planName: string) => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export default function PricingSection({
  plans = NEXUS_PLANS,
  onSelectPlan,
  title,
  subtitle,
  className = "",
}: PricingSectionProps) {
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
        duration: 0.45,
      },
    }),
    hidden: {
      filter: "blur(8px)",
      y: -16,
      opacity: 0,
    },
  };

  const handlePlanClick = (plan: PricingPlan) => {
    if (onSelectPlan) {
      onSelectPlan(plan.name);
    }
  };

  return (
    <section className={`px-4 py-20 relative bg-slate-50/70 border-y border-slate-200 overflow-hidden ${className}`} ref={pricingRef}>
      {/* Background Soft Glow */}
      <div
        className="absolute top-0 left-[15%] right-[15%] w-[70%] h-96 pointer-events-none opacity-40 -z-0"
        style={{
          background: "radial-gradient(circle at center, rgba(37,99,235,0.2) 0%, transparent 70%)",
        }}
      />

      <div className="text-center mb-10 max-w-3xl mx-auto relative z-10">
        <TimelineContent
          as="div"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 mb-3"
        >
          PLANS &amp; PRICING
        </TimelineContent>

        <TimelineContent
          as="h2"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4"
        >
          {title || (
            <>
              Plans that work best for your{" "}
              <span className="border border-dashed border-blue-500 px-2.5 py-0.5 rounded-xl bg-blue-100/70 text-blue-700 capitalize inline-block">
                coding journey
              </span>
            </>
          )}
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={2}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="sm:text-base text-sm text-slate-600 max-w-xl mx-auto"
        >
          {subtitle || "Learning to code is free. Pro is in early access — join the list and lock in the early price."}
        </TimelineContent>
      </div>


      <div className="grid md:grid-cols-3 max-w-6xl gap-6 mx-auto items-stretch relative z-10 mt-10">
        {plans.map((plan, index) => {
          const isCustom = plan.isCustom;
          const displayPrice = plan.price;

          return (
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={4 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="flex"
            >
              <Card
                className={`w-full flex flex-col justify-between rounded-2xl border transition-all hover:shadow-lg ${
                  plan.popular
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-white shadow-xl shadow-blue-500/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <CardHeader className="text-left">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    {plan.popular && (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm shadow-blue-600/30">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline mt-4 pt-4 border-t border-slate-100">
                    {isCustom ? (
                      <span className="text-4xl font-bold text-slate-900 tracking-tight">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-baseline">
                          <span className="text-2xl sm:text-3xl mr-0.5">₹</span>
                          <NumberFlow
                            value={displayPrice}
                            className="font-bold tabular-nums"
                          />
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5 font-medium">
                          {plan.price === 0 ? "/ forever" : "/ month"}
                        </span>
                        {plan.earlyAccess && (
                          <span className="ml-2 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                            Early access
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 justify-between pt-0">
                  <div>
                    <button
                      type="button"
                      onClick={() => handlePlanClick(plan)}
                      className={`w-full py-3.5 px-4 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 text-white hover:-translate-y-px"
                          : plan.buttonVariant === "outline"
                            ? "bg-slate-900 hover:bg-slate-800 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                      }`}
                    >
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <ul className="space-y-3 font-medium py-5 border-b border-slate-100">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-xs text-slate-700">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 grid place-content-center mr-2.5 shrink-0">
                            {feature.icon}
                          </span>
                          <span>{feature.text}</span>
                          {feature.soon && <SoonBadge />}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider mb-3">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-2">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start text-xs text-slate-600">
                          <span className="h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 grid place-content-center mr-2 shrink-0 mt-0.5">
                            <CheckCheck className="h-3 w-3 text-emerald-600" />
                          </span>
                          <span>{feature.replace(/ \(soon\)$/, "")}</span>
                          {feature.endsWith(" (soon)") && <SoonBadge />}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          );
        })}
      </div>
    </section>
  );
}
