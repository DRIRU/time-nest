# TimeNest - Service Exchange Platform

A community-driven platform for exchanging services using time credits.

## Project Structure

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

- Service browsing and listing
- User authentication and profiles
- Service request management
- Real-time messaging
- Responsive design with dark mode support

### Getting Started with Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend (FastAPI)

The backend will be implemented using FastAPI and will include:

- RESTful API endpoints
- User authentication and authorization
- Database integration
- Real-time features
- Service and request management

### Getting Started with Backend

```bash
cd backend
# Backend implementation coming soon
```

## Features

- **Service Exchange**: Users can offer and request services using time credits
- **Time Credit System**: Fair exchange where 1 hour = 1 credit
- **User Profiles**: Detailed profiles with ratings and reviews
- **Real-time Chat**: Communication between service providers and requesters
- **Location-based Services**: Find services in your area
- **Categories**: Organized service categories for easy browsing

## Technology Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI components
- Lucide React icons

### Backend (Planned)
- FastAPI
- Python
- PostgreSQL/SQLite
- JWT Authentication
- WebSocket support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.