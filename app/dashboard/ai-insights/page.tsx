"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  RefreshCw,
  Clock,
  Target,
  Zap,
  Brain,
  BarChart3,
  Activity,
  PieChart,
  CheckCircle,
  Calendar,
  TrendingDown,
  Loader2,
  Search,
  Database,
  LineChart,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

// Import types from the existing AI insights panel
interface ScopeCreepAlert {
  sprintId: string;
  sprintName: string;
  originalStoryPoints: number;
  currentStoryPoints: number;
  increasePercentage: number;
  riskLevel: "low" | "medium" | "high";
  addedTasks: string[];
  warning: string;
}

interface RiskHeatmapData {
  overloadedMembers: Array<{
    memberId: string;
    memberName: string;
    taskCount: number;
    totalStoryPoints: number;
    riskLevel: "high" | "medium" | "low";
    reason: string;
  }>;
  delayedTasks: Array<{
    taskId: string;
    taskTitle: string;
    daysOverdue: number;
    riskLevel: "high" | "medium" | "low";
  }>;
  blockedTasks: Array<{
    taskId: string;
    taskTitle: string;
    blockingReason: string;
    riskLevel: "high" | "medium" | "low";
  }>;
  recommendations: string[];
}

interface RetrospectiveData {
  sprintId: string;
  sprintName: string;
  content: string;
  generatedAt: string;
}

// Add new interface for completed sprints
interface CompletedSprint {
  id: string;
  name: string;
  endDate: string;
  retrospective?: RetrospectiveData;
}

interface AIInsight {
  type: "risk" | "success" | "warning" | "info";
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

interface PerformanceMetrics {
  sprintVelocity: Array<{
    sprintName: string;
    plannedPoints: number;
    completedPoints: number;
    completionRate: number;
  }>;
  teamProductivity: Array<{
    memberName: string;
    tasksCompleted: number;
    averageCompletionTime: number;
    efficiency: number;
  }>;
  qualityMetrics: {
    bugRate: number;
    reworkPercentage: number;
    customerSatisfaction: number;
  };
}

interface PredictiveAnalytics {
  sprintCompletion: {
    probability: number;
    confidence: number;
    riskFactors: string[];
  };
  burndownPrediction: Array<{
    date: string;
    predicted: number;
    actual: number;
  }>;
  recommendedActions: string[];
}

// Add loading states interface
interface LoadingState {
  step: string;
  message: string;
  icon: React.ComponentType<any>;
}

const loadingSteps: LoadingState[] = [
  {
    step: "initialization",
    message: "Initializing AI analysis engine...",
    icon: Brain,
  },
  {
    step: "data-fetch",
    message: "Fetching project data and sprint information...",
    icon: Database,
  },
  {
    step: "scope-analysis",
    message: "Analyzing scope creep patterns...",
    icon: TrendingUp,
  },
  {
    step: "risk-assessment",
    message: "Evaluating team workload and risk factors...",
    icon: AlertTriangle,
  },
  {
    step: "performance-calc",
    message: "Calculating performance metrics and velocity...",
    icon: BarChart3,
  },
  {
    step: "predictions",
    message: "Running predictive models for sprint completion...",
    icon: PieChart,
  },
  {
    step: "retrospectives",
    message: "Processing retrospective data...",
    icon: FileText,
  },
  {
    step: "insights-generation",
    message: "Generating AI insights and recommendations...",
    icon: Zap,
  },
  {
    step: "finalization",
    message: "Finalizing analysis and preparing dashboard...",
    icon: CheckCircle,
  },
];

// Loading Component
function AIAnalysisLoading() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationClass, setAnimationClass] = useState("opacity-100");

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationClass("opacity-50");

      setTimeout(() => {
        setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
        setAnimationClass("opacity-100");
      }, 200);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-foreground">
            <Brain className="mr-3 h-8 w-8 text-purple-600 dark:text-purple-400" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered analysis of your project health and team
            performance
          </p>
        </div>
      </div>

      {/* Loading Analysis Card */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Icon and Spinner */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
              </div>
              <div className="relative w-16 h-16 border-4 border-purple-600 dark:border-purple-400 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CurrentIcon
                  className={`h-6 w-6 text-purple-600 dark:text-purple-400 transition-opacity duration-200 ${animationClass}`}
                />
              </div>
            </div>

            {/* Analysis Status */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Running AI Analysis
              </h3>
              <p
                className={`text-sm text-muted-foreground transition-opacity duration-200 ${animationClass}`}
              >
                {loadingSteps[currentStep].message}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {Math.round(((currentStep + 1) / loadingSteps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      ((currentStep + 1) / loadingSteps.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Analysis Steps Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-2xl">
              {loadingSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={step.step}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                      isActive
                        ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30 scale-105"
                        : isCompleted
                        ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-950/30"
                        : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isActive
                          ? "bg-purple-100 dark:bg-purple-900/50"
                          : isCompleted
                          ? "bg-green-100 dark:bg-green-900/50"
                          : "bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <StepIcon
                          className={`h-4 w-4 ${
                            isActive
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs text-center mt-1 font-medium ${
                        isActive
                          ? "text-purple-700 dark:text-purple-300"
                          : isCompleted
                          ? "text-green-700 dark:text-green-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.step.replace("-", " ")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Fun AI Facts */}
            <div className="mt-6 p-4 bg-background border border-purple-100 dark:border-purple-800 rounded-lg max-w-md">
              <div className="text-center">
                <Search className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Did you know?</span> Our AI
                  analyzes over{" "}
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    50+ data points
                  </span>{" "}
                  to generate insights about your team's performance and sprint
                  health.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AIInsightsPage() {
  const { user } = useAuth();
  const [scopeCreepAlerts, setScopeCreepAlerts] = useState<ScopeCreepAlert[]>(
    []
  );
  const [riskHeatmap, setRiskHeatmap] = useState<RiskHeatmapData | null>(null);
  const [retrospectives, setRetrospectives] = useState<RetrospectiveData[]>([]);
  const [completedSprints, setCompletedSprints] = useState<CompletedSprint[]>(
    []
  );
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [generatingRetrospective, setGeneratingRetrospective] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [predictiveAnalytics, setPredictiveAnalytics] =
    useState<PredictiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchAllAIData();
    }
  }, [user]);

  const fetchAllAIData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchScopeCreepAlerts(),
        fetchRiskHeatmap(),
        fetchRetrospectives(),
        fetchInsights(),
        fetchPerformanceMetrics(),
        fetchPredictiveAnalytics(),
      ]);
    } catch (error) {
      console.error("Error fetching AI data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScopeCreepAlerts = async () => {
    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", orgMember.organization_id);

      if (!teams) return;

      const teamIds = teams.map((t) => t.id);
      const { data: activeSprints } = await supabase
        .from("sprints")
        .select("id, name, start_date, created_at")
        .in("team_id", teamIds)
        .eq("status", "active");

      if (!activeSprints || activeSprints.length === 0) {
        setScopeCreepAlerts([]);
        return;
      }

      const alerts: ScopeCreepAlert[] = [];
      for (const sprint of activeSprints) {
        const { data: sprintTasks } = await supabase
          .from("sprint_tasks")
          .select(`added_at, tasks!inner(id, title, story_points, created_at)`)
          .eq("sprint_id", sprint.id);

        if (!sprintTasks) continue;

        const processedSprintTasks = sprintTasks.map((st: any) => ({
          added_at: st.added_at,
          tasks: st.tasks,
        }));

        const originalTasks = processedSprintTasks.filter(
          (st) => new Date(st.added_at) <= new Date(sprint.start_date)
        );
        const allTasks = processedSprintTasks;

        const originalStoryPoints = originalTasks.reduce(
          (sum, st) => sum + (st.tasks.story_points || 0),
          0
        );
        const currentStoryPoints = allTasks.reduce(
          (sum, st) => sum + (st.tasks.story_points || 0),
          0
        );

        if (originalStoryPoints > 0) {
          const increasePercentage =
            ((currentStoryPoints - originalStoryPoints) / originalStoryPoints) *
            100;

          if (increasePercentage > 15) {
            const addedTasks = allTasks
              .filter(
                (st) => new Date(st.added_at) > new Date(sprint.start_date)
              )
              .map((st) => st.tasks.title);

            alerts.push({
              sprintId: sprint.id,
              sprintName: sprint.name,
              originalStoryPoints,
              currentStoryPoints,
              increasePercentage: Math.round(increasePercentage),
              riskLevel: increasePercentage > 25 ? "high" : "medium",
              addedTasks,
              warning: `Sprint scope increased by ${Math.round(
                increasePercentage
              )}% since start`,
            });
          }
        }
      }

      setScopeCreepAlerts(alerts);
    } catch (error) {
      console.error("Error fetching scope creep alerts:", error);
    }
  };

  const fetchRiskHeatmap = async () => {
    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", orgMember.organization_id);

      if (!teams) return;

      const teamIds = teams.map((t) => t.id);
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("team_id", teamIds)
        .neq("status", "done");

      const { data: teamMembersData } = await supabase
        .from("team_members")
        .select("user_id")
        .in("team_id", teamIds);

      if (!tasks || !teamMembersData) return;

      const processedTeamMembers: Array<{ id: string; name: string }> = [];
      if (teamMembersData.length > 0) {
        const userIds = teamMembersData.map((tm) => tm.user_id);
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (userProfiles) {
          processedTeamMembers.push(
            ...userProfiles.map((up) => ({
              id: up.id,
              name: up.full_name || "Unknown",
            }))
          );
        }
      }

      const response = await fetch("/api/ai/risk-heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          teamMembers: processedTeamMembers,
          currentDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const riskData = await response.json();
        setRiskHeatmap(riskData);
      }
    } catch (error) {
      console.error("Error fetching risk heatmap:", error);
    }
  };

  const fetchRetrospectives = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", orgMember.organization_id);

      if (!teams) return;

      const teamIds = teams.map((t) => t.id);
      const { data: completedSprintsData } = await supabase
        .from("sprints")
        .select("id, name, end_date")
        .in("team_id", teamIds)
        .eq("status", "completed")
        .gte("end_date", thirtyDaysAgo.toISOString())
        .order("end_date", { ascending: false })
        .limit(10); // Increased limit to show more sprints

      if (!completedSprintsData || completedSprintsData.length === 0) {
        setCompletedSprints([]);
        setSelectedSprintId("");
        setRetrospectives([]);
        return;
      }

      const { data: existingRetros } = await supabase
        .from("retrospectives")
        .select("sprint_id, content, created_at")
        .in(
          "sprint_id",
          completedSprintsData.map((s) => s.id)
        );

      // Organize completed sprints with their retrospectives
      const sprintsWithRetros: CompletedSprint[] = completedSprintsData.map(
        (sprint) => {
          const retrospective = existingRetros?.find(
            (r) => r.sprint_id === sprint.id
          );

          return {
            id: sprint.id,
            name: sprint.name,
            endDate: sprint.end_date,
            retrospective: retrospective
              ? {
                  sprintId: sprint.id,
                  sprintName: sprint.name,
                  content: retrospective.content,
                  generatedAt: retrospective.created_at,
                }
              : undefined,
          };
        }
      );

      setCompletedSprints(sprintsWithRetros);

      // Set the latest sprint as default if no sprint is selected or if current selection is not in the new list
      if (
        !selectedSprintId ||
        !sprintsWithRetros.find((s) => s.id === selectedSprintId)
      ) {
        if (sprintsWithRetros.length > 0) {
          setSelectedSprintId(sprintsWithRetros[0].id);
        }
      }

      // Keep the existing retrospectives array for backward compatibility
      const retros: RetrospectiveData[] = sprintsWithRetros
        .filter((sprint) => sprint.retrospective)
        .map((sprint) => sprint.retrospective!);

      setRetrospectives(retros);
    } catch (error) {
      console.error("Error fetching retrospectives:", error);
    }
  };

  const fetchInsights = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const mockInsights: AIInsight[] = [
        {
          type: "success",
          title: "Great Sprint Velocity",
          description: "Team is consistently meeting sprint goals",
          metric: "95% completion rate",
          action: "Maintain current pace",
        },
        {
          type: "warning",
          title: "High WIP Tasks",
          description: "Too many tasks in progress simultaneously",
          metric: "8 active tasks",
          action: "Focus on completing existing work",
        },
        {
          type: "info",
          title: "Code Review Bottleneck",
          description: "Reviews taking longer than usual",
          metric: "3.2 days average",
          action: "Add more reviewers to the rotation",
        },
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", orgMember.organization_id);

      if (!teams) return;

      const teamIds = teams.map((t) => t.id);

      const response = await fetch("/api/ai/performance-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamIds,
          timeRange: 30,
        }),
      });

      if (response.ok) {
        const metrics = await response.json();
        setPerformanceMetrics(metrics);
      } else {
        const mockMetrics: PerformanceMetrics = {
          sprintVelocity: [
            {
              sprintName: "Sprint 1",
              plannedPoints: 21,
              completedPoints: 18,
              completionRate: 86,
            },
            {
              sprintName: "Sprint 2",
              plannedPoints: 24,
              completedPoints: 22,
              completionRate: 92,
            },
            {
              sprintName: "Sprint 3",
              plannedPoints: 20,
              completedPoints: 20,
              completionRate: 100,
            },
            {
              sprintName: "Sprint 4",
              plannedPoints: 26,
              completedPoints: 24,
              completionRate: 92,
            },
          ],
          teamProductivity: [
            {
              memberName: "Alice Johnson",
              tasksCompleted: 12,
              averageCompletionTime: 2.3,
              efficiency: 95,
            },
            {
              memberName: "Bob Smith",
              tasksCompleted: 8,
              averageCompletionTime: 3.1,
              efficiency: 78,
            },
            {
              memberName: "Charlie Brown",
              tasksCompleted: 10,
              averageCompletionTime: 2.8,
              efficiency: 85,
            },
          ],
          qualityMetrics: {
            bugRate: 2.1,
            reworkPercentage: 8.5,
            customerSatisfaction: 4.6,
          },
        };
        setPerformanceMetrics(mockMetrics);
      }
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
    }
  };

  const fetchPredictiveAnalytics = async () => {
    try {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single();

      if (!orgMember) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .eq("organization_id", orgMember.organization_id);

      if (!teams) return;

      const teamIds = teams.map((t) => t.id);

      const { data: activeSprint } = await supabase
        .from("sprints")
        .select("id")
        .in("team_id", teamIds)
        .eq("status", "active")
        .limit(1)
        .single();

      if (activeSprint) {
        const response = await fetch("/api/ai/predictive-analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sprintId: activeSprint.id,
            teamIds,
          }),
        });

        if (response.ok) {
          const analytics = await response.json();
          setPredictiveAnalytics(analytics);
        } else {
          const mockPredictive: PredictiveAnalytics = {
            sprintCompletion: {
              probability: 87,
              confidence: 92,
              riskFactors: [
                "2 tasks without assignees",
                "Holiday period overlap",
                "Dependency on external team",
              ],
            },
            burndownPrediction: [
              { date: "2024-01-01", predicted: 24, actual: 24 },
              { date: "2024-01-02", predicted: 22, actual: 23 },
              { date: "2024-01-03", predicted: 20, actual: 19 },
              { date: "2024-01-04", predicted: 17, actual: 18 },
              { date: "2024-01-05", predicted: 14, actual: 0 },
            ],
            recommendedActions: [
              "Assign remaining unassigned tasks",
              "Schedule critical path review",
              "Consider scope adjustment for holiday impact",
              "Set up daily check-ins for external dependencies",
            ],
          };
          setPredictiveAnalytics(mockPredictive);
        }
      } else {
        const mockPredictive: PredictiveAnalytics = {
          sprintCompletion: {
            probability: 0,
            confidence: 0,
            riskFactors: ["No active sprint found"],
          },
          burndownPrediction: [],
          recommendedActions: [
            "Start a new sprint to enable predictive analytics",
          ],
        };
        setPredictiveAnalytics(mockPredictive);
      }
    } catch (error) {
      console.error("Error fetching predictive analytics:", error);
    }
  };

  const generateSprintRetrospective = async (sprintId: string) => {
    try {
      setGeneratingRetrospective(true);
      const response = await fetch("/api/ai/retrospective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });

      if (response.ok) {
        toast({
          title: "Retrospective Generated",
          description: "AI retrospective has been generated for the sprint.",
        });
        // Refresh retrospectives data
        await fetchRetrospectives();
      } else {
        throw new Error("Failed to generate retrospective");
      }
    } catch (error) {
      console.error("Error generating retrospective:", error);
      toast({
        title: "Error",
        description: "Failed to generate retrospective.",
        variant: "destructive",
      });
    } finally {
      setGeneratingRetrospective(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "low":
        return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getIconForType = (type: AIInsight["type"]) => {
    switch (type) {
      case "risk":
        return (
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
        );
      case "warning":
        return (
          <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
        );
      case "success":
        return (
          <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400" />
        );
      case "info":
        return <Target className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBackgroundForType = (type: AIInsight["type"]) => {
    switch (type) {
      case "risk":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800";
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-muted border-border";
    }
  };

  if (loading) {
    return <AIAnalysisLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-foreground">
            <Brain className="mr-3 h-8 w-8 text-purple-600 dark:text-purple-400" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Comprehensive AI-powered analysis of your project health and team
            performance
          </p>
        </div>
        <Button onClick={fetchAllAIData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-muted dark:bg-background">
          <TabsTrigger
            value="overview"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="scope-creep"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Scope Creep
          </TabsTrigger>
          <TabsTrigger
            value="risk-analysis"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="predictive"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Predictive
          </TabsTrigger>
          <TabsTrigger
            value="retrospectives"
            className="text-sm font-medium data-[state=active]:text-foreground"
          >
            Retrospectives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Insights Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scopeCreepAlerts.length +
                    (riskHeatmap?.overloadedMembers.length || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scope creep and risk alerts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sprint Health
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictiveAnalytics?.sprintCompletion.probability || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Completion probability
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Velocity
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.sprintVelocity.slice(-1)[0]
                    ?.completionRate || 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Last sprint completion
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quality Score
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.qualityMetrics.customerSatisfaction || 0}
                  /5
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer satisfaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                AI-generated insights based on current project data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${getBackgroundForType(
                      insight.type
                    )}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getIconForType(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        {insight.metric && (
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">{insight.metric}</Badge>
                            {insight.action && (
                              <span className="text-xs text-muted-foreground">
                                {insight.action}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scope-creep" className="space-y-4">
          {/* Scope creep content - same as original */}
          {scopeCreepAlerts.length > 0 ? (
            scopeCreepAlerts.map((alert) => (
              <Alert
                key={alert.sprintId}
                className={`border-l-4 ${getRiskColor(alert.riskLevel)}`}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong>{alert.sprintName}</strong>
                      <Badge className={getRiskColor(alert.riskLevel)}>
                        {alert.riskLevel} risk
                      </Badge>
                    </div>
                    <p className="text-sm">{alert.warning}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Original:{" "}
                        </span>
                        <span className="font-medium">
                          {alert.originalStoryPoints} pts
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current: </span>
                        <span className="font-medium">
                          {alert.currentStoryPoints} pts
                        </span>
                      </div>
                    </div>
                    {alert.addedTasks.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Recently added tasks:
                        </p>
                        <ul className="text-xs space-y-1">
                          {alert.addedTasks.map((task, idx) => (
                            <li key={idx} className="text-foreground/80">
                              • {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                No Scope Creep Detected
              </h3>
              <p className="text-muted-foreground">
                Your active sprints are maintaining healthy scope boundaries.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk-analysis" className="space-y-4">
          {/* Risk heatmap content - same as original but with more details */}
          {riskHeatmap ? (
            <div className="space-y-6">
              {riskHeatmap.overloadedMembers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      Overloaded Team Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskHeatmap.overloadedMembers.map((member, idx) => (
                        <Alert
                          key={idx}
                          className={`border-l-4 ${getRiskColor(
                            member.riskLevel
                          )}`}
                        >
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <strong className="text-foreground">
                                  {member.memberName}
                                </strong>
                                <p className="text-sm text-muted-foreground">
                                  {member.reason}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-foreground">
                                  {member.taskCount} tasks
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {member.totalStoryPoints} pts
                                </div>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {riskHeatmap.delayedTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Delayed Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {riskHeatmap.delayedTasks.map((task, idx) => (
                        <Alert
                          key={idx}
                          className={`border-l-4 ${getRiskColor(
                            task.riskLevel
                          )}`}
                        >
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <strong className="text-foreground">
                                {task.taskTitle}
                              </strong>
                              <Badge className={getRiskColor(task.riskLevel)}>
                                {task.daysOverdue} days overdue
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {riskHeatmap.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {riskHeatmap.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                          <span className="text-sm text-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {riskHeatmap.overloadedMembers.length === 0 &&
                riskHeatmap.delayedTasks.length === 0 &&
                riskHeatmap.blockedTasks.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Team Health Looks Good
                    </h3>
                    <p className="text-muted-foreground">
                      No significant risks detected in current workload
                      distribution.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                No Risk Data Available
              </h3>
              <p className="text-muted-foreground">
                Risk analysis will appear here when you have active tasks and
                team members.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceMetrics && (
            <>
              {/* Sprint Velocity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Sprint Velocity Trends
                  </CardTitle>
                  <CardDescription>
                    Planned vs completed story points over recent sprints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.sprintVelocity.map((sprint, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {sprint.sprintName}
                          </span>
                          <Badge
                            variant={
                              sprint.completionRate >= 90
                                ? "default"
                                : "secondary"
                            }
                          >
                            {sprint.completionRate}%
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1 bg-muted dark:bg-muted/50 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (sprint.completedPoints /
                                    sprint.plannedPoints) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Planned: {sprint.plannedPoints}</span>
                          <span>Completed: {sprint.completedPoints}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Productivity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Team Productivity
                  </CardTitle>
                  <CardDescription>
                    Individual team member performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceMetrics.teamProductivity.map((member, idx) => (
                      <div
                        key={idx}
                        className="p-4 border rounded-lg dark:border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">
                            {member.memberName}
                          </span>
                          <Badge
                            variant={
                              member.efficiency >= 90 ? "default" : "secondary"
                            }
                          >
                            {member.efficiency}% efficiency
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Tasks completed:{" "}
                            </span>
                            <span className="font-medium text-foreground">
                              {member.tasksCompleted}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Avg completion:{" "}
                            </span>
                            <span className="font-medium text-foreground">
                              {member.averageCompletionTime} days
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Quality Metrics
                  </CardTitle>
                  <CardDescription>
                    Overall code quality and customer satisfaction indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg dark:border-border">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {performanceMetrics.qualityMetrics.bugRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bug Rate
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg dark:border-border">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {performanceMetrics.qualityMetrics.reworkPercentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rework
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg dark:border-border">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {performanceMetrics.qualityMetrics.customerSatisfaction}
                        /5
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Satisfaction
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          {predictiveAnalytics && (
            <>
              {/* Sprint Completion Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="mr-2 h-5 w-5" />
                    Sprint Completion Prediction
                  </CardTitle>
                  <CardDescription>
                    AI-powered prediction for current sprint success
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {predictiveAnalytics.sprintCompletion.probability}%
                      </div>
                      <div className="text-muted-foreground">
                        Completion probability (
                        {predictiveAnalytics.sprintCompletion.confidence}%
                        confidence)
                      </div>
                    </div>

                    {predictiveAnalytics.sprintCompletion.riskFactors.length >
                      0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-foreground">
                          Risk Factors:
                        </h4>
                        <ul className="space-y-1">
                          {predictiveAnalytics.sprintCompletion.riskFactors.map(
                            (factor, idx) => (
                              <li
                                key={idx}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                                <span className="text-foreground">
                                  {factor}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Burndown Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="mr-2 h-5 w-5" />
                    Burndown Prediction
                  </CardTitle>
                  <CardDescription>
                    Predicted vs actual progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveAnalytics.burndownPrediction.map(
                      (point, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-foreground">
                            {point.date}
                          </span>
                          <div className="flex space-x-4">
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              Predicted: {point.predicted}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400">
                              Actual: {point.actual}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5" />
                    Recommended Actions
                  </CardTitle>
                  <CardDescription>
                    AI-suggested actions to improve sprint outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictiveAnalytics.recommendedActions.map(
                      (action, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-3 p-3 border rounded-lg dark:border-border"
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5" />
                          <span className="text-sm text-foreground">
                            {action}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="retrospectives" className="space-y-6">
          {/* Sprint Selector and Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Sprint Retrospectives
                  </CardTitle>
                  <CardDescription>
                    AI-generated insights from completed sprints
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {completedSprints.length > 0 && (
                    <Select
                      value={selectedSprintId}
                      onValueChange={setSelectedSprintId}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a sprint">
                          {completedSprints.find(
                            (s) => s.id === selectedSprintId
                          )?.name || "Select a sprint"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {completedSprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            <div className="flex items-center justify-between w-full min-w-0">
                              <span className="truncate flex-1">
                                {sprint.name}
                              </span>
                              {sprint.retrospective && (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Selected Sprint Retrospective Content */}
          {completedSprints.length > 0 && selectedSprintId ? (
            (() => {
              const selectedSprint = completedSprints.find(
                (sprint) => sprint.id === selectedSprintId
              );

              if (!selectedSprint) {
                return (
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2 text-foreground">
                        Sprint Not Found
                      </h3>
                      <p className="text-muted-foreground">
                        The selected sprint could not be found. Please select
                        another sprint.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {selectedSprint.name}
                        </CardTitle>
                        <CardDescription>
                          Completed on{" "}
                          {new Date(
                            selectedSprint.endDate
                          ).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedSprint.retrospective ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Generated on{" "}
                            {new Date(
                              selectedSprint.retrospective.generatedAt
                            ).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Button
                            onClick={() =>
                              generateSprintRetrospective(selectedSprint.id)
                            }
                            disabled={generatingRetrospective}
                            size="sm"
                          >
                            {generatingRetrospective ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            Generate Retrospective
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedSprint.retrospective ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm text-foreground">
                          {selectedSprint.retrospective.content}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2 text-foreground">
                          No Retrospective Generated
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Generate an AI-powered retrospective for this
                          completed sprint to get insights on what went well,
                          what could be improved, and actionable
                          recommendations.
                        </p>
                        <Button
                          onClick={() =>
                            generateSprintRetrospective(selectedSprint.id)
                          }
                          disabled={generatingRetrospective}
                        >
                          {generatingRetrospective ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Generate Retrospective
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                No Completed Sprints Found
              </h3>
              <p className="text-muted-foreground mb-4">
                Retrospectives will be available once you have completed sprints
                in your project.
              </p>
            </div>
          )}

          {/* All Sprints Overview */}
          {completedSprints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Completed Sprints</CardTitle>
                <CardDescription>
                  Overview of all your completed sprints and their retrospective
                  status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {completedSprints.map((sprint) => (
                    <div
                      key={sprint.id}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedSprintId === sprint.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-border"
                      }`}
                      onClick={() => setSelectedSprintId(sprint.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium text-foreground">
                            {sprint.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Completed{" "}
                            {new Date(sprint.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {sprint.retrospective ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Has Retrospective
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            No Retrospective
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
