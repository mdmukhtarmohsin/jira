import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./supabase"

export const supabase = createClientComponentClient<Database>()

export async function signUp(email: string, password: string, fullName: string, organizationName: string) {
  try {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) throw authError

    if (authData.user) {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert([{ name: organizationName }])
        .select()
        .single()

      if (orgError) throw orgError

      // Add user to organization as admin
      const { error: memberError } = await supabase.from("organization_members").insert([
        {
          user_id: authData.user.id,
          organization_id: orgData.id,
          role: "admin",
        },
      ])

      if (memberError) throw memberError

      // Create user profile
      const { error: profileError } = await supabase.from("user_profiles").insert([
        {
          id: authData.user.id,
          full_name: fullName,
        },
      ])

      if (profileError) throw profileError

      // Create sample teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .insert([
          {
            organization_id: orgData.id,
            name: "Frontend Team",
            description: "Responsible for user interface development",
          },
          {
            organization_id: orgData.id,
            name: "Backend Team",
            description: "API and database development",
          },
          {
            organization_id: orgData.id,
            name: "Design Team",
            description: "User experience and visual design",
          },
        ])
        .select()

      if (teamsError) throw teamsError

      // Add user to all teams
      const teamMemberships = teamsData.map((team) => ({
        user_id: authData.user.id,
        team_id: team.id,
      }))

      const { error: teamMemberError } = await supabase.from("team_members").insert(teamMemberships)

      if (teamMemberError) throw teamMemberError

      // Create sample sprints and tasks
      const sampleSprints = [
        {
          team_id: teamsData[0].id, // Frontend team
          name: "Sprint 15 - Mobile App",
          goal: "Improve mobile responsiveness and user experience",
          start_date: "2025-01-01",
          end_date: "2025-01-15",
          status: "active",
        },
        {
          team_id: teamsData[1].id, // Backend team
          name: "Sprint 14 - API Integration",
          goal: "Complete API endpoints and database optimization",
          start_date: "2025-01-01",
          end_date: "2025-01-15",
          status: "active",
        },
        {
          team_id: teamsData[2].id, // Design team
          name: "Sprint 13 - Design System",
          goal: "Finalize design components and style guide",
          start_date: "2024-12-15",
          end_date: "2024-12-31",
          status: "completed",
        },
      ]

      const { data: sprintsData, error: sprintsError } = await supabase.from("sprints").insert(sampleSprints).select()

      if (sprintsError) throw sprintsError

      // Create sample tasks
      const sampleTasks = [
        {
          team_id: teamsData[0].id,
          title: "Implement user authentication",
          description: "Add login and signup functionality with OAuth support",
          type: "story",
          status: "in_progress",
          priority: "high",
          story_points: 8,
          assignee_id: authData.user.id,
        },
        {
          team_id: teamsData[0].id,
          title: "Fix mobile responsive issues",
          description: "Dashboard not displaying correctly on mobile devices",
          type: "bug",
          status: "todo",
          priority: "medium",
          story_points: 3,
        },
        {
          team_id: teamsData[1].id,
          title: "API documentation",
          description: "Create comprehensive API documentation with examples",
          type: "task",
          status: "done",
          priority: "low",
          story_points: 5,
          assignee_id: authData.user.id,
        },
        {
          team_id: teamsData[1].id,
          title: "Setup CI/CD pipeline",
          description: "Configure automated testing and deployment",
          type: "task",
          status: "done",
          priority: "high",
          story_points: 13,
        },
        {
          team_id: teamsData[2].id,
          title: "Design system components",
          description: "Create reusable UI components and design tokens",
          type: "story",
          status: "done",
          priority: "medium",
          story_points: 8,
          assignee_id: authData.user.id,
        },
        {
          team_id: teamsData[0].id,
          title: "Database optimization",
          description: "Optimize slow database queries and add indexes",
          type: "task",
          status: "todo",
          priority: "medium",
          story_points: 5,
        },
      ]

      const { data: tasksData, error: tasksError } = await supabase.from("tasks").insert(sampleTasks).select()

      if (tasksError) throw tasksError

      // Link tasks to sprints
      const sprintTasks = [
        { sprint_id: sprintsData[0].id, task_id: tasksData[0].id }, // Frontend sprint
        { sprint_id: sprintsData[0].id, task_id: tasksData[1].id },
        { sprint_id: sprintsData[0].id, task_id: tasksData[5].id },
        { sprint_id: sprintsData[1].id, task_id: tasksData[2].id }, // Backend sprint
        { sprint_id: sprintsData[1].id, task_id: tasksData[3].id },
        { sprint_id: sprintsData[2].id, task_id: tasksData[4].id }, // Design sprint
      ]

      const { error: sprintTasksError } = await supabase.from("sprint_tasks").insert(sprintTasks)

      if (sprintTasksError) throw sprintTasksError
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserOrganization(userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        created_at
      )
    `)
    .eq("user_id", userId)
    .single()

  return { data, error }
}
