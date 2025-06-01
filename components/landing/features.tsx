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
      "Automatically suggest optimal sprint plans based on team capacity and task priorities using advanced machine learning algorithms.",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    icon: AlertTriangle,
    title: "Risk Heatmap",
    description:
      "Identify overloaded team members and potential blockers before they impact delivery with intelligent workload visualization.",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    icon: BarChart3,
    title: "Scope Detector",
    description:
      "Get warned when sprint scope increases beyond healthy limits during execution with real-time monitoring and alerts.",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    icon: FileText,
    title: "Auto Retrospectives",
    description:
      "Generate structured retrospective reports automatically at sprint completion with actionable insights and recommendations.",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-300/20 mb-4">
            Features
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            AI-Enhanced Project Management
          </h2>
          <p className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300">
            Everything you need to run efficient sprints with intelligent
            automation and modern team collaboration tools.
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-2xl sm:mt-24 lg:mt-32 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`group relative overflow-hidden border-0 bg-white dark:bg-gray-800/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${feature.borderColor} border backdrop-blur-sm`}
              >
                <CardHeader className="pb-4">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-indigo-50/0 dark:from-blue-950/0 dark:via-purple-950/0 dark:to-indigo-950/0 group-hover:from-blue-50/20 dark:group-hover:from-blue-950/20 group-hover:via-purple-50/20 dark:group-hover:via-purple-950/20 group-hover:to-indigo-50/20 dark:group-hover:to-indigo-950/20 transition-all duration-500" />

                {/* Bottom accent line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    feature.color.includes("blue")
                      ? "from-blue-400 to-blue-600"
                      : feature.color.includes("orange")
                      ? "from-orange-400 to-orange-600"
                      : feature.color.includes("green")
                      ? "from-green-400 to-green-600"
                      : "from-purple-400 to-purple-600"
                  } transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                />
              </Card>
            ))}
          </div>
        </div>

        {/* Additional stats section */}
        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              40%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Faster Planning
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              85%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Risk Reduction
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              60%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Better Outcomes
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              90%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Team Satisfaction
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
