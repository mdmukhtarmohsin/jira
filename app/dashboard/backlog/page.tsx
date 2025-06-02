"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronDown,
  ChevronRight,
  BookOpen,
  Bug,
  CheckSquare,
  Circle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
} from "lucide-react";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { useKanbanData } from "@/hooks/use-kanban-data";
import { useEpicsAndLabels } from "@/hooks/use-epics-and-labels";
import { EnhancedTaskDetailsModal } from "@/components/modals/enhanced-task-details-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const priorityIcons = {
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
};

const priorityColors = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-green-500",
};

const typeIcons = {
  story: BookOpen,
  bug: Bug,
  task: CheckSquare,
};

const typeColors = {
  story: "text-blue-500",
  bug: "text-red-500",
  task: "text-gray-500",
};

const statusColors = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress:
    "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  review:
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  done: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
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

  const {
    epics,
    labels,
    loading: epicsLabelsLoading,
    error: epicsLabelsError,
  } = useEpicsAndLabels(selectedTeamId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEpic, setSelectedEpic] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [collapsedSprints, setCollapsedSprints] = useState<Set<string>>(
    new Set()
  );

  // Set sprint filter to "backlog" when component mounts or team changes
  useEffect(() => {
    if (selectedTeamId && selectedSprintId !== "all") {
      setSelectedSprintId("all");
    }
    // Reset filters when team changes
    setSelectedEpic("all");
    setSelectedLabel("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setSelectedPriority("all");
    setSearchTerm("");
  }, [selectedTeamId, selectedSprintId, setSelectedSprintId]);

  const handleTaskCreated = () => {
    refetch();
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const toggleSprintCollapse = (sprintId: string) => {
    const newCollapsed = new Set(collapsedSprints);
    if (newCollapsed.has(sprintId)) {
      newCollapsed.delete(sprintId);
    } else {
      newCollapsed.add(sprintId);
    }
    setCollapsedSprints(newCollapsed);
  };

  const generateTaskId = (task: any, index: number) => {
    // Generate a short ID based on team name and index
    const teamPrefix =
      teams
        .find((t) => t.id === selectedTeamId)
        ?.name?.substring(0, 3)
        .toUpperCase() || "TSK";
    return `${teamPrefix}-${(index + 1).toString().padStart(3, "0")}`;
  };

  // Group tasks by sprint or show backlog
  const groupedTasks = () => {
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority =
        selectedPriority === "all" || task.priority === selectedPriority;
      const matchesType = selectedType === "all" || task.type === selectedType;
      const matchesStatus =
        selectedStatus === "all" || task.status === selectedStatus;
      const matchesEpic =
        selectedEpic === "all" ||
        (selectedEpic === "no-epic" && !task.epic) ||
        (task.epic && task.epic.id === selectedEpic);
      const matchesLabel =
        selectedLabel === "all" ||
        (task.labels &&
          task.labels.some(
            (label: { id: string; name: string; color: string }) =>
              label.id === selectedLabel
          ));

      return (
        matchesSearch &&
        matchesPriority &&
        matchesType &&
        matchesStatus &&
        matchesEpic &&
        matchesLabel
      );
    });

    // Always group by sprint, regardless of selected sprint view
    const sprintGroups = new Map();

    // Always add a backlog group first
    sprintGroups.set("backlog", {
      sprint: {
        id: "backlog",
        name: "Backlog",
        status: "backlog",
      },
      tasks: [],
    });

    // Group all tasks by their sprint (or put in backlog if they have no sprint)
    filteredTasks.forEach((task) => {
      const sprintId = task.sprint?.id || "backlog";

      if (!sprintGroups.has(sprintId)) {
        sprintGroups.set(sprintId, {
          sprint: task.sprint,
          tasks: [],
        });
      }

      sprintGroups.get(sprintId).tasks.push(task);
    });

    // Sort groups to make sure backlog is first, then active sprints, then future sprints
    const sortedGroups = Array.from(sprintGroups.values());
    sortedGroups.sort((a, b) => {
      // Backlog always first
      if (a.sprint.id === "backlog") return -1;
      if (b.sprint.id === "backlog") return 1;

      // Sort remaining sprints by status/name
      return a.sprint.name.localeCompare(b.sprint.name);
    });

    return sortedGroups;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 bg-muted rounded w-80 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Backlog</h1>
        </div>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertTriangle className="h-10 w-10 text-red-600 mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Backlog
            </h3>
            <p className="text-red-700 text-center mb-4 text-sm">{error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Backlog</h1>
        </div>
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
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

  const taskGroups = groupedTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {teams.map((team, index) => {
              if (index < 6) {
                return (
                  <Avatar key={team.id} className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                );
              }
              return null;
            })}
            {teams.length > 6 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{teams.length - 6}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-44">
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
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 p-3 bg-card border rounded-lg dark:bg-gray-800/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search backlog"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value="all">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Version</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEpic} onValueChange={setSelectedEpic}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Epic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            <SelectItem value="no-epic">No Epic</SelectItem>
            {epics.map((epic) => (
              <SelectItem key={epic.id} value={epic.id}>
                {epic.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Type</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedLabel} onValueChange={setSelectedLabel}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Groups */}
      <div className="space-y-4">
        {taskGroups.map((group, groupIndex) => {
          const isBacklog = !group.sprint || group.sprint.id === "backlog";
          const sprintId = group.sprint?.id || "backlog";
          const isCollapsed = collapsedSprints.has(sprintId);

          return (
            <div
              key={sprintId}
              className="border rounded-lg bg-card dark:bg-gray-800/50"
            >
              {!isBacklog && (
                <div
                  className="flex items-center justify-between p-4 border-b bg-muted/50 dark:bg-gray-800/80 cursor-pointer hover:bg-muted dark:hover:bg-gray-700/50"
                  onClick={() => toggleSprintCollapse(sprintId)}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{group.sprint.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({group.tasks.length} work items)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
                        0
                      </span>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        0
                      </span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                        0
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      Complete sprint
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit sprint</DropdownMenuItem>
                        <DropdownMenuItem>Delete sprint</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {(!isCollapsed || isBacklog) && (
                <div className="divide-y divide-border">
                  {group.tasks.map((task: any, taskIndex: number) => {
                    const TaskTypeIcon =
                      typeIcons[task.type as keyof typeof typeIcons];
                    const PriorityIcon =
                      priorityIcons[
                        task.priority as keyof typeof priorityIcons
                      ];
                    const taskId = generateTaskId(
                      task,
                      groupIndex * 100 + taskIndex
                    );

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 p-3 hover:bg-muted/50 dark:hover:bg-gray-700/50 cursor-pointer group"
                        onClick={() => handleTaskClick(task)}
                      >
                        {/* Type Icon */}
                        <TaskTypeIcon
                          className={cn(
                            "h-4 w-4",
                            typeColors[task.type as keyof typeof typeColors]
                          )}
                        />

                        {/* Task ID */}
                        <span className="text-sm font-mono text-muted-foreground min-w-[80px]">
                          {taskId}
                        </span>

                        {/* Task Title */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </span>
                          {task.epic && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Epic: {task.epic.title}
                            </div>
                          )}
                        </div>

                        {/* Labels/Status */}
                        <div className="flex items-center gap-2">
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex gap-1">
                              {task.labels
                                .slice(0, 3)
                                .map(
                                  (label: {
                                    id: string;
                                    name: string;
                                    color: string;
                                  }) => (
                                    <span
                                      key={label.id}
                                      className="text-xs px-2 py-1 rounded-full text-white"
                                      style={{ backgroundColor: label.color }}
                                    >
                                      {label.name}
                                    </span>
                                  )
                                )}
                              {task.labels.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{task.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              statusColors[
                                task.status as keyof typeof statusColors
                              ]
                            )}
                          >
                            {task.status.replace("_", " ").toUpperCase()}
                          </Badge>
                          {task.story_points && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {task.story_points}
                            </span>
                          )}
                        </div>

                        {/* Priority */}
                        <PriorityIcon
                          className={cn(
                            "h-4 w-4",
                            priorityColors[
                              task.priority as keyof typeof priorityColors
                            ]
                          )}
                        />

                        {/* Assignee */}
                        <div className="min-w-[32px]">
                          {task.assignee ? (
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={task.assignee.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback className="text-xs">
                                {task.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                ?
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {group.tasks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">
                        {isBacklog
                          ? "No backlog items found. Create a task to get started."
                          : "No tasks in this sprint."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
        selectedTeamId={selectedTeamId}
      />

      <EnhancedTaskDetailsModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={() => setSelectedTask(null)}
        onTaskUpdated={refetch}
        onTaskDeleted={refetch}
      />
    </div>
  );
}
