# GRABAMOVIE - Movie Discovery Platform

A full-stack movie discovery and management platform built with React and Node.js.

## Features

- 🎬 Movie browsing and search
- ⭐ User ratings and reviews
- 💬 Comments and discussions
- 📝 Movie quizzes
- ⚔️ Movie battles
- 🔥 Trending & Popular movies
- 👤 User profiles and favorites
- 🎫 Ticket booking system
- 👨‍💼 Admin panel for content management

## Tech Stack

### Frontend
- React 19
- Vite
- CSS3

### Backend
- Node.js 20
- Express.js
- PostgreSQL
- Cloudinary (for media uploads)
- TMDB API (for movie data)

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Cloudinary account (for image/video uploads)
- TMDB API key (optional, for "Soon to be Released" feature)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/lecture_GrabAMovie.git
   cd lecture_GrabAMovie
   ```

2. **Set up Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database and API credentials
   npm run init-db
   npm start
   ```

3. **Set up Frontend**:
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your backend API URL
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## Environment Variables

### Backend (.env)
See `backend/.env.example` for required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `CLOUDINARY_URL`: Cloudinary credentials
- `TMDB_API_KEY`: TMDB API key (optional)
- `JWT_SECRET`: Secret for JWT tokens
- `PORT`: Server port (default: 4000)

### Frontend (.env)
See `frontend/.env.example` for required variables:
- `VITE_API_BASE_URL`: Backend API URL

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to:
- **Backend**: Google Cloud Platform (Cloud Run/App Engine)
- **Frontend**: Vercel
- **Database**: Google Cloud SQL

## Project Structure

```
.
├── backend/           # Node.js backend
│   ├── src/          # Source code
│   │   ├── migrations/  # Database migrations
│   │   └── server.js    # Main server file
│   ├── Dockerfile    # Docker configuration
│   └── app.yaml      # Google App Engine config
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── vercel.json   # Vercel configuration
└── docs/            # Documentation

```

## Scripts

### Backend
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run init-db`: Initialize database schema

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
