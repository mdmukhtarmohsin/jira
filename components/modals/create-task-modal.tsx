"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
  selectedTeamId?: string
  defaultStatus?: string
}

interface TeamMember {
  id: string
  name: string
  avatar: string | null
  initials: string
}

interface Team {
  id: string
  name: string
}

interface Sprint {
  id: string
  name: string
  status: string
}

export function CreateTaskModal({
  open,
  onOpenChange,
  onTaskCreated,
  selectedTeamId,
  defaultStatus = "todo",
}: CreateTaskModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "task" as "bug" | "story" | "task",
    priority: "medium" as "low" | "medium" | "high",
    status: defaultStatus as "todo" | "in_progress" | "review" | "done",
    story_points: "none",
    team_id: selectedTeamId || "",
    sprint_id: "none",
    assignee_id: "unassigned",
    due_date: "",
  })

  // Fetch teams when modal opens
  useEffect(() => {
    if (open && user) {
      fetchTeams()
    }
  }, [open, user])

  // Fetch team members when team is selected
  useEffect(() => {
    if (formData.team_id) {
      fetchTeamMembers(formData.team_id)
      fetchSprints(formData.team_id)
    }
  }, [formData.team_id])

  const fetchTeams = async () => {
    if (!user) return

    try {
      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (orgError) throw new Error("Could not find organization")

      // Get teams in the organization
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("organization_id", orgMember.organization_id)
        .order("name")

      if (teamsError) throw new Error("Could not fetch teams")

      setTeams(teamsData || [])

      // Set default team if provided
      if (selectedTeamId && teamsData?.find((t) => t.id === selectedTeamId)) {
        setFormData((prev) => ({ ...prev, team_id: selectedTeamId }))
      }

      // After fetching teams, also fetch sprints for the selected team
      const fetchedSprints = async (teamId: string) => {
        try {
          const { data: sprintsData, error: sprintsError } = await supabase
            .from("sprints")
            .select("id, name, status")
            .eq("team_id", teamId)
            .order("created_at", { ascending: false })

          if (sprintsError) throw new Error("Could not fetch sprints")
          setSprints(sprintsData || [])
        } catch (error: any) {
          console.error("Error fetching sprints:", error)
          setSprints([])
        }
      }

      if (selectedTeamId) {
        fetchedSprints(selectedTeamId)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      // Get team members
      const { data: teamMembersData, error: membersError } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)

      if (membersError) throw new Error("Could not fetch team members")

      if (teamMembersData && teamMembersData.length > 0) {
        const userIds = teamMembersData.map((member) => member.user_id)

        // Get user profiles
        const { data: userProfiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds)

        if (profilesError) throw new Error("Could not fetch user profiles")

        const members: TeamMember[] = (userProfiles || []).map((profile) => ({
          id: profile.id,
          name: profile.full_name || "Unknown User",
          avatar: profile.avatar_url || null,
          initials: profile.full_name
            ? profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : "U",
        }))

        setTeamMembers(members)
      } else {
        setTeamMembers([])
      }
    } catch (error: any) {
      console.error("Error fetching team members:", error)
      setTeamMembers([])
    }
  }

  const fetchSprints = async (teamId: string) => {
    try {
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select("id, name, status")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })

      if (sprintsError) throw new Error("Could not fetch sprints")
      setSprints(sprintsData || [])
    } catch (error: any) {
      console.error("Error fetching sprints:", error)
      setSprints([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.title.trim() || !formData.team_id) return

    setLoading(true)

    try {
      const taskData = {
        team_id: formData.team_id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        story_points: formData.story_points === "none" ? null : Number.parseInt(formData.story_points),
        assignee_id: formData.assignee_id === "unassigned" ? null : formData.assignee_id,
        due_date: formData.due_date || null,
      }

      const { data: createdTask, error } = await supabase.from("tasks").insert([taskData]).select().single()

      if (error) throw new Error("Failed to create task")

      // If sprint is selected, add task to sprint
      if (formData.sprint_id !== "none" && createdTask) {
        const { error: sprintError } = await supabase
          .from("sprint_tasks")
          .insert([{ sprint_id: formData.sprint_id, task_id: createdTask.id }])

        if (sprintError) {
          console.error("Failed to add task to sprint:", sprintError)
        }
      }

      toast({
        title: "Success",
        description: `Task "${formData.title}" created successfully!`,
      })

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        type: "task",
        priority: "medium",
        status: defaultStatus,
        story_points: "none",
        team_id: selectedTeamId || "",
        sprint_id: "none",
        assignee_id: "unassigned",
        due_date: "",
      })
      onOpenChange(false)
      onTaskCreated?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  const getSelectedAssignee = () => {
    if (formData.assignee_id === "unassigned") return null
    return teamMembers.find((member) => member.id === formData.assignee_id)
  }

  const typeColors = {
    story: "bg-blue-100 text-blue-800",
    bug: "bg-red-100 text-red-800",
    task: "bg-gray-100 text-gray-800",
  }

  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Add a new task to your team's backlog. Fill in the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Fix login button styling"
                value={formData.title}
                onChange={handleInputChange("title")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task in detail..."
                value={formData.description}
                onChange={handleInputChange("description")}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Team *</Label>
                <Select value={formData.team_id} onValueChange={handleChange("team_id")}>
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

              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={handleChange("type")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={typeColors.task}>
                          Task
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="story">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={typeColors.story}>
                          Story
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="bug">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={typeColors.bug}>
                          Bug
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Sprint (Optional)</Label>
              <Select value={formData.sprint_id} onValueChange={handleChange("sprint_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Sprint (Backlog)</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={handleChange("priority")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={priorityColors.low}>
                          Low
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={priorityColors.medium}>
                          Medium
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={priorityColors.high}>
                          High
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={handleChange("status")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Story Points</Label>
                <Select value={formData.story_points || "none"} onValueChange={handleChange("story_points")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select points">
                      {formData.story_points === "none" ? "No estimate" : formData.story_points}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No estimate</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="13">13</SelectItem>
                    <SelectItem value="21">21</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input type="date" value={formData.due_date} onChange={handleInputChange("due_date")} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select value={formData.assignee_id} onValueChange={handleChange("assignee_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee">
                    {getSelectedAssignee() && (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getSelectedAssignee()?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{getSelectedAssignee()?.initials}</AvatarFallback>
                        </Avatar>
                        <span>{getSelectedAssignee()?.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.team_id}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
