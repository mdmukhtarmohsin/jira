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
  Eye,
  Link,
  GitBranch,
  Bookmark,
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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
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

  const typeIcons = {
    story: "📖",
    bug: "🐛",
    task: "✓",
  };

  const priorityColors = {
    high: "text-red-600 bg-red-50 border-red-200",
    medium: "text-orange-600 bg-orange-50 border-orange-200",
    low: "text-green-600 bg-green-50 border-green-200",
  };

  const statusColors = {
    todo: "text-gray-600 bg-gray-50 border-gray-200",
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
    } catch (error) {
      console.error("Error fetching task data:", error);
    }
  };

  const fetchComments = async () => {
    if (!task) return;

    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          user_profiles(
            full_name,
            avatar_url
          )
        `
        )
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      const formattedComments: Comment[] = (commentsData || []).map(
        (comment: any) => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          user: {
            full_name: comment.user_profiles?.full_name || "Unknown User",
            avatar_url: comment.user_profiles?.avatar_url || null,
            initials: comment.user_profiles?.full_name
              ? comment.user_profiles.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
              : "U",
          },
        })
      );

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const addComment = async () => {
    if (!task || !newComment.trim() || !user) return;

    try {
      const { error } = await supabase.from("comments").insert([
        {
          task_id: task.id,
          user_id: user.id,
          content: newComment.trim(),
        },
      ]);

      if (error) throw error;

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

      setIsEditing(false);
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
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-white">
        <div className="flex h-full max-h-[85vh]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 text-xl">
                    {typeIcons[task.type]}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-bold text-gray-900 mb-1">
                      {isEditing ? (
                        <Input
                          value={editData.title}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="text-xl font-bold border-0 px-0 focus:ring-0 bg-transparent"
                        />
                      ) : (
                        task.title
                      )}
                    </DialogTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <span className="capitalize font-medium">
                          {task.type}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {task.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-8 w-8 rounded-lg hover:bg-gray-100"
                  >
                    {isEditing ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Edit3 className="w-4 h-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-lg hover:bg-gray-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>
                        <Link className="w-4 h-4 mr-2" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Watch
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <div className="w-0.5 h-4 bg-blue-500 rounded-full"></div>
                  <span>Description</span>
                </Label>
                <div>
                  {isEditing ? (
                    <Textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Add a description..."
                      className="min-h-[80px] border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-700 bg-gray-50/50 rounded-lg p-3 min-h-[80px] border border-gray-100">
                      {task.description || (
                        <span className="text-gray-400 italic">
                          No description provided
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <div className="w-0.5 h-4 bg-emerald-500 rounded-full"></div>
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Comments</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  >
                    {comments.length}
                  </Badge>
                </Label>

                {/* Add Comment */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8 ring-1 ring-blue-100">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                        {user?.user_metadata?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[60px] border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none text-sm"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={addComment}
                          disabled={!newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {comments.length > 0 ? (
                  <ScrollArea className="max-h-[400px] pr-2">
                    <div className="space-y-3">
                      {comments.map((comment, index) => (
                        <div key={comment.id} className="relative">
                          {index !== comments.length - 1 && (
                            <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200"></div>
                          )}
                          <div className="flex space-x-3">
                            <Avatar className="h-8 w-8 ring-1 ring-gray-100 relative z-10 bg-white">
                              <AvatarImage
                                src={comment.user.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-600 text-white font-semibold text-xs">
                                {comment.user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900 text-sm">
                                    {comment.user.full_name}
                                  </span>
                                  <time className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </time>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
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
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-sm">
                      No comments yet
                    </p>
                    <p className="text-gray-400 text-xs">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 bg-gradient-to-b from-gray-50 to-gray-100/50 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Status
                </Label>
                <div>
                  {isEditing ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          status: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={`${
                        statusColors[task.status]
                      } border px-2 py-1 text-xs font-medium`}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Priority
                </Label>
                <div>
                  {isEditing ? (
                    <Select
                      value={editData.priority}
                      onValueChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          priority: value as any,
                        }))
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center">
                            <Flag className="w-4 h-4 mr-2 text-green-600" />
                            Low
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center">
                            <Flag className="w-4 h-4 mr-2 text-orange-600" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center">
                            <Flag className="w-4 h-4 mr-2 text-red-600" />
                            High
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      className={`${
                        priorityColors[task.priority]
                      } border px-2 py-1 text-xs font-medium capitalize`}
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Assignee
                </Label>
                <div>
                  {isEditing ? (
                    <Select
                      value={editData.assignee_id || "unassigned"}
                      onValueChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          assignee_id: value === "unassigned" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-8">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center">
                              <Avatar className="w-5 h-5 mr-2">
                                <AvatarImage src={member.avatar || undefined} />
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
                  ) : (
                    <div className="flex items-center space-x-2">
                      {task.assignee ? (
                        <>
                          <Avatar className="w-6 h-6 ring-1 ring-gray-200">
                            <AvatarImage
                              src={task.assignee.avatar || undefined}
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {task.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {task.assignee.name}
                            </p>
                            <p className="text-xs text-gray-500">Assigned</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-500 text-sm">
                              Unassigned
                            </p>
                            <p className="text-xs text-gray-400">No assignee</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Story Points */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Story Points
                </Label>
                <div>
                  {isEditing ? (
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
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-8"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Target className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {task.story_points || "Not estimated"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Due Date
                </Label>
                <div>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.due_date}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 h-8"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString()
                            : "No due date"}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-gray-500">
                            {new Date(task.due_date) < new Date()
                              ? "Overdue"
                              : "Upcoming"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-300" />

              {/* Metadata */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Created
                  </Label>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      {formatDate(task.created_at)}
                    </span>
                  </div>
                </div>

                {task.updated_at && (
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Last Updated
                    </Label>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
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
