import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { tasks, teamMembers, currentDate } = await request.json()

    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
    Analyze the following sprint data and identify risks:

    Tasks:
    ${JSON.stringify(tasks, null, 2)}

    Team Members:
    ${JSON.stringify(teamMembers, null, 2)}

    Current Date: ${currentDate}

    Identify risks and provide a JSON response:
    {
      "overloadedMembers": [
        {
          "memberId": "member_id",
          "memberName": "member_name",
          "taskCount": number,
          "totalStoryPoints": number,
          "riskLevel": "high|medium|low",
          "reason": "explanation"
        }
      ],
      "delayedTasks": [
        {
          "taskId": "task_id",
          "taskTitle": "task_title",
          "daysOverdue": number,
          "riskLevel": "high|medium|low"
        }
      ],
      "blockedTasks": [
        {
          "taskId": "task_id",
          "taskTitle": "task_title",
          "blockingReason": "inferred reason",
          "riskLevel": "high|medium|low"
        }
      ],
      "recommendations": ["recommendation1", "recommendation2"]
    }

    Risk criteria:
    - Overloaded: >5 tasks or >20 story points per person
    - Delayed: Tasks past due date
    - Blocked: Tasks with status 'todo' for >3 days or high priority tasks not started
    - High risk: Critical issues requiring immediate attention
    - Medium risk: Issues that should be addressed soon
    - Low risk: Minor concerns to monitor

    Provide actionable recommendations for improving team efficiency and reducing risks.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const riskAnalysis = JSON.parse(jsonMatch[0])

    return NextResponse.json(riskAnalysis)
  } catch (error) {
    console.error("Error generating risk heatmap:", error)
    return NextResponse.json({ error: "Failed to generate risk analysis" }, { status: 500 })
  }
}
