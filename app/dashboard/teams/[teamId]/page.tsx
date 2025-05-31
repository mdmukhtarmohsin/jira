"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Users,
  Calendar,
  Target,
  Settings,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  joinedAt: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  taskCount: number;
  completedTasks: number;
}

interface TeamDetails {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  members: TeamMember[];
  sprints: Sprint[];
  stats: {
    activeSprints: number;
    completedTasksThisMonth: number;
    totalTasks: number;
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  const fetchTeamDetails = async () => {
    if (!user || !teamId) return;

    setLoading(true);
    setError(null);

    try {
      // Get team basic info
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, name, description, created_at")
        .eq("id", teamId)
        .single();

      if (teamError) {
        setError("Team not found");
        return;
      }

      // Get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select("user_id, joined_at")
        .eq("team_id", teamId);

      if (membersError) {
        console.error("Error fetching team members:", membersError);
      }

      // Get user profiles for team members
      const members: TeamMember[] = [];
      if (teamMembers && teamMembers.length > 0) {
        const userIds = teamMembers.map((member) => member.user_id);

        // Get user profiles
        const { data: userProfiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
        }

        // Get user emails from auth.users (this would need to be done via a function in a real app)
        // For now, we'll use placeholder emails
        if (userProfiles) {
          for (const profile of userProfiles) {
            const memberData = teamMembers.find(
              (m) => m.user_id === profile.id
            );
            members.push({
              id: profile.id,
              name: profile.full_name || "Unknown User",
              email: `user${profile.id.slice(0, 8)}@example.com`, // Placeholder
              avatar: profile.avatar_url || null,
              initials: profile.full_name
                ? profile.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "U",
              joinedAt: memberData?.joined_at || "",
            });
          }
        }
      }

      // Get team sprints
      const { data: sprintsData, error: sprintsError } = await supabase
        .from("sprints")
        .select("id, name, status, start_date, end_date")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (sprintsError) {
        console.error("Error fetching sprints:", sprintsError);
      }

      // Process sprints with task counts
      const sprints: Sprint[] = [];
      if (sprintsData) {
        for (const sprint of sprintsData) {
          // Get task counts for this sprint
          const { data: sprintTasks, error: sprintTasksError } = await supabase
            .from("sprint_tasks")
            .select(
              `
              task_id,
              tasks!inner(status)
            `
            )
            .eq("sprint_id", sprint.id);

          if (sprintTasksError) {
            console.error("Error fetching sprint tasks:", sprintTasksError);
          }

          const taskCount = sprintTasks?.length || 0;
          const completedTasks =
            sprintTasks?.filter((st) => st.tasks.status === "done").length || 0;
          const progress =
            taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

          sprints.push({
            id: sprint.id,
            name: sprint.name,
            status: sprint.status,
            progress,
            startDate: sprint.start_date,
            endDate: sprint.end_date,
            taskCount,
            completedTasks,
          });
        }
      }

      // Get team statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);

      const { data: allTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, status, updated_at")
        .eq("team_id", teamId);

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
      }

      const completedThisMonth =
        allTasks?.filter(
          (task) =>
            task.status === "done" && new Date(task.updated_at) >= thisMonth
        ).length || 0;

      const activeSprints = sprints.filter((s) => s.status === "active").length;

      setTeam({
        id: teamData.id,
        name: teamData.name,
        description: teamData.description,
        createdAt: teamData.created_at,
        memberCount: members.length,
        members,
        sprints,
        stats: {
          activeSprints,
          completedTasksThisMonth: completedThisMonth,
          totalTasks: allTasks?.length || 0,
        },
      });

      setEditForm({
        name: teamData.name,
        description: teamData.description || "",
      });
    } catch (err: any) {
      console.error("Team details fetch error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!team || !editForm.name.trim()) return;

    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        })
        .eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team updated successfully!",
      });

      setIsEditing(false);
      fetchTeamDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${team.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("teams").delete().eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team deleted successfully!",
      });

      router.push("/dashboard/teams");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [user, teamId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Team
            </h3>
            <p className="text-red-700 text-center mb-4">
              {error || "Team not found"}
            </p>
            <div className="flex space-x-3">
              <Button onClick={fetchTeamDetails} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/dashboard/teams">
                <Button>Back to Teams</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Button>
          </Link>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="text-2xl font-bold"
                />
                <Textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Team description..."
                  rows={2}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleUpdateTeam}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold ">{team.name}</h1>
                <p className="text-gray-600">
                  {team.description || "No description"}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchTeamDetails}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteTeam}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.memberCount}</div>
            <p className="text-xs text-gray-600">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sprints
            </CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.stats.activeSprints}</div>
            <p className="text-xs text-gray-600">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks This Month
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {team.stats.completedTasksThisMonth}
            </div>
            <p className="text-xs text-gray-600">Completed tasks</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage team members and their roles
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                        />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Member</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sprints" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Sprints</CardTitle>
                  <CardDescription>
                    View and manage team sprints
                  </CardDescription>
                </div>
                <Link href="/dashboard/sprint-planning">
                  <Button>Create Sprint</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.sprints.length > 0 ? (
                  team.sprints.map((sprint) => (
                    <div key={sprint.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{sprint.name}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(sprint.startDate).toLocaleDateString()} -{" "}
                            {new Date(sprint.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={
                            sprint.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {sprint.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{sprint.progress}%</span>
                        </div>
                        <Progress value={sprint.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {sprint.completedTasks}/{sprint.taskCount} tasks
                            completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No sprints created yet</p>
                    <Link href="/dashboard/sprint-planning">
                      <Button variant="outline" size="sm" className="mt-2">
                        Create First Sprint
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Configure team preferences and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={team.name} disabled />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={team.description || ""} disabled rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-gray-600">
                  {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Team ID</Label>
                <Input value={team.id} disabled />
                <p className="text-xs text-gray-500">
                  Use this ID for integrations and API access
                </p>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete a team, there is no going back. Please be
                  certain.
                </p>
                <Button variant="destructive" onClick={handleDeleteTeam}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
