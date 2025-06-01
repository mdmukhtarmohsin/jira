"use client";

import { useState } from "react";
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
import {
  Plus,
  Users,
  Calendar,
  Target,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { CreateTeamModal } from "@/components/modals/create-team-modal";
import { useTeamsData } from "@/hooks/use-teams-data";
import Link from "next/link";

export default function TeamsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { teams, loading, error, refetch } = useTeamsData();

  const handleTeamCreated = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-8 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 mx-auto mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold ">Teams</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's teams and members
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Teams
            </h3>
            <p className="text-red-700 text-center mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ">Teams</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's teams and members
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium  mb-2">No Teams Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
              Create your first team to start organizing projects and
              collaborating with team members.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {team.description || "No description"}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold ">{team.memberCount}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Members
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold ">
                      {team.activeSprintCount}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Active Sprints
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold ">
                      {team.completedTasksThisMonth}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tasks Done
                    </p>
                  </div>
                </div>

                {team.currentSprint && (
                  <div>
                    <h4 className="font-medium  mb-2">Current Sprint</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {team.currentSprint}
                        </span>
                        <Badge
                          variant={
                            team.sprintProgress === 100
                              ? "default"
                              : "secondary"
                          }
                        >
                          {team.sprintProgress}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${team.sprintProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium  mb-2">Team Members</h4>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((member, index) => (
                      <Avatar
                        key={index}
                        className="h-8 w-8 border-2 border-white"
                      >
                        <AvatarImage
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                        />
                        <AvatarFallback className="text-xs">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.memberCount > 4 && (
                      <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          +{team.memberCount - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/dashboard/teams/${team.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/teams/${team.id}`}>
                    <Button size="sm" className="flex-1">
                      Manage Team
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <Plus className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-medium  mb-2">Create New Team</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Start collaborating with a new team. Add members and begin your
                first sprint.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Team
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <CreateTeamModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
}
