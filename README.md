
# BlockBet - Bitcoin Block Betting Platform

A dynamic platform for tracking Bitcoin blockchain data and predicting which mining pool will mine the next Bitcoin block.

## Features

- **Real-time Block Explorer**: View the latest Bitcoin blocks with detailed information
- **Mining Pool Tracking**: Track which mining pools are finding blocks with color-coded visual indicators
- **Detailed Block Information**: View size, transaction count, mining time, and rewards for each block
- **Betting Platform**: Predict which pool will mine the next block based on historical data
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes for cryptocurrency enthusiasts

## Technology Stack

### Frontend
- React (v18) - Main frontend framework
- TypeScript - For type-safe JavaScript development
- Vite - Build tool and development server
- TailwindCSS - Utility-first CSS framework with custom theme configuration
- ShadcnUI - Component library
- React Query (Tanstack Query) - For data fetching and state management
- Wouter - Lightweight routing library
- Recharts - Data visualization (pie charts, graphs)
- Lucide React - Icon library
- React Hook Form - Form handling library
- Zod - Schema validation

### Backend
- Node.js - Runtime environment
- Express.js - Web framework for Node.js
- TypeScript - For type-safe backend development
- Drizzle ORM - Database ORM
- Neon Database (PostgreSQL) - Cloud PostgreSQL database
- Express Session - Session management
- Passport.js - Authentication middleware
- WebSocket (ws) - For real-time updates

### Development & Build Tools
- tsx - TypeScript execution environment
- esbuild - JavaScript bundler
- ESLint - Code linting
- PostCSS - CSS processing
- Various Replit-specific plugins for development

## Architecture
- Client-side rendering
- RESTful API backend
- Real-time updates via WebSocket
- Type safety across the entire stack
- Component-based UI architecture
- Responsive design principles
- Database integration
- Session-based authentication

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with the following variables:
```
DATABASE_URL=your_database_connection_string
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000

## Recent Updates

- Added colored circles for mining pools for easier visual identification
- Enhanced timestamp display with exact dates (MM/DD/YYYY, HH:MM:SS AM/PM)
- Added a Size (MB) column to show block sizes
- Implemented hover tooltips with explanatory information for each column
- Expanded mining pool database with additional pools
- Fixed "Unknown Pool" display issues by mapping all pool names correctly
