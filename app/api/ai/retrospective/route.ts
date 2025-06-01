import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use the same keys as the frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log("=== Retrospective API Called ===");
    const { sprintId } = await request.json();
    console.log("Sprint ID received:", sprintId);

    if (!sprintId) {
      console.log("Error: No sprint ID provided");
      return NextResponse.json(
        { error: "Sprint ID is required" },
        { status: 400 }
      );
    }

    console.log("Checking for existing retrospective...");
    // Check if retrospective already exists
    const { data: existingRetro, error: existingError } = await supabase
      .from("retrospectives")
      .select("id")
      .eq("sprint_id", sprintId)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.log("Error checking existing retrospective:", existingError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingRetro) {
      console.log("Retrospective already exists for sprint:", sprintId);
      return NextResponse.json(
        { error: "Retrospective already exists for this sprint" },
        { status: 409 }
      );
    }

    console.log("Fetching sprint data...");
    // Fetch sprint data
    const { data: sprintData, error: sprintError } = await supabase
      .from("sprints")
      .select("id, name, goal, start_date, end_date, status, team_id")
      .eq("id", sprintId)
      .single();

    if (sprintError) {
      console.log("Error fetching sprint data:", sprintError);
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    if (!sprintData) {
      console.log("No sprint data found for ID:", sprintId);
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    console.log("Sprint data found:", sprintData.name);

    console.log("Fetching sprint tasks...");
    // Fetch all tasks associated with this sprint
    const { data: sprintTasks, error: tasksError } = await supabase
      .from("sprint_tasks")
      .select(
        `
        added_at,
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
          created_at,
          updated_at
        )
      `
      )
      .eq("sprint_id", sprintId);

    if (tasksError) {
      console.error("Error fetching sprint tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch sprint tasks" },
        { status: 500 }
      );
    }

    console.log("Found", sprintTasks?.length || 0, "sprint tasks");

    // Process tasks data
    const allTasks =
      sprintTasks?.map((st: any) => ({
        ...st.tasks,
        added_at: st.added_at,
      })) || [];

    const completedTasks = allTasks.filter((task) => task.status === "done");
    const delayedTasks = allTasks.filter(
      (task) =>
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== "done"
    );
    const blockedTasks = allTasks.filter(
      (task) =>
        task.status === "todo" &&
        new Date(task.created_at) <
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Calculate metrics
    const totalTasks = allTasks.length;
    const completedCount = completedTasks.length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const totalStoryPoints = allTasks.reduce(
      (sum, task) => sum + (task.story_points || 0),
      0
    );
    const completedStoryPoints = completedTasks.reduce(
      (sum, task) => sum + (task.story_points || 0),
      0
    );

    console.log("Task analysis complete:", {
      total: totalTasks,
      completed: completedCount,
      completionRate: completionRate + "%",
    });

    console.log("Generating AI content...");
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    Generate a comprehensive sprint retrospective based on the following data:

    Sprint Information:
    - Name: ${sprintData.name}
    - Goal: ${sprintData.goal || "No specific goal set"}
    - Duration: ${sprintData.start_date} to ${sprintData.end_date}
    - Status: ${sprintData.status}

    Sprint Metrics:
    - Total tasks: ${totalTasks}
    - Completed tasks: ${completedCount}
    - Completion rate: ${completionRate}%
    - Total story points: ${totalStoryPoints}
    - Completed story points: ${completedStoryPoints}
    - Delayed tasks: ${delayedTasks.length}
    - Blocked tasks: ${blockedTasks.length}

    Completed Tasks (${completedTasks.length}):
    ${JSON.stringify(
      completedTasks.map((t) => ({
        title: t.title,
        type: t.type,
        priority: t.priority,
        story_points: t.story_points,
      })),
      null,
      2
    )}

    Delayed Tasks (${delayedTasks.length}):
    ${JSON.stringify(
      delayedTasks.map((t) => ({
        title: t.title,
        due_date: t.due_date,
        status: t.status,
        priority: t.priority,
      })),
      null,
      2
    )}

    Blocked Tasks (${blockedTasks.length}):
    ${JSON.stringify(
      blockedTasks.map((t) => ({
        title: t.title,
        status: t.status,
        created_at: t.created_at,
        priority: t.priority,
      })),
      null,
      2
    )}

    Generate a retrospective in markdown format with the following structure:

    ## 🟢 What went well
    - List positive outcomes and achievements based on completed tasks
    - Focus on successful processes and team collaboration
    - Highlight efficiency wins and goal achievements
    - Note any process improvements that worked

    ## 🔴 What didn't go well
    - List challenges and issues encountered
    - Include specific delays, blockers, and process problems
    - Identify patterns in task completion issues
    - Note communication or coordination problems based on the data

    ## 🛠 Action items for next sprint
    - Provide specific, actionable recommendations based on the data
    - Focus on process improvements and preventive measures
    - Suggest workload balancing if needed based on task distribution
    - Recommend tools or practices to adopt

    ## 📊 Sprint metrics summary
    - Completion rate: ${completionRate}% (${completedCount}/${totalTasks} tasks)
    - Story points delivered: ${completedStoryPoints}/${totalStoryPoints} (${
      totalStoryPoints > 0
        ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
        : 0
    }%)
    - Delayed tasks: ${delayedTasks.length}
    - Blocked tasks: ${blockedTasks.length}

    Keep it concise but insightful. Focus on actionable insights that can improve future sprints.
    Use data-driven observations from the actual task data provided.
    Be specific about what worked and what didn't based on the completion patterns and delays.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const retrospectiveContent = response.text();

    // Save retrospective to database
    const { data: savedRetrospective, error: saveError } = await supabase
      .from("retrospectives")
      .insert({
        sprint_id: sprintId,
        content: retrospectiveContent,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving retrospective:", saveError);
      return NextResponse.json(
        { error: "Failed to save retrospective" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: savedRetrospective.id,
      sprint_id: sprintId,
      content: retrospectiveContent,
      created_at: savedRetrospective.created_at,
    });
  } catch (error) {
    console.error("Error generating retrospective:", error);
    return NextResponse.json(
      { error: "Failed to generate retrospective" },
      { status: 500 }
    );
  }
}
