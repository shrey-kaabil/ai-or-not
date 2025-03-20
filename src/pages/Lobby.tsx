import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

// Basic placeholder for user stats
interface UserStats {
  wins: number;
  losses: number;
  averageStars: number;
  totalGames: number;
}

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  // Placeholder stats - in a real app, this would come from API
  const [userStats, setUserStats] = useState<UserStats>({
    wins: 0,
    losses: 0,
    averageStars: 0,
    totalGames: 0
  });

  // Simulate user authentication
  useEffect(() => {
    // In a real app, this would be from authentication
    const mockUserId = `user-${Math.random().toString(36).substr(2, 9)}`;
    setUserId(mockUserId);
    
    // Get user profile (in real app)
    const fetchUserProfile = async () => {
      try {
        const profile = await ApiService.user.getProfile(mockUserId);
        setUserStats({
          wins: profile.wins,
          losses: profile.losses,
          averageStars: profile.totalGames > 0 ? profile.totalStars / profile.totalGames : 0,
          totalGames: profile.totalGames
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleFindMatch = async () => {
    setIsSearching(true);
    
    try {
      // Request a match through API
      const matchResult = await ApiService.match.requestMatch(userId);
      
      // Navigate to match screen with the match ID from the API
      navigate(`/match/${matchResult.matchId}`, { 
        state: { 
          matchId: matchResult.matchId,
          userId,
          isPlayerA: matchResult.isPlayerA,
          matchType: matchResult.type
        } 
      });
    } catch (error) {
      console.error('Error finding match:', error);
      setIsSearching(false);
      
      // In a real app, show error message to user
      
      // Fallback to the mock behavior for demo purposes
      setTimeout(() => {
        navigate('/match/placeholder-match-id', {
          state: {
            matchId: 'placeholder-match-id',
            userId,
            isPlayerA: true,
            matchType: 'human-ai'
          }
        });
      }, 2000);
    }
  };

  return (
    <div className="lobby-container">
      <h1>AI or Not</h1>
      <div className="stats-container">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Wins:</span>
            <span className="stat-value">{userStats.wins}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Losses:</span>
            <span className="stat-value">{userStats.losses}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Stars:</span>
            <span className="stat-value">{userStats.averageStars.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Games:</span>
            <span className="stat-value">{userStats.totalGames}</span>
          </div>
        </div>
      </div>
      <div className="find-match-container">
        <button 
          className="find-match-button"
          onClick={handleFindMatch}
          disabled={isSearching}
        >
          {isSearching ? 'Finding Match...' : 'Find Match'}
        </button>
      </div>
    </div>
  );
};

export default Lobby; 