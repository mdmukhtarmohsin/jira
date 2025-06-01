"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

const demos = [
  {
    title: "AI Sprint Planning",
    description:
      "Watch AI suggest optimal task distribution based on team capacity and historical data",
    image: "/placeholder.svg?height=400&width=600",
    color: "from-blue-500 to-indigo-600",
  },
  {
    title: "Risk Heatmap",
    description:
      "Visualize team workload and potential blockers with intelligent risk assessment",
    image: "/placeholder.svg?height=400&width=600",
    color: "from-orange-500 to-red-600",
  },
  {
    title: "Kanban Board",
    description:
      "Drag-and-drop task management with AI insights and predictive analytics",
    image: "/placeholder.svg?height=400&width=600",
    color: "from-green-500 to-emerald-600",
  },
];

export function DemoCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demos.length) % demos.length);
  };

  return (
    <section className="py-24 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-20">
          <div className="inline-flex items-center rounded-lg bg-green-50 dark:bg-green-950/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-700/10 dark:ring-green-300/20 mb-4">
            Live Demo
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            See It In Action
          </h2>
          <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300">
            Experience the power of AI-enhanced project management with
            interactive demos
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <Card className="border-0 shadow-2xl bg-white dark:bg-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  {/* Main Demo Image */}
                  <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${demos[currentSlide].color} opacity-20`}
                    />
                    <div className="relative z-10 text-center text-gray-600 dark:text-gray-300">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                      </div>
                      <p className="text-sm font-medium">
                        Interactive Demo Coming Soon
                      </p>
                    </div>
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="max-w-2xl">
                      <h3 className="text-3xl font-bold mb-3">
                        {demos[currentSlide].title}
                      </h3>
                      <p className="text-lg text-gray-200 leading-relaxed">
                        {demos[currentSlide].description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm w-12 h-12"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm w-12 h-12"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-8 space-x-3">
            {demos.map((_, index) => (
              <button
                key={index}
                className={`group relative w-12 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-blue-600 dark:bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
                onClick={() => setCurrentSlide(index)}
              >
                <span className="sr-only">Go to slide {index + 1}</span>
                {index === currentSlide && (
                  <div className="absolute inset-0 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded bg-blue-600 dark:bg-blue-500"></div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get instant feedback on your project's health and team performance
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded bg-green-600 dark:bg-green-500"></div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Smart Automation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Automate repetitive tasks and focus on what matters most
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <div className="w-6 h-6 rounded bg-purple-600 dark:bg-purple-500"></div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Team Collaboration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enhanced communication tools for distributed teams
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
