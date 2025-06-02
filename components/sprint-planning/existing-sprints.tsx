"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Users,
  MoreHorizontal,
  Play,
  Pause,
  Square,
  Trash2,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Sprint {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
  goal: string | null;
  team_id: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
  completed_tasks?: number;
  total_story_points?: number;
  completed_story_points?: number;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface ExistingSprintsProps {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  onCreateNew: () => void;
  onRefresh: () => void;
  searchQuery: string;
  statusFilter: string;
}

export function ExistingSprints({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  onCreateNew,
  onRefresh,
  searchQuery,
  statusFilter,
}: ExistingSprintsProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState<Sprint | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (selectedTeamId) {
      fetchSprints();
    }
  }, [selectedTeamId]);

  const fetchSprints = async () => {
    if (!selectedTeamId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch sprints for the selected team
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select("*")
        .eq("team_id", selectedTeamId)
        .order("created_at", { ascending: false });

      if (sprintsError) throw sprintsError;

      // For each sprint, fetch task counts and story points via sprint_tasks junction table
      const sprintsWithCounts = await Promise.all(
        (sprintsData || []).map(async (sprint) => {
          // Get tasks associated with this sprint through the sprint_tasks table
          const { data: sprintTasksData, error: sprintTasksError } =
            await supabase
              .from("sprint_tasks")
              .select(
                `
              task_id,
              tasks!inner (
                id,
                status,
                story_points
              )
            `
              )
              .eq("sprint_id", sprint.id);

          if (sprintTasksError) {
            console.error(
              "Error fetching tasks for sprint:",
              sprint.id,
              sprintTasksError
            );
            return {
              ...sprint,
              task_count: 0,
              completed_tasks: 0,
              total_story_points: 0,
              completed_story_points: 0,
            };
          }

          // Extract and properly type the task data
          const tasks = (sprintTasksData || [])
            .map((sprintTask: any) => sprintTask.tasks)
            .filter((task: any) => task && typeof task === "object") as Array<{
            id: string;
            status: string;
            story_points: number | null;
          }>;

          const completedTasks = tasks.filter((task) => task.status === "done");
          const totalStoryPoints = tasks.reduce(
            (sum, task) => sum + (task.story_points || 0),
            0
          );
          const completedStoryPoints = completedTasks.reduce(
            (sum, task) => sum + (task.story_points || 0),
            0
          );

          return {
            ...sprint,
            task_count: tasks.length,
            completed_tasks: completedTasks.length,
            total_story_points: totalStoryPoints,
            completed_story_points: completedStoryPoints,
          };
        })
      );

      setSprints(sprintsWithCounts);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
      setError(error.message || "Failed to fetch sprints");
      toast({
        title: "Error",
        description: "Failed to fetch sprints. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300",
          icon: Play,
          label: "Active",
        };
      case "planning":
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
          icon: Timer,
          label: "Planning",
        };
      case "completed":
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300",
          icon: CheckCircle2,
          label: "Completed",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300",
          icon: Clock,
          label: status,
        };
    }
  };

  const handleSprintAction = async (sprint: Sprint, action: string) => {
    try {
      let updates: Partial<Sprint> = {};

      switch (action) {
        case "start":
          updates = {
            status: "active",
            start_date: new Date().toISOString(),
          };
          break;
        case "pause":
          updates = { status: "planning" };
          break;
        case "complete":
          updates = {
            status: "completed",
            end_date: new Date().toISOString(),
          };
          break;
        case "delete":
          setSprintToDelete(sprint);
          setDeleteDialogOpen(true);
          return;
        default:
          throw new Error("Invalid action");
      }

      const { error } = await supabase
        .from("sprints")
        .update(updates)
        .eq("id", sprint.id);

      if (error) throw error;

      await fetchSprints();
      onRefresh();

      toast({
        title: "Success",
        description: `Sprint ${action}${
          action.endsWith("e") ? "d" : "ed"
        } successfully!`,
      });
    } catch (error: any) {
      console.error(`Error performing action ${action}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} sprint`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sprintToDelete) return;

    try {
      // Close dialog first
      setDeleteDialogOpen(false);

      const { error } = await supabase
        .from("sprints")
        .delete()
        .eq("id", sprintToDelete.id);

      if (error) throw error;

      await fetchSprints();
      onRefresh();
      setSprintToDelete(null);

      toast({
        title: "Success",
        description: "Sprint deleted successfully!",
      });
    } catch (error: any) {
      console.error("Error deleting sprint:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete sprint",
        variant: "destructive",
      });
    }
  };

  // Handle user clicking the delete button
  const onDeleteClick = () => {
    handleDeleteConfirm();
  };

  // Filter sprints based on search query and status filter
  const filteredSprints = sprints.filter((sprint) => {
    const matchesSearch = searchQuery
      ? sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sprint.description &&
          sprint.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus =
      statusFilter === "all" || sprint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  if (!selectedTeamId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select a Team</h3>
          <p className="text-muted-foreground text-center mb-6">
            Choose a team to view and manage sprints
          </p>
          <Select value="" onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading sprints...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-destructive mb-2">
            Error Loading Sprints
          </h3>
          <p className="text-destructive/80 text-center mb-4">{error}</p>
          <Button onClick={fetchSprints} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Sprints
              </CardTitle>
              <CardDescription>
                Manage sprints for your selected team
              </CardDescription>
            </div>
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Sprint
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedTeamId || ""}
                onValueChange={setSelectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
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
            <Badge variant="outline" className="px-3 py-1">
              {filteredSprints.length} sprint
              {filteredSprints.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sprints List */}
      {filteredSprints.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {searchQuery || statusFilter !== "all"
                ? "No Matching Sprints"
                : "No Sprints Yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first sprint to start planning and organizing your team's work."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Sprint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredSprints.map((sprint) => {
            const statusConfig = getStatusConfig(sprint.status);
            const StatusIcon = statusConfig.icon;
            const progress =
              sprint.task_count && sprint.task_count > 0
                ? Math.round(
                    (sprint.completed_tasks! / sprint.task_count) * 100
                  )
                : 0;

            return (
              <Card
                key={sprint.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{sprint.name}</CardTitle>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {sprint.description && (
                        <CardDescription className="text-base">
                          {sprint.description}
                        </CardDescription>
                      )}
                      {sprint.goal && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>{sprint.goal}</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {sprint.status === "planning" && (
                          <DropdownMenuItem
                            onClick={() => handleSprintAction(sprint, "start")}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Sprint
                          </DropdownMenuItem>
                        )}
                        {sprint.status === "active" && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSprintAction(sprint, "pause")
                              }
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Sprint
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSprintAction(sprint, "complete")
                              }
                            >
                              <Square className="mr-2 h-4 w-4" />
                              Complete Sprint
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleSprintAction(sprint, "delete")}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Sprint
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}% complete</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {sprint.completed_tasks} of {sprint.task_count} tasks
                          completed
                        </span>
                        <span>
                          {sprint.completed_story_points} of{" "}
                          {sprint.total_story_points} story points
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Started:</span>
                        <span>{formatDate(sprint.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ends:</span>
                        <span>{formatDate(sprint.end_date)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {sprint.task_count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Tasks
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {sprint.total_story_points}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Story Points
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {progress}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Complete
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sprintToDelete?.name}"? This
              action cannot be undone. All tasks in this sprint will be moved
              back to the backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={onDeleteClick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Sprint
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
