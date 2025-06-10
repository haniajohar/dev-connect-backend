# DevConnect-Lite Backend

A simplified backend service for a developer-client platform built with Node.js, Express, and MongoDB.

## 🚀 Features

### Core Features
- **User & Developer Registration/Login** with JWT authentication
- **Project Management** - Users can create projects with tech stack and budget
- **Bidding System** - Developers can bid on open projects
- **Role-based Access Control** - Different permissions for users and developers

### Bonus Features
- **Bid Management** - Accept/reject bids with automatic project assignment
- **Project Export** - Export user's projects to JSON format
- **Pagination** - Efficient data retrieval with pagination
- **Advanced Filtering** - Filter projects by tech stack and budget range

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt
- **Validation**: express-validator
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd devconnect-lite-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit the `.env` file with your configurations:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 4. Start MongoDB
Make sure MongoDB is running on your system or use MongoDB Atlas.

### 5. Run the application
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### 1. User Registration
```http
POST /auth/signup/user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "company": "Tech Corp" // optional
}
```

#### 2. Developer Registration
```http
POST /auth/signup/developer
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": 3, // optional
  "portfolio": "https://janesmith.dev" // optional
}
```

#### 3. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Project Endpoints

#### 4. Create Project (Users Only)
```http
POST /projects/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "E-commerce Website",
  "description": "Need a modern e-commerce platform",
  "techStack": ["React", "Node.js", "MongoDB"],
  "estimatedBudget": 5000,
  "deadline": "2024-12-31" // optional
}
```

#### 5. Get Open Projects (Developers Only)
```http
GET /projects/open?page=1&limit=10&techStack=React&minBudget=1000&maxBudget=10000
Authorization: Bearer <jwt_token>
```

#### 6. Get Project Bids (Project Owner Only)
```http
GET /projects/:projectId/bids
Authorization: Bearer <jwt_token>
```

#### 7. Export Projects (Users Only)
```http
GET /projects/export
Authorization: Bearer <jwt_token>
```

### Bid Endpoints

#### 8. Place Bid (Developers Only)
```http
POST /bids/place
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "projectId": "64a1234567890abcdef12345",
  "bidAmount": 4500,
  "message": "I can deliver this project with high quality",
  "estimatedDelivery": "2024-11-30" // optional
}
```

#### 9. Get My Bids (Developers Only)
```http
GET /bids/my?status=pending&page=1&limit=10
Authorization: Bearer <jwt_token>
```

#### 10. Update Bid Status (Users Only)
```http
PUT /bids/:bidId/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "accepted" // or "rejected"
}
```

## 🗂️ Project Structure

```
devconnect-lite-backend/
├── models/
│   ├── User.js          # User & Developer model
│   ├── Project.js       # Project model
│   └── Bid.js           # Bid model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── projects.js      # Project management routes
│   └── bids.js          # Bidding system routes
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── server.js            # Main application entry point
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md           # Project documentation
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 7 days by default (configurable via JWT_EXPIRES_IN).

## 👥 User Roles

### User (Client)
- Register/Login
- Create projects
- View bids on their projects
- Accept/reject bids
- Export their projects

### Developer
- Register/Login
- View open projects
- Place bids on projects
- View their own bids

## 🧪 Testing with Postman

1. Import the Postman collection (if provided)
2. Set up environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: `<jwt_token_after_login>`

3. Test the endpoints in this order:
   - Register user and developer
   - Login to get tokens
   - Create project (as user)
   - View open projects (as developer)
   - Place bid (as developer)
   - View bids (as project owner)
   - Accept/reject bid (as project owner)

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## 🔒 Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token-based authentication
- Input validation and sanitization
- Role-based access control
- MongoDB injection prevention
- CORS configuration

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devconnect-lite
JWT_SECRET=very-long-and-complex-secret-key-for-production
```

### MongoDB Atlas Setup
1. Create account at MongoDB Atlas
2. Create cluster and database
3. Get connection string
4. Update MONGODB_URI in .env

## 📈 Performance Considerations

- Database indexes on frequently queried fields
- Pagination for large data sets
- Password hashing optimization
- JWT token expiration handling
- Input validation to prevent malicious requests

## 🐛 Known Issues & Limitations

- No email verification for registration
- No password reset functionality
- No file upload for project attachments
- No real-time notifications
- No payment processing integration

## 🔄 Future Enhancements

- Email notifications for bids and project updates
- File upload functionality for project attachments
- Real-time chat between users and developers
- Payment processing integration
- Advanced search and filtering
- Project milestone tracking
- Review and rating system

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, contact: trustnexus.co@gmail.com