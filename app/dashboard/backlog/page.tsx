"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  Calendar,
  User,
  FolderPlus,
} from "lucide-react";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { useKanbanData } from "@/hooks/use-kanban-data";
import { TaskDetailsModal } from "@/components/modals/task-details-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const priorityColors = {
  high: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  medium:
    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  low: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
};

const typeColors = {
  story:
    "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  bug: "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  task: "bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
};

const statusColors = {
  todo: "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  in_progress:
    "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  review:
    "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  done: "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
};

export default function BacklogPage() {
  const {
    tasks,
    teams,
    selectedTeamId,
    setSelectedTeamId,
    selectedSprintId,
    setSelectedSprintId,
    loading,
    error,
    refetch,
    sprints,
  } = useKanbanData();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Set sprint filter to "backlog" when component mounts or team changes
  useEffect(() => {
    if (selectedTeamId && selectedSprintId !== "backlog") {
      setSelectedSprintId("backlog");
    }
  }, [selectedTeamId, selectedSprintId, setSelectedSprintId]);

  const handleTaskCreated = () => {
    refetch();
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const handleAddToSprint = async (taskId: string, sprintId: string) => {
    try {
      const response = await fetch("/api/sprint-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sprint_id: sprintId,
          task_id: taskId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add task to sprint");
      }

      const sprint = sprints.find((s) => s.id === sprintId);
      toast({
        title: "Success",
        description: `Task added to ${sprint?.name || "sprint"} successfully`,
      });

      // Refresh the tasks to update the view
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add task to sprint",
        variant: "destructive",
      });
    }
  };

  // Get available sprints for adding tasks (exclude 'all' and 'backlog' options)
  const availableSprints = sprints.filter(
    (sprint) => sprint.id !== "all" && sprint.id !== "backlog"
  );

  // Now we can use tasks directly since the backend is already filtering for backlog
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority =
      selectedPriority === "all" || task.priority === selectedPriority;
    const matchesType = selectedType === "all" || task.type === selectedType;

    return matchesSearch && matchesPriority && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 mt-1 animate-pulse"></div>
          </div>
          <div className="h-9 bg-muted rounded w-32 animate-pulse"></div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-9 bg-muted rounded w-40 animate-pulse"></div>
          <div className="h-9 bg-muted rounded w-40 animate-pulse"></div>
        </div>

        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-semibold text-foreground">Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and prioritize your upcoming tasks
          </p>
        </div>

        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400 mb-3" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">
              Error Loading Backlog
            </h3>
            <p className="text-red-700 dark:text-red-300 text-center mb-4 text-sm">
              {error}
            </p>
            <div className="flex gap-2">
              <Button onClick={refetch} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-semibold text-foreground">Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a team first to start managing tasks
          </p>
        </div>

        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-blue-100 dark:bg-blue-950/30 p-3 mb-4">
              <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Teams Found
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md text-sm">
              You need to create or join a team before you can manage your
              backlog.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/teams")}
              size="sm"
            >
              Go to Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Backlog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and prioritize your upcoming tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-44 h-9">
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
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="h-9"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search backlog tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 bg-background"
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={refetch} size="sm" className="h-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks Grid */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <Card
                key={task.id}
                className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer border-border bg-card relative overflow-hidden"
                onClick={() => handleTaskClick(task)}
              >
                {/* Priority indicator bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          typeColors[task.type]
                        } font-medium`}
                      >
                        {task.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          priorityColors[task.priority]
                        } font-medium`}
                      >
                        {task.priority}
                      </Badge>
                      {task.story_points && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-medium">
                          {task.story_points} pts
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1">
                      {/* Quick Add to Sprint Button */}
                      {availableSprints.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              title="Add to Sprint"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-2 text-xs font-semibold text-foreground border-b border-border">
                              Add to Sprint
                            </div>
                            <div className="p-1">
                              {availableSprints.map((sprint) => (
                                <DropdownMenuItem
                                  key={sprint.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToSprint(task.id, sprint.id);
                                  }}
                                  className="cursor-pointer flex items-center p-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md"
                                >
                                  <FolderPlus className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-foreground truncate">
                                      {sprint.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                      {sprint.status}
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {availableSprints.length > 0 ? (
                            <>
                              <div className="px-3 py-2 text-xs font-semibold text-foreground border-b border-border">
                                Add to Sprint
                              </div>
                              <div className="p-1">
                                {availableSprints.map((sprint) => (
                                  <DropdownMenuItem
                                    key={sprint.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToSprint(task.id, sprint.id);
                                    }}
                                    className="cursor-pointer flex items-center p-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md"
                                  >
                                    <FolderPlus className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-foreground truncate">
                                        {sprint.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground capitalize">
                                        {sprint.status}
                                      </div>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            </>
                          ) : (
                            <DropdownMenuItem disabled className="p-3">
                              <span className="text-sm text-muted-foreground">
                                No active sprints available
                              </span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          statusColors[task.status]
                        } font-medium`}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignee.avatar || "/placeholder.svg"}
                                alt={task.assignee.name}
                              />
                              <AvatarFallback className="text-xs">
                                {task.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {task.assignee.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-muted rounded-lg bg-muted/30">
            <div className="max-w-sm mx-auto">
              <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ||
                selectedPriority !== "all" ||
                selectedType !== "all"
                  ? "No tasks found"
                  : "No backlog tasks"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ||
                selectedPriority !== "all" ||
                selectedType !== "all"
                  ? "No backlog tasks found matching your filters."
                  : "No tasks in backlog. Tasks in active sprints won't appear here."}
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create First Task
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
        selectedTeamId={selectedTeamId}
      />

      <TaskDetailsModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={() => setSelectedTask(null)}
      />
    </div>
  );
}
