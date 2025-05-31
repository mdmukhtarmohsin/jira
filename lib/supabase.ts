import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export const supabase = createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          team_id: string
          title: string
          description: string | null
          type: "bug" | "story" | "task"
          status: "todo" | "in_progress" | "review" | "done"
          priority: "low" | "medium" | "high"
          story_points: number | null
          assignee_id: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          description?: string | null
          type: "bug" | "story" | "task"
          status?: "todo" | "in_progress" | "review" | "done"
          priority?: "low" | "medium" | "high"
          story_points?: number | null
          assignee_id?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          description?: string | null
          type?: "bug" | "story" | "task"
          status?: "todo" | "in_progress" | "review" | "done"
          priority?: "low" | "medium" | "high"
          story_points?: number | null
          assignee_id?: string | null
          due_date?: string | null
          created_at?: string
        }
      }
      sprints: {
        Row: {
          id: string
          team_id: string
          name: string
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          start_date?: string
          end_date?: string
          created_at?: string
        }
      }
    }
  }
}
