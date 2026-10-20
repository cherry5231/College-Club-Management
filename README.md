# College Club Management System

A full-stack college assignment built with React, Vite, CSS, Node.js, Express, and MongoDB.

## Features
- Dashboard summary cards
- Club CRUD (create, read, update, delete)
- Event CRUD
- Student membership registration and deletion
- Search/filter on the frontend
- REST API with MongoDB/Mongoose
- Responsive sidebar/dashboard UI

## Requirements
- Node.js 18+
- MongoDB local server OR a MongoDB Atlas connection string

## 1. Configure the backend
```bash
cd server
cp .env.example .env
```
Edit `.env` and set `MONGODB_URI`. For local MongoDB, the default is:
`mongodb://127.0.0.1:27017/college_club_management`

## 2. Start the backend
```bash
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

## 3. Start the frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`.

## API endpoints
- `GET /api/health`
- `GET, POST /api/clubs`; `GET, PUT, DELETE /api/clubs/:id`
- `GET, POST /api/events`; `GET, PUT, DELETE /api/events/:id`
- `GET, POST /api/members`; `DELETE /api/members/:id`
- `GET /api/dashboard`

## Notes
MongoDB must be running and reachable. If the database is unavailable, the UI displays an API error instead of silently pretending data was saved. Add your own screenshots and student details before submission.
