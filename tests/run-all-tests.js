#!/usr/bin/env node

/**
 * Test Runner for OdinBook
 * Executes all test files in the tests directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 OdinBook Test Runner');
console.log('========================\n');

// Get all test files
const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.js') && file !== 'run-all-tests.js')
  .sort();

console.log(`📁 Found ${testFiles.length} test files:\n`);

let passedTests = 0;
let failedTests = 0;
const results = [];

// Run each test file
testFiles.forEach((testFile, index) => {
  console.log(`[${index + 1}/${testFiles.length}] Running ${testFile}...`);
  
  try {
    const testPath = path.join(testDir, testFile);
    execSync(`node "${testPath}"`, { 
      stdio: 'pipe',
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`✅ ${testFile} - PASSED\n`);
    passedTests++;
    results.push({ file: testFile, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ ${testFile} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
    failedTests++;
    results.push({ file: testFile, status: 'FAILED', error: error.message });
  }
});

// Summary
console.log('📊 Test Results Summary');
console.log('========================');
console.log(`Total Tests: ${testFiles.length}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testFiles.length) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log('\n❌ Failed Tests:');
  results
    .filter(result => result.status === 'FAILED')
    .forEach(result => {
      console.log(`   - ${result.file}: ${result.error}`);
    });
}

if (passedTests === testFiles.length) {
  console.log('\n🎉 All tests passed! Your application is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

console.log('\n📚 For individual test execution:');
console.log('   npm run test:user      # Run user tests');
console.log('   npm run test:friends   # Run friendship tests');
console.log('   npm run test:posts     # Run post tests');
console.log('   npm run test:db        # Run database tests');
