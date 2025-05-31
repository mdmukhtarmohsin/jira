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
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  RefreshCw,
  Clock,
  Target,
  Zap,
  Brain,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

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

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  story_points: number | null;
  due_date: string | null;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface SprintTask {
  task_id: string;
  sprint_id: string;
  tasks: Task;
}

interface TeamMember {
  user_id: string;
  user_profiles: UserProfile;
}

interface AIInsight {
  type: "risk" | "success" | "warning" | "info";
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

export function AiInsightsPanel() {
  const { user } = useAuth();
  const [scopeCreepAlerts, setScopeCreepAlerts] = useState<ScopeCreepAlert[]>(
    []
  );
  const [riskHeatmap, setRiskHeatmap] = useState<RiskHeatmapData | null>(null);
  const [retrospectives, setRetrospectives] = useState<RetrospectiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scope-creep");
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAiInsights();
    }
  }, [user]);

  const fetchAiInsights = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchScopeCreepAlerts(),
        fetchRiskHeatmap(),
        fetchRetrospectives(),
        fetchInsights(),
      ]);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScopeCreepAlerts = async () => {
    try {
      // Get user's teams
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

      // Get active sprints
      const { data: activeSprints } = await supabase
        .from("sprints")
        .select("id, name, start_date, created_at")
        .in("team_id", teamIds)
        .eq("status", "active");

      if (!activeSprints || activeSprints.length === 0) {
        setScopeCreepAlerts([]);
        return;
      }

      // Check scope creep for each active sprint
      const alerts: ScopeCreepAlert[] = [];

      for (const sprint of activeSprints) {
        // Get tasks added to sprint over time
        const { data: sprintTasks } = await supabase
          .from("sprint_tasks")
          .select(
            `
            added_at,
            tasks!inner(id, title, story_points, created_at)
          `
          )
          .eq("sprint_id", sprint.id);

        if (!sprintTasks) continue;

        // Process the sprint tasks data properly
        const processedSprintTasks = sprintTasks.map((st: any) => ({
          added_at: st.added_at,
          tasks: st.tasks,
        }));

        // Simulate original vs current scope (in real app, you'd track this)
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
      // Get user's teams and current tasks
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

      // Get current tasks and team members
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .in("team_id", teamIds)
        .neq("status", "done");

      // Get team members - use separate queries since no FK relationship
      const { data: teamMembersData } = await supabase
        .from("team_members")
        .select("user_id")
        .in("team_id", teamIds);

      if (!tasks || !teamMembersData) return;

      // Get user profiles for team members
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

      // Call AI API for risk analysis
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
      // Get completed sprints from the last 30 days
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

      const { data: completedSprints } = await supabase
        .from("sprints")
        .select("id, name, end_date")
        .in("team_id", teamIds)
        .eq("status", "completed")
        .gte("end_date", thirtyDaysAgo.toISOString())
        .order("end_date", { ascending: false })
        .limit(5);

      if (!completedSprints) return;

      // Check if retrospectives already exist
      const { data: existingRetros } = await supabase
        .from("retrospectives")
        .select("sprint_id, content, created_at")
        .in(
          "sprint_id",
          completedSprints.map((s) => s.id)
        );

      const retros: RetrospectiveData[] = [];

      for (const sprint of completedSprints) {
        const existingRetro = existingRetros?.find(
          (r) => r.sprint_id === sprint.id
        );

        if (existingRetro) {
          retros.push({
            sprintId: sprint.id,
            sprintName: sprint.name,
            content: existingRetro.content,
            generatedAt: existingRetro.created_at,
          });
        }
      }

      setRetrospectives(retros);
    } catch (error) {
      console.error("Error fetching retrospectives:", error);
    }
  };

  const fetchInsights = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get teams for the user
      const { data: userTeams } = await supabase
        .from("team_members")
        .select(
          `
          team_id,
          teams (
            id,
            name,
            description
          )
        `
        )
        .eq("user_id", user.id);

      if (!userTeams) return;
      setTeams(userTeams);

      // Process each team
      const allInsights: AIInsight[] = [];

      for (const teamData of userTeams) {
        const team = teamData.teams as any; // Cast to handle Supabase join type inference
        if (!team) continue;

        // Get active/recent sprints for this team
        const { data: sprints } = await supabase
          .from("sprints")
          .select("*")
          .eq("team_id", team.id)
          .in("status", ["active", "completed"])
          .order("created_at", { ascending: false })
          .limit(3);

        if (!sprints || sprints.length === 0) continue;

        // Get sprint tasks with task details
        const { data: sprintTasksData } = await supabase
          .from("sprint_tasks")
          .select(
            `
            task_id,
            sprint_id,
            tasks (
              id,
              title,
              status,
              priority,
              story_points,
              due_date,
              assignee_id,
              created_at,
              updated_at
            )
          `
          )
          .in(
            "sprint_id",
            sprints.map((s: Sprint) => s.id)
          );

        // Process sprint tasks data to extract tasks properly
        const sprintTasks: Task[] = [];
        if (sprintTasksData) {
          sprintTasksData.forEach((st: any) => {
            // Handle the case where tasks might be an array (from join) or single object
            if (st.tasks) {
              if (Array.isArray(st.tasks)) {
                sprintTasks.push(...st.tasks);
              } else {
                sprintTasks.push(st.tasks);
              }
            }
          });
        }

        // Get team members with profiles - use separate queries since no FK relationship
        const { data: teamMembersData } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", team.id);

        // Get user profiles for team members
        const teamMembers: UserProfile[] = [];
        if (teamMembersData && teamMembersData.length > 0) {
          const userIds = teamMembersData.map((tm) => tm.user_id);
          const { data: userProfiles } = await supabase
            .from("user_profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

          if (userProfiles) {
            teamMembers.push(...userProfiles);
          }
        }

        // Calculate insights for this team
        const teamInsights = calculateTeamInsights(
          team,
          sprints,
          sprintTasks,
          teamMembers
        );
        allInsights.push(...teamInsights);
      }

      setInsights(allInsights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    }
  };

  const calculateTeamInsights = (
    team: any,
    sprints: Sprint[],
    allTasks: Task[],
    teamMembers: UserProfile[]
  ): AIInsight[] => {
    const insights: AIInsight[] = [];
    const now = new Date();

    // Find active sprint
    const activeSprint = sprints.find((s) => s.status === "active");
    if (!activeSprint) return insights;

    // Get tasks for active sprint
    const activeTasks = allTasks.filter((task) => {
      // This is a simplified check - in reality you'd join with sprint_tasks
      return task.created_at >= activeSprint.start_date;
    });

    // Risk Analysis
    const overdueTasks = activeTasks.filter(
      (task) =>
        task.due_date && new Date(task.due_date) < now && task.status !== "done"
    );

    const highPriorityIncompleteTasks = activeTasks.filter(
      (task) => task.priority === "high" && task.status !== "done"
    );

    // Workload Analysis
    const tasksByAssignee = activeTasks.reduce((acc, task) => {
      if (task.assignee_id) {
        acc[task.assignee_id] =
          (acc[task.assignee_id] || 0) + (task.story_points || 1);
      }
      return acc;
    }, {} as Record<string, number>);

    const overloadedMembers = Object.entries(tasksByAssignee)
      .filter(([_, points]) => points > 20)
      .map(([userId, points]) => {
        const member = teamMembers.find((m) => m.id === userId);
        return { member: member?.full_name || "Unknown", points };
      });

    // Blocked tasks (no assignee)
    const blockedTasks = activeTasks.filter((task) => !task.assignee_id);

    // Generate insights
    if (overdueTasks.length > 0) {
      insights.push({
        type: "risk",
        title: "Overdue Tasks Detected",
        description: `${overdueTasks.length} tasks are overdue in ${team.name}`,
        metric: `${overdueTasks.length} tasks`,
        action: "Review and prioritize overdue items",
      });
    }

    if (overloadedMembers.length > 0) {
      insights.push({
        type: "warning",
        title: "Team Member Overload",
        description: `${overloadedMembers.length} team members have high workload`,
        metric: `${overloadedMembers[0]?.points || 0} story points`,
        action: "Consider redistributing tasks",
      });
    }

    if (blockedTasks.length > 0) {
      insights.push({
        type: "warning",
        title: "Unassigned Tasks",
        description: `${blockedTasks.length} tasks have no assignee`,
        metric: `${blockedTasks.length} tasks`,
        action: "Assign team members to tasks",
      });
    }

    if (highPriorityIncompleteTasks.length > 3) {
      insights.push({
        type: "info",
        title: "High Priority Focus",
        description: `${highPriorityIncompleteTasks.length} high-priority tasks need attention`,
        metric: `${highPriorityIncompleteTasks.length} tasks`,
        action: "Focus on high-priority items",
      });
    }

    // Success insights
    const completedTasks = activeTasks.filter((task) => task.status === "done");
    const completionRate =
      activeTasks.length > 0
        ? Math.round((completedTasks.length / activeTasks.length) * 100)
        : 0;

    if (completionRate > 70) {
      insights.push({
        type: "success",
        title: "Great Progress!",
        description: `${team.name} is making excellent progress`,
        metric: `${completionRate}% complete`,
        action: "Keep up the momentum",
      });
    }

    return insights;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIconForType = (type: AIInsight["type"]) => {
    switch (type) {
      case "risk":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "info":
        return <Target className="h-5 w-5 text-blue-500" />;
      default:
        return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundForType = (type: AIInsight["type"]) => {
    switch (type) {
      case "risk":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-600" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-purple-600" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your sprint health and team performance
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAiInsights}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="scope-creep"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Scope Creep</span>
            </TabsTrigger>
            <TabsTrigger
              value="risk-heatmap"
              className="flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Risk Heatmap</span>
            </TabsTrigger>
            <TabsTrigger
              value="retrospectives"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Retrospectives</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scope-creep" className="space-y-4">
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
                          <span className="text-gray-600">Original: </span>
                          <span className="font-medium">
                            {alert.originalStoryPoints} pts
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Current: </span>
                          <span className="font-medium">
                            {alert.currentStoryPoints} pts
                          </span>
                        </div>
                      </div>
                      {alert.addedTasks.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Recently added tasks:
                          </p>
                          <ul className="text-xs space-y-1">
                            {alert.addedTasks.slice(0, 3).map((task, idx) => (
                              <li key={idx} className="text-gray-700">
                                • {task}
                              </li>
                            ))}
                            {alert.addedTasks.length > 3 && (
                              <li className="text-gray-500">
                                ... and {alert.addedTasks.length - 3} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Scope Creep Detected
                </h3>
                <p className="text-gray-600">
                  Your active sprints are maintaining healthy scope boundaries.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risk-heatmap" className="space-y-4">
            {riskHeatmap ? (
              <div className="space-y-6">
                {riskHeatmap.overloadedMembers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Overloaded Team Members
                    </h4>
                    <div className="space-y-2">
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
                                <strong>{member.memberName}</strong>
                                <p className="text-sm text-gray-600">
                                  {member.reason}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {member.taskCount} tasks
                                </div>
                                <div className="text-sm text-gray-600">
                                  {member.totalStoryPoints} pts
                                </div>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {riskHeatmap.delayedTasks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Delayed Tasks
                    </h4>
                    <div className="space-y-2">
                      {riskHeatmap.delayedTasks.map((task, idx) => (
                        <Alert
                          key={idx}
                          className={`border-l-4 ${getRiskColor(
                            task.riskLevel
                          )}`}
                        >
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <strong>{task.taskTitle}</strong>
                              <Badge className={getRiskColor(task.riskLevel)}>
                                {task.daysOverdue} days overdue
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {riskHeatmap.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">AI Recommendations</h4>
                    <ul className="space-y-2">
                      {riskHeatmap.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {riskHeatmap.overloadedMembers.length === 0 &&
                  riskHeatmap.delayedTasks.length === 0 &&
                  riskHeatmap.blockedTasks.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Team Health Looks Good
                      </h3>
                      <p className="text-gray-600">
                        No significant risks detected in current workload
                        distribution.
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Risk Data Available
                </h3>
                <p className="text-gray-600">
                  Risk analysis will appear here when you have active tasks and
                  team members.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="retrospectives" className="space-y-4">
            {retrospectives.length > 0 ? (
              retrospectives.map((retro) => (
                <Card
                  key={retro.sprintId}
                  className="border-l-4 border-l-blue-500"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {retro.sprintName}
                      </CardTitle>
                      <Badge variant="outline">
                        {new Date(retro.generatedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {retro.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Retrospectives Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Retrospectives will be automatically generated when sprints
                  are completed.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
