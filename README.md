# Grocery POS System

A full-stack Point-of-Sale (POS) system for grocery stores with dashboard, inventory management, and real-time notifications.

## 🏗️ Project Structure

### Backend
- **Node.js + Express** server
- SQLite database
- RESTful API routes for:
  - Authentication & Admin management
  - Product & Inventory management
  - Transactions & Sales history
  - Dashboard analytics
  - Notifications

### Frontend
- **React + Vite** for fast development
- **Tailwind CSS** for styling
- **PostCSS** for processing
- Multi-language support (English & Arabic)
- Dark/Light theme toggle
- Real-time notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
node server.js
```

Server runs on `http://localhost:5000` (adjust port in `server.js` if needed)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default)

## 📁 Key Files

- `backend/server.js` - Main server entry point
- `backend/database.js` - Database initialization & queries
- `backend/routes/` - API endpoint handlers
- `frontend/src/App.jsx` - Main React component
- `frontend/src/pages/Login.jsx` - Authentication page
- `frontend/src/context/` - Global state management

## 🔐 Default Admin

See `backend/reset-admin.js` for resetting admin credentials

## 📝 License

MIT
