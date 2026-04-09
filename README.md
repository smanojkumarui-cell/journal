# Tech Editor - Journal Publishing Automation Platform

A complete end-to-end workflow management system for academic journal publishing.

## Features

- **Manuscript Management**: Authors submit manuscripts with metadata and file versions
- **Manager Dashboard**: Kanban board for assigning and tracking work to internal/external resources
- **Technical Editor Dashboard**: Task management for copyediting, proof reading, QA
- **Role-based Access**: Author, Manager, Technical Editor, Editor, Reviewer, Admin

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Zustand + @dnd-kit (drag & drop)
- **Backend**: .NET 8 + ASP.NET Core + Entity Framework Core
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

## Quick Start (Local Development)

### Prerequisites

- .NET 8 SDK
- Node.js 20+
- PostgreSQL 15
- Redis 7

### Option 1: Docker Compose

```bash
# Set environment variables (create .env file)
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Start all services
docker-compose up -d
```

### Option 2: Manual Setup

**Backend:**
```bash
cd apps/api
dotnet restore
dotnet build
dotnet run
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@techeditor.com | any |
| Technical Editor | te1@techeditor.com | any |
| Author | author1@techeditor.com | any |

## API Endpoints

```
POST /api/auth/login        - Login with email
GET  /api/auth/me           - Get current user
GET  /api/auth/resources    - Get resource pool
POST /api/auth/freelancer   - Add external freelancer

GET  /api/journals          - List journals
POST /api/journals          - Create journal

GET  /api/manuscripts       - List manuscripts
POST /api/manuscripts       - Create manuscript
POST /api/manuscripts/{id}/versions - Upload file

GET  /api/assignments/kanban - Get Kanban board
POST /api/assignments        - Create assignment
PUT  /api/assignments/{id}/status - Update status

GET  /api/notifications     - Get notifications
```

## Workflow

```
Author submits manuscript
    ↓
Manager receives in Kanban (TO DO)
    ↓
Manager assigns to TE/Copyeditor/Proofreader
    ↓
Technical Editor works on task (In Progress)
    ↓
Submit for Review (Review column)
    ↓
Manager reviews and marks Complete
    ↓
Publication (Phase 2)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection |
| `Redis__ConnectionString` | Redis connection |
| `JWT__Key` | JWT signing key |
| `Google__ClientId` | Google OAuth Client ID |
| `Google__ClientSecret` | Google OAuth Client Secret |

## Project Structure

```
apps/
├── api/                    # .NET backend
│   ├── Controllers/        # API endpoints
│   ├── Services/          # Business logic
│   ├── Models/            # Domain entities
│   ├── Data/              # EF Core DbContext
│   └── DTOs/              # Data transfer objects
└── web/                   # React frontend
    ├── src/
    │   ├── components/    # UI components
    │   ├── pages/         # Route pages
    │   ├── services/      # API client
    │   ├── store/         # Zustand state
    │   └── types/         # TypeScript types
    └── public/
```

## License

Proprietary - Tech Editor Platform