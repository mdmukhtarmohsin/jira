"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: "planning" | "active" | "completed" | "cancelled";
  created_at: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useEpicsAndLabels(teamId?: string) {
  const { user } = useAuth();
  const [epics, setEpics] = useState<Epic[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpics = async (currentTeamId: string) => {
    if (!currentTeamId) return;

    try {
      const { data: epicsData, error: epicsError } = await supabase
        .from("epics")
        .select("id, title, description, status, created_at")
        .eq("team_id", currentTeamId)
        .order("created_at", { ascending: false });

      if (epicsError) throw new Error("Could not fetch epics");

      setEpics(epicsData || []);
    } catch (error: any) {
      console.error("Error fetching epics:", error);
      setError(error.message);
    }
  };

  const fetchLabels = async (currentTeamId: string) => {
    if (!currentTeamId) return;

    try {
      const { data: labelsData, error: labelsError } = await supabase
        .from("labels")
        .select("id, name, color, created_at")
        .eq("team_id", currentTeamId)
        .order("name");

      if (labelsError) throw new Error("Could not fetch labels");

      setLabels(labelsData || []);
    } catch (error: any) {
      console.error("Error fetching labels:", error);
      setError(error.message);
    }
  };

  const fetchData = async () => {
    if (!teamId || !user) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchEpics(teamId), fetchLabels(teamId)]);
    } catch (error: any) {
      console.error("Error fetching epics and labels:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId, user]);

  return {
    epics,
    labels,
    loading,
    error,
    refetch: fetchData,
  };
}
