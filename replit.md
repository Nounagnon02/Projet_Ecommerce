# E-Commerce Authentication Application

## Overview

This is a full-stack e-commerce authentication application built with React, Express, and PostgreSQL. The application provides a complete user authentication system with a modern, responsive UI featuring French localization. It uses a monorepo structure with shared TypeScript schemas and modern development tooling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo architecture with clear separation between client, server, and shared code:

- **Frontend**: React with TypeScript, Vite build system
- **Backend**: Express.js with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common TypeScript schemas and types
- **UI**: shadcn/ui components with Tailwind CSS styling

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for monorepo support
- **Routing**: wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui component library based on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Session Management**: express-session with in-memory store
- **Password Security**: bcrypt for password hashing
- **Database**: Drizzle ORM with Neon serverless PostgreSQL
- **Development**: tsx for TypeScript execution

### Authentication System
- **Session-based authentication** using express-session
- **Password hashing** with bcrypt (salt rounds configurable)
- **Form validation** using Zod schemas shared between client and server
- **French localization** for all user-facing messages
- **Secure session configuration** with httpOnly cookies

### Database Schema
The application uses a simple user table with the following structure:
- `id`: Serial primary key
- `name`: User's display name (255 chars max)
- `email`: Unique email address (255 chars max)
- `password`: Bcrypt hashed password
- `emailVerifiedAt`: Timestamp for email verification (nullable)
- `rememberToken`: Token for "remember me" functionality (nullable)
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Data Flow

### Authentication Flow
1. **Registration**: User submits form → Validation with Zod → Password hashing → Database storage → Session creation
2. **Login**: Credentials submission → Email lookup → Password verification → Session creation → User data return
3. **Session Management**: Session middleware checks for valid user session on protected routes
4. **Logout**: Session destruction and client-side cache clearing

### Client-Server Communication
- **API Requests**: Centralized through queryClient with automatic credential inclusion
- **Error Handling**: Unified error responses with French localization
- **State Synchronization**: TanStack Query handles server state caching and invalidation
- **Form Validation**: Shared Zod schemas ensure consistent validation rules

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe SQL ORM
- **express-session**: Server-side session management
- **bcrypt**: Password hashing and verification
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Accessible UI primitive components
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form state management and validation
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database schema management and migrations

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite compiles React app to static assets in `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (falls back to default in development)
- **NODE_ENV**: Environment flag for development/production modes

### Development Workflow
- **Development**: `npm run dev` starts tsx server with hot reload
- **Type Checking**: `npm run check` validates TypeScript across entire monorepo
- **Database**: `npm run db:push` applies schema changes to database
- **Production**: `npm run build && npm start` for production deployment

### Session Storage
Currently uses in-memory session store (MemoryStore) suitable for development. Production deployments should migrate to persistent session storage like Redis or database-backed sessions for scalability and reliability.

The application is designed to be easily deployed on platforms like Replit, Vercel, or similar hosting providers with PostgreSQL database support.