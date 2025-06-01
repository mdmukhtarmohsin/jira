"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Check,
  X,
  Brain,
  Zap,
  Target,
  User,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  type: "bug" | "story" | "task";
  priority: "low" | "medium" | "high";
  story_points: number | null;
}

interface TeamMember {
  id: string;
  name: string;
  capacity: number;
}

interface AISuggestion {
  sprintName: string;
  recommendedTasks: string[];
  totalStoryPoints: number;
  estimatedCompletion: string;
  workloadDistribution: {
    memberId: string;
    tasks: string[];
    storyPoints: number;
  }[];
  reasoning: string;
  usedCustomTasks?: boolean;
  customTasksText?: string;
}

interface AiSprintPlannerProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  sprintDuration: number;
  onSuggestionAccepted: (suggestion: AISuggestion) => void;
}

export function AiSprintPlanner({
  tasks,
  teamMembers,
  sprintDuration,
  onSuggestionAccepted,
}: AiSprintPlannerProps) {
  const [customTasks, setCustomTasks] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);

    try {
      // Prepare data for the AI
      let tasksForAI;
      let useCustomTasks = false;

      if (customTasks.trim()) {
        tasksForAI = parseCustomTasks(customTasks);
        useCustomTasks = true;
      } else {
        tasksForAI = tasks.map((task) => ({
          id: task.id,
          title: task.title,
          type: task.type,
          priority: task.priority,
          story_points: task.story_points || 0,
        }));
      }

      if (tasksForAI.length === 0) {
        toast({
          title: "No tasks available",
          description:
            "Please add tasks to your backlog or paste custom tasks to generate a sprint plan.",
          variant: "destructive",
        });
        return;
      }

      // Calculate total team capacity
      const teamCapacity = teamMembers.reduce(
        (sum, member) => sum + member.capacity,
        0
      );

      if (teamCapacity === 0) {
        toast({
          title: "No team capacity",
          description:
            "Please ensure team members are assigned with proper capacity.",
          variant: "destructive",
        });
        return;
      }

      // Call the AI API
      const response = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: tasksForAI,
          teamCapacity,
          sprintDuration,
          useCustomTasks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate sprint plan");
      }

      const suggestion = await response.json();

      // Store whether we used custom tasks for later reference
      suggestion.usedCustomTasks = useCustomTasks;
      suggestion.customTasksText = useCustomTasks ? customTasks : "";

      setAiSuggestion(suggestion);

      toast({
        title: "AI Sprint Plan Generated! ✨",
        description: "Your personalized sprint plan is ready for review.",
      });
    } catch (error: any) {
      console.error("Error generating sprint plan:", error);
      toast({
        title: "Generation Failed",
        description:
          error.message || "Failed to generate sprint plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Parse custom tasks pasted by the user
  const parseCustomTasks = (text: string) => {
    // Simple parsing - each line is a task
    const lines = text.split("\n").filter((line) => line.trim());

    return lines.map((line, index) => {
      // Try to extract priority and points from the line
      // Format could be: Task title [high] (5)
      const priorityMatch = line.match(/\[(low|medium|high)\]/i);
      const pointsMatch = line.match(/\((\d+)\)/);

      const priority = priorityMatch
        ? (priorityMatch[1].toLowerCase() as "low" | "medium" | "high")
        : "medium";
      const points = pointsMatch ? Number.parseInt(pointsMatch[1]) : 3;

      // Clean the title
      const title = line
        .replace(/\[(low|medium|high)\]/i, "")
        .replace(/\(\d+\)/, "")
        .trim();

      return {
        id: `custom-${index}`,
        title,
        type: "task" as const,
        priority,
        story_points: points,
      };
    });
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      // If custom tasks were used, we need to populate the custom tasks field
      if (aiSuggestion.usedCustomTasks) {
        // For custom tasks, we'll pass the suggestion with the custom tasks text
        onSuggestionAccepted({
          ...aiSuggestion,
          customTasksText: aiSuggestion.customTasksText || customTasks,
        });
      } else {
        // For existing tasks, pass the recommended task IDs
        onSuggestionAccepted(aiSuggestion);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {!aiSuggestion ? (
        <div className="space-y-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Task Input
              </CardTitle>
              <CardDescription>
                Choose your approach: use existing backlog tasks or paste custom
                tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-dashed">
                  <div className="text-center">
                    <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">Use Backlog Tasks</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI will select from your existing backlog
                    </p>
                    <div className="text-2xl font-bold text-primary">
                      {tasks.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available Tasks
                    </p>
                  </div>
                </Card>

                <Card className="p-4 border-dashed">
                  <div className="text-center">
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h3 className="font-medium">Custom Tasks</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Paste your own task list below
                    </p>
                    <div className="text-2xl font-bold text-primary">
                      {customTasks ? parseCustomTasks(customTasks).length : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Custom Tasks
                    </p>
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Custom Tasks (Optional)
                  </label>
                  <Badge variant="outline" className="text-xs">
                    Format: Task name [priority] (points)
                  </Badge>
                </div>
                <Textarea
                  placeholder="Implement user authentication [high] (8)&#10;Create dashboard UI [medium] (5)&#10;Write unit tests [low] (3)&#10;&#10;One task per line. Priority: [high], [medium], [low]&#10;Story points in parentheses: (1-13)"
                  value={customTasks}
                  onChange={(e) => setCustomTasks(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Example: "Implement login page [high] (5)" - Each line is
                  one task
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Team Capacity Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Team Capacity
              </CardTitle>
              <CardDescription>
                Current team setup for the {sprintDuration}-day sprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {teamMembers.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {teamMembers.reduce((sum, m) => sum + m.capacity, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {sprintDuration}
                  </div>
                  <p className="text-sm text-muted-foreground">Sprint Days</p>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Member Breakdown</h4>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded"
                    >
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline">{member.capacity}h</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Ready to Generate Your Sprint Plan?
                  </h3>
                  <p className="text-muted-foreground">
                    AI will analyze your tasks, team capacity, and sprint
                    duration to create an optimal plan
                  </p>
                </div>
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  size="lg"
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating Sprint Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate AI Sprint Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Results Section */
        <div className="space-y-6">
          {/* Sprint Overview */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                AI-Generated Sprint Plan
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  ✨ Optimized
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                {aiSuggestion.sprintName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">
                    {aiSuggestion.recommendedTasks.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Selected Tasks
                  </div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">
                    {aiSuggestion.totalStoryPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Story Points
                  </div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <User className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">
                    {aiSuggestion.workloadDistribution.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Team Members
                  </div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold">{sprintDuration}</div>
                  <div className="text-xs text-muted-foreground">
                    Sprint Days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Selected Tasks ({aiSuggestion.recommendedTasks.length})
              </CardTitle>
              <CardDescription>
                Total: {aiSuggestion.totalStoryPoints} story points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {aiSuggestion.usedCustomTasks
                  ? // Show custom tasks from the AI reasoning or original text
                    parseCustomTasks(
                      aiSuggestion.customTasksText || customTasks
                    ).map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(task.priority)}
                          >
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">
                            {task.story_points || 0} pts
                          </Badge>
                        </div>
                      </div>
                    ))
                  : // Show existing tasks
                    aiSuggestion.recommendedTasks.map((taskId) => {
                      const task = tasks.find((t) => t.id === taskId);
                      return task ? (
                        <div
                          key={taskId}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getPriorityColor(task.priority)}
                            >
                              {task.priority}
                            </Badge>
                            <Badge variant="outline">
                              {task.story_points || 0} pts
                            </Badge>
                          </div>
                        </div>
                      ) : null;
                    })}
              </div>
            </CardContent>
          </Card>

          {/* Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Workload Distribution
              </CardTitle>
              <CardDescription>
                Balanced assignment across team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiSuggestion.workloadDistribution.map((assignment, index) => {
                const member = teamMembers.find(
                  (m) => m.id === assignment.memberId
                );
                const utilizationPercent = member
                  ? Math.round((assignment.storyPoints / member.capacity) * 100)
                  : 0;

                return (
                  <div
                    key={index}
                    className="p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">
                          {member?.name || "Team member"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.tasks.length} tasks •{" "}
                          {assignment.storyPoints} story points
                        </p>
                      </div>
                      <Badge variant="outline">
                        {utilizationPercent}% utilized
                      </Badge>
                    </div>
                    <Progress value={utilizationPercent} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Reasoning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Analysis & Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                {aiSuggestion.reasoning}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAcceptSuggestion}
              size="lg"
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Accept & Create Sprint
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiSuggestion(null)}
              size="lg"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Generate New Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
