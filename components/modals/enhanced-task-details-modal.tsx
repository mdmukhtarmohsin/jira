"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit3,
  MessageSquare,
  Calendar,
  Clock,
  User,
  Tag,
  Target,
  Trash2,
  Save,
  X,
  MoreHorizontal,
  Activity,
  Flag,
  Link,
  GitBranch,
  Bookmark,
  BookOpen,
  CheckSquare,
  Bug,
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
  commentCount?: number;
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
  epic?: {
    id: string;
    title: string;
    status: string;
  };
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    full_name: string;
    avatar_url: string | null;
    initials: string;
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

interface Epic {
  id: string;
  title: string;
  description?: string;
  status: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface EnhancedTaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export function EnhancedTaskDetailsModal({
  open,
  onOpenChange,
  task,
  onTaskUpdated,
  onTaskDeleted,
}: EnhancedTaskDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  // Local state for current sprint to update UI immediately
  const [currentSprint, setCurrentSprint] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Local state for current epic
  const [currentEpic, setCurrentEpic] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Local state for current labels
  const [currentLabels, setCurrentLabels] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
    }>
  >([]);

  // Individual edit states for each field
  const [editingField, setEditingField] = useState<string | null>(null);

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
    epic_id: "",
    label_ids: [] as string[],
  });

  const [isFieldSaving, setIsFieldSaving] = useState<string | null>(null);

  const typeIcons = {
    bug: <Bug className="w-4 h-4" />,
    story: <BookOpen className="w-4 h-4" />,
    task: <CheckSquare className="w-4 h-4" />,
  };

  const priorityColors = {
    high: "text-red-600 bg-red-50 border-red-200",
    medium: "text-orange-600 bg-orange-50 border-orange-200",
    low: "text-green-600 bg-green-50 border-green-200",
  };

  const statusColors = {
    todo: "text-neutral-600 dark:text-neutral-400 bg-neutral-50 border-neutral-200",
    in_progress: "text-blue-600 bg-blue-50 border-blue-200",
    review: "text-purple-600 bg-purple-50 border-purple-200",
    done: "text-green-600 bg-green-50 border-green-200",
  };

  const statusLabels = {
    todo: "To Do",
    in_progress: "In Progress",
    review: "In Review",
    done: "Done",
  };

  useEffect(() => {
    if (task && open) {
      setCurrentSprint(task.sprint || null);
      setCurrentEpic(
        task.epic ? { id: task.epic.id, title: task.epic.title } : null
      );
      setCurrentLabels(task.labels || []);

      // Initialize edit data from task
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
        epic_id: task.epic?.id || "",
        label_ids: task.labels?.map((label) => label.id) || [],
      });

      fetchTaskData();
      fetchComments();
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
                .map((n: string) => n[0])
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

      // Fetch epics and labels with detailed error handling
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No authenticated user found");
          return;
        }

        console.log(
          "Fetching epics for team:",
          taskData.team_id,
          "and user:",
          user.id
        );

        // Check team membership first
        const { data: teamMembership, error: membershipError } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", taskData.team_id)
          .eq("user_id", user.id)
          .single();

        if (membershipError) {
          console.error("Team membership check error:", membershipError);
        } else {
          console.log("Team membership found:", teamMembership);
        }

        // Fetch epics with detailed error handling
        console.log("Starting epic fetch...");
        const { data: epicsData, error: epicsError } = await supabase
          .from("epics")
          .select("id, title, description, status")
          .eq("team_id", taskData.team_id)
          .order("created_at", { ascending: false });

        if (epicsError) {
          console.error("Error fetching epics:", epicsError);
          toast({
            title: "Error",
            description: "Failed to fetch epics: " + epicsError.message,
            variant: "destructive",
          });
        } else {
          console.log("Epics fetched successfully:", epicsData);
          setEpics(epicsData || []);
        }

        // Fetch labels with detailed error handling
        console.log("Starting labels fetch...");
        const { data: labelsData, error: labelsError } = await supabase
          .from("labels")
          .select("id, name, color")
          .eq("team_id", taskData.team_id)
          .order("created_at", { ascending: false });

        if (labelsError) {
          console.error("Error fetching labels:", labelsError);
          toast({
            title: "Error",
            description: "Failed to fetch labels: " + labelsError.message,
            variant: "destructive",
          });
        } else {
          console.log("Labels fetched successfully:", labelsData);
          setLabels(labelsData || []);
        }
      } catch (error) {
        console.error("Unexpected error in fetchEpicsAndLabels:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while fetching data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching task data:", error);
    }
  };

  const fetchUpdatedTaskData = async () => {
    if (!task) return;

    try {
      // Fetch updated task with sprint information
      const { data: updatedTask, error } = await supabase
        .from("tasks")
        .select(
          `
          *,
          sprint:sprint_tasks(
            sprint:sprints(
              id,
              name,
              status
            )
          )
        `
        )
        .eq("id", task.id)
        .single();

      if (error) {
        console.error("Error fetching updated task:", error);
        return;
      }

      // Update the task data - this will trigger the parent component to re-render
      console.log("Fetched updated task data:", updatedTask);

      // Call onTaskUpdated to refresh parent component with new data
      onTaskUpdated?.();
    } catch (error) {
      console.error("Error fetching updated task data:", error);
    }
  };

  const fetchComments = async () => {
    if (!task) return;

    try {
      console.log("Fetching comments for task:", task.id);

      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id
        `
        )
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Error",
          description: "Failed to load comments. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Comments data received:", commentsData);

      // Fetch user profiles separately for each comment
      const formattedComments: Comment[] = await Promise.all(
        (commentsData || []).map(async (comment: any) => {
          // Try to get user profile, fallback to basic info if not found
          const { data: userProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("full_name, avatar_url")
            .eq("id", comment.user_id)
            .single();

          if (profileError) {
            console.warn(
              "Could not fetch user profile for user:",
              comment.user_id,
              profileError
            );
          }

          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            user: {
              full_name: userProfile?.full_name || "Unknown User",
              avatar_url: userProfile?.avatar_url || null,
              initials: userProfile?.full_name
                ? userProfile.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                : "U",
            },
          };
        })
      );

      console.log("Formatted comments:", formattedComments);
      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addComment = async () => {
    if (!task || !newComment.trim() || !user) return;

    try {
      console.log("Adding comment for task:", task.id, "by user:", user.id);

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            task_id: task.id,
            user_id: user.id,
            content: newComment.trim(),
          },
        ])
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        toast({
          title: "Error",
          description: "Failed to add comment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Comment added successfully:", data);
      setNewComment("");
      await fetchComments();

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
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
        if (task.sprint?.id) {
          await supabase
            .from("sprint_tasks")
            .delete()
            .eq("task_id", task.id)
            .eq("sprint_id", task.sprint.id);
        }

        if (editData.sprint_id) {
          await supabase
            .from("sprint_tasks")
            .insert([{ sprint_id: editData.sprint_id, task_id: task.id }]);
        }
      }

      setEditingField(null);
      onTaskUpdated?.();

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = async (field: string, newValue?: any) => {
    console.log(
      "handleFieldSave called with field:",
      field,
      "newValue:",
      newValue
    );
    if (!task) return;

    setLoading(true);

    try {
      let updateData: any = {
        updated_at: new Date().toISOString(),
      };

      switch (field) {
        case "title":
          if (!editData.title.trim()) return;
          updateData.title = editData.title.trim();
          break;
        case "description":
          updateData.description = editData.description.trim() || null;
          break;
        case "type":
          updateData.type = editData.type;
          break;
        case "priority":
          updateData.priority = editData.priority;
          break;
        case "status":
          updateData.status = editData.status;
          break;
        case "story_points":
          updateData.story_points = editData.story_points
            ? Number.parseInt(editData.story_points)
            : null;
          break;
        case "assignee_id":
          updateData.assignee_id = editData.assignee_id || null;
          break;
        case "due_date":
          updateData.due_date = editData.due_date || null;
          break;
        case "epic_id":
          // Handle epic assignment
          const targetEpicId =
            newValue !== undefined
              ? newValue === "no_epic"
                ? ""
                : newValue
              : editData.epic_id;

          console.log("Updating epic assignment:", {
            currentEpicId: task.epic?.id,
            newEpicId: targetEpicId,
            taskId: task.id,
          });

          // Compare current epic ID with new epic ID
          const currentEpicId = task.epic?.id || null;
          const newEpicId = targetEpicId || null;

          if (currentEpicId !== newEpicId) {
            // Update the epic_id field directly in the tasks table
            console.log("Updating task epic_id to:", newEpicId);
            const { error: updateError } = await supabase
              .from("tasks")
              .update({ epic_id: newEpicId })
              .eq("id", task.id);

            if (updateError) {
              console.error("Error updating task epic:", updateError);
              throw new Error(
                `Failed to update task epic: ${updateError.message}`
              );
            }

            console.log("Epic assignment updated successfully");

            // Update internal state to reflect the change immediately
            setEditData((prev) => ({
              ...prev,
              epic_id: newEpicId || "",
            }));

            // Update current epic display
            if (newEpicId) {
              const selectedEpic = epics.find((e) => e.id === newEpicId);
              setCurrentEpic(
                selectedEpic
                  ? { id: selectedEpic.id, title: selectedEpic.title }
                  : null
              );
            } else {
              setCurrentEpic(null);
            }

            setEditingField(null);

            // Fetch updated task data to reflect changes immediately
            await fetchUpdatedTaskData();

            toast({
              title: "Epic updated",
              description: newEpicId
                ? "Task has been added to the selected epic."
                : "Task has been removed from epic.",
            });

            return; // Exit early for epic changes
          } else {
            console.log("No epic change detected, skipping update");
            setEditingField(null);
            return;
          }
        case "labels":
          // Handle label assignments
          const targetLabelIds =
            newValue !== undefined ? newValue : editData.label_ids;
          const currentLabelIds = task.labels?.map((label) => label.id) || [];

          console.log("Updating label assignments:", {
            currentLabelIds,
            newLabelIds: targetLabelIds,
            taskId: task.id,
          });

          // Remove all current label assignments
          if (currentLabelIds.length > 0) {
            const { error: deleteError } = await supabase
              .from("task_labels")
              .delete()
              .eq("task_id", task.id);

            if (deleteError) {
              console.error("Error removing task labels:", deleteError);
              throw new Error(
                `Failed to remove current labels: ${deleteError.message}`
              );
            }
          }

          // Add new label assignments
          if (targetLabelIds.length > 0) {
            const labelAssignments = targetLabelIds.map((labelId: string) => ({
              task_id: task.id,
              label_id: labelId,
            }));

            const { error: insertError } = await supabase
              .from("task_labels")
              .insert(labelAssignments);

            if (insertError) {
              console.error("Error adding task labels:", insertError);
              throw new Error(
                `Failed to add new labels: ${insertError.message}`
              );
            }
          }

          console.log("Label assignments updated successfully");

          // Update internal state to reflect the change immediately
          setEditData((prev) => ({
            ...prev,
            label_ids: targetLabelIds,
          }));

          // Update current labels display
          const selectedLabels = labels.filter((label) =>
            targetLabelIds.includes(label.id)
          );
          setCurrentLabels(selectedLabels);

          setEditingField(null);

          // Fetch updated task data to reflect changes immediately
          await fetchUpdatedTaskData();

          toast({
            title: "Labels updated",
            description: "Task labels have been updated successfully.",
          });

          return; // Exit early for label changes
        case "sprint_id":
          // Handle sprint assignment separately
          // Use newValue if provided, otherwise use editData
          const targetSprintId =
            newValue !== undefined
              ? newValue === "backlog"
                ? ""
                : newValue
              : editData.sprint_id;

          console.log("Updating sprint assignment:", {
            currentSprintId: task.sprint?.id,
            newSprintId: targetSprintId,
            taskId: task.id,
          });

          // Compare current sprint ID with new sprint ID
          const currentSprintId = task.sprint?.id || null;
          const newSprintId = targetSprintId || null;

          if (currentSprintId !== newSprintId) {
            // Remove from current sprint if exists
            if (currentSprintId) {
              console.log(
                "Removing task from current sprint:",
                currentSprintId
              );
              const { error: deleteError } = await supabase
                .from("sprint_tasks")
                .delete()
                .eq("task_id", task.id)
                .eq("sprint_id", currentSprintId);

              if (deleteError) {
                console.error("Error removing task from sprint:", deleteError);
                throw new Error(
                  `Failed to remove task from current sprint: ${deleteError.message}`
                );
              }
            }

            // Add to new sprint if selected
            if (newSprintId) {
              console.log("Adding task to new sprint:", newSprintId);
              const { error: insertError } = await supabase
                .from("sprint_tasks")
                .insert([{ sprint_id: newSprintId, task_id: task.id }]);

              if (insertError) {
                console.error("Error adding task to sprint:", insertError);
                throw new Error(
                  `Failed to add task to new sprint: ${insertError.message}`
                );
              }
            }

            console.log("Sprint assignment updated successfully");

            // Update internal state to reflect the change immediately
            setEditData((prev) => ({
              ...prev,
              sprint_id: newSprintId || "",
            }));

            // Update current sprint display
            if (newSprintId) {
              const selectedSprint = sprints.find((s) => s.id === newSprintId);
              setCurrentSprint(
                selectedSprint
                  ? { id: selectedSprint.id, name: selectedSprint.name }
                  : null
              );
            } else {
              setCurrentSprint(null);
            }

            setEditingField(null);

            // Fetch updated task data to reflect changes immediately
            await fetchUpdatedTaskData();

            toast({
              title: "Sprint updated",
              description: newSprintId
                ? "Task has been moved to the selected sprint."
                : "Task has been moved to backlog.",
            });

            return; // Exit early for sprint changes
          } else {
            console.log("No sprint change detected, skipping update");
            setEditingField(null);
            return;
          }
      }

      // Update the task for all other fields (not sprint_id, epic_id, or labels)
      const { error: updateError } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.id);

      if (updateError) throw updateError;

      setEditingField(null);
      onTaskUpdated?.();

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectedAssignee = () => {
    return teamMembers.find((member) => member.id === editData.assignee_id);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 dark:bg-neutral-900">
        <div className="flex h-full max-h-[85vh]">
          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <DialogHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-lg">
                    {typeIcons[task.type]}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-lg font-bold dark:text-white mb-1">
                      {editingField === "title" ? (
                        <div className="space-y-2">
                          <Input
                            value={editData.title}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="text-lg font-bold border-0 px-0 focus:ring-0 bg-transparent dark:bg-transparent dark:text-white h-7"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleFieldSave("title")}
                              disabled={loading}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingField(null)}
                              className="h-6 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded p-1 -m-1"
                          onClick={() => setEditingField("title")}
                        >
                          {task.title}
                        </div>
                      )}
                    </DialogTitle>
                    <div className="flex items-center space-x-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center space-x-1">
                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                        <span className="capitalize font-medium">
                          {task.type}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                        {task.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {editingField && editingField !== "title" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-7 w-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  {!editingField && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField("title")}
                      className="h-7 w-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-36 dark:bg-neutral-800 dark:border-neutral-700"
                    >
                      <DropdownMenuItem className="dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <Link className="w-3 h-3 mr-2" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="dark:text-neutral-300 dark:hover:bg-neutral-700">
                        <Bookmark className="w-3 h-3 mr-2" />
                        Watch
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 dark:text-red-400 dark:hover:bg-neutral-700">
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold dark:text-neutral-200 flex items-center space-x-1.5">
                  <div className="w-0.5 h-3 bg-blue-500 rounded-full"></div>
                  <span>Description</span>
                  {editingField !== "description" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingField("description")}
                      className="h-4 w-4 p-0 ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </Label>
                <div className="group">
                  {editingField === "description" ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editData.description}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Add a description..."
                        className="min-h-[60px] border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFieldSave("description")}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                          className="h-6 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50/50 dark:bg-neutral-800/50 rounded-lg p-2 min-h-[60px] border border-neutral-100 dark:border-neutral-700 cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50"
                      onClick={() => setEditingField("description")}
                    >
                      {task.description || (
                        <span className="text-neutral-400 dark:text-neutral-500 italic">
                          Click to add description
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold dark:text-neutral-200 flex items-center space-x-1.5">
                  <div className="w-0.5 h-3 bg-emerald-500 rounded-full"></div>
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>Comments</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs px-1.5 py-0.5"
                  >
                    {comments.length}
                  </Badge>
                </Label>

                {/* Add Comment */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-2">
                  <div className="flex space-x-2">
                    <Avatar className="h-6 w-6 ring-1 ring-blue-100 dark:ring-blue-800">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                        {user?.user_metadata?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1.5">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[40px] border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 resize-none text-xs"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={addComment}
                          disabled={!newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-6 text-xs"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                  <ScrollArea className="max-h-[300px] pr-1">
                    <div className="space-y-2">
                      {comments.map((comment, index) => (
                        <div key={comment.id} className="relative">
                          {index !== comments.length - 1 && (
                            <div className="absolute left-3 top-8 bottom-0 w-px bg-neutral-200 dark:bg-neutral-600"></div>
                          )}
                          <div className="flex space-x-2">
                            <Avatar className="h-6 w-6 ring-1 ring-neutral-100 dark:ring-neutral-700 relative z-10 bg-white dark:bg-neutral-800">
                              <AvatarImage
                                src={comment.user.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-neutral-500 to-neutral-600 text-white font-semibold text-xs">
                                {comment.user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg p-2 shadow-sm hover:shadow-md dark:shadow-neutral-900/20 transition-shadow duration-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium dark:text-neutral-200 text-xs">
                                    {comment.user.full_name}
                                  </span>
                                  <time className="text-xs text-neutral-600 dark:text-neutral-400">
                                    {formatDate(comment.created_at)}
                                  </time>
                                </div>
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mx-auto mb-1" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                      No comments yet
                    </p>
                    <p className="text-neutral-400 dark:text-neutral-500 text-xs">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                )}
              </div>

              {editingField === "title" && (
                <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-200 dark:border-neutral-600">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingField(null)}
                    className="h-7 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-60 bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-800 dark:to-neutral-900/50 border-l border-neutral-200 dark:border-neutral-600 p-3 overflow-y-auto">
            <div className="space-y-3">
              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Status
                </Label>
                <div>
                  {editingField === "status" ? (
                    <div className="space-y-2">
                      <Select
                        value={editData.status}
                        onValueChange={async (value) => {
                          setEditData((prev) => ({
                            ...prev,
                            status: value as any,
                          }));
                          // Auto-save the status change
                          await handleFieldSave("status");
                        }}
                      >
                        <SelectTrigger className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-600">
                          <SelectItem
                            value="todo"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            To Do
                          </SelectItem>
                          <SelectItem
                            value="in_progress"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            In Progress
                          </SelectItem>
                          <SelectItem
                            value="review"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            In Review
                          </SelectItem>
                          <SelectItem
                            value="done"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Done
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => setEditingField("status")}
                    >
                      <Badge
                        className={`${
                          statusColors[task.status]
                        } border px-2 py-0.5 text-xs font-medium`}
                      >
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Epic */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Epic
                </Label>
                <div>
                  {editingField === "epic_id" ? (
                    <div className="space-y-2">
                      <Select
                        value={editData.epic_id || "no_epic"}
                        onValueChange={(value) => {
                          console.log("Epic select value changed:", {
                            oldValue: editData.epic_id,
                            newValue: value,
                            currentTask: task?.id,
                          });
                          setEditData((prev) => ({
                            ...prev,
                            epic_id: value === "no_epic" ? "" : value,
                          }));
                          // Auto-save the epic change
                          console.log(
                            "About to call handleFieldSave for epic_id"
                          );
                          handleFieldSave("epic_id", value);
                        }}
                      >
                        <SelectTrigger className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-600">
                          <SelectItem
                            value="no_epic"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            No Epic
                          </SelectItem>
                          {epics.map((epic) => (
                            <SelectItem
                              key={epic.id}
                              value={epic.id}
                              className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded bg-purple-500"></div>
                                <span>{epic.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => {
                        console.log(
                          "Epic field clicked, setting editing field to epic_id"
                        );
                        setEditingField("epic_id");
                      }}
                    >
                      <div className="flex items-center space-x-1.5">
                        {currentEpic ? (
                          <>
                            <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded bg-purple-500"></div>
                            </div>
                            <span className="font-medium dark:text-neutral-200 text-xs">
                              {currentEpic.title}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                              <Target className="w-2.5 h-2.5 text-neutral-400 dark:text-neutral-500" />
                            </div>
                            <span className="font-medium text-neutral-600 dark:text-neutral-400 text-xs">
                              No Epic
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Labels
                </Label>
                <div>
                  {editingField === "labels" ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {labels.map((label) => {
                          const isSelected = editData.label_ids.includes(
                            label.id
                          );
                          return (
                            <button
                              key={label.id}
                              onClick={() => {
                                const newLabelIds = isSelected
                                  ? editData.label_ids.filter(
                                      (id) => id !== label.id
                                    )
                                  : [...editData.label_ids, label.id];
                                setEditData((prev) => ({
                                  ...prev,
                                  label_ids: newLabelIds,
                                }));
                              }}
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
                                isSelected
                                  ? "border-neutral-300 dark:border-neutral-500"
                                  : "border-neutral-200 dark:border-neutral-600 opacity-60 hover:opacity-100"
                              }`}
                              style={{
                                backgroundColor: isSelected
                                  ? `${label.color}20`
                                  : "transparent",
                                color: label.color,
                              }}
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: label.color }}
                              ></div>
                              <span>{label.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFieldSave("labels")}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                          className="h-6 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => {
                        console.log(
                          "Labels field clicked, setting editing field to labels"
                        );
                        setEditingField("labels");
                      }}
                    >
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <Tag className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          {currentLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {currentLabels.map((label) => (
                                <span
                                  key={label.id}
                                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: `${label.color}20`,
                                    color: label.color,
                                    border: `1px solid ${label.color}40`,
                                  }}
                                >
                                  <div
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                  ></div>
                                  <span>{label.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="font-medium text-neutral-600 dark:text-neutral-400 text-xs">
                              No labels
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sprint */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Sprint
                </Label>
                <div>
                  {editingField === "sprint_id" ? (
                    <div className="space-y-2">
                      <Select
                        value={editData.sprint_id || "backlog"}
                        onValueChange={(value) => {
                          console.log("Sprint select value changed:", {
                            oldValue: editData.sprint_id,
                            newValue: value,
                            currentTask: task?.id,
                          });
                          setEditData((prev) => ({
                            ...prev,
                            sprint_id: value === "backlog" ? "" : value,
                          }));
                          // Auto-save the sprint change
                          console.log(
                            "About to call handleFieldSave for sprint_id"
                          );
                          handleFieldSave("sprint_id", value);
                        }}
                      >
                        <SelectTrigger className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-600">
                          <SelectItem
                            value="backlog"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Backlog
                          </SelectItem>
                          {sprints.map((sprint) => (
                            <SelectItem
                              key={sprint.id}
                              value={sprint.id}
                              className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                              {sprint.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => {
                        console.log(
                          "Sprint field clicked, setting editing field to sprint_id"
                        );
                        setEditingField("sprint_id");
                      }}
                    >
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <GitBranch className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-medium dark:text-neutral-200 text-xs">
                          {currentSprint?.name || "Backlog"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Priority
                </Label>
                <div>
                  {editingField === "priority" ? (
                    <div className="space-y-2">
                      <Select
                        value={editData.priority}
                        onValueChange={async (value) => {
                          setEditData((prev) => ({
                            ...prev,
                            priority: value as any,
                          }));
                          // Auto-save the priority change
                          await handleFieldSave("priority");
                        }}
                      >
                        <SelectTrigger className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-600">
                          <SelectItem
                            value="low"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            <div className="flex items-center">
                              <Flag className="w-3 h-3 mr-1.5 text-green-600" />
                              Low
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="medium"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            <div className="flex items-center">
                              <Flag className="w-3 h-3 mr-1.5 text-orange-600" />
                              Medium
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="high"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            <div className="flex items-center">
                              <Flag className="w-3 h-3 mr-1.5 text-red-600" />
                              High
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => setEditingField("priority")}
                    >
                      <Badge
                        className={`${
                          priorityColors[task.priority]
                        } border px-2 py-0.5 text-xs font-medium capitalize`}
                      >
                        <Flag className="w-2.5 h-2.5 mr-1" />
                        {task.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Assignee
                </Label>
                <div>
                  {editingField === "assignee_id" ? (
                    <div className="space-y-2">
                      <Select
                        value={editData.assignee_id || "unassigned"}
                        onValueChange={async (value) => {
                          setEditData((prev) => ({
                            ...prev,
                            assignee_id: value === "unassigned" ? "" : value,
                          }));
                          // Auto-save the assignee change
                          await handleFieldSave("assignee_id");
                        }}
                      >
                        <SelectTrigger className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-neutral-800 dark:border-neutral-600">
                          <SelectItem
                            value="unassigned"
                            className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                          >
                            Unassigned
                          </SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem
                              key={member.id}
                              value={member.id}
                              className="dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                              <div className="flex items-center">
                                <Avatar className="w-4 h-4 mr-1.5">
                                  <AvatarImage
                                    src={member.avatar || undefined}
                                  />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {member.initials}
                                  </AvatarFallback>
                                </Avatar>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => setEditingField("assignee_id")}
                    >
                      <div className="flex items-center space-x-1.5">
                        {task.assignee ? (
                          <>
                            <Avatar className="w-5 h-5 ring-1 ring-neutral-200 dark:ring-neutral-600">
                              <AvatarImage
                                src={task.assignee.avatar || undefined}
                              />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {task.assignee.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium dark:text-neutral-200 text-xs">
                                {task.assignee.name}
                              </p>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                Assigned
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-neutral-400 dark:text-neutral-500" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-600 dark:text-neutral-400 text-xs">
                                Unassigned
                              </p>
                              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                Click to assign
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Story Points */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Story Points
                </Label>
                <div>
                  {editingField === "story_points" ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={editData.story_points}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            story_points: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleFieldSave("story_points");
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFieldSave("story_points")}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                          className="h-6 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => setEditingField("story_points")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <Target className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-medium dark:text-neutral-200 text-xs">
                          {task.story_points || "Not estimated"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                  Due Date
                </Label>
                <div>
                  {editingField === "due_date" ? (
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={editData.due_date}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            due_date: e.target.value,
                          }))
                        }
                        className="border-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleFieldSave("due_date");
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleFieldSave("due_date")}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingField(null)}
                          className="h-6 text-xs dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded p-1 -m-1"
                      onClick={() => setEditingField("due_date")}
                    >
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                          <Calendar className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium dark:text-neutral-200 text-xs">
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString()
                              : "No due date"}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                              {new Date(task.due_date) < new Date()
                                ? "Overdue"
                                : "Upcoming"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-neutral-300 dark:bg-neutral-600" />

              {/* Metadata */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                    Created
                  </Label>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5 text-neutral-400 dark:text-neutral-500" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {formatDate(task.created_at)}
                    </span>
                  </div>
                </div>

                {task.updated_at && (
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold dark:text-neutral-200 uppercase tracking-wider">
                      Last Updated
                    </Label>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-2.5 h-2.5 text-neutral-400 dark:text-neutral-500" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        {formatDate(task.updated_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
