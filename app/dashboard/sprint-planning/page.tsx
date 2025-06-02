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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Users,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  Filter,
  Search,
  List,
  FileText,
} from "lucide-react";
import { useSprintPlanningData } from "@/hooks/use-sprint-planning-data";
import { ExistingSprints } from "@/components/sprint-planning/existing-sprints";
import { CreateSprintWorkflow } from "@/components/sprint-planning/create-sprint-workflow";
import { AiSprintPlanner } from "@/components/sprint-planning/ai-sprint-planner";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays } from "date-fns";

// Define extended Team interface for the component
interface TeamWithDescription {
  id: string;
  name: string;
  description: string;
}

export default function SprintPlanningPage() {
  const router = useRouter();
  const {
    teams,
    selectedTeamId,
    setSelectedTeamId,
    backlogTasks,
    teamMembers,
    loading,
    error,
    createSprint,
    refetch,
  } = useSprintPlanningData();

  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "planning" | "completed"
  >("all");
  const [customTasks, setCustomTasks] = useState("");

  // Sample tasks for the generate button
  const sampleTasks = `Implement user authentication [high] (8)
Create responsive dashboard layout [medium] (5)
Fix mobile navigation bug [high] (3) {bug}
Add email notification system [medium] (5)
Update user profile page [low] (3)
Create API documentation [low] (2)
Implement data export feature [medium] (5)
Add dark mode toggle [low] (3)
Fix form validation issues [high] (3) {bug}
Optimize database queries [medium] (8)`;

  // Function to generate sample tasks
  const generateSampleTasks = () => {
    setCustomTasks(sampleTasks);
    toast({
      title: "Sample Tasks Generated",
      description: "Sample tasks have been added to the input field",
    });
  };

  // Convert teams to the format expected by ExistingSprints
  const teamsForSprints: TeamWithDescription[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    description: "", // Add empty description as it's required by the component
  }));

  const handleSprintCreated = () => {
    refetch();
    setActiveTab("overview");
    toast({
      title: "Success",
      description: "Sprint created successfully!",
    });
  };

  const handleAiSprintSuggestionAccepted = async (suggestion: {
    sprintName: string;
    recommendedTasks: string[];
    totalStoryPoints: number;
    estimatedCompletion: string;
    workloadDistribution: any[];
    reasoning: string;
    usedCustomTasks?: boolean;
    customTasksText?: string;
    parsedCustomTasks?: Array<{
      id: string;
      title: string;
      type: string;
      priority: string;
      story_points: number;
    }>;
  }) => {
    try {
      if (!selectedTeamId) {
        toast({
          title: "Error",
          description: "Please select a team first",
          variant: "destructive",
        });
        return;
      }

      // Generate start and end dates (2-week sprint starting next Monday)
      const now = new Date();
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      const endDate = addDays(nextMonday, 13); // 2 weeks later

      const sprintData = {
        name: suggestion.sprintName,
        goal: suggestion.reasoning,
        start_date: format(nextMonday, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        team_id: selectedTeamId,
        tasks: suggestion.recommendedTasks,
      };

      // If using custom tasks, add them to the sprint data
      if (suggestion.usedCustomTasks && suggestion.parsedCustomTasks) {
        (sprintData as any).customTasks = suggestion.parsedCustomTasks;
      }

      const result = await createSprint(sprintData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Sprint created successfully!",
        });
        refetch(); // Refresh the data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create sprint",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating sprint from AI suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to create sprint",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sprint Planning
            </h1>
            <p className="text-muted-foreground text-lg">
              Plan and manage your sprints with AI-powered insights
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">
              Loading sprint planning data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Planning</h1>
          <p className="text-muted-foreground text-lg">
            Plan and manage your sprints with AI-powered insights
          </p>
        </div>

        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">
              Error Loading Sprint Planning
            </h3>
            <p className="text-destructive/80 text-center mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Planning</h1>
          <p className="text-muted-foreground text-lg">
            Create a team first to start planning sprints
          </p>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Teams Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You need to create or join a team before you can plan sprints.
            </p>
            <Button onClick={() => router.push("/dashboard/teams")}>
              Go to Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Planning</h1>
          <p className="text-muted-foreground text-lg">
            Plan and manage your sprints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {/* {selectedTeam && (
            <Badge variant="secondary" className="text-sm">
              Team: {selectedTeam.name}
            </Badge>
          )} */}
        </div>
      </div>

      {/* Simplified Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3 h-12">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 px-6"
            >
              <List className="h-4 w-4" />
              <span>Sprints</span>
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex items-center gap-2 px-6"
            >
              <Plus className="h-4 w-4" />
              <span>Create Sprint</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai-planner"
              className="flex items-center gap-2 px-6"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Planner</span>
            </TabsTrigger>
          </TabsList>

          {/* Filters for Overview Tab */}
          {activeTab === "overview" && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sprints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(
                    value as "all" | "active" | "planning" | "completed"
                  )
                }
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Sprint Overview */}
        <TabsContent value="overview" className="space-y-6">
          <ExistingSprints
            teams={teamsForSprints}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={(teamId) => setSelectedTeamId(teamId || "")}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onCreateNew={() => setActiveTab("create")}
            onRefresh={refetch}
          />
        </TabsContent>

        {/* Create Sprint */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Sprint
              </CardTitle>
              <CardDescription>
                Configure a new sprint for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateSprintWorkflow
                teams={teams}
                selectedTeamId={selectedTeamId}
                setSelectedTeamId={setSelectedTeamId}
                backlogTasks={backlogTasks}
                teamMembers={teamMembers}
                createSprint={createSprint}
                onSprintCreated={handleSprintCreated}
                onCancel={() => setActiveTab("overview")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Sprint Planner */}
        <TabsContent value="ai-planner" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Sprint Planner
                  <Badge variant="outline" className="ml-2">
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Let AI analyze your backlog and team capacity to suggest an
                  optimal sprint plan
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                onClick={generateSampleTasks}
                className="gap-2"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Generate Sample Tasks
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <Brain className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">
                      Smart Task Selection
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Analyzes dependencies and priorities
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">
                      Capacity Optimization
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Balances workload across team
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">Goal Achievement</h4>
                    <p className="text-xs text-muted-foreground">
                      Recommends achievable goals
                    </p>
                  </div>
                </div>
              </div>

              <AiSprintPlanner
                tasks={backlogTasks}
                teamMembers={teamMembers}
                sprintDuration={14}
                onSuggestionAccepted={handleAiSprintSuggestionAccepted}
                customTasks={customTasks}
                setCustomTasks={setCustomTasks}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
