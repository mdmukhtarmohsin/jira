"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"

interface ScopeCreepAlert {
  sprintId: string
  sprintName: string
  scopeIncreasePercentage: number
  riskLevel: "low" | "medium" | "high"
  warning: string
  recommendations: string[]
}

interface RiskHeatmapData {
  overloadedMembers: Array<{
    memberId: string
    memberName: string
    taskCount: number
    totalStoryPoints: number
    riskLevel: "high" | "medium" | "low"
    reason: string
  }>
  delayedTasks: Array<{
    taskId: string
    taskTitle: string
    daysOverdue: number
    riskLevel: "high" | "medium" | "low"
  }>
  blockedTasks: Array<{
    taskId: string
    taskTitle: string
    blockingReason: string
    riskLevel: "high" | "medium" | "low"
  }>
  recommendations: string[]
}

export function useAiInsights() {
  const { user } = useAuth()
  const [scopeCreepAlerts, setScopeCreepAlerts] = useState<ScopeCreepAlert[]>([])
  const [riskHeatmap, setRiskHeatmap] = useState<RiskHeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkScopeCreep = async (sprintId: string) => {
    try {
      // Get sprint details
      const { data: sprint } = await supabase
        .from("sprints")
        .select("name, start_date, created_at")
        .eq("id", sprintId)
        .single()

      if (!sprint) return

      // Get all tasks ever added to this sprint
      const { data: allSprintTasks } = await supabase
        .from("sprint_tasks")
        .select(`
          added_at,
          tasks!inner(id, title, story_points)
        `)
        .eq("sprint_id", sprintId)

      if (!allSprintTasks) return

      // Separate original vs added tasks
      const originalTasks = allSprintTasks.filter((st) => new Date(st.added_at) <= new Date(sprint.start_date))
      const currentTasks = allSprintTasks

      // Call AI API for scope analysis
      const response = await fetch("/api/ai/scope-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTasks: originalTasks.map((st) => st.tasks),
          currentTasks: currentTasks.map((st) => st.tasks),
          sprintStartDate: sprint.start_date,
          sprintName: sprint.name,
        }),
      })

      if (response.ok) {
        const scopeData = await response.json()
        if (scopeData.scopeCreepDetected) {
          return {
            sprintId,
            sprintName: sprint.name,
            scopeIncreasePercentage: scopeData.scopeIncreasePercentage,
            riskLevel: scopeData.riskLevel,
            warning: scopeData.warning,
            recommendations: scopeData.recommendations,
          }
        }
      }
    } catch (error) {
      console.error("Error checking scope creep:", error)
    }
    return null
  }

  const generateRiskHeatmap = async () => {
    try {
      // Get user's teams and current tasks
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single()

      if (!orgMember) return

      const { data: teams } = await supabase.from("teams").select("id").eq("organization_id", orgMember.organization_id)

      if (!teams) return

      const teamIds = teams.map((t) => t.id)

      // Get current tasks and team members
      const { data: tasks } = await supabase.from("tasks").select("*").in("team_id", teamIds).neq("status", "done")

      const { data: teamMembers } = await supabase
        .from("team_members")
        .select(`
          user_id,
          user_profiles!inner(id, full_name)
        `)
        .in("team_id", teamIds)

      if (!tasks || !teamMembers) return

      // Call AI API for risk analysis
      const response = await fetch("/api/ai/risk-heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          teamMembers: teamMembers.map((tm) => ({
            id: tm.user_id,
            name: tm.user_profiles.full_name || "Unknown",
          })),
          currentDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const riskData = await response.json()
        setRiskHeatmap(riskData)
      }
    } catch (error) {
      console.error("Error generating risk heatmap:", error)
    }
  }

  const fetchAiInsights = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Get active sprints for scope creep detection
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (orgMember) {
        const { data: teams } = await supabase
          .from("teams")
          .select("id")
          .eq("organization_id", orgMember.organization_id)

        if (teams) {
          const teamIds = teams.map((t) => t.id)

          const { data: activeSprints } = await supabase
            .from("sprints")
            .select("id")
            .in("team_id", teamIds)
            .eq("status", "active")

          // Check scope creep for each active sprint
          const alerts: ScopeCreepAlert[] = []
          if (activeSprints) {
            for (const sprint of activeSprints) {
              const alert = await checkScopeCreep(sprint.id)
              if (alert) {
                alerts.push(alert)
              }
            }
          }
          setScopeCreepAlerts(alerts)
        }
      }

      // Generate risk heatmap
      await generateRiskHeatmap()
    } catch (err: any) {
      console.error("Error fetching AI insights:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAiInsights()
  }, [user])

  return {
    scopeCreepAlerts,
    riskHeatmap,
    loading,
    error,
    refetch: fetchAiInsights,
    checkScopeCreep,
    generateRiskHeatmap,
  }
}
