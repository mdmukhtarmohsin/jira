#!/usr/bin/env node

/**
 * AI Features Demo Script
 *
 * This script demonstrates how to call the AI features programmatically.
 * Run with: node scripts/demo-ai-calls.js
 */

const API_BASE_URL = "http://localhost:3000";

// Test data from our setup
const ACTIVE_SPRINT_ID = "e3fd12f2-bb46-427c-869b-f342b6c85364";
const COMPLETED_SPRINT_ID = "cbeae18a-3645-4a5e-9ef3-b200e01edac3";
const TEST_USER_ID = "fbd7170b-5726-4dc9-887c-8a6d79995833";

// Sample tasks for risk analysis
const riskAnalysisTasks = [
  {
    id: "884256b1-7433-404b-8484-00f9fa754e69",
    title: "Database Backup System",
    status: "todo",
    priority: "high",
    story_points: 8,
    due_date: "2025-05-29",
    assignee_id: TEST_USER_ID,
  },
  {
    id: "fcc9af33-8ba7-4999-bebc-e1d4ab93d81d",
    title: "Critical Payment Integration",
    status: "in_progress",
    priority: "high",
    story_points: 13,
    due_date: "2025-05-30",
    assignee_id: TEST_USER_ID,
  },
  {
    id: "c27b886c-b6e0-4c0d-8988-8d9e7ce799a1",
    title: "Emergency Bug Fix",
    status: "todo",
    priority: "high",
    story_points: 5,
    due_date: "2025-06-01",
    assignee_id: TEST_USER_ID,
  },
];

const teamMembers = [
  {
    id: TEST_USER_ID,
    full_name: "Test 2",
  },
];

// Sample data for retrospective
const retrospectiveData = {
  sprintData: {
    id: COMPLETED_SPRINT_ID,
    name: "AI Test Sprint - Completed",
  },
  completedTasks: [
    { id: "1", title: "User Authentication Flow", status: "done" },
    { id: "2", title: "Dashboard UI Components", status: "done" },
    { id: "3", title: "Database Schema Migration", status: "done" },
  ],
  delayedTasks: [
    { id: "4", title: "API Rate Limiting", status: "in_progress" },
    { id: "5", title: "Email Notification System", status: "todo" },
  ],
  blockedTasks: [
    { id: "6", title: "Documentation Update", status: "todo" },
    { id: "7", title: "Code Review Process", status: "todo" },
  ],
};

async function callRiskHeatmap() {
  console.log("\n🎯 Testing AI Risk Heatmap API...\n");

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/risk-heatmap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sprintId: ACTIVE_SPRINT_ID,
        tasks: riskAnalysisTasks,
        teamMembers: teamMembers,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("📊 Risk Analysis Results:");
    console.log("========================");

    if (data.overloadedMembers?.length > 0) {
      console.log("\n⚠️  OVERLOADED TEAM MEMBERS:");
      data.overloadedMembers.forEach((member) => {
        console.log(
          `   • ${member.memberName}: ${member.totalStoryPoints} story points (${member.taskCount} tasks)`
        );
        console.log(`     Risk Level: ${member.riskLevel.toUpperCase()}`);
        console.log(`     Reason: ${member.reason}\n`);
      });
    }

    if (data.delayedTasks?.length > 0) {
      console.log("\n🚨 DELAYED TASKS:");
      data.delayedTasks.forEach((task) => {
        console.log(`   • ${task.taskTitle}`);
        console.log(`     Risk Level: ${task.riskLevel.toUpperCase()}`);
        console.log(`     Reason: ${task.delayReason}\n`);
      });
    }

    if (data.blockedTasks?.length > 0) {
      console.log("\n🔒 BLOCKED TASKS:");
      data.blockedTasks.forEach((task) => {
        console.log(`   • ${task.taskTitle}`);
        console.log(`     Risk Level: ${task.riskLevel.toUpperCase()}`);
        console.log(`     Blocking Reason: ${task.blockingReason}\n`);
      });
    }

    if (data.recommendations?.length > 0) {
      console.log("\n💡 AI RECOMMENDATIONS:");
      data.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  } catch (error) {
    console.error("❌ Error calling risk heatmap API:", error.message);
  }
}

async function callRetrospective() {
  console.log("\n\n🔍 Testing AI Retrospective API...\n");

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/retrospective`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(retrospectiveData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("📋 Sprint Retrospective:");
    console.log("========================");
    console.log(data.content);
    console.log("\n⏰ Generated at:", data.generatedAt);
  } catch (error) {
    console.error("❌ Error calling retrospective API:", error.message);
  }
}

async function testAIFeatures() {
  console.log("🤖 AI Features Demo Script");
  console.log("===========================");
  console.log("Testing the AI capabilities of your Jira clone...");

  // Test both AI features
  await callRiskHeatmap();
  await callRetrospective();

  console.log("\n\n✅ Demo completed! The AI features are working correctly.");
  console.log("\n📖 Next steps:");
  console.log("   1. Check your dashboard for live AI insights");
  console.log("   2. Review the test data in your Supabase database");
  console.log("   3. Integrate these APIs into your frontend components");
  console.log("   4. Customize the AI logic for your specific needs");
}

// Check if we're running as a script
if (require.main === module) {
  testAIFeatures().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

module.exports = {
  callRiskHeatmap,
  callRetrospective,
  testAIFeatures,
};
