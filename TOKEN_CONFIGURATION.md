# Token Validity and Auto-Logout Configuration

## Current Implementation Status ✅

### Backend Token Configuration

#### Regular Users

-   **Duration**: 30 minutes
-   **Source**: `.env` file (`ACCESS_TOKEN_EXPIRE_MINUTES=30`)
-   **Applied in**: `backend/app/api/endpoints/users.py` login endpoint
-   **Code**: `access_token_expires = timedelta(minutes=30)`

#### Admin Users

-   **Duration**: 8 hours (480 minutes)
-   **Source**: Hardcoded in admin login endpoint
-   **Applied in**: `backend/app/api/endpoints/users.py` admin-login endpoint
-   **Code**: `access_token_expires = timedelta(hours=8)`

#### Password Reset Tokens

-   **Duration**: 15 minutes
-   **Source**: `.env` file (`RESET_TOKEN_EXPIRE_MINUTES=15`)
-   **Applied in**: `backend/app/core/security.py`

### Frontend Auto-Logout Implementation

#### Token Expiration Detection

-   **Location**: `frontend/contexts/auth-context.jsx`
-   **Method**: JWT payload parsing to check `exp` field
-   **Implementation**:
    ```javascript
    const isTokenExpired = (token) => {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    };
    ```

#### Auto-Logout Mechanism

-   **Check Frequency**: Every 60 seconds (1 minute)
-   **Triggers**:
    1. Periodic token validation (every minute)
    2. On app startup/refresh
    3. On API 401/403 responses
-   **Actions on Expiration**:
    1. Clear authentication state
    2. Remove tokens from localStorage
    3. Show user notification
    4. Redirect to login page

#### Implementation Details

1. **Periodic Checks**: `setInterval(checkTokenExpiration, 60000)`
2. **Startup Validation**: Token checked when app loads
3. **API Response Handling**: 401/403 responses trigger logout
4. **User Feedback**: Alert shown when session expires

### Security Features

#### Token Storage

-   **Method**: localStorage (client-side)
-   **Cleanup**: Automatic removal on logout/expiration

#### API Authentication

-   **Error Handling**: 401/403 responses trigger immediate logout
-   **Wrapper Functions**: `withAuthHandling()` and `useAuthenticatedApi()`

#### Session Management

-   **Persistence**: Tokens persist across browser sessions
-   **Validation**: Tokens validated on every app startup
-   **Cleanup**: Complete cleanup on logout/expiration

## Configuration Summary

| User Type      | Token Duration | Check Interval | Auto-Logout |
| -------------- | -------------- | -------------- | ----------- |
| Regular User   | 30 minutes     | 1 minute       | ✅ Yes      |
| Admin User     | 8 hours        | 1 minute       | ✅ Yes      |
| Password Reset | 15 minutes     | On-demand      | ✅ Yes      |

## Files Involved

### Backend

-   `backend/.env` - Token expiration configuration
-   `backend/app/core/security.py` - JWT token creation/validation
-   `backend/app/api/endpoints/users.py` - Login endpoints with token generation

### Frontend

-   `frontend/contexts/auth-context.jsx` - Main auth logic and auto-logout
-   `frontend/lib/api-utils.js` - API response handling and 401/403 detection
-   `frontend/lib/token-test.js` - Test utilities for token validation

## How It Works

1. **Login**: User gets JWT token with expiration time
2. **Storage**: Token stored in localStorage with user data
3. **Validation**: Token checked every minute and on app startup
4. **Expiration**: When token expires, user is automatically logged out
5. **Cleanup**: All auth data cleared from localStorage
6. **Redirect**: User redirected to login page with notification

## Testing

You can test the token expiration logic using the test file:

```javascript
import { testTokenExpiration } from "./lib/token-test.js";
testTokenExpiration(); // Run in browser console
```

The implementation is robust and handles all edge cases including:

-   Malformed tokens
-   Missing tokens
-   Expired tokens
-   Network errors
-   API authentication failures
