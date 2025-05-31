import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { tasks, teamCapacity, sprintDuration } = await request.json()

    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
    You are an AI sprint planning assistant. Given the following information, suggest an optimal sprint plan:

    Tasks:
    ${JSON.stringify(tasks, null, 2)}

    Team Capacity: ${teamCapacity} hours total
    Sprint Duration: ${sprintDuration} days

    Please provide a JSON response with the following structure:
    {
      "sprintName": "Suggested sprint name",
      "recommendedTasks": ["task_id_1", "task_id_2"],
      "totalStoryPoints": number,
      "estimatedCompletion": "percentage",
      "workloadDistribution": [
        {
          "memberId": "member_id",
          "tasks": ["task_id"],
          "storyPoints": number
        }
      ],
      "reasoning": "Brief explanation of the recommendation"
    }

    Consider:
    - Task priorities (high priority tasks should be included)
    - Story point estimates vs team capacity
    - Balanced workload distribution
    - Sprint goal alignment
    
    For the sprint name, suggest something descriptive based on the tasks selected, like "Sprint 16 - Authentication & Performance".
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response from the AI
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const aiSuggestion = JSON.parse(jsonMatch[0])

    return NextResponse.json(aiSuggestion)
  } catch (error) {
    console.error("Error generating sprint plan:", error)
    return NextResponse.json({ error: "Failed to generate sprint plan" }, { status: 500 })
  }
}
