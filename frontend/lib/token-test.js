// JWT Token Expiration Test
// This file demonstrates how token expiration is handled in the app

const testTokenExpiration = () => {
  console.log("Testing JWT Token Expiration Logic");
  
  // Function to check if token is expired (from auth-context.jsx)
  const isTokenExpired = (token) => {
    if (!token) return true
    
    try {
      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.')
      if (parts.length !== 3) return true
      
      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]))
      
      // Check if token has expired
      const currentTime = Date.now() / 1000
      console.log("Token exp:", payload.exp, "Current time:", currentTime)
      return payload.exp < currentTime
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return true
    }
  }
  
  // Test with sample tokens
  const currentTime = Math.floor(Date.now() / 1000)
  
  // Create a mock expired token (exp = current time - 1 hour)
  const expiredTokenPayload = {
    sub: "test@example.com",
    exp: currentTime - 3600, // 1 hour ago
    user_id: 1
  }
  
  // Create a mock valid token (exp = current time + 30 minutes)
  const validTokenPayload = {
    sub: "test@example.com",
    exp: currentTime + 1800, // 30 minutes from now
    user_id: 1
  }
  
  // Base64 encode the payloads (simplified - real JWT would have header and signature)
  const expiredToken = `header.${btoa(JSON.stringify(expiredTokenPayload))}.signature`
  const validToken = `header.${btoa(JSON.stringify(validTokenPayload))}.signature`
  
  console.log("Expired token test:", isTokenExpired(expiredToken)) // Should be true
  console.log("Valid token test:", isTokenExpired(validToken)) // Should be false
}

// Configuration Summary
const tokenConfig = {
  backend: {
    regularUsers: "30 minutes (from .env ACCESS_TOKEN_EXPIRE_MINUTES=30)",
    adminUsers: "8 hours (hardcoded in admin login endpoint)",
    passwordReset: "15 minutes (from .env RESET_TOKEN_EXPIRE_MINUTES=15)"
  },
  frontend: {
    tokenCheck: "Every 60 seconds (1 minute interval)",
    autoLogout: "Immediate when token expires",
    localStorage: "Cleared on logout/expiration",
    userFeedback: "Alert shown on session expiration"
  }
}

console.log("Token Configuration:", tokenConfig)

export { testTokenExpiration, tokenConfig }
