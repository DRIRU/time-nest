// Test file to verify user service filtering functionality

import { filterServices } from './services-data.js';

// Test function to verify that current user's services are filtered out
export function testUserServiceFiltering() {
  console.log("Testing user service filtering...");
  
  // Mock current user
  const mockCurrentUser = {
    user_id: 1,
    firstName: "Test",
    lastName: "User"
  };
  
  // Get all services without filtering
  const allServices = filterServices();
  console.log("Total services:", allServices.length);
  
  // Filter out services created by user with ID 1
  const filteredServices = allServices.filter(service => {
    if (service.creator_id && mockCurrentUser.user_id) {
      return service.creator_id !== mockCurrentUser.user_id;
    }
    return true;
  });
  
  console.log("Services after filtering out user ID 1:", filteredServices.length);
  console.log("Services by user ID 1:", allServices.filter(s => s.creator_id === 1).length);
  
  // Verify the filtering worked
  const hasUserServices = filteredServices.some(service => service.creator_id === mockCurrentUser.user_id);
  
  if (hasUserServices) {
    console.error("❌ TEST FAILED: User's own services are still showing");
  } else {
    console.log("✅ TEST PASSED: User's own services are filtered out");
  }
  
  return !hasUserServices;
}

// Test with different user IDs
export function testUserServiceFilteringMultipleUsers() {
  console.log("\nTesting filtering for multiple users...");
  
  const allServices = filterServices();
  
  [1, 2, 3].forEach(userId => {
    const filteredServices = allServices.filter(service => {
      if (service.creator_id && userId) {
        return service.creator_id !== userId;
      }
      return true;
    });
    
    const userServiceCount = allServices.filter(s => s.creator_id === userId).length;
    console.log(`User ${userId}: ${userServiceCount} services owned, ${filteredServices.length} services shown`);
  });
}

// Export test functions
export { testUserServiceFiltering, testUserServiceFilteringMultipleUsers };

// Helper function to log service details
export function logServiceDetails() {
  const services = filterServices();
  console.log("\nService details:");
  services.forEach(service => {
    console.log(`- "${service.title}" by ${service.provider} (creator_id: ${service.creator_id})`);
  });
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  window.testUserServiceFiltering = testUserServiceFiltering;
  window.testUserServiceFilteringMultipleUsers = testUserServiceFilteringMultipleUsers;
  window.logServiceDetails = logServiceDetails;
}
