import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Service for interacting with the API
 */
const ApiService = {
  // Match-related endpoints
  match: {
    /**
     * Request a new match
     */
    requestMatch: async (userId: string) => {
      const response = await api.post('/api/match/request', { userId });
      return response.data;
    },
    
    /**
     * Get match details
     */
    getMatch: async (matchId: string) => {
      const response = await api.get(`/api/match/${matchId}`);
      return response.data;
    },
    
    /**
     * Submit a guess about the opponent
     */
    submitGuess: async (matchId: string, userId: string, guess: 'human' | 'ai') => {
      const response = await api.post(`/api/match/${matchId}/guess`, { userId, guess });
      return response.data;
    }
  },
  
  // User-related endpoints (to be expanded in future)
  user: {
    /**
     * Get user profile
     */
    getProfile: async (userId: string) => {
      // This is a placeholder - would connect to real endpoint in production
      return {
        id: userId,
        username: 'Demo User',
        wins: 0,
        losses: 0,
        totalStars: 0,
        averageStars: 0,
        totalGames: 0
      };
    }
  }
};

export default ApiService; 