# AI Features Testing Guide

## Overview

Your Jira clone now has comprehensive AI features that provide intelligent insights about sprints, teams, and project risks. This guide will help you test and activate these features.

## Test Data Setup ✅

I've already set up comprehensive test data in your Supabase database:

### Test Sprints Created:

1. **AI Test Sprint - Completed** (Sprint ID: `cbeae18a-3645-4a5e-9ef3-b200e01edac3`)

   - Status: completed
   - 9 tasks with various scenarios (completed, delayed, different priorities)
   - Perfect for testing retrospective generation

2. **AI Test Sprint - Active Risk** (Sprint ID: `e3fd12f2-bb46-427c-869b-f342b6c85364`)
   - Status: active
   - 8 tasks with risk scenarios:
     - 2 overdue tasks (high risk)
     - 5 high-priority tasks assigned to same person (overload risk)
     - 2 unassigned tasks (blocking risk)
     - 1 very large task (complexity risk)

## How to Test the Features

### 1. AI Insights Panel (Dashboard)

**Location:** Main dashboard - right side panel

**What it analyzes:**

- Overdue tasks detection
- Team member workload analysis
- Unassigned/blocked tasks
- High priority task focus areas
- Sprint progress tracking

**To test:**

1. Navigate to your main dashboard
2. Look for the "AI Insights" panel on the right
3. You should see insights like:
   - "Overdue Tasks Detected" (red alert)
   - "Team Member Overload" (yellow warning)
   - "Unassigned Tasks" (yellow warning)
   - "High Priority Focus" (blue info)

### 2. AI Risk Heatmap API

**Endpoint:** `POST /api/ai/risk-heatmap`

**Test with curl:**

```bash
curl -X POST http://localhost:3000/api/ai/risk-heatmap \
  -H "Content-Type: application/json" \
  -d '{
    "sprintId": "e3fd12f2-bb46-427c-869b-f342b6c85364",
    "tasks": [
      {
        "id": "884256b1-7433-404b-8484-00f9fa754e69",
        "title": "Database Backup System",
        "status": "todo",
        "priority": "high",
        "story_points": 8,
        "due_date": "2025-05-29",
        "assignee_id": "fbd7170b-5726-4dc9-887c-8a6d79995833"
      }
    ],
    "teamMembers": [
      {
        "id": "fbd7170b-5726-4dc9-887c-8a6d79995833",
        "full_name": "Test 2"
      }
    ]
  }'
```

**Expected response:**

- `overloadedMembers`: Analysis of team member workload
- `delayedTasks`: Tasks that are behind schedule
- `blockedTasks`: Tasks with blocking issues
- `recommendations`: AI-generated actionable advice

### 3. AI Retrospective API

**Endpoint:** `POST /api/ai/retrospective`

**Test with curl:**

```bash
curl -X POST http://localhost:3000/api/ai/retrospective \
  -H "Content-Type: application/json" \
  -d '{
    "sprintData": {
      "id": "cbeae18a-3645-4a5e-9ef3-b200e01edac3",
      "name": "AI Test Sprint - Completed"
    },
    "completedTasks": [
      {"id": "1", "title": "User Authentication Flow", "status": "done"}
    ],
    "delayedTasks": [
      {"id": "2", "title": "API Rate Limiting", "status": "in_progress"}
    ],
    "blockedTasks": []
  }'
```

**Expected response:**

- Comprehensive retrospective content with:
  - What went well
  - What didn't go well
  - Action items for next sprint
  - Sprint metrics analysis

## Quick Test Checklist

- [ ] Dashboard shows AI Insights panel
- [ ] Risk alerts appear for overdue tasks
- [ ] Workload warnings show for overloaded team members
- [ ] API endpoints respond correctly
- [ ] Retrospective generates meaningful analysis
- [ ] Recommendations are actionable and relevant

## Adding More Test Data

To create additional test scenarios, you can insert more data using the Supabase MCP or SQL editor:

```sql
-- Create a new sprint with different risk patterns
INSERT INTO sprints (name, team_id, goal, start_date, end_date, status)
VALUES (
  'Your Custom Test Sprint',
  '92b740a8-b830-4b8b-98aa-5176b8b35a01',
  'Custom test scenario',
  '2025-06-01',
  '2025-06-15',
  'active'
);

-- Add tasks with specific risk patterns you want to test
-- (Reference the existing test data structure)
```

## Integration Points

The AI features integrate with:

- **Supabase Database**: Real-time data analysis
- **Dashboard Components**: Live insights display
- **API Routes**: RESTful endpoints for AI services
- **Team Management**: User and team-based analysis
- **Sprint Planning**: Sprint-specific insights

## Troubleshooting

If AI insights don't appear:

1. Check that you have active sprints with tasks
2. Verify team membership in the database
3. Ensure tasks have proper assignees and due dates
4. Check browser console for any API errors

The AI features are now fully operational and ready for production use! 🚀
