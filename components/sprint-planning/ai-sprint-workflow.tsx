"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Users, Target, ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  avatar: string | null
  initials: string
  capacity: number
}

interface Team {
  id: string
  name: string
}

interface ParsedTask {
  id: string
  title: string
  description: string
  type: "bug" | "story" | "task"
  priority: "low" | "medium" | "high"
  story_points: number
  isEditing?: boolean
}

interface AiSprintWorkflowProps {
  teams: Team[]
  selectedTeamId: string
  setSelectedTeamId: (teamId: string) => void
  teamMembers: TeamMember[]
  createSprint: (data: any) => Promise<{ success: boolean; error?: string; sprintId?: string }>
  onSprintCreated: () => void
  onCancel: () => void
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
}

const typeColors = {
  story: "bg-blue-100 text-blue-800",
  bug: "bg-red-100 text-red-800",
  task: "bg-gray-100 text-gray-800",
}

export function AiSprintWorkflow({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  teamMembers,
  createSprint,
  onSprintCreated,
  onCancel,
}: AiSprintWorkflowProps) {
  const [step, setStep] = useState<"input" | "review" | "creating">("input")
  const [taskInput, setTaskInput] = useState("")
  const [sprintName, setSprintName] = useState("")
  const [sprintGoal, setSprintGoal] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleGenerateSprintPlan = async () => {
    if (!taskInput.trim() || !selectedTeamId) {
      toast({
        title: "Error",
        description: "Please enter task descriptions and select a team",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Parse tasks from input
      const tasks = parseTasksFromInput(taskInput)

      if (tasks.length === 0) {
        toast({
          title: "Error",
          description: "No valid tasks found in the input",
          variant: "destructive",
        })
        return
      }

      // Calculate team capacity
      const teamCapacity = teamMembers.reduce((sum, member) => sum + member.capacity, 0)

      // Call AI API
      const response = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks,
          teamCapacity,
          sprintDuration: 14, // Default 2 weeks
          useCustomTasks: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate sprint plan")
      }

      const aiSuggestion = await response.json()

      // Set the AI suggestions
      setSprintName(aiSuggestion.sprintName || "AI Generated Sprint")
      setSprintGoal(aiSuggestion.reasoning || "")
      setParsedTasks(tasks)
      setSelectedTasks(tasks.map((t) => t.id))

      // Set default dates (start tomorrow, end in 2 weeks)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const twoWeeksLater = new Date()
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 15)

      setStartDate(tomorrow.toISOString().split("T")[0])
      setEndDate(twoWeeksLater.toISOString().split("T")[0])

      setStep("review")

      toast({
        title: "Success",
        description: "AI sprint plan generated! Review and edit the details below.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const parseTasksFromInput = (input: string): ParsedTask[] => {
    const lines = input.split("\n").filter((line) => line.trim())

    return lines.map((line, index) => {
      // Try to extract priority and points from the line
      const priorityMatch = line.match(/\[(low|medium|high)\]/i)
      const pointsMatch = line.match(/$$(\d+)$$/)
      const typeMatch = line.match(/\{(bug|story|task)\}/i)

      const priority = priorityMatch ? (priorityMatch[1].toLowerCase() as "low" | "medium" | "high") : "medium"
      const points = pointsMatch ? Number.parseInt(pointsMatch[1]) : 3
      const type = typeMatch ? (typeMatch[1].toLowerCase() as "bug" | "story" | "task") : "task"

      // Clean the title
      const title = line
        .replace(/\[(low|medium|high)\]/i, "")
        .replace(/$$\d+$$/, "")
        .replace(/\{(bug|story|task)\}/i, "")
        .trim()

      return {
        id: `ai-task-${index}`,
        title,
        description: `Generated from: ${line}`,
        type,
        priority,
        story_points: points,
      }
    })
  }

  const handleTaskEdit = (taskId: string, field: string, value: any) => {
    setParsedTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)))
  }

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks((prev) => [...prev, taskId])
    } else {
      setSelectedTasks((prev) => prev.filter((id) => id !== taskId))
    }
  }

  const handleRemoveTask = (taskId: string) => {
    setParsedTasks((prev) => prev.filter((task) => task.id !== taskId))
    setSelectedTasks((prev) => prev.filter((id) => id !== taskId))
  }

  const handleAddTask = () => {
    const newTask: ParsedTask = {
      id: `ai-task-${Date.now()}`,
      title: "New Task",
      description: "Task description",
      type: "task",
      priority: "medium",
      story_points: 3,
      isEditing: true,
    }
    setParsedTasks((prev) => [...prev, newTask])
    setSelectedTasks((prev) => [...prev, newTask.id])
  }

  const handleAcceptAndCreateSprint = async () => {
    if (!selectedTeamId || !sprintName || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    setStep("creating")

    try {
      // First create the sprint
      const sprintResult = await createSprint({
        name: sprintName,
        goal: sprintGoal,
        start_date: startDate,
        end_date: endDate,
        team_id: selectedTeamId,
        tasks: [], // We'll add tasks separately
      })

      if (!sprintResult.success) {
        throw new Error(sprintResult.error || "Failed to create sprint")
      }

      // Create tasks and add them to the sprint
      const selectedTasksData = parsedTasks.filter((task) => selectedTasks.includes(task.id))

      for (const task of selectedTasksData) {
        // Create task in database
        const { data: createdTask, error: taskError } = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team_id: selectedTeamId,
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            story_points: task.story_points,
            status: "todo",
          }),
        }).then((res) => res.json())

        if (taskError) {
          console.error("Error creating task:", taskError)
          continue
        }

        // Add task to sprint
        if (createdTask?.id && sprintResult.sprintId) {
          await fetch("/api/sprint-tasks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sprint_id: sprintResult.sprintId,
              task_id: createdTask.id,
            }),
          })
        }
      }

      toast({
        title: "Success",
        description: `Sprint "${sprintName}" created with ${selectedTasksData.length} tasks!`,
      })

      onSprintCreated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      setStep("review")
    } finally {
      setIsCreating(false)
    }
  }

  const totalCapacity = teamMembers.reduce((sum, member) => sum + member.capacity, 0)
  const selectedStoryPoints = selectedTasks.reduce((sum, taskId) => {
    const task = parsedTasks.find((t) => t.id === taskId)
    return sum + (task?.story_points || 0)
  }, 0)

  if (step === "creating") {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel} disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Overview
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Creating Sprint...</h2>
            <p className="text-gray-600">Please wait while we create your sprint and tasks</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Sprint</h3>
            <p className="text-gray-600 text-center">
              Creating sprint "{sprintName}" with {selectedTasks.length} tasks...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "review") {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setStep("input")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Input
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review AI Sprint Plan</h2>
            <p className="text-gray-600">Review and edit the generated sprint details and tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Details</CardTitle>
                <CardDescription>Review and edit the sprint configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sprintName">Sprint Name</Label>
                    <Input id="sprintName" value={sprintName} onChange={(e) => setSprintName(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sprintGoal">Sprint Goal</Label>
                  <Textarea
                    id="sprintGoal"
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Tasks</CardTitle>
                    <CardDescription>Review, edit, and select tasks for your sprint</CardDescription>
                  </div>
                  <Button onClick={handleAddTask} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {parsedTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-3">
                          {task.isEditing ? (
                            <div className="space-y-3">
                              <Input
                                value={task.title}
                                onChange={(e) => handleTaskEdit(task.id, "title", e.target.value)}
                                placeholder="Task title"
                              />
                              <Textarea
                                value={task.description}
                                onChange={(e) => handleTaskEdit(task.id, "description", e.target.value)}
                                placeholder="Task description"
                                rows={2}
                              />
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={task.type}
                                  onValueChange={(value) => handleTaskEdit(task.id, "type", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="story">Story</SelectItem>
                                    <SelectItem value="bug">Bug</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={task.priority}
                                  onValueChange={(value) => handleTaskEdit(task.id, "priority", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={task.story_points}
                                  onChange={(e) =>
                                    handleTaskEdit(task.id, "story_points", Number.parseInt(e.target.value))
                                  }
                                  placeholder="Points"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleTaskEdit(task.id, "isEditing", false)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRemoveTask(task.id)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={typeColors[task.type]}>
                                    {task.type}
                                  </Badge>
                                  <Badge variant="outline" className={priorityColors[task.priority]}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-sm text-gray-500">{task.story_points} pts</span>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTaskEdit(task.id, "isEditing", true)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleRemoveTask(task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Team Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{member.capacity}h</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Capacity</span>
                      <span>{totalCapacity}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Sprint Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Selected Tasks</span>
                    <span className="font-medium">{selectedTasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Story Points</span>
                    <span className="font-medium">{selectedStoryPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Capacity Utilization</span>
                    <span className="font-medium">
                      {totalCapacity ? Math.round((selectedStoryPoints / totalCapacity) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col space-y-3">
              <Button
                className="w-full"
                disabled={!selectedTeamId || !sprintName || !startDate || !endDate || selectedTasks.length === 0}
                onClick={handleAcceptAndCreateSprint}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Accept & Create Sprint
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep("input")}>
                Back to Edit
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Sprint Planner</h2>
          <p className="text-gray-600">Let AI help you create a sprint plan from your task descriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                Task Input
              </CardTitle>
              <CardDescription>
                Paste your task descriptions below. AI will analyze them and create a structured sprint plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskInput">Task Descriptions</Label>
                <Textarea
                  id="taskInput"
                  placeholder={`Enter your tasks, one per line. You can include:
• Priority: [high], [medium], [low]
• Story points: (5), (8), (13)
• Type: {story}, {bug}, {task}

Examples:
Implement user authentication [high] (8) {story}
Fix login button styling [medium] (3) {bug}
Update documentation [low] (2) {task}
Add payment integration
Create dashboard mockups`}
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {taskInput.split("\n").filter((line) => line.trim()).length} tasks detected
                </p>
                <Button onClick={handleGenerateSprintPlan} disabled={isGenerating || !taskInput.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Sprint Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Team Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{member.capacity}h</span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Capacity</span>
                    <span>{totalCapacity}h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Paste Tasks</p>
                  <p className="text-sm text-gray-600">Add your task descriptions with optional metadata</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">AI Analysis</p>
                  <p className="text-sm text-gray-600">AI analyzes and structures your tasks</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Review & Edit</p>
                  <p className="text-sm text-gray-600">Review and customize the generated sprint plan</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Create Sprint</p>
                  <p className="text-sm text-gray-600">Accept the plan to create sprint and tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
