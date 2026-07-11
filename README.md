# Campus Gigs & Rentals

Campus Gigs & Rentals is a full-stack, production-ready, peer-to-peer marketplace application tailored exclusively for college students. It allows students to sign up using verified university emails, post service gigs, accept gigs, list rental items, schedule bookings on availability calendars, complete payments via a secure mock escrow system, rate users, and chat in real-time.

This project is built using a modern TypeScript stack, containerized with Docker, and includes automated testing suites (Jest, Vitest, Playwright E2E).

---

## Workspace Directory Layout

```
├── Docker/
│   ├── docker-compose.yml       # Combines Frontend, Backend, and MongoDB
│   ├── Dockerfile.backend       # Node TS build configuration
│   └── Dockerfile.frontend      # React Vite production Nginx configuration
├── Shared/
│   └── src/
│       └── types.ts             # Shared data interfaces and contracts
├── Backend/
│   ├── src/                     # Modular Monolith Express Server
│   │   ├── config/              # DB and Socket.io setups
│   │   ├── models/              # Mongoose schema models
│   │   ├── controllers/         # MVC handler logic
│   │   ├── routes/              # Routing layers
│   │   └── services/            # Notifications and Sockets dispatchers
│   └── tests/                   # Jest Integration & Route tests
├── Frontend/
│   ├── src/                     # React 18, Vite, Tailwind CSS, TS app
│   │   ├── components/          # Reusable Navbar and UI widgets
│   │   ├── pages/               # Onboarding, Feed, Details, Chat, Profile, Admin
│   │   ├── store/               # Redux Toolkit global states
│   │   └── services/            # Axios and Sockets connections
│   └── vite.config.ts           # Vitest and build configurations
├── Tests/
│   ├── e2e/                     # Playwright user-journey E2E tests
│   └── playwright.config.ts     # Playwright configurations
└── Docs/
    ├── project_report.md        # Comprehensive College Project Report with UML
    ├── testing_report.md        # Summary of tests coverage and execution
    └── api_documentation.md     # REST API requests/responses logs
```

---

## Tech Stack
* **Frontend**: React, TypeScript, Tailwind CSS, Redux Toolkit, TanStack React Query, Axios, Socket.io-client.
* **Backend**: Node.js, Express, TypeScript, Mongoose (MongoDB ORM), Socket.io, jsonwebtoken, bcryptjs.
* **Database**: MongoDB.
* **Testing**: Jest, Supertest, Vitest, React Testing Library, Playwright.
* **DevOps**: Docker, Docker Compose.

---

## Quick Start (Docker Compose)

The easiest way to run the entire stack (Database, Backend, and Frontend) is using Docker Compose:

1. Navigate to the `Docker` directory:
   ```bash
   cd Docker
   ```
2. Build and launch the containers:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   * **Frontend Application**: `http://localhost:3000` (Served via Nginx)
   * **Backend API Server**: `http://localhost:5000`
   * **MongoDB Instance**: `localhost:27017`

---

## Local Development Setup

If you prefer to run the components locally for debugging:

### Prerequisites
* **Node.js** (v18+)
* **MongoDB** running locally on `mongodb://localhost:27017/campus_gigs_rentals`

### 1. Seed the Database
Ensure MongoDB is running, then populate default students, listings, and categories:
```bash
cd Backend
npm run seed
```

### 2. Start the Backend API Server
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus_gigs_rentals
JWT_SECRET=development_secret_key_123
REFRESH_SECRET=development_refresh_key_456
```
Start the development server:
```bash
npm run dev
```
The server will run on `http://localhost:5000` with hot reloading.

### 3. Start the Frontend Dev Server
Start the Vite developer environment:
```bash
cd Frontend
npm run dev
```
The application will run on `http://localhost:5173`. Open your browser and log in with one of the seeded users:
* **Alice Johnson (Student)**: `alice@college.edu` | Password: `password123`
* **Bob Smith (Student)**: `bob@college.edu` | Password: `password123`
* **Admin Moderator (Admin)**: `admin@college.edu` | Password: `password123`

---

## Testing Guide

### Backend Tests
Execute Jest integration tests:
```bash
cd Backend
npm run test
```

### Frontend Tests
Execute Vitest unit and component tests:
```bash
cd Frontend
npm run test
```

### Playwright E2E Tests
With the application running on `http://localhost:3000` (Docker) or `http://localhost:5173` (Vite, change base URL in `Tests/playwright.config.ts` if needed):
```bash
cd Tests
npm install
npx playwright install
npx playwright test
```
This tests the full user lifecycle, including login, gig creation, acceptance, socket messaging, escrow validation, user ratings, and logout.
