import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sprintId, teamIds } = body;

    // Get current sprint data
    const { data: sprint } = await supabase
      .from("sprints")
      .select("*")
      .eq("id", sprintId)
      .single();

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Get sprint tasks
    const { data: sprintTasks } = await supabase
      .from("sprint_tasks")
      .select(
        `
        tasks!inner(
          id,
          title,
          status,
          priority,
          story_points,
          assignee_id,
          due_date,
          created_at
        )
      `
      )
      .eq("sprint_id", sprintId);

    // Get team members
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .in("team_id", teamIds);

    // Analyze current sprint progress
    const tasks = sprintTasks?.map((st: any) => st.tasks) || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const todoTasks = tasks.filter((task) => task.status === "todo").length;
    const unassignedTasks = tasks.filter((task) => !task.assignee_id).length;

    // Calculate sprint progress
    const totalStoryPoints = tasks.reduce(
      (sum, task) => sum + (task.story_points || 0),
      0
    );
    const completedStoryPoints = tasks
      .filter((task) => task.status === "done")
      .reduce((sum, task) => sum + (task.story_points || 0), 0);

    const progressPercentage =
      totalStoryPoints > 0
        ? (completedStoryPoints / totalStoryPoints) * 100
        : 0;

    // Calculate days elapsed and remaining
    const sprintStart = new Date(sprint.start_date);
    const sprintEnd = new Date(sprint.end_date);
    const today = new Date();
    const totalDays = Math.ceil(
      (sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.ceil(
      (today.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const timeProgressPercentage =
      totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    // Identify risk factors
    const riskFactors: string[] = [];

    if (unassignedTasks > 0) {
      riskFactors.push(`${unassignedTasks} tasks without assignees`);
    }

    if (progressPercentage < timeProgressPercentage - 10) {
      riskFactors.push("Sprint progress behind schedule");
    }

    if (inProgressTasks > totalTasks * 0.5) {
      riskFactors.push("Too many tasks in progress simultaneously");
    }

    // Check for overdue tasks
    const overdueTasks = tasks.filter(
      (task) =>
        task.due_date &&
        new Date(task.due_date) < today &&
        task.status !== "done"
    ).length;

    if (overdueTasks > 0) {
      riskFactors.push(`${overdueTasks} overdue tasks`);
    }

    // Check for holiday periods or weekends
    const daysUntilWeekend = (5 - today.getDay() + 7) % 7;
    if (daysUntilWeekend <= remainingDays && remainingDays <= 7) {
      riskFactors.push("Weekend overlap in remaining sprint time");
    }

    // Calculate completion probability using simple heuristics
    let baseProbability = progressPercentage;

    // Adjust based on time remaining
    if (timeProgressPercentage > 80 && progressPercentage < 60) {
      baseProbability *= 0.7; // Penalize if far behind near end
    } else if (timeProgressPercentage < 50 && progressPercentage > 70) {
      baseProbability = Math.min(95, baseProbability * 1.1); // Bonus if ahead early
    }

    // Adjust for risk factors
    const riskPenalty = Math.min(30, riskFactors.length * 10);
    baseProbability = Math.max(10, baseProbability - riskPenalty);

    // Calculate confidence based on data quality
    const confidence = Math.min(
      95,
      60 + totalTasks * 5 + (teamMembers?.length || 0) * 10
    );

    // Generate burndown prediction
    const burndownPrediction = [];
    const dailyBurnRate = completedStoryPoints / Math.max(1, elapsedDays);

    for (let day = 0; day <= Math.min(remainingDays, 7); day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const predictedRemaining = Math.max(
        0,
        totalStoryPoints - completedStoryPoints - dailyBurnRate * day
      );
      const actualRemaining =
        day === 0 ? totalStoryPoints - completedStoryPoints : 0; // Only current day has actual

      burndownPrediction.push({
        date: date.toISOString().split("T")[0],
        predicted: Math.round(predictedRemaining),
        actual: day === 0 ? Math.round(actualRemaining) : 0,
      });
    }

    // Generate recommended actions
    const recommendedActions: string[] = [];

    if (unassignedTasks > 0) {
      recommendedActions.push(
        "Assign remaining unassigned tasks to team members"
      );
    }

    if (progressPercentage < timeProgressPercentage - 10) {
      recommendedActions.push(
        "Consider reducing sprint scope or extending timeline"
      );
    }

    if (inProgressTasks > totalTasks * 0.5) {
      recommendedActions.push(
        "Focus on completing in-progress tasks before starting new ones"
      );
    }

    if (overdueTasks > 0) {
      recommendedActions.push(
        "Prioritize overdue tasks for immediate attention"
      );
    }

    if (riskFactors.length === 0) {
      recommendedActions.push(
        "Continue with current pace - sprint is on track"
      );
    }

    recommendedActions.push("Schedule daily stand-ups to monitor progress");

    const predictiveAnalytics = {
      sprintCompletion: {
        probability: Math.round(baseProbability),
        confidence: Math.round(confidence),
        riskFactors,
      },
      burndownPrediction,
      recommendedActions,
      additionalMetrics: {
        progressPercentage: Math.round(progressPercentage),
        timeProgressPercentage: Math.round(timeProgressPercentage),
        tasksCompleted: completedTasks,
        totalTasks,
        remainingDays,
      },
    };

    return NextResponse.json(predictiveAnalytics);
  } catch (error) {
    console.error("Error generating predictive analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate predictive analytics" },
      { status: 500 }
    );
  }
}
