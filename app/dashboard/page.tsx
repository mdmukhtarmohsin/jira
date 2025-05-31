"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import Link from "next/link";

export default function DashboardPage() {
  const { stats, sprints, loading, error, refetch } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-2 animate-pulse"></div>
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
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-red-700 text-center mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Link href="/dashboard/teams">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no teams or data
  if (stats && stats.activeSprints === 0 && sprints.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className="text-gray-600">
            Welcome! Let's get you started with your first project.
          </p>
        </div>

        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium  mb-2">No Projects Yet</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Create your first team and start managing projects with AI-powered
              sprint planning.
            </p>
            <div className="flex space-x-3">
              <Link href="/dashboard/teams">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </Link>
              <Link href="/dashboard/sprint-planning">
                <Button variant="outline">Start Sprint Planning</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Sprints",
      value: stats?.activeSprints.toString() || "0",
      change: "+1 from last week",
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Completed Tasks",
      value: stats?.completedTasks.toString() || "0",
      change: "+12% from last week",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgressTasks.toString() || "0",
      change: "-5% from last week",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Blocked Tasks",
      value: stats?.blockedTasks.toString() || "0",
      change: "+2 from yesterday",
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-600">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Sprint Progress
            </CardTitle>
            <CardDescription>
              Current sprint status across all teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sprints.length > 0 ? (
              sprints.map((sprint) => (
                <div key={sprint.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sprint.name}</p>
                      <p className="text-sm text-gray-600">
                        {sprint.team_name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          sprint.progress === 100 ? "default" : "secondary"
                        }
                      >
                        {sprint.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {sprint.progress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={sprint.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {sprint.completed_tasks}/{sprint.task_count} tasks
                    </span>
                    <span>
                      Due: {new Date(sprint.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active sprints</p>
                <Link href="/dashboard/sprint-planning">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Sprint
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <AiInsightsPanel />
      </div>
    </div>
  );
}
