/**
 * Manual Backend Test Script for Composio MCP Integration
 * 
 * This script tests the Composio MCP backend endpoints directly
 * Run this with: node test-composio-backend.js
 */

const API_BASE = 'http://localhost:8000/api';

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await fetch(`${API_BASE}/composio-mcp/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testSupportedApps() {
  console.log('📱 Testing Supported Apps...');
  try {
    const response = await fetch(`${API_BASE}/composio-mcp/supported-apps`);
    const data = await response.json();
    console.log(`✅ Supported Apps: Found ${data.apps?.length || 0} apps`);
    if (data.apps?.length > 0) {
      console.log('   Sample apps:', data.apps.slice(0, 3).map(app => `${app.name} (${app.key})`));
    }
    return true;
  } catch (error) {
    console.error('❌ Supported Apps Failed:', error.message);
    return false;
  }
}

async function testCreateConnection() {
  console.log('➕ Testing Create Connection (Gmail)...');
  try {
    const response = await fetch(`${API_BASE}/composio-mcp/create-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth token, but we can see the error
      },
      body: JSON.stringify({ app_key: 'gmail' })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Create Connection: Properly requires authentication (401)');
      return true;
    } else if (response.ok) {
      console.log('✅ Create Connection:', data);
      return true;
    } else {
      console.log('⚠️ Create Connection Error:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Create Connection Failed:', error.message);
    return false;
  }
}

async function testUserConnections() {
  console.log('🔗 Testing User Connections...');
  try {
    const response = await fetch(`${API_BASE}/composio-mcp/user-connections`, {
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper auth token
      }
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ User Connections: Properly requires authentication (401)');
      return true;
    } else if (response.ok) {
      console.log('✅ User Connections:', data);
      return true;
    } else {
      console.log('⚠️ User Connections Error:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ User Connections Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Composio MCP Backend Tests...\n');
  
  const results = [];
  
  // Test 1: Health Check (no auth required)
  results.push(await testHealthCheck());
  console.log('');
  
  // Test 2: Supported Apps (no auth required)
  results.push(await testSupportedApps());
  console.log('');
  
  // Test 3: Create Connection (auth required - expect 401)
  results.push(await testCreateConnection());
  console.log('');
  
  // Test 4: User Connections (auth required - expect 401)
  results.push(await testUserConnections());
  console.log('');
  
  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('📊 Test Summary:');
  console.log(`   Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Backend is ready for frontend integration.');
  } else {
    console.log('⚠️ Some tests failed. Check the backend server.');
  }
  
  return passed === total;
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  runTests().catch(console.error);
} else {
  // Browser environment
  window.testComposioBackend = runTests;
  console.log('Run testComposioBackend() in the browser console');
}
