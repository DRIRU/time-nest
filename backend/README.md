# TimeNest Backend

FastAPI backend for the TimeNest service exchange platform.

## Overview

This backend will provide RESTful API endpoints for the TimeNest frontend application, handling user authentication, service management, and real-time features.

## Planned Features

- **User Management**
  - User registration and authentication
  - Profile management
  - JWT token-based authentication

- **Service Management**
  - CRUD operations for services
  - Service categorization and filtering
  - Search functionality

- **Request Management**
  - Service request creation and management
  - Proposal system
  - Status tracking

- **Time Credits System**
  - Credit balance management
  - Transaction history
  - Credit transfer between users

- **Real-time Features**
  - WebSocket support for chat
  - Real-time notifications
  - Live updates

- **Database**
  - PostgreSQL for production
  - SQLite for development
  - Database migrations
  - Data validation

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Alembic**: Database migration tool
- **Pydantic**: Data validation using Python type annotations
- **JWT**: JSON Web Tokens for authentication
- **WebSockets**: Real-time communication
- **PostgreSQL**: Production database
- **SQLite**: Development database

## Getting Started

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies (when requirements.txt is created)
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload
```

## API Documentation

Once implemented, the API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   └── dependencies/
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── models/
│   │   └── database.py
│   ├── schemas/
│   └── services/
├── alembic/
├── tests/
├── requirements.txt
└── main.py
```

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost/timenest
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Development

This backend is designed to work seamlessly with the Next.js frontend located in the `../frontend` directory.

## Contributing

Please refer to the main project README for contribution guidelines.