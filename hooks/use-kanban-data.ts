"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

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
  assignee?: {
    name: string;
    avatar: string | null;
    initials: string;
  };
  isBlocked: boolean;
  isOverdue: boolean;
  commentCount: number;
  sprint?: {
    id: string;
    name: string;
    status: string;
  };
}

interface Team {
  id: string;
  name: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
}

export function useKanbanData() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("all");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (!user) return;

    try {
      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (orgError) throw new Error("Could not find organization");

      // Get teams in the organization
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", orgMember.organization_id)
        .order("name");

      if (teamsError) throw new Error("Could not fetch teams");

      setTeams(teamsData || []);

      // Set default team to first team
      if (teamsData && teamsData.length > 0 && !selectedTeamId) {
        setSelectedTeamId(teamsData[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      setError(error.message);
    }
  };

  const fetchSprints = async (teamId: string) => {
    if (!teamId) return;

    try {
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select("id, name, status")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (sprintsError) throw new Error("Could not fetch sprints");

      setSprints([
        { id: "all", name: "All Tasks", status: "all" },
        { id: "backlog", name: "Backlog (No Sprint)", status: "backlog" },
        ...(sprintsData || []),
      ]);
    } catch (error: any) {
      console.error("Error fetching sprints:", error);
      setSprints([
        { id: "all", name: "All Tasks", status: "all" },
        { id: "backlog", name: "Backlog (No Sprint)", status: "backlog" },
      ]);
    }
  };

  const fetchTasks = async (teamId: string, sprintFilter = "all") => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      let tasksData = [];

      if (sprintFilter === "backlog") {
        // Get tasks not in any sprint FOR THIS TEAM
        const { data: backlogTasks, error: backlogError } = await supabase
          .from("tasks")
          .select(
            `
          id,
          title,
          description,
          type,
          status,
          priority,
          story_points,
          assignee_id,
          due_date,
          created_at
        `
          )
          .eq("team_id", teamId)
          .order("created_at", { ascending: false });

        if (backlogError) throw new Error("Could not fetch backlog tasks");

        // Filter out tasks that are in sprints FOR THIS TEAM ONLY
        const { data: sprintTaskIds, error: sprintTaskError } = await supabase
          .from("sprint_tasks")
          .select(
            `
            task_id,
            sprints!inner(
              id,
              team_id
            )
          `
          )
          .eq("sprints.team_id", teamId);

        if (sprintTaskError) throw new Error("Could not fetch sprint tasks");

        const sprintTaskIdSet = new Set(
          sprintTaskIds?.map((st) => st.task_id) || []
        );
        tasksData = (backlogTasks || []).filter(
          (task) => !sprintTaskIdSet.has(task.id)
        );
      } else if (sprintFilter === "all") {
        // Get all tasks for the team
        const { data: allTasks, error: allTasksError } = await supabase
          .from("tasks")
          .select(
            `
          id,
          title,
          description,
          type,
          status,
          priority,
          story_points,
          assignee_id,
          due_date,
          created_at
        `
          )
          .eq("team_id", teamId)
          .order("created_at", { ascending: false });

        if (allTasksError) throw new Error("Could not fetch all tasks");
        tasksData = allTasks || [];
      } else {
        // Get tasks for specific sprint
        const { data: sprintTasks, error: sprintTasksError } = await supabase
          .from("sprint_tasks")
          .select(
            `
          task_id,
          tasks!inner(
            id,
            title,
            description,
            type,
            status,
            priority,
            story_points,
            assignee_id,
            due_date,
            created_at
          )
        `
          )
          .eq("sprint_id", sprintFilter)
          .eq("tasks.team_id", teamId);

        if (sprintTasksError) throw new Error("Could not fetch sprint tasks");
        tasksData = (sprintTasks || [])
          .map((st: any) => st.tasks)
          .filter(Boolean);
      }

      // Process tasks with assignee, sprint, and comment information
      const tasksWithAssignees = await Promise.all(
        tasksData.map(async (task: any) => {
          let assignee = undefined;
          let sprint = undefined;

          // Get assignee information
          if (task.assignee_id) {
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("id, full_name, avatar_url")
              .eq("id", task.assignee_id)
              .single();

            if (userProfile) {
              assignee = {
                name: userProfile.full_name || "Unknown User",
                avatar: userProfile.avatar_url || null,
                initials: userProfile.full_name
                  ? userProfile.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U",
              };
            }
          }

          // Get sprint information
          const { data: sprintTask } = await supabase
            .from("sprint_tasks")
            .select(
              `
            sprint_id,
            sprints!inner(id, name, status)
          `
            )
            .eq("task_id", task.id)
            .single();

          if (sprintTask && sprintTask.sprints) {
            const sprintData = Array.isArray(sprintTask.sprints)
              ? sprintTask.sprints[0]
              : sprintTask.sprints;
            if (sprintData) {
              sprint = {
                id: sprintData.id,
                name: sprintData.name,
                status: sprintData.status,
              };
            }
          }

          // Get comment count
          const { count: commentCount } = await supabase
            .from("comments")
            .select("id", { count: "exact" })
            .eq("task_id", task.id);

          const isOverdue = task.due_date
            ? new Date(task.due_date) < new Date() && task.status !== "done"
            : false;
          const isBlocked = false;

          return {
            ...task,
            assignee,
            sprint,
            isBlocked,
            isOverdue,
            commentCount: commentCount || 0,
          };
        })
      );

      setTasks(tasksWithAssignees);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus as any } : task
        )
      );

      return { success: true };
    } catch (error: any) {
      console.error("Error updating task status:", error);
      return { success: false, error: error.message };
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchSprints(selectedTeamId);
      fetchTasks(selectedTeamId, selectedSprintId);
    }
  }, [selectedTeamId, selectedSprintId]);

  return {
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
    refetch: () => fetchTasks(selectedTeamId, selectedSprintId),
  };
}
