# Dagsap Document Tracking Apps

A full-stack web and mobile web application for tracking physical documents across multiple locations. Built to replace manual logs with a transparent, role-based chain-of-custody system.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js (Node.js)
- **Database**: PostgreSQL (via Prisma ORM)
- **State Management**: React Context
- **Testing**: Vitest, Supertest

## Features
- **Role-Based Access Control**: Differentiates between Web Admin (Dashboard) and Field Ops (Mobile).
- **Live Document Tracking**: Monitor document status and transit locations.
- **QR Code Scanning**: Quick scan utility for logging document movements.
- **Detailed History**: Every status change is recorded with timestamps and user details.

## Prerequisites
- Node.js (v18+)
- PostgreSQL server (running locally or cloud)
- `bun` (Package Manager) - *Note: The official package manager for this project is Bun.*

## Installation & Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/aslamrdhn/Dagsap-Document-Tracking-Apps.git
   cd Dagsap-Document-Tracking-Apps
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   bun install
   \`\`\`

3. **Configure Environment Variables**
   Copy the example environment file and configure your database connection:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   *Example `.env` configuration:*
   \`\`\`env
   # PostgreSQL connection string
   DATABASE_URL="postgresql://user:password@localhost:5432/dagsap_db"
   
   # JWT Secret for Authentication
   JWT_SECRET="your-super-secret-key-change-this-in-production"
   \`\`\`

4. **Initialize Database (Prisma)**
   Run migrations to create the database schema:
   \`\`\`bash
   bunx prisma migrate dev --name init
   \`\`\`
   
   *(Optional) Seed the database with initial users and data:*
   \`\`\`bash
   bunx prisma db seed
   \`\`\`

5. **Start the Development Server**
   \`\`\`bash
   bun run dev
   \`\`\`
   The application will be available at `http://localhost:3000`. This starts both the frontend Vite server and backend Express server concurrently.

## Testing
This project uses Vitest for unit and integration tests.
\`\`\`bash
bun test
\`\`\`

## Project Structure
\`\`\`
├── src/
│   ├── components/    # Reusable React components
│   ├── contexts/      # React Contexts (e.g., AuthContext)
│   ├── layouts/       # Structural layouts (AdminLayout, MobileLayout)
│   ├── lib/           # Utility functions (e.g., api fetch wrapper)
│   ├── pages/         # Page components (Admin dashboard, Login, Scanner)
│   └── server/        # Express backend, Prisma client, and API routes
├── prisma/
│   └── schema.prisma  # Database schema definitions
├── public/            # Static assets (images, icons)
├── dist/              # Production build output
├── .env.example       # Example environment variables template
└── vite.config.ts     # Vite bundler configuration
\`\`\`
