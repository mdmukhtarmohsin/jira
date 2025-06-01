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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Target,
  Users,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  start_date: string;
  end_date: string;
  progress: number;
  task_count: number;
  completed_tasks: number;
  team_name: string;
}

interface Team {
  id: string;
  name: string;
}

interface ExistingSprintsProps {
  teams: Team[];
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
}

export function ExistingSprints({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  onCreateNew,
  onRefresh,
}: ExistingSprintsProps) {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSprints = async () => {
    if (!user || !selectedTeamId) return;

    setLoading(true);
    setError(null);

    try {
      // Get sprints for the selected team
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select(
          `
          id,
          name,
          goal,
          status,
          start_date,
          end_date,
          teams!inner(name)
        `
        )
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false });

      if (sprintsError) throw new Error("Could not fetch sprints");

      // Process sprints with task counts
      const processedSprints = await Promise.all(
        (sprintsData || []).map(async (sprint) => {
          // Get task counts for this sprint
          const { data: sprintTasks, error: sprintTasksError } = await supabase
            .from("sprint_tasks")
            .select(
              `
              task_id,
              tasks!inner(status)
            `
            )
            .eq("sprint_id", sprint.id);

          if (sprintTasksError) {
            console.error("Error fetching sprint tasks:", sprintTasksError);
          }

          const taskCount = sprintTasks?.length || 0;
          const completedTasks =
            sprintTasks?.filter((st) => st.tasks.status === "done").length || 0;
          const progress =
            taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

          return {
            id: sprint.id,
            name: sprint.name,
            goal: sprint.goal,
            status: sprint.status,
            start_date: sprint.start_date,
            end_date: sprint.end_date,
            progress,
            task_count: taskCount,
            completed_tasks: completedTasks,
            team_name: sprint.teams.name,
          };
        })
      );

      setSprints(processedSprints);
    } catch (err: any) {
      console.error("Error fetching sprints:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeamId) {
      fetchSprints();
    }
  }, [selectedTeamId, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sprint
        </Button>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
            <p className="text-red-700 text-center">{error}</p>
            <Button
              onClick={fetchSprints}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : sprints.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {sprint.goal || "No goal specified"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(sprint.status)}>
                      {sprint.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold ">{sprint.task_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total Tasks
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold ">
                      {getDaysRemaining(sprint.end_date)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Days Left
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold ">{sprint.progress}%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Complete
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {sprint.completed_tasks}/{sprint.task_count} tasks
                    </span>
                  </div>
                  <Progress value={sprint.progress} className="h-2" />
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {new Date(sprint.start_date).toLocaleDateString()}
                  </span>
                  <span>→</span>
                  <span>{new Date(sprint.end_date).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Manage Sprint
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium  mb-2">No Sprints Found</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              Get started by creating your first sprint. You can use our AI
              planner to help you organize tasks.
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Sprint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
