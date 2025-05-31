import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { originalTasks, currentTasks, sprintStartDate, sprintName } = await request.json()

    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
    Analyze scope creep in this sprint:

    Sprint Name: ${sprintName}
    Sprint Start Date: ${sprintStartDate}

    Original Sprint Tasks (at start):
    ${JSON.stringify(originalTasks, null, 2)}

    Current Sprint Tasks:
    ${JSON.stringify(currentTasks, null, 2)}

    Analyze and provide a JSON response:
    {
      "scopeCreepDetected": boolean,
      "scopeIncreasePercentage": number,
      "addedTasks": [
        {
          "taskId": "task_id",
          "taskTitle": "task_title",
          "storyPoints": number,
          "addedDate": "date"
        }
      ],
      "removedTasks": [
        {
          "taskId": "task_id", 
          "taskTitle": "task_title",
          "storyPoints": number
        }
      ],
      "originalStoryPoints": number,
      "currentStoryPoints": number,
      "netStoryPointsChange": number,
      "riskLevel": "low|medium|high",
      "recommendations": ["recommendation1", "recommendation2"],
      "warning": "Warning message if scope creep > 15%",
      "impactAssessment": "Assessment of how scope changes affect sprint goals"
    }

    Criteria:
    - Scope creep detected if story points increased by >15%
    - High risk if >25% increase
    - Medium risk if 15-25% increase  
    - Low risk if <15% increase
    - Consider both additions and removals
    - Assess impact on sprint goals and team capacity
    - Provide specific recommendations for managing scope

    Focus on actionable insights for sprint management and future planning.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const scopeAnalysis = JSON.parse(jsonMatch[0])

    return NextResponse.json(scopeAnalysis)
  } catch (error) {
    console.error("Error checking scope creep:", error)
    return NextResponse.json({ error: "Failed to analyze scope creep" }, { status: 500 })
  }
}
