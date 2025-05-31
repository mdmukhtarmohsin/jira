"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  Users,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useSprintPlanningData } from "@/hooks/use-sprint-planning-data";
import { ExistingSprints } from "@/components/sprint-planning/existing-sprints";
import { CreateSprintWorkflow } from "@/components/sprint-planning/create-sprint-workflow";
import { AiSprintWorkflow } from "@/components/sprint-planning/ai-sprint-workflow";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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

  const handleSprintCreated = () => {
    refetch();
    setActiveTab("overview");
    toast({
      title: "Success",
      description: "Sprint created successfully!",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold ">Sprint Planning</h1>
            <p className="text-gray-600">
              Plan and manage your sprints with AI-powered insights
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">
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
          <h1 className="text-3xl font-bold ">Sprint Planning</h1>
          <p className="text-gray-600">
            Plan and manage your sprints with AI-powered insights
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Sprint Planning
            </h3>
            <p className="text-red-700 text-center mb-4">{error}</p>
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
          <h1 className="text-3xl font-bold ">Sprint Planning</h1>
          <p className="text-gray-600">
            Create a team first to start planning sprints
          </p>
        </div>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium  mb-2">No Teams Found</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ">Sprint Planning</h1>
          <p className="text-gray-600">
            Plan and manage your sprints with AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Sprint Overview</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Sprint</span>
          </TabsTrigger>
          <TabsTrigger
            value="ai-planner"
            className="flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Sprint Planner</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ExistingSprints
            teams={teams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            onCreateNew={() => setActiveTab("create")}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="ai-planner" className="space-y-6">
          <AiSprintWorkflow
            teams={teams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            teamMembers={teamMembers}
            createSprint={createSprint}
            onSprintCreated={handleSprintCreated}
            onCancel={() => setActiveTab("overview")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
