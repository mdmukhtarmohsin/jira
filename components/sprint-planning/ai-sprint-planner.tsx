"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Check, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  type: "bug" | "story" | "task"
  priority: "low" | "medium" | "high"
  story_points: number | null
}

interface TeamMember {
  id: string
  name: string
  capacity: number
}

interface AISuggestion {
  sprintName: string
  recommendedTasks: string[]
  totalStoryPoints: number
  estimatedCompletion: string
  workloadDistribution: {
    memberId: string
    tasks: string[]
    storyPoints: number
  }[]
  reasoning: string
  usedCustomTasks?: boolean
  customTasksText?: string
}

interface AiSprintPlannerProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  sprintDuration: number
  onSuggestionAccepted: (suggestion: AISuggestion) => void
}

export function AiSprintPlanner({ tasks, teamMembers, sprintDuration, onSuggestionAccepted }: AiSprintPlannerProps) {
  const [customTasks, setCustomTasks] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)

  const handleGeneratePlan = async () => {
    setIsGenerating(true)

    try {
      // Prepare data for the AI
      let tasksForAI
      let useCustomTasks = false

      if (customTasks.trim()) {
        tasksForAI = parseCustomTasks(customTasks)
        useCustomTasks = true
      } else {
        tasksForAI = tasks.map((task) => ({
          id: task.id,
          title: task.title,
          type: task.type,
          priority: task.priority,
          story_points: task.story_points || 0,
        }))
      }

      if (tasksForAI.length === 0) {
        toast({
          title: "Error",
          description: "No tasks available for planning. Please add tasks to your backlog or paste custom tasks.",
          variant: "destructive",
        })
        return
      }

      // Calculate total team capacity
      const teamCapacity = teamMembers.reduce((sum, member) => sum + member.capacity, 0)

      if (teamCapacity === 0) {
        toast({
          title: "Error",
          description: "No team capacity available. Please ensure team members are assigned.",
          variant: "destructive",
        })
        return
      }

      // Call the AI API
      const response = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: tasksForAI,
          teamCapacity,
          sprintDuration,
          useCustomTasks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate sprint plan")
      }

      const suggestion = await response.json()

      // Store whether we used custom tasks for later reference
      suggestion.usedCustomTasks = useCustomTasks
      suggestion.customTasksText = useCustomTasks ? customTasks : ""

      setAiSuggestion(suggestion)

      toast({
        title: "Success",
        description: "AI sprint plan generated successfully!",
      })
    } catch (error: any) {
      console.error("Error generating sprint plan:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate sprint plan",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Parse custom tasks pasted by the user
  const parseCustomTasks = (text: string) => {
    // Simple parsing - each line is a task
    const lines = text.split("\n").filter((line) => line.trim())

    return lines.map((line, index) => {
      // Try to extract priority and points from the line
      // Format could be: Task title [high] (5)
      const priorityMatch = line.match(/\[(low|medium|high)\]/i)
      const pointsMatch = line.match(/$$(\d+)$$/)

      const priority = priorityMatch ? (priorityMatch[1].toLowerCase() as "low" | "medium" | "high") : "medium"
      const points = pointsMatch ? Number.parseInt(pointsMatch[1]) : 3

      // Clean the title
      const title = line
        .replace(/\[(low|medium|high)\]/i, "")
        .replace(/$$\d+$$/, "")
        .trim()

      return {
        id: `custom-${index}`,
        title,
        type: "task" as const,
        priority,
        story_points: points,
      }
    })
  }

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      // If custom tasks were used, we need to populate the custom tasks field
      if (aiSuggestion.usedCustomTasks) {
        // For custom tasks, we'll pass the suggestion with the custom tasks text
        onSuggestionAccepted({
          ...aiSuggestion,
          customTasksText: aiSuggestion.customTasksText || customTasks,
        })
      } else {
        // For existing tasks, pass the recommended task IDs
        onSuggestionAccepted(aiSuggestion)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
              AI Sprint Planner
            </CardTitle>
            <CardDescription>
              Let AI suggest an optimal sprint plan based on your tasks and team capacity
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!aiSuggestion ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                You can paste your own tasks or use the tasks from your backlog. Each line should be a task. Optionally
                include priority [high/medium/low] and story points (5).
              </p>
              <Textarea
                placeholder="Task 1 [high] (5)&#10;Task 2 [medium] (3)&#10;Task 3 [low] (2)"
                value={customTasks}
                onChange={(e) => setCustomTasks(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-gray-500">Example: "Implement login page [high] (5)"</p>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">
                  Team capacity: {teamMembers.reduce((sum, m) => sum + m.capacity, 0)} hours
                </p>
                <p className="text-sm font-medium">
                  Available tasks: {customTasks ? parseCustomTasks(customTasks).length : tasks.length}
                </p>
              </div>
              <Button onClick={handleGeneratePlan} disabled={isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Sprint Plan"}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-blue-900">Recommended Sprint</h3>
              <p className="text-blue-700">{aiSuggestion.sprintName}</p>
            </div>

            <div>
              <h3 className="font-medium text-blue-900">Tasks ({aiSuggestion.recommendedTasks.length})</h3>
              <p className="text-blue-700">{aiSuggestion.totalStoryPoints} story points</p>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {aiSuggestion.usedCustomTasks
                  ? // Show custom tasks from the AI reasoning or original text
                    parseCustomTasks(aiSuggestion.customTasksText || customTasks).map((task, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{task.title}</span>
                        <Badge variant="outline" className="ml-auto">
                          {task.story_points || 0} pts
                        </Badge>
                      </div>
                    ))
                  : // Show existing tasks
                    aiSuggestion.recommendedTasks.map((taskId) => {
                      const task = tasks.find((t) => t.id === taskId)
                      return task ? (
                        <div key={taskId} className="flex items-center space-x-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{task.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            {task.story_points || 0} pts
                          </Badge>
                        </div>
                      ) : null
                    })}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-blue-900">Workload Distribution</h3>
              <div className="mt-2 space-y-2">
                {aiSuggestion.workloadDistribution.map((assignment, index) => {
                  const member = teamMembers.find((m) => m.id === assignment.memberId)
                  return (
                    <div key={index} className="text-sm">
                      <p className="font-medium">
                        {member?.name || "Team member"}: {assignment.storyPoints} points
                      </p>
                      <p className="text-gray-600">{assignment.tasks.length} tasks assigned</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-blue-900">AI Reasoning</h3>
              <p className="text-sm text-gray-700">{aiSuggestion.reasoning}</p>
            </div>

            <div className="flex space-x-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleAcceptSuggestion}>
                Accept Suggestion
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setAiSuggestion(null)}>
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
