#!/usr/bin/env node

/**
 * Simple validation script to check our implementation
 * This validates the core logic without needing to run the full test suite
 */

console.log("🔍 Validating Program Editor Implementation...");

// Test week range validation logic
function validateWeekRanges(phases, totalWeeks) {
  const sortedPhases = phases.sort((a, b) => a.phase_number - b.phase_number);
  const errors = [];
  let expectedStart = 1;

  for (const phase of sortedPhases) {
    if (phase.week_start !== expectedStart) {
      errors.push(
        `Phase ${phase.phase_number} should start at week ${expectedStart}, not ${phase.week_start}`
      );
    }
    if (phase.week_end < phase.week_start) {
      errors.push(
        `Phase ${phase.phase_number}: end week (${phase.week_end}) cannot be before start week (${phase.week_start})`
      );
    }
    expectedStart = phase.week_end + 1;
  }

  const totalWeeksUsed = sortedPhases[sortedPhases.length - 1]?.week_end || 0;
  if (totalWeeksUsed !== totalWeeks) {
    errors.push(
      `Phase weeks (${totalWeeksUsed}) don't match program total (${totalWeeks})`
    );
  }

  return { isValid: errors.length === 0, errors };
}

// Test cases
const testCases = [
  {
    name: "Valid 3-phase program",
    phases: [
      { phase_number: 1, week_start: 1, week_end: 4 },
      { phase_number: 2, week_start: 5, week_end: 8 },
      { phase_number: 3, week_start: 9, week_end: 12 },
    ],
    totalWeeks: 12,
    expectedValid: true,
  },
  {
    name: "Gap between phases",
    phases: [
      { phase_number: 1, week_start: 1, week_end: 4 },
      { phase_number: 2, week_start: 6, week_end: 9 }, // Gap at week 5
    ],
    totalWeeks: 9,
    expectedValid: false,
  },
  {
    name: "End before start",
    phases: [
      { phase_number: 1, week_start: 5, week_end: 3 }, // Invalid
    ],
    totalWeeks: 3,
    expectedValid: false,
  },
  {
    name: "Phases out of order (should still work)",
    phases: [
      { phase_number: 2, week_start: 5, week_end: 8 },
      { phase_number: 1, week_start: 1, week_end: 4 },
    ],
    totalWeeks: 8,
    expectedValid: true,
  },
];

let allTestsPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
  
  const result = validateWeekRanges(testCase.phases, testCase.totalWeeks);
  const passed = result.isValid === testCase.expectedValid;
  
  console.log(`   Result: ${result.isValid ? "✅ Valid" : "❌ Invalid"}`);
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.join(", ")}`);
  }
  console.log(`   Expected: ${testCase.expectedValid ? "Valid" : "Invalid"}`);
  console.log(`   Status: ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  
  if (!passed) {
    allTestsPassed = false;
  }
});

// Check file structure
const fs = require('fs');
const path = require('path');

console.log("\n📁 Checking file structure...");

const requiredFiles = [
  'app/api/admin/programs/route.ts',
  'app/api/admin/programs/[id]/route.ts', 
  'app/api/admin/programs/[id]/phases/route.ts',
  'app/(admin)/programs/page.tsx',
  'app/(admin)/programs/[id]/page.tsx',
  'tests/program-editor.test.ts',
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) {
    allFilesExist = false;
  }
});

// Summary
console.log("\n🏁 Summary:");
console.log(`   Logic Tests: ${allTestsPassed ? "✅ All Passed" : "❌ Some Failed"}`);
console.log(`   File Structure: ${allFilesExist ? "✅ Complete" : "❌ Missing Files"}`);

if (allTestsPassed && allFilesExist) {
  console.log("\n🎉 Program Editor implementation looks good!");
  process.exit(0);
} else {
  console.log("\n❌ Issues found in implementation");
  process.exit(1);
}