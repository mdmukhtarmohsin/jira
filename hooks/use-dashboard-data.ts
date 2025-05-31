"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"

interface DashboardStats {
  activeSprints: number
  completedTasks: number
  inProgressTasks: number
  blockedTasks: number
}

interface Sprint {
  id: string
  name: string
  team_name: string
  progress: number
  status: string
  end_date: string
  task_count: number
  completed_tasks: number
}

export function useDashboardData() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (orgError) {
        if (orgError.code === "PGRST116") {
          // No organization found - user needs to be set up
          setError("No organization found. Please contact support or create a new account.")
        } else {
          setError("Could not find organization")
        }
        return
      }

      // Get teams in the organization
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", orgMember.organization_id)

      if (teamsError) {
        setError("Could not fetch teams")
        return
      }

      const teamIds = teams.map((team) => team.id)

      if (teamIds.length === 0) {
        // No teams found - show empty state
        setStats({
          activeSprints: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          blockedTasks: 0,
        })
        setSprints([])
        setLoading(false)
        return
      }

      // Fetch sprints with team names
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select(`
          id,
          name,
          end_date,
          status,
          teams!inner(name)
        `)
        .in("team_id", teamIds)
        .order("created_at", { ascending: false })
        .limit(5)

      if (sprintsError) {
        setError("Could not fetch sprints")
        return
      }

      // Fetch tasks for statistics
      const { data: tasks, error: tasksError } = await supabase.from("tasks").select("status").in("team_id", teamIds)

      if (tasksError) {
        setError("Could not fetch tasks")
        return
      }

      // Calculate statistics
      const taskStats = tasks.reduce(
        (acc, task) => {
          switch (task.status) {
            case "done":
              acc.completedTasks++
              break
            case "in_progress":
              acc.inProgressTasks++
              break
            case "todo":
              // For now, we'll consider some todo tasks as potentially blocked
              break
          }
          return acc
        },
        {
          activeSprints: sprintsData.filter((s) => s.status === "active").length,
          completedTasks: 0,
          inProgressTasks: 0,
          blockedTasks: Math.floor(Math.random() * 3), // Simulated for now
        },
      )

      // Process sprints data with task counts
      const processedSprints = await Promise.all(
        sprintsData.map(async (sprint) => {
          // Get task counts for this sprint
          const { data: sprintTasks, error: sprintTasksError } = await supabase
            .from("sprint_tasks")
            .select(`
              task_id,
              tasks!inner(status)
            `)
            .eq("sprint_id", sprint.id)

          if (sprintTasksError) {
            console.error("Error fetching sprint tasks:", sprintTasksError)
            return {
              id: sprint.id,
              name: sprint.name,
              team_name: sprint.teams.name,
              progress: 0,
              status: sprint.status,
              end_date: sprint.end_date,
              task_count: 0,
              completed_tasks: 0,
            }
          }

          const taskCount = sprintTasks?.length || 0
          const completedTasks = sprintTasks?.filter((st) => st.tasks.status === "done").length || 0
          const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0

          return {
            id: sprint.id,
            name: sprint.name,
            team_name: sprint.teams.name,
            progress,
            status: sprint.status,
            end_date: sprint.end_date,
            task_count: taskCount,
            completed_tasks: completedTasks,
          }
        }),
      )

      setStats(taskStats)
      setSprints(processedSprints)
    } catch (err: any) {
      console.error("Dashboard data fetch error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  return {
    stats,
    sprints,
    loading,
    error,
    refetch: fetchDashboardData,
  }
}
