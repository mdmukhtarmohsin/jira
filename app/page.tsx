import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { DemoCarousel } from "@/components/landing/demo-carousel"
import { Pricing } from "@/components/landing/pricing"
import { CTAFooter } from "@/components/landing/cta-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <Features />
      <DemoCarousel />
      <Pricing />
      <CTAFooter />
    </div>
  )
}
