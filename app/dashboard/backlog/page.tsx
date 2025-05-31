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
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const typeColors = {
  story: "bg-blue-50 text-blue-700 border-blue-200",
  bug: "bg-red-50 text-red-700 border-red-200",
  task: "bg-slate-50 text-slate-700 border-slate-200",
};

const statusColors = {
  todo: "bg-gray-50 text-gray-600 border-gray-200",
  in_progress: "bg-blue-50 text-blue-600 border-blue-200",
  review: "bg-purple-50 text-purple-600 border-purple-200",
  done: "bg-green-50 text-green-600 border-green-200",
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
            <div className="h-7 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-9 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>

        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Backlog</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and prioritize your upcoming tasks
          </p>
        </div>

        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-10 w-10 text-red-600 mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Backlog
            </h3>
            <p className="text-red-700 text-center mb-4 text-sm">{error}</p>
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
        <div className="border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Backlog</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a team first to start managing tasks
          </p>
        </div>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Teams Found
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
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
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Backlog</h1>
          <p className="text-sm text-gray-600 mt-1">
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
      <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search backlog tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 bg-white"
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

      {/* Tasks List */}
      <div className="space-y-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-sm hover:border-gray-300 transition-all duration-200 cursor-pointer border-gray-200 bg-white"
              onClick={() => handleTaskClick(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Section - Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                          {task.story_points} pts
                        </span>
                      )}

                      {/* Quick Add to Sprint Button */}
                      {availableSprints.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-blue-50 text-blue-600 hover:text-blue-700 ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              title="Add to Sprint"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
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
                                  className="cursor-pointer flex items-center p-3 hover:bg-blue-50 rounded-md"
                                >
                                  <FolderPlus className="mr-3 h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 truncate">
                                      {sprint.name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {sprint.status}
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          statusColors[task.status]
                        } font-medium`}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-1 leading-5">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Right Section - Meta Info */}
                  <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {task.assignee ? (
                        <>
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={task.assignee.avatar || "/placeholder.svg"}
                              alt={task.assignee.name}
                            />
                            <AvatarFallback className="text-xs">
                              {task.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium max-w-20 truncate">
                            {task.assignee.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="h-3.5 w-3.5" />
                          <span className="text-xs">Unassigned</span>
                        </>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {availableSprints.length > 0 ? (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
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
                                  className="cursor-pointer flex items-center p-3 hover:bg-blue-50 rounded-md"
                                >
                                  <FolderPlus className="mr-3 h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 truncate">
                                      {sprint.name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {sprint.status}
                                    </div>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </>
                        ) : (
                          <DropdownMenuItem disabled className="p-3">
                            <span className="text-sm text-gray-500">
                              No active sprints available
                            </span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50/30">
            <div className="max-w-sm mx-auto">
              <p className="text-gray-500 mb-3">
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
