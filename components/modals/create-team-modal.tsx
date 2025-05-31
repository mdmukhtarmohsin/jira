"use client"

import type React from "react"

import { useState } from "react"
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
import { supabase } from "@/lib/auth"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface CreateTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamCreated?: () => void
}

export function CreateTeamModal({ open, onOpenChange, onTeamCreated }: CreateTeamModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    setLoading(true)

    try {
      // Get user's organization
      const { data: orgMember, error: orgError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (orgError) {
        throw new Error("Could not find your organization")
      }

      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            organization_id: orgMember.organization_id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
          },
        ])
        .select()
        .single()

      if (teamError) {
        throw new Error("Failed to create team")
      }

      // Add the current user to the team
      const { error: memberError } = await supabase.from("team_members").insert([
        {
          user_id: user.id,
          team_id: teamData.id,
        },
      ])

      if (memberError) {
        throw new Error("Failed to add you to the team")
      }

      toast({
        title: "Success",
        description: `Team "${formData.name}" created successfully!`,
      })

      // Reset form and close modal
      setFormData({ name: "", description: "" })
      onOpenChange(false)
      onTeamCreated?.()
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

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize your projects and collaborate with team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Frontend Team, Marketing, DevOps"
                value={formData.name}
                onChange={handleChange("name")}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this team does..."
                value={formData.description}
                onChange={handleChange("description")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
