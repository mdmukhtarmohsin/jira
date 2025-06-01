import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-20 sm:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-blob" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400/20 dark:bg-pink-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-blob animation-delay-4000" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="group relative rounded-full px-4 py-2 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:ring-gray-300/70 dark:hover:ring-gray-600/70 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-300 hover:scale-105">
              <span className="flex items-center gap-2">
                AI-Powered Sprint Planning
                <Sparkles className="inline h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:animate-pulse" />
              </span>
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Project Management with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>

          <p className="mt-8 text-xl leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Streamline your sprints with AI-powered planning, automatic risk
            detection, and intelligent retrospectives. Built for teams who want
            Jira's power with modern AI capabilities.
          </p>

          <div className="mt-12 flex items-center justify-center gap-x-6 flex-wrap">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 px-8 py-3"
              >
                <Play className="mr-2 h-5 w-5" />
                Try Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                10k+
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Teams using our platform
              </div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                99.9%
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Uptime guarantee
              </div>
            </div>
            <div className="group">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200">
                50%
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Faster sprint planning
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
