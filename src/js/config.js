// Configuration for the chess application
export const config = {
    // Get backend URL from environment variable, fallback to localhost for development
    BACKEND_URL: window.BACKEND_URL || 'http://localhost:10000',
    
    // Add any other configuration variables here
    SOCKET_OPTIONS: {
        reconnectionDelayMax: 10000,
        reconnection: true,
        reconnectionAttempts: 10
    }
}; 