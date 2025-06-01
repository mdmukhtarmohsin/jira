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
    const { teamIds, timeRange = 30 } = body;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Get sprints data
    const { data: sprints } = await supabase
      .from("sprints")
      .select("id, name, start_date, end_date, status")
      .in("team_id", teamIds)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (!sprints) {
      return NextResponse.json({ error: "No sprints found" }, { status: 404 });
    }

    // Get tasks for these sprints
    const { data: sprintTasks } = await supabase
      .from("sprint_tasks")
      .select(
        `
        sprint_id,
        tasks!inner(
          id,
          title,
          status,
          story_points,
          assignee_id,
          created_at,
          updated_at
        )
      `
      )
      .in(
        "sprint_id",
        sprints.map((s) => s.id)
      );

    // Calculate sprint velocity
    const sprintVelocity = sprints.map((sprint) => {
      const tasks =
        sprintTasks?.filter((st) => st.sprint_id === sprint.id) || [];
      const plannedPoints = tasks.reduce(
        (sum, st: any) => sum + (st.tasks.story_points || 0),
        0
      );
      const completedTasks = tasks.filter(
        (st: any) => st.tasks.status === "done"
      );
      const completedPoints = completedTasks.reduce(
        (sum, st: any) => sum + (st.tasks.story_points || 0),
        0
      );
      const completionRate =
        plannedPoints > 0
          ? Math.round((completedPoints / plannedPoints) * 100)
          : 0;

      return {
        sprintName: sprint.name,
        plannedPoints,
        completedPoints,
        completionRate,
      };
    });

    // Get team members and calculate productivity
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select(
        `
        user_id,
        user_profiles!inner(id, full_name)
      `
      )
      .in("team_id", teamIds);

    const teamProductivity =
      teamMembers?.map((member) => {
        const memberTasks =
          sprintTasks?.filter(
            (st: any) => st.tasks.assignee_id === member.user_id
          ) || [];
        const completedTasks = memberTasks.filter(
          (st: any) => st.tasks.status === "done"
        );

        // Calculate average completion time
        const completionTimes = completedTasks.map((st: any) => {
          const created = new Date(st.tasks.created_at);
          const updated = new Date(st.tasks.updated_at);
          return Math.ceil(
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
        });

        const averageCompletionTime =
          completionTimes.length > 0
            ? Math.round(
                (completionTimes.reduce((sum, time) => sum + time, 0) /
                  completionTimes.length) *
                  10
              ) / 10
            : 0;

        // Simple efficiency calculation based on completion rate and time
        const efficiency =
          completedTasks.length > 0 && averageCompletionTime > 0
            ? Math.min(
                100,
                Math.round((completedTasks.length * 20) / averageCompletionTime)
              )
            : 0;

        return {
          memberName: (member as any).user_profiles.full_name || "Unknown",
          tasksCompleted: completedTasks.length,
          averageCompletionTime,
          efficiency,
        };
      }) || [];

    // Mock quality metrics (in real implementation, these would come from actual data)
    const qualityMetrics = {
      bugRate: Math.random() * 5, // Random between 0-5%
      reworkPercentage: Math.random() * 15, // Random between 0-15%
      customerSatisfaction: 4 + Math.random(), // Random between 4-5
    };

    const performanceMetrics = {
      sprintVelocity,
      teamProductivity,
      qualityMetrics: {
        bugRate: Math.round(qualityMetrics.bugRate * 10) / 10,
        reworkPercentage: Math.round(qualityMetrics.reworkPercentage * 10) / 10,
        customerSatisfaction:
          Math.round(qualityMetrics.customerSatisfaction * 10) / 10,
      },
    };

    return NextResponse.json(performanceMetrics);
  } catch (error) {
    console.error("Error generating performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to generate performance metrics" },
      { status: 500 }
    );
  }
}
