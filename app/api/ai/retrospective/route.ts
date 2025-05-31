import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { sprintData, completedTasks, delayedTasks, blockedTasks } = await request.json()

    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
    Generate a comprehensive sprint retrospective based on the following data:

    Sprint Information:
    ${JSON.stringify(sprintData, null, 2)}

    Completed Tasks (${completedTasks?.length || 0}):
    ${JSON.stringify(completedTasks, null, 2)}

    Delayed Tasks (${delayedTasks?.length || 0}):
    ${JSON.stringify(delayedTasks, null, 2)}

    Blocked Tasks (${blockedTasks?.length || 0}):
    ${JSON.stringify(blockedTasks, null, 2)}

    Generate a retrospective in markdown format with the following structure:

    ## 🟢 What went well
    - List positive outcomes and achievements
    - Focus on completed tasks and successful processes
    - Highlight team collaboration and efficiency wins
    - Note any process improvements that worked

    ## 🔴 What didn't go well
    - List challenges and issues encountered
    - Include delays, blockers, and process problems
    - Identify patterns in task completion issues
    - Note communication or coordination problems

    ## 🛠 Action items for next sprint
    - Provide specific, actionable recommendations
    - Focus on process improvements and preventive measures
    - Suggest workload balancing if needed
    - Recommend tools or practices to adopt

    ## 📊 Sprint metrics
    - Completion rate: X% (completed tasks / total tasks)
    - Average task completion time
    - Story points delivered vs planned
    - Key performance indicators

    Keep it concise but insightful. Focus on actionable insights that can improve future sprints.
    Use data-driven observations and avoid generic advice.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const retrospectiveContent = response.text()

    return NextResponse.json({
      content: retrospectiveContent,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating retrospective:", error)
    return NextResponse.json({ error: "Failed to generate retrospective" }, { status: 500 })
  }
}
