# Collection Management System

## Overview

This is a full-stack web application for managing weekly lending operations and daily collection tracking. The system handles customer loan management, daily collection entries, and reporting for a lending business. It features a React frontend with shadcn/ui components, an Express.js backend with PostgreSQL database using Drizzle ORM, and comprehensive collection line management based on weekday schedules.

## Recent Updates (August 2025)
- Added comprehensive profit tracking on dashboard (new loans + collections profit)
- Made customer numbers editable in registration form
- Added area-based filtering for customer management
- Fixed customer creation form validation issues
- Updated date formatting to dd.mm.yyyy format throughout application
- Enhanced dashboard with profit cards showing total, loan, and collection profits

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful API with JSON responses
- **Middleware**: Express middleware for request logging, JSON parsing, and error handling
- **Development**: Hot reload with Vite integration in development mode

### Database Schema
- **Customers Table**: Stores loan customer information including amounts, dates, and collection lines
- **Daily Collections Table**: Tracks individual collection records per customer per day
- **Daily Entries Table**: Aggregates daily collection summaries with targets and expenses
- **Data Types**: Uses PostgreSQL decimal types for financial precision and UUID primary keys

### Collection Line System
- **Scheduling**: Organized by weekday and time slots (morning/evening)
- **Lines Available**: Monday (morning/evening), Tuesday (morning), Wednesday (morning/evening), Thursday (morning)
- **Customer Assignment**: Each customer is assigned to a specific collection line
- **Route Planning**: Groups customers by collection lines for efficient daily routes

### Authentication & Security
- **Current State**: No authentication system implemented (single-user admin interface)
- **Session Management**: Uses express-session with PostgreSQL session store (connect-pg-simple)
- **Data Validation**: Zod schemas for both client and server-side validation

### Development Environment
- **Build System**: Vite for frontend bundling with esbuild for server builds
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Development Tools**: Hot reload, error overlays, and Replit-specific development features
- **Database Migrations**: Drizzle Kit for schema management and migrations

## External Dependencies

- **Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **UI Components**: Radix UI primitives for accessible component foundation
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date calculations and formatting
- **Development**: Replit-specific plugins for cartographer and error handling
- **Fonts**: Google Fonts integration (Inter, Geist Mono, Architects Daughter, etc.)
- **Icons**: Lucide React for consistent iconography throughout the application