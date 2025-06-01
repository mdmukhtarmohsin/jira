"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
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
  MoreHorizontal,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Settings,
  User,
  Flag,
  MessageSquare,
} from "lucide-react";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { EnhancedTaskDetailsModal } from "@/components/modals/enhanced-task-details-modal";
import { useKanbanData } from "@/hooks/use-kanban-data";
import { useEpicsAndLabels } from "@/hooks/use-epics-and-labels";
import { toast } from "@/hooks/use-toast";

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-muted border-border",
    textColor: "text-muted-foreground",
    headerColor: "bg-background/20",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color:
      "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    textColor: "text-blue-600 dark:text-blue-400",
    headerColor: "bg-blue-100/50 dark:bg-blue-950/50",
  },
  {
    id: "review",
    title: "In Review",
    color:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    textColor: "text-purple-600 dark:text-purple-400",
    headerColor: "bg-purple-100/50 dark:bg-purple-950/50",
  },
  {
    id: "done",
    title: "Done",
    color:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    textColor: "text-green-600 dark:text-green-400",
    headerColor: "bg-green-100/50 dark:bg-green-950/50",
  },
];

const priorityConfig = {
  high: {
    color:
      "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    icon: "🔴",
    flag: "text-red-500 dark:text-red-400",
  },
  medium: {
    color:
      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
    icon: "🟡",
    flag: "text-orange-500 dark:text-orange-400",
  },
  low: {
    color:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    icon: "🟢",
    flag: "text-green-500 dark:text-green-400",
  },
};

const typeConfig = {
  story: {
    color:
      "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: "📖",
  },
  bug: {
    color:
      "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: "🐛",
  },
  task: { color: "bg-muted text-muted-foreground border-border", icon: "✓" },
};

export default function KanbanPage() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEpic, setSelectedEpic] = useState("all");
  const [selectedLabel, setSelectedLabel] = useState("all");

  const {
    tasks,
    teams,
    sprints,
    selectedTeamId,
    setSelectedTeamId,
    selectedSprintId,
    setSelectedSprintId,
    loading,
    error,
    getTasksByStatus,
    updateTaskStatus,
    refetch,
  } = useKanbanData();

  const {
    epics,
    labels,
    loading: epicsLabelsLoading,
    error: epicsLabelsError,
  } = useEpicsAndLabels(selectedTeamId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState("todo");

  // Reset epic and label filters when team changes
  useEffect(() => {
    setSelectedEpic("all");
    setSelectedLabel("all");
  }, [selectedTeamId]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const updateResult = await updateTaskStatus(
      draggableId,
      destination.droppableId
    );

    if (!updateResult.success) {
      toast({
        title: "Error",
        description: updateResult.error || "Failed to update task status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Task moved",
        description: `Task moved to ${
          columns.find((c) => c.id === destination.droppableId)?.title
        }`,
      });
    }
  };

  const handleCreateTask = (status: string) => {
    setCreateModalStatus(status);
    setShowCreateModal(true);
  };

  const handleTaskCreated = () => {
    refetch();
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const filteredTasks = (tasks || []).filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
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

    return matchesSearch && matchesEpic && matchesLabel;
  });

  const getFilteredTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-96 mt-1 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-12 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="h-24 bg-muted rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
            <p className="text-sm text-muted-foreground">
              Drag and drop tasks to update their status
            </p>
          </div>

          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" />
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                Error Loading Kanban Board
              </h3>
              <p className="text-red-700 dark:text-red-300 text-center mb-4 text-sm">
                {error}
              </p>
              <div className="flex space-x-2">
                <Button onClick={refetch} variant="outline" size="sm">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Try Again
                </Button>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <Plus className="mr-1 h-3 w-3" />
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
            <p className="text-sm text-muted-foreground">
              Create a team first to start managing tasks
            </p>
          </div>

          <Card className="border-dashed border-2 border-border">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-blue-100 dark:bg-blue-950/50 p-2 mb-3">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Teams Found
              </h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md text-sm">
                You need to create or join a team before you can manage tasks on
                the Kanban board.
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center">
                <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded mr-2 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">KB</span>
                </div>
                Kanban Board
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Plan, track, and manage your team's work
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={refetch} size="sm">
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh
              </Button>
              <Button onClick={() => handleCreateTask("todo")} size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Create Issue
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-sm mr-2"></div>
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSprintId}
                onValueChange={setSelectedSprintId}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 w-48 h-8 text-xs"
                />
              </div>

              <Select value={selectedEpic} onValueChange={setSelectedEpic}>
                <SelectTrigger className="w-32 h-8 text-xs">
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

              <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                <SelectTrigger className="w-32 h-8 text-xs">
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
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.id} className="space-y-3">
                {/* Column Header */}
                <div
                  className={`rounded-lg border ${column.color} ${column.headerColor} p-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`font-semibold text-sm ${column.textColor}`}
                      >
                        {column.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-card/80 text-xs px-1.5 py-0.5"
                      >
                        {getFilteredTasksByStatus(column.id).length}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[300px] p-1 rounded-lg transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? `${column.color} border-2 border-dashed shadow-inner`
                          : "bg-transparent"
                      }`}
                    >
                      {getFilteredTasksByStatus(column.id).map(
                        (task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-pointer hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 ${
                                  snapshot.isDragging
                                    ? "shadow-lg rotate-1 bg-card z-50 ring-2 ring-blue-400 dark:ring-blue-600"
                                    : "bg-card hover:bg-muted/50"
                                }`}
                                onClick={() => handleTaskClick(task)}
                              >
                                <CardContent className="p-3">
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-sm">
                                        {typeConfig[task.type].icon}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          typeConfig[task.type].color
                                        } border text-xs px-1.5 py-0.5`}
                                      >
                                        {task.type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Task Title */}
                                  <h4 className="font-medium text-foreground mb-1 line-clamp-2 leading-tight text-sm">
                                    {task.title}
                                  </h4>

                                  {/* Epic Information */}
                                  {task.epic && (
                                    <div className="text-xs text-muted-foreground mb-1">
                                      Epic: {task.epic.title}
                                    </div>
                                  )}

                                  {/* Task Description */}
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Labels */}
                                  {task.labels && task.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {task.labels
                                        .slice(0, 2)
                                        .map(
                                          (label: {
                                            id: string;
                                            name: string;
                                            color: string;
                                          }) => (
                                            <span
                                              key={label.id}
                                              className="text-xs px-1.5 py-0.5 rounded-full text-white"
                                              style={{
                                                backgroundColor: label.color,
                                              }}
                                            >
                                              {label.name}
                                            </span>
                                          )
                                        )}
                                      {task.labels.length > 2 && (
                                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
                                          +{task.labels.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Task Metadata */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-1.5">
                                      {/* Priority */}
                                      <Flag
                                        className={`h-2.5 w-2.5 ${
                                          priorityConfig[task.priority].flag
                                        }`}
                                      />

                                      {/* Task ID */}
                                      <span className="text-xs text-muted-foreground font-mono">
                                        {task.id.slice(0, 6)}
                                      </span>

                                      {/* Comments count */}
                                      <div className="flex items-center space-x-0.5">
                                        <MessageSquare className="h-2.5 w-2.5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {task.commentCount}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-1.5">
                                      {/* Story Points */}
                                      {task.story_points && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-1.5 py-0.5"
                                        >
                                          {task.story_points}
                                        </Badge>
                                      )}

                                      {/* Assignee */}
                                      {task.assignee ? (
                                        <Avatar className="h-5 w-5">
                                          <AvatarImage
                                            src={
                                              task.assignee.avatar ||
                                              "/placeholder.svg"
                                            }
                                            alt={task.assignee.name}
                                          />
                                          <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                                            {task.assignee.initials}
                                          </AvatarFallback>
                                        </Avatar>
                                      ) : (
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                            <User className="h-2.5 w-2.5" />
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>

                                  {/* Due Date & Status Indicators */}
                                  {(task.isBlocked ||
                                    task.isOverdue ||
                                    task.due_date) && (
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                      <div className="flex items-center space-x-1.5">
                                        {task.isBlocked && (
                                          <div className="flex items-center space-x-0.5">
                                            <AlertTriangle className="h-2.5 w-2.5 text-red-600 dark:text-red-400" />
                                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                              Blocked
                                            </span>
                                          </div>
                                        )}
                                        {task.isOverdue && (
                                          <div className="flex items-center space-x-0.5">
                                            <Clock className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                                            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                              Overdue
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {task.due_date && (
                                        <span className="text-xs text-muted-foreground">
                                          Due{" "}
                                          {new Date(
                                            task.due_date
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        )
                      )}
                      {provided.placeholder}

                      {/* Add Task Button - only show for To Do column */}
                      {column.id === "todo" && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 border-2 border-dashed border-border hover:border-muted-foreground transition-all duration-200 h-8 text-xs"
                          onClick={() => handleCreateTask(column.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Create issue
                        </Button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTaskCreated={handleTaskCreated}
        selectedTeamId={selectedTeamId}
        defaultStatus={createModalStatus}
      />

      <EnhancedTaskDetailsModal
        open={showTaskDetails}
        onOpenChange={setShowTaskDetails}
        task={selectedTask}
        onTaskUpdated={refetch}
        onTaskDeleted={refetch}
      />
    </div>
  );
}
