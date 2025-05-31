import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sprint_id, task_id } = body

    // Validate required fields
    if (!sprint_id || !task_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Add task to sprint
    const { data: sprintTask, error: sprintTaskError } = await supabase
      .from("sprint_tasks")
      .insert({
        sprint_id,
        task_id,
      })
      .select()
      .single()

    if (sprintTaskError) {
      console.error("Error adding task to sprint:", sprintTaskError)
      return NextResponse.json({ error: "Failed to add task to sprint" }, { status: 500 })
    }

    return NextResponse.json({ data: sprintTask })
  } catch (error) {
    console.error("Error in sprint task creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
