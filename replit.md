# Funil - Landing Page and Registration System

## Overview
Funil is a video-based landing page application designed to capture leads through a multi-step funnel process. It features a video presentation that tracks user engagement, a registration form for user information, and an administrative dashboard for monitoring visitor analytics and managing registrations. The system aims to provide a robust platform for lead generation and analytics, built with a React frontend, Express.js backend, and SQLite database (arquivo local database.db versionado no Git para 100% de portabilidade).

## Recent Changes (November 2025)

### Analytics System - Critical Bug Fixes
**Date**: November 13, 2025
**Status**: ✅ Fully Fixed and Tested

Completed comprehensive revision and correction of the analytics system. All critical bugs have been fixed and the system is now 100% functional.

**Problems Identified and Fixed:**
1. **CRITICAL**: `analytics.init()` was never being called in App.tsx, preventing all data collection
2. **CRITICAL**: DNT (Do Not Track) logic was inverted - blocking users when DNT was null/absent instead of when explicitly enabled
3. **CRITICAL**: Frontend and backend had misaligned DNT verification logic
4. **HIGH**: Google Analytics and Vercel Analytics were not respecting DNT settings
5. **HIGH**: DNT header was not being sent in analytics requests from frontend to backend

**Corrections Applied:**
- ✅ Fixed DNT logic in `src/utils/analytics.ts` - now only blocks when DNT is explicitly '1' or 'yes'
- ✅ Added `analytics.init()` call in `src/App.tsx` with proper DNT verification
- ✅ Made Google Analytics respect DNT in all functions (`trackPageView`, `trackEvent`, `trackDemographics`)
- ✅ Made Vercel Analytics respect DNT (only loads when DNT is not active)
- ✅ Fixed backend DNT logic in `server/index.js` to align with frontend
- ✅ Added DNT header to all analytics requests from frontend
- ✅ Fixed special DNT verification in `/api/analytics/signals` endpoint

**Verification:**
- ✅ System tested and collecting data correctly (11 visitors, 10 page views, 191 events)
- ✅ Geolocation working (Brazil/Araras, USA/North Charleston)
- ✅ Device and browser detection working (Desktop/Chrome)
- ✅ All changes reviewed and approved by Architect agent
- ✅ DNT compliance verified across all systems (custom analytics, GA4, Vercel)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React 18 with TypeScript, Vite, Tailwind CSS, React Router DOM v7, Lucide React, Recharts (data visualization).
- **Page Structure**: Multi-page funnel including Landing, Registration, Confirmation, Admin Login, and Admin Dashboard.
- **State Management**: Component-level state using React hooks.
- **Design Rationale**: Single-page navigation in `MainApp` for smooth transitions, separated admin routes for security and independent deployment, TypeScript for type safety.
- **Data Visualization**: Apache ECharts with echarts-gl for professional 3D visualizations. Interactive pie and bar charts with glassmorphism design, customizable palettes, and real-time filtering. Includes comprehensive configuration system with server-side persistence.

### Backend Architecture
- **Technology Stack**: Node.js with ES modules, Express.js 5, SQLite (`better-sqlite3` library), JWT for authentication with bcrypt.
- **API Structure**: RESTful endpoints under `/api` for admin, analytics, visitor tracking, events, and registration.
- **Authentication Mechanism**: JWT tokens in HTTP-only cookies, `authMiddleware` for protected routes, bcrypt (10 salt rounds) for password hashing.
- **Server Configuration**: Port 3001, CORS configured, environment-based configuration, banco de dados SQLite em arquivo local (database.db).
- **Design Decisions**: JWT in cookies for XSS protection, separate admin authentication, environment variables for sensitive configurations.
- **Word Import/Export**: Endpoints for exporting reports to `.docx` (`/api/admin/export/word`) and importing data from `.docx` (`/api/admin/import/word`). Includes robust validation and data extraction.

### Data Storage
- **Database**: SQLite (arquivo database.db - 100% versionado no Git).
- **Schema Design**:
    - `admins`: Stores admin credentials.
    - `visitors`: Tracks unique visitors, geolocation, device info, and engagement.
    - `registrations`: Stores user registration data linked to visitors.
    - `events`: Records user interactions and custom events.
    - `page_views`: Records page views with time spent and scroll depth.
- **Database Connection**: SQLite síncrono via `better-sqlite3` com WAL mode habilitado para melhor performance.
- **Data Persistence Strategy**: Visitor tracking via `localStorage`, session tracking via `sessionStorage`, database stores all historical analytics and registration data.
- **Migrations**: Automatic database migration system (`server/migrations/init-sqlite.sql`) runs on server startup, creating tables and indexes if they don't exist.
- **Database Maintenance**: Scripts disponíveis em `scripts/` para verificar (`check-database.js`) e limpar (`clean-all-analytics.js`) dados de analytics. Ver `INSTRUCOES-ANALYTICS.md` para detalhes completos sobre como evitar dados falsos durante desenvolvimento.

### System Design Choices
- **Comprehensive Analytics**: Automatic visitor tracking, event tracking, page view analytics, and registration tracking with geolocation and device info.
- **Admin Dashboard**: Secure administrative interface providing real-time statistics, visitor details, registration management, and event visualization with automatic data refresh every 10 seconds.
- **Real-Time Data Updates**: Dashboard automatically refreshes all analytics data every 10 seconds without page reload, maintaining scroll position and user navigation state. Features include:
  - Silent background polling with dual-state loading (initial vs. refresh)
  - Visual refresh indicator showing "Atualizando..." when fetching new data
  - Timestamp display showing last update time
  - No page flicker or scroll reset during updates
  - Proper error handling with automatic logout on 401 errors
- **Visual Analytics Dashboard**: Professional 3D charts with artistic glassmorphism cards showing device distribution, browser usage, geographic locations, operating systems, and registration sources. Features include:
  - 6 interactive charts (4 pie charts with 3D visual effects, 2 real 3D bar charts)
  - Comprehensive configuration modal with per-chart customization
  - 5 color palettes (default, vibrant, ocean, sunset, forest)
  - Toggle between 2D/3D modes, labels, animations, and auto-rotation
  - Server-side persistence of user preferences per admin account
  - All charts dynamically update based on applied filters (date range, location, device type, search terms)
- **Permanent Admin Users**: Two perpetual admin accounts (Victor and Julio) stored in SQLite database with bcrypt-hashed passwords. Julio has password change functionality on first login.
- **Security Enhancements**: JWT with `sameSite: strict`, CORS restrictions, bcrypt hashing, protected admin routes, and environment flag (`ALLOW_ADMIN_CREATION`) for admin creation.
- **Portability**: Project structured for complete portability between Replit accounts and development environments, with versioned code, database schema, and configuration, and clear steps for migration.

## External Dependencies

### Third-Party Services
- **ipapi.co**: For geolocation data in analytics.

### Frontend Libraries
- **React Router DOM**: Client-side routing.
- **Lucide React**: Icon system.
- **Tailwind CSS**: Utility-first styling.
- **Apache ECharts**: Professional charting library with extensive customization.
- **echarts-gl**: 3D visualization extension for ECharts.
- **echarts-for-react**: React wrapper for ECharts integration.

### Backend Libraries
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT token generation and verification.
- **cookie-parser**: Cookie parsing middleware.
- **cors**: Cross-origin resource sharing.
- **dotenv**: Environment variable management.
- **better-sqlite3**: SQLite client (sícrono e de alta performance).
- **docx**: Creation of `.docx` documents.
- **mammoth**: Reading of `.docx` documents.
- **multer**: Secure file uploads.

### Development Tools
- **ESLint**: Code quality.
- **TypeScript**: Static type checking.
- **Vite**: Development server and build optimization.
- **Concurrently**: Running multiple servers.

### Environment Configuration
- `JWT_SECRET`: Secret key for JWT signing.
- `ALLOWED_ORIGINS`: CORS allowed origins.
- `PORT`: Backend server port.
- `NODE_ENV`: Environment mode.
- `ALLOW_ADMIN_CREATION`: Security flag for admin creation.