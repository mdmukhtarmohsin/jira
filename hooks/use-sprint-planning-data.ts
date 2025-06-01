"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: "bug" | "story" | "task";
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
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  capacity: number;
}

interface Team {
  id: string;
  name: string;
}

export function useSprintPlanningData() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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

  const fetchBacklogTasks = async (teamId: string) => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      // Get tasks for the selected team
      const { data: tasksData, error: tasksError } = await supabase
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
        .order("priority"); // Order by priority

      if (tasksError) throw new Error("Could not fetch tasks");

      // Get tasks that are already in sprints for this team
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

      // Filter out tasks that are in sprints for this team
      const sprintTaskIdSet = new Set(
        sprintTaskIds?.map((st) => st.task_id) || []
      );
      const backlogTasks = (tasksData || []).filter(
        (task) => !sprintTaskIdSet.has(task.id)
      );

      // Get assignee information for tasks that have assignees
      const tasksWithAssignees = await Promise.all(
        backlogTasks.map(async (task) => {
          let assignee = undefined;

          if (task.assignee_id) {
            const { data: userProfile, error: profileError } = await supabase
              .from("user_profiles")
              .select("id, full_name, avatar_url")
              .eq("id", task.assignee_id)
              .single();

            if (!profileError && userProfile) {
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

          return {
            ...task,
            assignee,
          };
        })
      );

      setBacklogTasks(tasksWithAssignees);
    } catch (error: any) {
      console.error("Error fetching backlog tasks:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    if (!teamId) return;

    try {
      // Get team members
      const { data: teamMembersData, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId);

      if (membersError) throw new Error("Could not fetch team members");

      if (teamMembersData && teamMembersData.length > 0) {
        const userIds = teamMembersData.map((member) => member.user_id);

        // Get user profiles
        const { data: userProfiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) throw new Error("Could not fetch user profiles");

        // For now, we'll assign a default capacity to each team member
        // In a real app, this would come from the database or user input
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
          capacity: 40, // Default capacity in hours per sprint
        }));

        setTeamMembers(members);
      } else {
        setTeamMembers([]);
      }
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
    }
  };

  const createSprint = async (sprintData: {
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    team_id: string;
    tasks: string[];
  }) => {
    try {
      // Create the sprint
      const { data: sprint, error: sprintError } = await supabase
        .from("sprints")
        .insert({
          name: sprintData.name,
          goal: sprintData.goal,
          start_date: sprintData.start_date,
          end_date: sprintData.end_date,
          team_id: sprintData.team_id,
          status: "planning",
        })
        .select()
        .single();

      if (sprintError) {
        console.error("Sprint creation error:", sprintError);
        throw new Error(`Failed to create sprint: ${sprintError.message}`);
      }

      // Add tasks to the sprint if any are selected
      if (sprintData.tasks.length > 0) {
        // First, verify that all tasks exist and belong to the team
        const { data: existingTasks, error: tasksCheckError } = await supabase
          .from("tasks")
          .select("id")
          .eq("team_id", sprintData.team_id)
          .in("id", sprintData.tasks);

        if (tasksCheckError) {
          console.error("Tasks check error:", tasksCheckError);
          throw new Error(`Failed to verify tasks: ${tasksCheckError.message}`);
        }

        const validTaskIds = existingTasks?.map((task) => task.id) || [];

        if (validTaskIds.length !== sprintData.tasks.length) {
          console.warn("Some tasks were not found or don't belong to the team");
        }

        if (validTaskIds.length > 0) {
          const sprintTasks = validTaskIds.map((taskId) => ({
            sprint_id: sprint.id,
            task_id: taskId,
          }));

          const { error: tasksError } = await supabase
            .from("sprint_tasks")
            .insert(sprintTasks);

          if (tasksError) {
            console.error("Sprint tasks insertion error:", tasksError);
            throw new Error(
              `Failed to add tasks to sprint: ${tasksError.message}`
            );
          }

          // Update task status to in_progress for the valid tasks
          const { error: updateError } = await supabase
            .from("tasks")
            .update({ status: "in_progress" })
            .in("id", validTaskIds);

          if (updateError) {
            console.error("Task status update error:", updateError);
            // Don't throw here as the sprint was created successfully
            console.warn("Sprint created but failed to update task status");
          }
        }
      }

      return { success: true, sprintId: sprint.id };
    } catch (error: any) {
      console.error("Error creating sprint:", error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeams();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchBacklogTasks(selectedTeamId);
      fetchTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  return {
    teams,
    selectedTeamId,
    setSelectedTeamId,
    backlogTasks,
    teamMembers,
    loading,
    error,
    createSprint,
    refetch: () => {
      fetchBacklogTasks(selectedTeamId);
      fetchTeamMembers(selectedTeamId);
    },
  };
}
