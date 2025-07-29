# Leaderboard System

## Overview

This is a full-stack leaderboard application built with React, Express, and PostgreSQL. The system allows users to claim random points and displays real-time rankings. Users can select from existing users or add new ones, claim points (1-10 randomly), and view a dynamic leaderboard with points history.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **Validation**: Zod schemas for request/response validation
- **Storage**: Dual storage approach - in-memory for development, PostgreSQL for production

## Key Components

### Database Schema
Located in `shared/schema.ts`:
- **Users Table**: Stores user information, total points, rank, and last claim timestamp
- **Points History Table**: Records every point claim with user reference, points awarded, and timestamp
- **Validation**: Zod schemas for type-safe data validation

### API Endpoints
- `GET /api/users` - Retrieve all users with rankings
- `POST /api/users` - Add new user
- `POST /api/users/:userId/claim` - Claim random points (1-10) for a user
- `GET /api/history` - Get points claim history
- `GET /api/stats` - Get system statistics

### Frontend Components
- **UserSelection**: Dropdown to select users and claim points
- **AddUserForm**: Form to add new users to the system
- **LeaderboardTable**: Real-time ranking display with auto-refresh
- **PointsHistory**: Historical view of all point claims

## Data Flow

1. **User Selection**: User selects an existing user from dropdown or adds a new user
2. **Point Claiming**: Random points (1-10) are generated server-side and awarded
3. **Database Updates**: User's total points are updated, and history record is created
4. **Ranking Calculation**: Rankings are recalculated based on total points
5. **Real-time Updates**: Frontend auto-refreshes every 5 seconds to show latest data

## External Dependencies

### Frontend Dependencies
- **UI Components**: Comprehensive Radix UI component library
- **Styling**: Tailwind CSS with shadcn/ui theming system
- **Data Fetching**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Hookform resolvers
- **Icons**: Lucide React icon library

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Validation**: Zod for runtime type checking
- **Development**: ESBuild for production builds, TSX for development

## Deployment Strategy

### Development
- Frontend served via Vite dev server with HMR
- Backend runs on Express with file watching via TSX
- In-memory storage for rapid development iteration

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: Drizzle handles schema migrations via `drizzle-kit push`

### Database Management
- Schema defined in TypeScript with Drizzle ORM
- Migrations stored in `./migrations` directory
- Connection via environment variable `DATABASE_URL`
- Fallback to in-memory storage if database unavailable

### Key Architectural Decisions

1. **Dual Storage Pattern**: Implements both in-memory and PostgreSQL storage through a common interface, allowing seamless development without database setup
2. **Real-time Updates**: Uses polling instead of WebSockets for simplicity while maintaining responsive UI
3. **Type Safety**: Shared TypeScript schemas between frontend and backend ensure consistency
4. **Component Architecture**: Modular React components with clear separation of concerns
5. **Responsive Design**: Tailwind CSS with mobile-first approach and adaptive layouts