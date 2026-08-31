# GenAI Interview Preparation Platform

A full-stack MERN application that provides AI-driven technical and behavioral interview practice, leveraging real-time voice, video, and text interactions.

## 🚀 Features

- **Live Video Interviews**: Practice with an AI hiring manager that asks follow-up questions using Web Speech API for real-time transcription and voice synthesis.
- **Voice-Only Calls**: Phone-screen style interviews with a continuous back-and-forth conversational AI.
- **ATS Resume Parsing**: Upload a resume (PDF) and paste a job description. The AI extracts skills, matches qualifications, and generates a personalized interview plan.
- **AI Feedback & Scoring**: Every interview generates a detailed scorecard, filler-word analysis, and actionable feedback for improvement.
- **Secure Authentication**: JWT-based authentication with token blacklisting, plus optional Google OAuth integration.
- **Rate Limiting**: Built-in API rate limiting to prevent abuse (general endpoints, auth, and AI-heavy endpoints).

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router, SCSS, React Hot Toast
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **AI Integration**: `@google/genai` (Gemini API)
- **Authentication**: Passport.js, JWT, bcryptjs
- **Testing**: Jest, Supertest

## 📦 Installation

### Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas)
- Google Gemini API Key

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd "Gen Ai Proj"
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```
   Create a `.env` file in the Backend directory:
   ```env
   PORT=5050
   MONGO_URI=mongodb://127.0.0.1:27017/interview_platform
   JWT_SECRET=your_jwt_secret
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   CLIENT_URL=http://localhost:5173
   
   # Optional: For Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Optional: For Email Notifications
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend
   npm install
   ```
   Create a `.env` file in the Frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5050/api
   ```

## 🐳 Running with Docker (Recommended)

The easiest way to run the entire stack (Frontend, Backend, and MongoDB) is using Docker Compose.

1. Ensure [Docker](https://docs.docker.com/get-docker/) is installed and running.
2. From the root of the project, run:
   ```bash
   docker-compose up -d --build
   ```
3. The platform is now live!
   - **Frontend**: http://localhost:5173
   - **Backend**: http://localhost:5050
4. To stop the containers, run:
   ```bash
   docker-compose down
   ```

## 🚦 Running Locally (Without Docker)

1. Start the backend server:
   ```bash
   cd Backend
   npm run dev
   ```

2. Start the frontend dev server:
   ```bash
   cd Frontend
   npm run dev
   ```

## 🧪 Testing

The backend includes integration tests for the authentication and interview controllers.

```bash
cd Backend
npm test
```

## 🔒 Security

- Passwords are cryptographically hashed using `bcryptjs`.
- Session management via HTTP-only, secure cookies with JWT.
- Rate limiting prevents brute force and API abuse:
  - `authLimiter`: 10 requests per 15 minutes.
  - `aiLimiter`: 20 requests per 15 minutes.
  - `generalLimiter`: 100 requests per 15 minutes.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a Pull Request if you'd like to improve the platform.
