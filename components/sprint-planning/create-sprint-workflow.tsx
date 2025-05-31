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
import { Users, Target, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  description: string | null
  type: "bug" | "story" | "task"
  priority: "low" | "medium" | "high"
  story_points: number | null
  assignee_id: string | null
  due_date: string | null
  created_at: string
  assignee?: {
    name: string
    avatar: string | null
    initials: string
  }
}

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

interface CreateSprintWorkflowProps {
  teams: Team[]
  selectedTeamId: string
  setSelectedTeamId: (teamId: string) => void
  backlogTasks: Task[]
  teamMembers: TeamMember[]
  createSprint: (data: any) => Promise<{ success: boolean; error?: string }>
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

export function CreateSprintWorkflow({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  backlogTasks,
  teamMembers,
  createSprint,
  onSprintCreated,
  onCancel,
}: CreateSprintWorkflowProps) {
  const [sprintName, setSprintName] = useState("")
  const [sprintGoal, setSprintGoal] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks((prev) => [...prev, taskId])
    } else {
      setSelectedTasks((prev) => prev.filter((id) => id !== taskId))
    }
  }

  const handleCreateSprint = async () => {
    if (!selectedTeamId || !sprintName || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const result = await createSprint({
        name: sprintName,
        goal: sprintGoal,
        start_date: startDate,
        end_date: endDate,
        team_id: selectedTeamId,
        tasks: selectedTasks,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to create sprint")
      }

      onSprintCreated()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const totalCapacity = teamMembers.reduce((sum, member) => sum + member.capacity, 0)
  const selectedStoryPoints = selectedTasks.reduce((sum, taskId) => {
    const task = backlogTasks.find((t) => t.id === taskId)
    return sum + (task?.story_points || 0)
  }, 0)

  const calculateSprintDuration = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const sprintDuration = calculateSprintDuration()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Overview
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Sprint</h2>
          <p className="text-gray-600">Set up your sprint details and select tasks from the backlog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sprint Configuration</CardTitle>
              <CardDescription>Define the basic parameters for your sprint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="team">Team *</Label>
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
                  <Label htmlFor="sprintName">Sprint Name *</Label>
                  <Input
                    id="sprintName"
                    placeholder="e.g., Sprint 16 - Mobile Features"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprintGoal">Sprint Goal</Label>
                <Textarea
                  id="sprintGoal"
                  placeholder="Describe the main objective and expected outcomes for this sprint..."
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Selection</CardTitle>
              <CardDescription>Choose tasks from your backlog to include in this sprint</CardDescription>
            </CardHeader>
            <CardContent>
              {backlogTasks.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {backlogTasks.map((task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={task.id}
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={task.id} className="cursor-pointer">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className={typeColors[task.type]}>
                              {task.type}
                            </Badge>
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                            {task.story_points && (
                              <span className="text-sm text-gray-500">{task.story_points} pts</span>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks available in the backlog for this team.</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Tasks to Backlog
                  </Button>
                </div>
              )}
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
                  <span className="text-sm text-gray-600">Sprint Duration</span>
                  <span className="font-medium">{sprintDuration} days</span>
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
              disabled={!selectedTeamId || !sprintName || !startDate || !endDate || isCreating}
              onClick={handleCreateSprint}
            >
              {isCreating ? "Creating Sprint..." : "Create Sprint"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
