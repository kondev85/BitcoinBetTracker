
# BlockBet - Bitcoin Block Betting Platform

A platform for predicting which mining pool will mine the next Bitcoin block and win rewards.

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
- Neon Database (PostgreSQL) - Database (@neondatabase/serverless)
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

2. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000
