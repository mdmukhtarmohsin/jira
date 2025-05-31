"use client";

import { useState } from "react";
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
import { toast } from "@/hooks/use-toast";

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-slate-100 border-slate-200",
    textColor: "text-slate-700",
    headerColor: "bg-slate-50",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "bg-blue-100 border-blue-200",
    textColor: "text-blue-700",
    headerColor: "bg-blue-50",
  },
  {
    id: "review",
    title: "In Review",
    color: "bg-purple-100 border-purple-200",
    textColor: "text-purple-700",
    headerColor: "bg-purple-50",
  },
  {
    id: "done",
    title: "Done",
    color: "bg-green-100 border-green-200",
    textColor: "text-green-700",
    headerColor: "bg-green-50",
  },
];

const priorityConfig = {
  high: {
    color: "text-red-600 bg-red-50 border-red-200",
    icon: "🔴",
    flag: "text-red-600",
  },
  medium: {
    color: "text-orange-600 bg-orange-50 border-orange-200",
    icon: "🟡",
    flag: "text-orange-600",
  },
  low: {
    color: "text-green-600 bg-green-50 border-green-200",
    icon: "🟢",
    flag: "text-green-600",
  },
};

const typeConfig = {
  story: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: "📖" },
  bug: { color: "bg-red-100 text-red-800 border-red-200", icon: "🐛" },
  task: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: "✓" },
};

export default function KanbanPage() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState("todo");

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

  const filteredTasks = (tasks || []).filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="h-32 bg-gray-200 rounded animate-pulse"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600">
              Drag and drop tasks to update their status
            </p>
          </div>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Error Loading Kanban Board
              </h3>
              <p className="text-red-700 text-center mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button onClick={refetch} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
            <p className="text-gray-600">
              Create a team first to start managing tasks
            </p>
          </div>

          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-blue-100 p-3 mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Teams Found
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                You need to create or join a team before you can manage tasks on
                the Kanban board.
              </p>
              <Button
                onClick={() => (window.location.href = "/dashboard/teams")}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">KB</span>
                </div>
                Kanban Board
              </h1>
              <p className="text-gray-600 mt-1">
                Plan, track, and manage your team's work
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={refetch} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => handleCreateTask("todo")} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Issue
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div>
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
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by sprint" />
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

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.id} className="space-y-4">
                {/* Column Header */}
                <div
                  className={`rounded-lg border-2 ${column.color} ${column.headerColor} p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className={`font-semibold ${column.textColor}`}>
                        {column.title}
                      </h3>
                      <Badge variant="secondary" className="bg-white/50">
                        {getFilteredTasksByStatus(column.id).length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCreateTask(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[400px] p-2 rounded-lg transition-all duration-200 ${
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
                                className={`cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${
                                  snapshot.isDragging
                                    ? "shadow-2xl rotate-3 bg-white z-50 ring-2 ring-blue-400"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                                onClick={() => handleTaskClick(task)}
                              >
                                <CardContent className="p-4">
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {typeConfig[task.type].icon}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          typeConfig[task.type].color
                                        } border text-xs`}
                                      >
                                        {task.type.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Task Title */}
                                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-snug">
                                    {task.title}
                                  </h4>

                                  {/* Task Description */}
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Task Metadata */}
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center space-x-2">
                                      {/* Priority */}
                                      <Flag
                                        className={`h-3 w-3 ${
                                          priorityConfig[task.priority].flag
                                        }`}
                                      />

                                      {/* Task ID */}
                                      <span className="text-xs text-gray-500 font-mono">
                                        {task.id.slice(0, 8)}
                                      </span>

                                      {/* Comments count */}
                                      <div className="flex items-center space-x-1">
                                        <MessageSquare className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                          {task.commentCount}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {/* Story Points */}
                                      {task.story_points && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                          {task.story_points}
                                        </Badge>
                                      )}

                                      {/* Assignee */}
                                      {task.assignee ? (
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage
                                            src={
                                              task.assignee.avatar ||
                                              "/placeholder.svg"
                                            }
                                            alt={task.assignee.name}
                                          />
                                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                            {task.assignee.initials}
                                          </AvatarFallback>
                                        </Avatar>
                                      ) : (
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-xs bg-gray-100 text-gray-400">
                                            <User className="h-3 w-3" />
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>

                                  {/* Due Date & Status Indicators */}
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center space-x-2">
                                      {task.isBlocked && (
                                        <div className="flex items-center space-x-1">
                                          <AlertTriangle className="h-3 w-3 text-red-600" />
                                          <span className="text-xs text-red-600 font-medium">
                                            Blocked
                                          </span>
                                        </div>
                                      )}
                                      {task.isOverdue && (
                                        <div className="flex items-center space-x-1">
                                          <Clock className="h-3 w-3 text-orange-600" />
                                          <span className="text-xs text-orange-600 font-medium">
                                            Overdue
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {task.due_date && (
                                      <span className="text-xs text-gray-500">
                                        Due{" "}
                                        {new Date(
                                          task.due_date
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        )
                      )}
                      {provided.placeholder}

                      {/* Add Task Button */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-white/50 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all duration-200"
                        onClick={() => handleCreateTask(column.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create issue
                      </Button>
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
