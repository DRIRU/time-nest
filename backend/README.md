# TimeNest Backend

FastAPI backend for the TimeNest service exchange platform.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

1. **Install MySQL**: Make sure you have MySQL installed and running on your system.

2. **Create Database**: Create a new database for TimeNest:
   ```sql
   CREATE DATABASE timenest;
   ```

3. **Update Environment Variables**: Edit the `.env` file with your MySQL credentials:
   ```env
   DATABASE_URL=mysql+pymysql://your_username:your_password@localhost:3306/timenest
   SECRET_KEY=your-secret-key-here-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

### 3. Run the Application

```bash
# From the backend directory
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verify Setup

1. **API Documentation**: Visit `http://localhost:8000/docs` to see the interactive API documentation.

2. **Health Check**: Visit `http://localhost:8000/api/v1/health` to verify the API is running.

3. **Database Tables**: The application will automatically create the `users` table when it starts.

## API Endpoints

### User Registration
- **POST** `/api/v1/users/register`
- **Body**: 
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123",
    "phone_number": "+1234567890",
    "gender": "Male",
    "age": 25,
    "location": "New York, NY"
  }
  ```

### User Login
- **POST** `/api/v1/users/login`
- **Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123"
  }
  ```

### Get Current User
- **GET** `/api/v1/users/me`
- **Headers**: `Authorization: Bearer <access_token>`

## Database Schema

The `users` table is automatically created with the following structure:

```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    gender ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    age INT DEFAULT NULL,
    location VARCHAR(100) DEFAULT NULL,
    total_credits_earned DECIMAL(5,2) DEFAULT 0.00,
    total_credits_spent DECIMAL(5,2) DEFAULT 0.00,
    time_credits DECIMAL(5,2) DEFAULT 0.00,
    services_completed_count INT DEFAULT 0,
    services_availed_count INT DEFAULT 0,
    status ENUM('Active', 'Suspended', 'Deactivated') DEFAULT 'Active',
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

## Security Features

- **Password Hashing**: Uses bcrypt for secure password hashing
- **JWT Authentication**: Implements JWT tokens for user authentication
- **Input Validation**: Comprehensive validation using Pydantic models
- **CORS**: Configured to allow requests from the frontend application

## Development

- **Auto-reload**: The server automatically reloads when you make changes to the code
- **API Documentation**: Interactive docs available at `/docs`
- **Logging**: Comprehensive logging for debugging and monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Error**: 
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure the database exists

2. **Import Errors**:
   - Make sure all dependencies are installed: `pip install -r requirements.txt`
   - Verify you're in the correct directory

3. **CORS Issues**:
   - Frontend URL is configured in `main.py`
   - Update CORS origins if running frontend on different port

### Testing Registration

You can test the registration endpoint using curl:

```bash
curl -X POST "http://localhost:8000/api/v1/users/register" \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Test",
       "last_name": "User",
       "email": "test@example.com",
       "password": "TestPassword123",
       "phone_number": "+1234567890",
       "gender": "Other",
       "age": 25,
       "location": "Test City"
     }'
```