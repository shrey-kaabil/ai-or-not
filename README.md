# AI or Not - Frontend Application

A React-based frontend for the AI or Not game where players try to determine if they're chatting with a human or AI.

## Tech Stack

- React 18 with TypeScript
- Socket.io-client for real-time communication
- Supabase for authentication and data storage
- Tailwind CSS for styling
- React Router for navigation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running (see server README)
- Supabase account and credentials

## Project Structure

```
ai-or-not/
├── public/          # Static files
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page components
│   ├── services/    # API & socket services
│   ├── utils/       # Utility functions
│   ├── types/       # TypeScript type definitions
│   └── App.tsx      # Root component
├── package.json
└── .env
```

## Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd ai-or-not
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Update the following variables in `.env`:
     ```
     REACT_APP_API_URL=http://localhost:5000
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Running the Application

### Development Mode
```bash
npm start
```
This will start the development server at http://localhost:3000

### Production Build
```bash
npm run build
```
The build artifacts will be stored in the `build/` directory.

## Game Features

- Real-time chat with matched players
- Turn-based messaging system (3 messages per player)
- Identity guessing system
- Score tracking based on guess timing
- Match history and statistics

## Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Create production build
- `npm run eject` - Eject from Create React App

## Component Structure

### Core Components
- `GameRoom` - Main game interface
- `Chat` - Message display and input
- `MatchMaking` - Queue and player matching
- `GuessPanel` - Identity guessing interface
- `ScoreBoard` - Display game results

### Utility Components
- `Loading` - Loading states
- `ErrorBoundary` - Error handling
- `Toast` - Notifications
- `Modal` - Popup dialogs

## State Management

The application uses React's Context API for:
- Game state
- User authentication
- WebSocket connection
- Theme preferences

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## Known Issues

- Occasional WebSocket reconnection needed
- Mobile responsiveness improvements needed
- Performance optimization for chat history

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details
