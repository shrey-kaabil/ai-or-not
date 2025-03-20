import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface ResultsState {
  guess: 'human' | 'ai';
  score: number;
  opponentType: 'human' | 'ai';
  isCorrect?: boolean;  // Added from backend response
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const location = useLocation();
  
  // Get state from navigation, or use defaults if not provided
  const { 
    guess, 
    score, 
    opponentType: receivedOpponentType, 
    isCorrect: backendIsCorrect 
  } = (location.state as ResultsState) || {
    guess: 'human',
    score: 0,
    opponentType: 'ai',
    isCorrect: undefined
  };
  
  // Ensure opponentType has a value (default to 'ai' based on game design)
  const opponentType = receivedOpponentType || 'ai';
  
  // Calculate if the guess was correct based on client-side data
  const frontendIsCorrect = guess === opponentType;
  
  // Use backend correctness if available, otherwise calculate it
  const isCorrectGuess = backendIsCorrect !== undefined ? backendIsCorrect : frontendIsCorrect;
  
  // If the guess is correct but score is 0, or incorrect but score > 0, 
  // we have an inconsistency. Adjust the score.
  const validatedScore = isCorrectGuess ? (score > 0 ? score : 1) : 0;
  
  // Add detailed logging
  useEffect(() => {
    console.log('=== RESULTS PAGE DEBUG ===');
    console.log('Location state:', location.state);
    console.log('matchId:', matchId);
    console.log('guess:', guess);
    console.log('receivedOpponentType:', receivedOpponentType);
    console.log('final opponentType used:', opponentType);
    console.log('Backend isCorrect flag:', backendIsCorrect);
    console.log('Frontend calculated isCorrect:', frontendIsCorrect);
    console.log('Final isCorrectGuess used:', isCorrectGuess);
    console.log('score from backend:', score);
    console.log('validatedScore displayed:', validatedScore);
    
    // Detect inconsistency
    if (backendIsCorrect !== undefined && backendIsCorrect !== frontendIsCorrect) {
      console.error('⚠️ INCONSISTENCY DETECTED: Backend and frontend disagree on correctness!');
      console.error('Backend says:', backendIsCorrect ? 'CORRECT' : 'INCORRECT');
      console.error('Frontend calculated:', frontendIsCorrect ? 'CORRECT' : 'INCORRECT');
    }
    
    // Detect score inconsistency
    if (isCorrectGuess && score === 0) {
      console.error('⚠️ INCONSISTENCY DETECTED: Correct guess but score is 0!');
    }
    if (!isCorrectGuess && score > 0) {
      console.error('⚠️ INCONSISTENCY DETECTED: Incorrect guess but score is > 0!');
    }
    
    console.log('=========================');
  // Use a stable dependency array that won't change in size between renders
  }, [
    JSON.stringify(location.state), 
    matchId, 
    guess, 
    receivedOpponentType, 
    opponentType, 
    frontendIsCorrect, 
    backendIsCorrect, 
    isCorrectGuess, 
    score, 
    validatedScore
  ]);
  
  // Handle Play Again button
  const handlePlayAgain = () => {
    navigate('/');
  };
  
  // Render stars based on score
  const renderStars = (count: number) => {
    return Array(count).fill('⭐').join(' ');
  };

  return (
    <div className="results-container">
      <h1>Game Results</h1>
      
      <div className="results-card">
        <div className="match-info">
          <h2>Match #{matchId && matchId.substring(0, 8)}</h2>
        </div>
        
        <div className="reveal-section">
          <h3>Your Opponent Was:</h3>
          <div className={`opponent-type ${opponentType}`}>
            {opponentType === 'human' ? 'Human' : 'AI'}
          </div>
        </div>
        
        <div className="guess-section">
          <h3>Your Guess:</h3>
          <div className={`guess ${guess}`}>
            {guess === 'human' ? 'Human' : 'AI'}
          </div>
          <div className="guess-result">
            {isCorrectGuess ? 'Correct! 🎉' : 'Incorrect ❌'}
          </div>
        </div>
        
        <div className="score-section">
          <h3>Your Score:</h3>
          <div className="stars">
            {validatedScore > 0 ? renderStars(validatedScore) : 'No stars earned'}
          </div>
          <div className="score-value">
            {validatedScore} {validatedScore === 1 ? 'star' : 'stars'}
          </div>
        </div>
        
        <div className="actions">
          <button 
            className="play-again-button"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results; 