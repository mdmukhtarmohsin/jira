import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, AlertTriangle, BarChart3, FileText } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Sprint Negotiator",
    description:
      "Automatically suggest optimal sprint plans based on team capacity and task priorities.",
    color: "text-blue-600",
  },
  {
    icon: AlertTriangle,
    title: "Risk Heatmap",
    description:
      "Identify overloaded team members and potential blockers before they impact delivery.",
    color: "text-orange-600",
  },
  {
    icon: BarChart3,
    title: "Scope Detector",
    description:
      "Get warned when sprint scope increases beyond healthy limits during execution.",
    color: "text-green-600",
  },
  {
    icon: FileText,
    title: "Auto Retrospectives",
    description:
      "Generate structured retrospective reports automatically at sprint completion.",
    color: "text-purple-600",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight  sm:text-4xl">
            AI-Enhanced Project Management
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Everything you need to run efficient sprints with intelligent
            automation
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-gray-200 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
