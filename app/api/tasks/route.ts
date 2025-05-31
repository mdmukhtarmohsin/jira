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
    const { team_id, title, description, type, priority, story_points, status } = body

    // Validate required fields
    if (!team_id || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        team_id,
        title,
        description: description || null,
        type: type || "task",
        priority: priority || "medium",
        story_points: story_points || null,
        status: status || "todo",
      })
      .select()
      .single()

    if (taskError) {
      console.error("Error creating task:", taskError)
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
    }

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error("Error in task creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
