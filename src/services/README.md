# API Client Infrastructure

This directory contains the API client infrastructure for the DingDingCat application, providing a robust HTTP client with authentication, retry mechanisms, and error handling.

## Overview

The API client is built on top of Axios and provides:

- **Authentication Management**: Automatic token handling and refresh
- **Request/Response Interceptors**: Common parameter injection and error handling
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Error Handling**: Comprehensive error transformation and recovery
- **Offline Support**: Token storage and network error handling
- **Type Safety**: Full TypeScript support with proper typing

## Files

### Core Implementation

- **`apiClient.ts`** - Main API client implementation with all features
- **`index.ts`** - Service exports and module organization

### Documentation & Examples

- **`apiClient.example.ts`** - Comprehensive usage examples
- **`README.md`** - This documentation file

### Tests

- **`__tests__/apiClient.test.ts`** - Comprehensive unit tests
- **`__tests__/apiClient.integration.test.ts`** - Integration tests

## Features

### 1. Authentication Management

The API client automatically handles authentication tokens:

```typescript
import apiClient from './apiClient';

// Store tokens after login
await apiClient.storeTokens({
  accessToken: 'your_access_token',
  refreshToken: 'your_refresh_token',
  tokenType: 'Bearer',
  expiresIn: 3600,
});

// Check authentication status
const isAuthenticated = await apiClient.isAuthenticated();

// Clear tokens on logout
await apiClient.clearStoredTokens();
```

### 2. Automatic Token Refresh

When a request receives a 401 Unauthorized response, the client automatically:

1. Attempts to refresh the access token using the stored refresh token
2. Retries the original request with the new token
3. Queues other requests during the refresh process
4. Clears tokens and redirects to login if refresh fails

### 3. Request Interceptors

All requests automatically include:

- **Authentication Header**: `Authorization: Bearer <token>`
- **Common Parameters**: `appKey`, `timestamp`
- **Request ID**: Unique identifier for tracking
- **Standard Headers**: Content-Type, Accept, User-Agent

### 4. Response Interceptors

All responses are processed to:

- **Check API Status**: Validate response.data.code === 200
- **Transform Errors**: Convert to consistent ApiError format
- **Handle Token Refresh**: Automatic 401 handling
- **Debug Logging**: Request/response logging in debug mode

### 5. Retry Mechanism

Failed requests are automatically retried with:

- **Exponential Backoff**: Increasing delays between retries
- **Jitter**: Random delay variation to prevent thundering herd
- **Configurable Limits**: Maximum retry count and delay settings
- **Smart Filtering**: Only retry appropriate error types

```typescript
// Configure retry behavior
apiClient.updateRetryConfig({
  maxRetries: 5,
  backoffMultiplier: 2,
  initialDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
});
```

### 6. Error Handling

Comprehensive error handling includes:

- **Network Errors**: Connection failures, timeouts
- **HTTP Errors**: Status code based error handling
- **API Errors**: Business logic error responses
- **Authentication Errors**: Token expiry and refresh failures

```typescript
try {
  const response = await apiClient.get('/some-endpoint');
  return response.data;
} catch (error: ApiError) {
  switch (error.code) {
    case 401:
      // Handle authentication error
      break;
    case 403:
      // Handle authorization error
      break;
    case 429:
      // Handle rate limiting
      break;
    default:
      // Handle other errors
  }
}
```

## Usage Examples

### Basic HTTP Methods

```typescript
import apiClient from './services/apiClient';

// GET request
const response = await apiClient.get('/endpoint');

// POST request
const response = await apiClient.post('/endpoint', { data: 'value' });

// PUT request
const response = await apiClient.put('/endpoint', { data: 'updated' });

// DELETE request
const response = await apiClient.delete('/endpoint');
```

### File Upload

```typescript
const file = { name: 'image.jpg', type: 'image/jpeg', uri: 'file://...' };

const response = await apiClient.uploadFile(
  '/upload',
  file,
  (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Custom Headers

```typescript
// Set custom headers for all requests
apiClient.setDefaultHeaders({
  'X-Custom-Header': 'custom-value',
  'X-App-Version': '1.0.0',
});

// Remove custom headers
apiClient.removeDefaultHeaders(['X-Custom-Header']);
```

### Advanced Configuration

```typescript
// Get direct access to axios instance
const axiosInstance = apiClient.getInstance();

// Cancel all pending requests
apiClient.cancelAllRequests();

// Update retry configuration
apiClient.updateRetryConfig({
  maxRetries: 3,
  initialDelay: 500,
});
```

## Configuration

The API client uses environment configuration from `../config/env.ts`:

```typescript
export interface EnvConfig {
  API_BASE_URL: string;    // Base URL for API requests
  WECHAT_APP_ID: string;   // WeChat App ID
  APP_KEY: string;         // Application key
  DEBUG_MODE: boolean;     // Enable debug logging
  LOG_LEVEL: string;       // Logging level
}
```

## Error Types

### ApiError Interface

```typescript
interface ApiError {
  code: number;      // HTTP status code or API error code
  message: string;   // Error message
  details?: any;     // Additional error details
}
```

### Common Error Codes

- **200**: Success
- **400**: Bad Request - Invalid parameters
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Access denied (risk control)
- **404**: Not Found - Resource doesn't exist
- **429**: Too Many Requests - Rate limited
- **500**: Internal Server Error - Server error

## Storage

The API client uses AsyncStorage for token persistence:

- **Access Token**: `@dingdingcat/access_token`
- **Refresh Token**: `@dingdingcat/refresh_token`
- **User ID**: `@dingdingcat/user_id`

## Testing

### Unit Tests

Run unit tests with:

```bash
npm test -- src/services/__tests__/apiClient.test.ts
```

Tests cover:
- Request/response interceptors
- Token management
- Retry mechanism
- Error handling
- HTTP methods
- Configuration

### Integration Tests

Run integration tests with:

```bash
npm test -- src/services/__tests__/apiClient.integration.test.ts
```

Integration tests verify:
- Basic functionality
- Configuration
- Authentication flow
- Header management

## Best Practices

### 1. Error Handling

Always handle errors appropriately:

```typescript
try {
  const response = await apiClient.get('/endpoint');
  return response.data;
} catch (error) {
  // Log error for debugging
  console.error('API call failed:', error);
  
  // Handle specific error types
  if (error.code === 401) {
    // Redirect to login
  } else if (error.code === 403) {
    // Show access denied message
  }
  
  // Return fallback or rethrow
  throw error;
}
```

### 2. Authentication Check

Check authentication before making requests:

```typescript
const isAuthenticated = await apiClient.isAuthenticated();
if (!isAuthenticated) {
  // Redirect to login
  return;
}

// Proceed with authenticated request
const response = await apiClient.get('/protected-endpoint');
```

### 3. Retry Logic

For critical operations, implement additional retry logic:

```typescript
async function criticalApiCall() {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiClient.post('/critical-endpoint', data);
    } catch (error) {
      lastError = error;
      
      if (error.code < 500) {
        // Don't retry client errors
        throw error;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError;
}
```

### 4. Type Safety

Use proper TypeScript types:

```typescript
import { ApiResponse, User } from '../types';

const response = await apiClient.get<User>('/user/profile');
const user: User = response.data;
```

## Troubleshooting

### Common Issues

1. **Token Refresh Loops**
   - Check refresh token validity
   - Verify refresh endpoint configuration
   - Ensure proper error handling

2. **Request Timeouts**
   - Check network connectivity
   - Verify server response times
   - Adjust timeout configuration

3. **Authentication Failures**
   - Verify token storage
   - Check token format and expiry
   - Validate authentication headers

### Debug Mode

Enable debug mode in environment configuration:

```typescript
const developmentConfig: EnvConfig = {
  DEBUG_MODE: true,
  LOG_LEVEL: 'debug',
  // ... other config
};
```

This will log all requests and responses to the console.

## Future Enhancements

Potential improvements for the API client:

1. **Request Caching**: Cache GET requests for better performance
2. **Offline Queue**: Queue requests when offline and sync when online
3. **Request Deduplication**: Prevent duplicate concurrent requests
4. **Metrics Collection**: Track API performance and error rates
5. **Circuit Breaker**: Prevent cascading failures
6. **Request Prioritization**: Handle high-priority requests first

## Dependencies

- **axios**: HTTP client library
- **@react-native-async-storage/async-storage**: Token storage
- **../config/env**: Environment configuration
- **../types**: TypeScript type definitions

## Contributing

When modifying the API client:

1. Update tests for new functionality
2. Update documentation and examples
3. Ensure backward compatibility
4. Test with different network conditions
5. Verify token refresh scenarios