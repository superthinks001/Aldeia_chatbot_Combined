# Aldeia Combined Platform

A comprehensive monorepo containing the Aldeia chatbot, rebuild platform, and shared components.

## 🏗️ Project Structure

```
aldeia-combined/
├── apps/
│   ├── backend/              # Express.js API server
│   ├── chatbot-frontend/     # React chat interface
│   └── rebuild-platform/     # Next.js rebuild platform
├── packages/
│   ├── shared-types/         # Shared TypeScript types
│   ├── ui-components/        # Shared UI components
│   └── utils/               # Shared utilities
├── data/
│   ├── documents/           # PDF documents
│   └── aldeia.db           # SQLite database
├── docker-compose.yml       # Docker configuration
├── package.json            # Root package.json for monorepo
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Run the migration script** (if not done already):
   ```bash
   ./migration-script.sh
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Development

#### Run all apps simultaneously:
```bash
npm run dev
```

#### Run individual apps:
```bash
# Backend API
npm run backend:dev

# Chatbot Frontend  
npm run frontend:dev

# Rebuild Platform
npm run rebuild:dev
```

## 📱 Applications

### Backend (`apps/backend`)
- **Port**: 3001
- **Tech**: Express.js, TypeScript, SQLite
- **Features**: 
  - Chat API endpoints
  - Document management
  - Database operations
  - Rate limiting and security

### Chatbot Frontend (`apps/chatbot-frontend`)
- **Port**: 3002
- **Tech**: React, TypeScript, Webpack
- **Features**:
  - Interactive chat interface
  - Real-time messaging
  - Confidence indicators
  - Bias warnings

### Rebuild Platform (`apps/rebuild-platform`)
- **Port**: 3000
- **Tech**: Next.js 14, TypeScript, Tailwind CSS
- **Features**:
  - Rebuild project management
  - Design matching
  - User preferences
  - Modern UI with Shadcn/ui

## 📦 Shared Packages

### `@aldeia/shared-types`
Common TypeScript interfaces and types used across all applications.

### `@aldeia/ui-components`
Reusable React components that can be used in both frontend applications.

### `@aldeia/utils`
Shared utility functions for API calls, validation, and common operations.

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps for production |
| `npm run start` | Start all apps in production mode |
| `npm run lint` | Run ESLint on all workspaces |
| `npm run clean` | Clean build artifacts |

## 🛠️ Individual App Scripts

### Backend
```bash
npm run build -w apps/backend
npm run dev -w apps/backend
npm run test -w apps/backend
```

### Chatbot Frontend
```bash
npm run build -w apps/chatbot-frontend
npm run dev -w apps/chatbot-frontend
```

### Rebuild Platform
```bash
npm run build -w apps/rebuild-platform
npm run dev -w apps/rebuild-platform
npm run lint -w apps/rebuild-platform
```

## 🌍 Environment Variables

Key environment variables (see `.env.example`):

- `DB_PATH`: Path to SQLite database
- `BACKEND_PORT`: Backend server port (default: 3001)
- `NEXT_PUBLIC_API_URL`: API URL for frontend apps
- `JWT_SECRET`: Secret for JWT token signing

## 🐳 Docker

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔒 Security Features

- Input sanitization
- Rate limiting
- CORS configuration
- Helmet security headers
- Environment variable validation

## 🧪 Testing

```bash
# Run tests for all packages
npm test

# Run tests for specific package
npm test -w apps/backend
```

## 📝 API Documentation

### Chat Endpoints
- `POST /api/chat` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history

### Document Endpoints  
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document

### Rebuild Platform Endpoints
- `GET /api/rebuild/projects` - Get user projects
- `POST /api/rebuild/projects` - Create new project
- `GET /api/rebuild/designs` - Get design matches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.