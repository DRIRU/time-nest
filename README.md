# TimeNest - Community Service Exchange Platform

TimeNest is a service exchange platform built with Next.js (frontend) and FastAPI (backend). It allows users to offer and request services, manage time credits, communicate via chat, and includes a full moderator/admin system for service approval and platform management.

## Key Features

-   Time-based currency: Exchange services based on time spent, not market rates
-   Skill marketplace: Offer your expertise or find help across diverse categories
-   Community building: Connect with neighbors and build meaningful relationships
-   Inclusive economy: Participate regardless of financial status
-   Trust & safety: Verified profiles, ratings, and secure messaging
-   Service creation, listing, and requests
-   Time credit system for service exchange
-   Ratings and reviews for services
-   Real-time chat between users
-   Admin dashboard for platform management
-   Moderator dashboard and authentication system
-   Service and listing approval workflow (mod approval before listing)

# Project Structure

```
├── frontend/          # Next.js React frontend application
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── contexts/     # React contexts
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility libraries and data
│   ├── public/       # Static assets
│   └── styles/       # CSS styles
├── backend/          # FastAPI backend (to be implemented)
└── README.md         # This file
```

## Frontend (Next.js)

The frontend is built with Next.js 15, React 19, and Tailwind CSS. It includes:

-   Service browsing and listing
-   User authentication and profiles
-   Service request management
-   Real-time messaging
-   Responsive design with dark mode support
-   Admin and moderator dashboards
-   Moderator dashboard with recent activity, service approval, and user management

### Getting Started with Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend (FastAPI)

The backend is implemented using FastAPI and includes:

-   RESTful API endpoints
-   User, admin, and moderator authentication and authorization
-   Database integration (MySQL)
-   Real-time features (WebSocket support)
-   Service and request management
-   Moderator approval automatically creates moderator accounts with user credentials
-   Service and listing approval logic (moderator must approve before listing)

### Getting Started with Backend

```bash
cd backend
# Backend implementation coming soon
```

## Features

See above for full feature list. Highlights:

-   Service Exchange: Users can offer and request services using time credits
-   Time Credit System: Fair exchange where 1 hour = 1 credit
-   User Profiles: Detailed profiles with ratings and reviews
-   Real-time Chat: Communication between service providers and requesters
-   Location-based Services: Find services in your area
-   Categories: Organized service categories for easy browsing
-   Moderator and admin dashboards for platform management

## Technology Stack

### Frontend

-   Next.js 15
-   React 19
-   TypeScript
-   Tailwind CSS
-   Radix UI components
-   Lucide React icons

### Backend (Planned)

-   FastAPI
-   Python
-   My SQL
-   JWT Authentication
-   WebSocket support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Chat Feature

-   Real-time chat between users
-   Context-aware conversations (linked to services/requests)
-   Message status tracking (sent, delivered, read)
-   RESTful chat API endpoints
-   Chat data layer and components in frontend
-   See `CHAT_IMPLEMENTATION.md` for full schema and API details

## Moderator System

-   Moderator application and approval workflow
-   Moderator authentication and dashboard
-   Service/listing approval by moderators
-   Moderator management by admin
-   Moderator accounts use existing user credentials (no separate password)

## Cache Clearing

If you encounter stale data or build issues, clear caches as follows:

### Frontend (Next.js)

```
rm -rf .next
npm run dev
```

### Backend (Python/FastAPI)

```
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -name "*.pyc" -delete
```

Also clear browser cache (Ctrl+F5) if UI changes do not appear.

## To Do

-   Display reviews on services
-   Add moderator functions (dashboard, approval, user management)
-   Make services and listings mod approval based before listing
