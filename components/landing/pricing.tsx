import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles, Crown, Building } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for small teams getting started",
    icon: Sparkles,
    features: [
      "Up to 5 team members",
      "Basic Kanban boards",
      "AI sprint suggestions (limited)",
      "Basic retrospectives",
      "Community support",
      "2GB storage",
    ],
    cta: "Start Free",
    popular: false,
    color: "gray",
  },
  {
    name: "Pro",
    price: "$12",
    description: "For growing teams with advanced needs",
    icon: Crown,
    features: [
      "Up to 25 team members",
      "Unlimited boards & sprints",
      "Full AI suite (unlimited)",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "50GB storage",
      "Advanced security",
    ],
    cta: "Start Trial",
    popular: true,
    color: "blue",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    icon: Building,
    features: [
      "Unlimited team members",
      "Advanced security & compliance",
      "Custom AI model training",
      "Dedicated support manager",
      "On-premise deployment",
      "SLA guarantees",
      "Unlimited storage",
      "White-label solution",
    ],
    cta: "Contact Sales",
    popular: false,
    color: "purple",
  },
];

export function Pricing() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-lg bg-purple-50 dark:bg-purple-950/30 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/10 dark:ring-purple-300/20 mb-4">
            Pricing
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300">
            Start free and scale as your team grows. No hidden fees, no
            surprises.
          </p>
        </div>

        <div className="mx-auto mt-20 grid max-w-lg grid-cols-1 gap-8 lg:max-w-6xl lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`group relative overflow-hidden transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                plan.popular
                  ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-2xl bg-white dark:bg-gray-800 border-0"
                  : "shadow-lg hover:shadow-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-4 py-2 text-sm font-medium rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${
                  plan.color === "blue"
                    ? "from-blue-500 to-indigo-600"
                    : plan.color === "purple"
                    ? "from-purple-500 to-indigo-600"
                    : "from-gray-400 to-gray-600"
                }`}
              />

              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg ${
                      plan.color === "blue"
                        ? "bg-blue-100 dark:bg-blue-950/30"
                        : plan.color === "purple"
                        ? "bg-purple-100 dark:bg-purple-950/30"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <plan.icon
                      className={`h-6 w-6 ${
                        plan.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : plan.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">
                      /month
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="relative">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={
                    plan.name === "Free"
                      ? "/auth/signup"
                      : plan.name === "Enterprise"
                      ? "/contact"
                      : "/auth/signup"
                  }
                >
                  <Button
                    className={`w-full py-3 font-semibold transition-all duration-200 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg hover:shadow-xl"
                        : plan.color === "purple"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-600 dark:hover:to-indigo-600 text-white"
                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                    }`}
                    variant={plan.popular ? "default" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes, all paid plans come with a 14-day free trial. No credit
                card required.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What about data security?
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your data is encrypted at rest and in transit. We're SOC 2
                compliant and GDPR ready.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer discounts?
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes, we offer discounts for annual billing and special rates for
                nonprofits and education.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
