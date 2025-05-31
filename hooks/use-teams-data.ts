"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"

interface Team {
  id: string
  name: string
  description: string | null
  memberCount: number
  activeSprintCount: number
  completedTasksThisMonth: number
  members: Array<{
    name: string
    avatar: string | null
    initials: string
    role: string
  }>
  currentSprint: string | null
  sprintProgress: number
}

export function useTeamsData() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamsData = async () => {
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
        setError("Could not find organization")
        return
      }

      // Get teams in the organization
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .eq("organization_id", orgMember.organization_id)
        .order("created_at", { ascending: false })

      if (teamsError) {
        setError("Could not fetch teams")
        return
      }

      // Process each team to get additional data
      const processedTeams = await Promise.all(
        teamsData.map(async (team) => {
          // Get team members
          const { data: teamMembers, error: membersError } = await supabase
            .from("team_members")
            .select("user_id")
            .eq("team_id", team.id)

          if (membersError) {
            console.error("Error fetching team members:", membersError)
          }

          // Process members data
          const processedMembers = []
          if (teamMembers && teamMembers.length > 0) {
            // Get user profiles for each team member
            const userIds = teamMembers.map((member) => member.user_id)
            const { data: userProfiles, error: profilesError } = await supabase
              .from("user_profiles")
              .select("id, full_name, avatar_url")
              .in("id", userIds)

            if (profilesError) {
              console.error("Error fetching user profiles:", profilesError)
            }

            // Map user profiles to members
            if (userProfiles) {
              for (const profile of userProfiles) {
                processedMembers.push({
                  name: profile.full_name || "Unknown User",
                  avatar: profile.avatar_url || null,
                  initials: profile.full_name
                    ? profile.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "U",
                  role: "Member", // Could be enhanced with actual roles
                })
              }
            }
          }

          // Get active sprints count
          const { data: sprints, error: sprintsError } = await supabase
            .from("sprints")
            .select("id, name, status")
            .eq("team_id", team.id)
            .eq("status", "active")

          if (sprintsError) {
            console.error("Error fetching sprints:", sprintsError)
          }

          // Get completed tasks this month
          const thisMonth = new Date()
          thisMonth.setDate(1)
          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("id")
            .eq("team_id", team.id)
            .eq("status", "done")
            .gte("updated_at", thisMonth.toISOString())

          if (tasksError) {
            console.error("Error fetching tasks:", tasksError)
          }

          const currentSprint = sprints && sprints.length > 0 ? sprints[0].name : null
          const sprintProgress = Math.floor(Math.random() * 100) // Simplified for now

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            memberCount: processedMembers.length,
            activeSprintCount: sprints?.length || 0,
            completedTasksThisMonth: tasks?.length || 0,
            members: processedMembers.slice(0, 4), // Show first 4 members
            currentSprint,
            sprintProgress,
          }
        }),
      )

      setTeams(processedTeams)
    } catch (err: any) {
      console.error("Teams data fetch error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamsData()
  }, [user])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeamsData,
  }
}
