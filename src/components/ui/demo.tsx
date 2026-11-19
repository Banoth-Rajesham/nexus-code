"use client"

import PricingSection from "@/components/ui/pricing-section";
import AgentScanCarousel from "@/components/ui/agent-scan-carousel";

export function DemoOne() {
  return <PricingSection />;
}

export default function Demo() {
  return (
    <div className="space-y-16">
      <AgentScanCarousel />
      <PricingSection />
    </div>
  );
}
