import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../services/api';
import { joinMatch, leaveMatch, sendMessage, onNewMessage, onMatchHistory, getSocket, onFinalMessage } from '../services/socket';

// Message interface
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

// UI Message with you/opponent format
interface UIMessage {
  id: string;
  text: string;
  sender: 'you' | 'opponent';
  timestamp: Date;
}

// Mock guess options
type GuessOption = 'human' | 'ai';

// Match state from navigation
interface MatchState {
  userId: string;
  isPlayerA: boolean;
  matchType: 'human-human' | 'human-ai';
}

const Match: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state from navigation or use defaults
  const { userId, isPlayerA, matchType } = 
    (location.state as MatchState) || 
    { userId: `user-${Date.now()}`, isPlayerA: true, matchType: 'human-ai' };
  
  // State for messages
  const [messages, setMessages] = useState<UIMessage[]>([]);
  
  // State for current message
  const [currentMessage, setCurrentMessage] = useState('');
  
  // State for character count
  const [charCount, setCharCount] = useState(0);
  
  // State for showing guess modal
  const [showGuessModal, setShowGuessModal] = useState(false);
  
  // State for whether it's the player's turn
  const [isPlayerTurn, setIsPlayerTurn] = useState(isPlayerA); // Player A goes first
  
  // State for tracking message count
  const [messagesSent, setMessagesSent] = useState(0);
  const [messagesReceived, setMessagesReceived] = useState(0);

  // Maximum characters allowed per message
  const MAX_CHARS = 1000;

  // Add state for guess timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // State for guess
  const [currentGuess, setCurrentGuess] = useState<GuessOption | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (matchId && userId) {
      // Join match room
      joinMatch(userId, matchId);
      
      // Listen for new messages
      const unsubscribeNewMessage = onNewMessage((message: Message) => {
        const isFromUser = (isPlayerA && message.sender === 'playerA') || 
                          (!isPlayerA && message.sender === 'playerB');

        // Convert to UI message format
        const uiMessage: UIMessage = {
          id: message.id,
          text: message.text,
          sender: isFromUser ? 'you' : 'opponent',
          timestamp: new Date(message.timestamp)
        };
        
        setMessages(prevMessages => [...prevMessages, uiMessage]);
        
        if (!isFromUser) {
          setMessagesReceived(prev => prev + 1);
          setIsPlayerTurn(true);
        }
      });
      
      // Listen for match history
      const unsubscribeMatchHistory = onMatchHistory((historyMessages: Message[]) => {
        // Convert server messages to UI format
        const uiMessages: UIMessage[] = historyMessages.map(msg => {
          const isFromUser = (isPlayerA && msg.sender === 'playerA') || 
                            (!isPlayerA && msg.sender === 'playerB');
          
          return {
            id: msg.id,
            text: msg.text,
            sender: isFromUser ? 'you' : 'opponent',
            timestamp: new Date(msg.timestamp)
          };
        });
        
        setMessages(uiMessages);
        
        // Count messages sent and received
        const sentCount = uiMessages.filter(msg => msg.sender === 'you').length;
        const receivedCount = uiMessages.filter(msg => msg.sender === 'opponent').length;
        
        setMessagesSent(sentCount);
        setMessagesReceived(receivedCount);
        
        // Determine whose turn it is
        setIsPlayerTurn(uiMessages.length % 2 === 0 ? isPlayerA : !isPlayerA);
      });
      
      // Listen for final message event
      const unsubscribeFinalMessage = onFinalMessage(({ matchId: eventMatchId, timeLimit }) => {
        if (matchId === eventMatchId) {
          // Set time left to server-provided limit
          setTimeLeft(timeLimit);
          setTimerActive(true);
        }
      });
      
      // Clean up on unmount
      return () => {
        leaveMatch(userId, matchId);
        unsubscribeNewMessage();
        unsubscribeMatchHistory();
        unsubscribeFinalMessage();
      };
    }
  }, [matchId, userId, isPlayerA]);
  
  // Submission and navigation logic extracted to a separate function
  const submitGuessAndNavigate = useCallback(async (guess: GuessOption) => {
    console.log('%c SENDING GUESS TO SERVER', 'background: #ff0000; color: white; font-size: 14px;');
    console.log('%c Guess:', 'color: blue; font-weight: bold;', guess);
    console.log('%c Messages received:', 'color: blue; font-weight: bold;', messagesReceived);
    
    try {
      // Submit guess to server
      const result = await ApiService.match.submitGuess(matchId!, userId, guess);
      
      console.log('%c SERVER RESPONSE', 'background: #00ff00; color: black; font-size: 14px;');
      console.log('%c Full response:', 'color: green; font-weight: bold;', result);
      
      // Extract values from the response, with fallbacks to prevent undefined values
      const score = typeof result.score === 'number' ? result.score : 0;
      const opponentType = result.opponentType || 'ai'; // Default to 'ai' if not provided
      const isCorrect = typeof result.isCorrect === 'boolean' ? result.isCorrect : (guess === opponentType);
      
      console.log('%c Processed response values:', 'color: green; font-weight: bold;');
      console.log('%c - Score:', 'color: green;', score);
      console.log('%c - Opponent type:', 'color: green;', opponentType);
      console.log('%c - Is correct:', 'color: green;', isCorrect);
      
      // Validate that the score follows the formula from PRD:
      // Score = 4 - messages received (if correct guess)
      const expectedScore = isCorrect ? Math.max(1, 4 - Math.max(1, Math.min(messagesReceived, 3))) : 0;
      console.log('%c Expected score based on PRD formula:', 'color: orange; font-weight: bold;', expectedScore);
      
      if (score !== expectedScore) {
        console.warn('%c SCORE MISMATCH!', 'background: orange; color: black; font-weight: bold;');
        console.warn(`Server returned ${score} but based on ${messagesReceived} messages, expected ${expectedScore}`);
      }
      
      // Navigate to results with the extracted values
      navigate(`/results/${matchId}`, { 
        state: { 
          guess,
          score: expectedScore, // Use calculated score based on formula to ensure consistency
          opponentType,
          isCorrect
        } 
      });
      
      console.log('%c NAVIGATING TO RESULTS', 'background: #0000ff; color: white; font-size: 14px;');
      console.log('%c State:', 'color: blue; font-weight: bold;', { 
        guess, 
        score: expectedScore,
        opponentType,
        isCorrect
      });
    } catch (error) {
      console.error('Error submitting guess:', error);
      
      // Fallback for demo - use matchType for opponent type
      // Default to 'ai' in case matchType is undefined (most common in our game)
      const opponentType = matchType === 'human-human' ? 'human' : 'ai';
      // Calculate score based on same formula as server
      const isCorrect = guess === opponentType;
      const score = isCorrect ? Math.max(1, 4 - messagesReceived) : 0;
      
      console.log('=== FALLBACK MODE ===');
      console.log('Using fallback values:');
      console.log('opponentType (derived from matchType):', opponentType);
      console.log('isCorrect (calculated):', isCorrect);
      console.log('Score (calculated):', score);
      
      navigate(`/results/${matchId}`, { 
        state: { 
          guess,
          score,
          opponentType,
          isCorrect
        } 
      });
      
      console.log('Navigating to results with fallback state:', { 
        guess, 
        score, 
        opponentType,
        isCorrect
      });
    }
  }, [matchId, userId, matchType, messagesReceived, navigate, messages.length]);

  // Check if we need to navigate to results after message count changes
  useEffect(() => {
    // Check if we have 6 messages and a guess - time to navigate to results
    if (messages.length >= 6 && hasGuessed && currentGuess) {
      submitGuessAndNavigate(currentGuess);
    }
  }, [messages.length, hasGuessed, currentGuess, submitGuessAndNavigate]);
  
  // Add useEffect for countdown timer
  useEffect(() => {
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      // Clear existing interval if any
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Set up countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime === null || prevTime <= 1) {
            // Time's up, clear interval
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setTimerActive(false);
            
            // Auto-show guess modal when time is almost up (5 seconds left)
            if (!showGuessModal && prevTime === 5) {
              setShowGuessModal(true);
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeLeft, showGuessModal]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (currentMessage.trim() && isPlayerTurn && messagesSent < 3) {
      // Send message to server
      sendMessage(userId, matchId!, currentMessage, isPlayerA);
      
      // Clear current message input
      setCurrentMessage('');
      setCharCount(0);
      
      // Update local state
      setMessagesSent(prev => prev + 1);
      setIsPlayerTurn(false);
    }
  };

  // Handle input change for message
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setCurrentMessage(text);
      setCharCount(text.length);
    }
  };

  // Handle making a guess
  const handleMakeGuess = async (guess: GuessOption) => {
    // Close the modal
    setShowGuessModal(false);
    
    // Store the guess
    setCurrentGuess(guess);
    setHasGuessed(true);
    
    // Check if we already have 6 messages - if so, submit and navigate
    if (messages.length >= 6) {
      submitGuessAndNavigate(guess);
    } else {
      // Otherwise just store the guess and show a notification
      console.log(`Guess recorded: ${guess}. Will navigate after the conversation is complete.`);
      // You could also show a toast/notification to the user that their guess is recorded
    }
  };

  // Enable guess button only after receiving at least one message
  const canGuess = messagesReceived > 0;

  return (
    <div className="match-container">
      <div className="match-header">
        <h2>Match #{matchId && matchId.substring(0, 8)}</h2>
        <div className="header-right">
          {timeLeft !== null && (
            <div className={`timer ${timeLeft < 10 ? 'warning' : ''}`}>
              Time to guess: {timeLeft}s
            </div>
          )}
          {hasGuessed && currentGuess ? (
            <div className="guess-indicator">
              Guess recorded: <strong>{currentGuess === 'human' ? 'Human' : 'AI'}</strong>
            </div>
          ) : (
            <button 
              className="guess-button"
              onClick={() => setShowGuessModal(true)}
              disabled={!canGuess}
            >
              Make Your Guess
            </button>
          )}
        </div>
      </div>
      
      {hasGuessed && currentGuess && messages.length < 6 && (
        <div className="guess-notice">
          Your guess has been recorded. The conversation will continue until all 6 messages are exchanged.
          <div className="message-counter">
            Messages: {messages.length} of 6
          </div>
        </div>
      )}
      
      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'you' ? 'sent' : 'received'}`}
          >
            <div className="message-sender">{message.sender === 'you' ? 'You' : 'Opponent'}</div>
            <div className="message-text">{message.text}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="message-input-container">
        <textarea
          value={currentMessage}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={!isPlayerTurn || messagesSent >= 3}
          className="message-input"
        />
        <div className="char-count">
          {charCount}/{MAX_CHARS}
        </div>
        <button 
          onClick={handleSendMessage}
          disabled={!currentMessage.trim() || !isPlayerTurn || messagesSent >= 3}
          className="send-button"
        >
          Send
        </button>
      </div>
      
      {/* Guess Modal */}
      {showGuessModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Make Your Guess</h3>
            <p>Is your opponent a human or AI?</p>
            <div className="guess-options">
              <button onClick={() => handleMakeGuess('human')}>Human</button>
              <button onClick={() => handleMakeGuess('ai')}>AI</button>
            </div>
            <button 
              className="close-modal"
              onClick={() => setShowGuessModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Match; 