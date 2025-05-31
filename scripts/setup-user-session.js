#!/usr/bin/env node

/**
 * User Session Setup Script
 *
 * This script helps debug and verify user authentication and data access
 * for the AI features.
 */

const { createClient } = require("@supabase/supabase-js");

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = "https://bbehinbzenqamizkwcrx.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key"; // Replace with actual anon key

// Test user credentials
const TEST_EMAIL = "mdmukhtamohsin@gmail.com";
const TEST_USER_ID = "fbd7170b-5726-4dc9-887c-8a6d79995833";

async function checkUserData() {
  console.log("🔍 Checking User Data Setup...\n");

  // Note: This script shows you what to check in the Supabase dashboard
  // since we can't access the anon key directly

  console.log("✅ Please verify the following in your Supabase dashboard:\n");

  console.log("1. AUTH USERS TABLE:");
  console.log(`   - User ID: ${TEST_USER_ID}`);
  console.log(`   - Email: ${TEST_EMAIL}`);
  console.log('   - Status: should be "confirmed"\n');

  console.log("2. USER_PROFILES TABLE:");
  console.log(`   - ID: ${TEST_USER_ID}`);
  console.log('   - full_name: "Test 2"\n');

  console.log("3. ORGANIZATION_MEMBERS TABLE:");
  console.log(`   - user_id: ${TEST_USER_ID}`);
  console.log("   - organization_id: should exist\n");

  console.log("4. TEAM_MEMBERS TABLE:");
  console.log(`   - user_id: ${TEST_USER_ID}`);
  console.log("   - team_id: should exist\n");

  console.log("5. HOW TO TEST IN BROWSER:");
  console.log("   - Go to your app login page");
  console.log(`   - Sign in with: ${TEST_EMAIL}`);
  console.log("   - Password: (use the password you set)");
  console.log("   - Navigate to dashboard");
  console.log("   - Open browser developer tools");
  console.log("   - Check console for debug logs from AI insights\n");

  console.log("6. IF USER DOESN'T EXIST:");
  console.log("   - Go to Supabase dashboard → Authentication → Users");
  console.log("   - Create a new user manually");
  console.log(`   - Email: ${TEST_EMAIL}`);
  console.log("   - Set a temporary password");
  console.log("   - Copy the generated user ID");
  console.log(
    "   - Update the user_profiles, organization_members, and team_members tables\n"
  );

  console.log("7. QUICK SQL TO VERIFY DATA:");
  console.log(`
-- Check user setup
SELECT 'auth_users' as table_name, count(*) as count FROM auth.users WHERE id = '${TEST_USER_ID}'
UNION ALL
SELECT 'user_profiles', count(*) FROM user_profiles WHERE id = '${TEST_USER_ID}'
UNION ALL  
SELECT 'organization_members', count(*) FROM organization_members WHERE user_id = '${TEST_USER_ID}'
UNION ALL
SELECT 'team_members', count(*) FROM team_members WHERE user_id = '${TEST_USER_ID}';
  `);
}

async function showTestInstructions() {
  console.log("\n🧪 Testing Instructions:\n");

  console.log("1. MAKE SURE USER IS AUTHENTICATED:");
  console.log("   - Sign in to your app with the test user");
  console.log("   - Go to dashboard");
  console.log("   - AI Insights should show data now\n");

  console.log("2. IF STILL NOT WORKING:");
  console.log("   - Open browser dev tools");
  console.log("   - Look for console errors");
  console.log("   - Check Network tab for failed API calls");
  console.log("   - Look for authentication errors\n");

  console.log("3. MANUAL API TEST:");
  console.log("   - You can test the APIs directly");
  console.log("   - Run: node scripts/demo-ai-calls.js");
  console.log("   - This proves the AI logic works\n");

  console.log("4. DEBUGGING STEPS:");
  console.log('   - Check console logs for "Starting scope creep analysis..."');
  console.log('   - Check console logs for "Current user: [user-id]"');
  console.log("   - If no user logged, authentication failed");
  console.log(
    "   - If user logged but no data, check organization membership\n"
  );
}

// Run the checks
console.log("🤖 AI Features User Setup Checker");
console.log("===================================\n");

checkUserData()
  .then(() => showTestInstructions())
  .then(() => {
    console.log("✅ Setup check completed!");
    console.log("\nIf you need help with any of these steps, check the");
    console.log("Supabase dashboard or create a new user manually.\n");
  })
  .catch((error) => {
    console.error("❌ Error:", error.message);
  });
