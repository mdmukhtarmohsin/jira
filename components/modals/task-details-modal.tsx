"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Target,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: "bug" | "story" | "task";
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  story_points: number | null;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at?: string;
  assignee?: {
    name: string;
    avatar: string | null;
    initials: string;
  };
  sprint?: {
    id: string;
    name: string;
    status: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
}

interface TaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export function TaskDetailsModal({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    type: "task" as "bug" | "story" | "task",
    priority: "medium" as "low" | "medium" | "high",
    status: "todo" as "todo" | "in_progress" | "review" | "done",
    story_points: "",
    assignee_id: "",
    due_date: "",
    sprint_id: "",
  });

  useEffect(() => {
    if (task && open) {
      setEditData({
        title: task.title,
        description: task.description || "",
        type: task.type,
        priority: task.priority,
        status: task.status,
        story_points: task.story_points?.toString() || "",
        assignee_id: task.assignee_id || "",
        due_date: task.due_date || "",
        sprint_id: task.sprint?.id || "",
      });
      fetchTaskData();
    }
  }, [task, open]);

  const fetchTaskData = async () => {
    if (!task) return;

    try {
      // Get team ID from task
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("team_id")
        .eq("id", task.id)
        .single();

      if (taskError || !taskData) return;

      // Fetch team members
      const { data: teamMembersData, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", taskData.team_id);

      if (!membersError && teamMembersData) {
        const userIds = teamMembersData.map((member) => member.user_id);
        const { data: userProfiles } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        const members: TeamMember[] = (userProfiles || []).map((profile) => ({
          id: profile.id,
          name: profile.full_name || "Unknown User",
          avatar: profile.avatar_url || null,
          initials: profile.full_name
            ? profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "U",
        }));

        setTeamMembers(members);
      }

      // Fetch sprints
      const { data: sprintsData } = await supabase
        .from("sprints")
        .select("id, name, status")
        .eq("team_id", taskData.team_id)
        .order("created_at", { ascending: false });

      setSprints(sprintsData || []);
    } catch (error) {
      console.error("Error fetching task data:", error);
    }
  };

  const handleSave = async () => {
    if (!task || !editData.title.trim()) return;

    setLoading(true);

    try {
      const updateData = {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        type: editData.type,
        priority: editData.priority,
        status: editData.status,
        story_points: editData.story_points
          ? Number.parseInt(editData.story_points)
          : null,
        assignee_id: editData.assignee_id || null,
        due_date: editData.due_date || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.id);

      if (updateError) throw updateError;

      // Handle sprint assignment
      if (editData.sprint_id !== task.sprint?.id) {
        // Remove from current sprint if exists
        if (task.sprint?.id) {
          await supabase
            .from("sprint_tasks")
            .delete()
            .eq("task_id", task.id)
            .eq("sprint_id", task.sprint.id);
        }

        // Add to new sprint if selected
        if (editData.sprint_id) {
          await supabase
            .from("sprint_tasks")
            .insert([{ sprint_id: editData.sprint_id, task_id: task.id }]);
        }
      }

      toast({
        title: "Success",
        description: "Task updated successfully!",
      });

      setIsEditing(false);
      onTaskUpdated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setLoading(true);

    try {
      // Delete sprint task relationships first
      await supabase.from("sprint_tasks").delete().eq("task_id", task.id);

      // Delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });

      onTaskDeleted?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof editData) => (value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange =
    (field: keyof typeof editData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const getSelectedAssignee = () => {
    if (!editData.assignee_id) return null;
    return teamMembers.find((member) => member.id === editData.assignee_id);
  };

  const typeColors = {
    story: "bg-blue-100 text-blue-800",
    bug: "bg-red-100 text-red-800",
    task: "bg-gray-100 text-gray-800",
  };

  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  const statusColors = {
    todo: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    done: "bg-green-100 text-green-800",
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Task" : task.title}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update task details"
                  : `Task ID: ${task.id.slice(0, 8)}`}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={editData.title}
                    onChange={handleInputChange("title")}
                    placeholder="Task title"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={handleInputChange("description")}
                    placeholder="Task description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select
                      value={editData.type}
                      onValueChange={handleChange("type")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select
                      value={editData.priority}
                      onValueChange={handleChange("priority")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={editData.status}
                      onValueChange={handleChange("status")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Story Points</Label>
                    <Input
                      type="number"
                      value={editData.story_points}
                      onChange={handleInputChange("story_points")}
                      placeholder="Points"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Assignee</Label>
                    <Select
                      value={editData.assignee_id}
                      onValueChange={handleChange("assignee_id")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee">
                          {getSelectedAssignee() && (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={
                                    getSelectedAssignee()?.avatar ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback className="text-xs">
                                  {getSelectedAssignee()?.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{getSelectedAssignee()?.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={member.avatar || "/placeholder.svg"}
                                  alt={member.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {member.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Sprint</Label>
                    <Select
                      value={editData.sprint_id}
                      onValueChange={handleChange("sprint_id")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_sprint">
                          No Sprint (Backlog)
                        </SelectItem>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name} ({sprint.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editData.due_date}
                    onChange={handleInputChange("due_date")}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading || !editData.title.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Type:
                      </span>
                      <Badge
                        variant="outline"
                        className={typeColors[task.type]}
                      >
                        {task.type}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Priority:
                      </span>
                      <Badge
                        variant="outline"
                        className={priorityColors[task.priority]}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Status:
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColors[task.status]}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Assignee:
                      </span>
                      {task.assignee ? (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.assignee.avatar || "/placeholder.svg"}
                              alt={task.assignee.name}
                            />
                            <AvatarFallback className="text-xs">
                              {task.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {task.story_points && (
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Story Points:
                        </span>
                        <span className="text-sm font-medium">
                          {task.story_points}
                        </span>
                      </div>
                    )}

                    {task.due_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Due Date:
                        </span>
                        <span className="text-sm">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {task.sprint && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Sprint</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{task.sprint.name}</span>
                        <Badge variant="outline">{task.sprint.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    Created: {new Date(task.created_at).toLocaleString()}
                  </div>
                  {task.updated_at && (
                    <div>
                      Updated: {new Date(task.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Activity Log</CardTitle>
                <CardDescription>Task history and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                  Activity tracking coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
