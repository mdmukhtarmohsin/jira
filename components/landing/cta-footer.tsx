import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Calendar } from "lucide-react";
import Link from "next/link";

export function CTAFooter() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 dark:from-blue-800 dark:via-indigo-900 dark:to-purple-900 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-40 right-20 w-64 h-64 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-40 w-64 h-64 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Sprint Planning?
            </span>
          </h2>
          <p className="mt-6 text-xl leading-8 text-blue-100">
            Join thousands of teams already using AI to optimize their project
            management. Start your free trial today and see the difference
            intelligent automation makes.
          </p>
          <div className="mt-12 flex items-center justify-center gap-x-6 flex-wrap">
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-700 hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3 font-semibold"
              >
                <Mail className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 hover:border-white backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3 font-semibold"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex items-center justify-center gap-x-8 flex-wrap">
            <div className="text-white/80 text-sm">
              <span className="font-semibold text-white">10,000+</span> teams
              trust us
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-semibold text-white">99.9%</span> uptime
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-semibold text-white">SOC 2</span> compliant
            </div>
          </div>
        </div>
      </div>

      <footer className="relative mt-20 border-t border-white/20 pt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-blue-100">
            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Product</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Features
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Pricing
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/api"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    API Documentation
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/integrations"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Integrations
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Company</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="/about"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    About Us
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Blog
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Careers
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/press"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Press Kit
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Support</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="/docs"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Documentation
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/help"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Help Center
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Contact Support
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/status"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    System Status
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-6 text-lg">Legal</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Privacy Policy
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Terms of Service
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/security"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Security
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
                <li>
                  <a
                    href="/cookies"
                    className="hover:text-white transition-colors duration-200 flex items-center group"
                  >
                    Cookie Policy
                    <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-200" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center text-blue-100 text-sm">
            <div className="flex items-center space-x-6">
              <span>© 2025 Jira Clone AI. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <span>Made with ❤️ for productive teams</span>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
