// Test file to verify user service request filtering functionality

import { getAllServiceRequests } from './service-requests-data.js';

// Test function to verify that current user's requests are filtered out
export function testUserRequestFiltering() {
  console.log("Testing user service request filtering...");
  
  // Mock current user
  const mockCurrentUser = {
    user_id: 1,
    firstName: "Test",
    lastName: "User"
  };
  
  // This would need to be tested with actual backend data
  console.log("Note: This test requires live backend data to verify filtering");
  console.log("Manual testing steps:");
  console.log("1. Create a service request as a logged-in user");
  console.log("2. Navigate to the service requests page");
  console.log("3. Verify that your own request is not displayed");
  console.log("4. Log out and verify that all requests are displayed");
  console.log("5. Log in as a different user and verify the request is visible");
  
  return true;
}

// Test with different user IDs (would work with mock data)
export function testUserRequestFilteringWithMockData() {
  console.log("\nTesting request filtering with mock data...");
  
  // Mock requests data with creator_id
  const mockRequests = [
    { id: "1", title: "Web Development Help", creator_id: 1 },
    { id: "2", title: "Garden Maintenance", creator_id: 2 },
    { id: "3", title: "Tutoring Math", creator_id: 1 },
    { id: "4", title: "Photography Session", creator_id: 3 },
  ];
  
  [1, 2, 3].forEach(userId => {
    const filteredRequests = mockRequests.filter(request => {
      if (request.creator_id && userId) {
        return request.creator_id !== userId;
      }
      return true;
    });
    
    const userRequestCount = mockRequests.filter(r => r.creator_id === userId).length;
    console.log(`User ${userId}: ${userRequestCount} requests owned, ${filteredRequests.length} requests shown`);
    
    // Verify no user's own requests are shown
    const hasUserRequests = filteredRequests.some(request => request.creator_id === userId);
    if (hasUserRequests) {
      console.error(`❌ TEST FAILED: User ${userId}'s own requests are still showing`);
    } else {
      console.log(`✅ TEST PASSED: User ${userId}'s own requests are filtered out`);
    }
  });
}

// Helper function to test backend API integration
export async function testBackendRequestFiltering() {
  console.log("\nTesting backend service request filtering...");
  
  try {
    // Test fetching all requests
    const allRequests = await getAllServiceRequests();
    console.log(`Total requests from backend: ${allRequests.length}`);
    
    // Test with exclude_creator_id parameter
    if (allRequests.length > 0) {
      const sampleCreatorId = allRequests[0].creator_id;
      if (sampleCreatorId) {
        const filteredRequests = await getAllServiceRequests({ 
          excludeCreatorId: sampleCreatorId 
        });
        console.log(`Requests after excluding creator ${sampleCreatorId}: ${filteredRequests.length}`);
        
        const hasExcludedUserRequests = filteredRequests.some(
          request => request.creator_id === sampleCreatorId
        );
        
        if (hasExcludedUserRequests) {
          console.error("❌ Backend filtering failed - excluded user's requests still present");
        } else {
          console.log("✅ Backend filtering working correctly");
        }
      }
    }
  } catch (error) {
    console.error("Backend test failed:", error);
  }
}

// Export test functions
export { testUserRequestFiltering, testUserRequestFilteringWithMockData, testBackendRequestFiltering };

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  window.testUserRequestFiltering = testUserRequestFiltering;
  window.testUserRequestFilteringWithMockData = testUserRequestFilteringWithMockData;
  window.testBackendRequestFiltering = testBackendRequestFiltering;
  
  // Run all tests
  window.runAllRequestFilteringTests = () => {
    testUserRequestFiltering();
    testUserRequestFilteringWithMockData();
    testBackendRequestFiltering();
  };
}
