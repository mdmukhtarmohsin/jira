"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  Kanban,
  Users,
  Settings,
  ChevronDown,
  Plus,
} from "lucide-react";
import Link from "next/link";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Backlog", href: "/dashboard/backlog", icon: ListTodo },
  {
    name: "Sprint Planning",
    href: "/dashboard/sprint-planning",
    icon: Calendar,
  },
  { name: "Kanban Board", href: "/dashboard/kanban", icon: Kanban },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const teams = [
  { name: "Frontend Team", id: "frontend" },
  { name: "Backend Team", id: "backend" },
  { name: "Design Team", id: "design" },
];

export function DashboardSidebar() {
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:block hidden">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Jira Clone AI</h1>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* <div className="mt-8">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => setIsTeamsOpen(!isTeamsOpen)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ChevronDown className={cn("mr-2 h-4 w-4 transition-transform", !isTeamsOpen && "-rotate-90")} />
              Teams
            </button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isTeamsOpen && (
            <ul className="mt-2 space-y-1">
              {teams.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/dashboard/teams/${team.id}`}
                    className="block px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                  >
                    {team.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div> */}
      </nav>
    </div>
  );
}
