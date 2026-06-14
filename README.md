# red-hope

Production-ready Turborepo starter for Red Hope with a Next.js 15 web app, NestJS API, Prisma/PostgreSQL data layer, shared UI, auth utilities, and typed contracts.

## Architecture

```text
red-hope
├── apps
│   ├── web      # Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui-style components
│   └── api      # NestJS API with ConfigModule, ValidationPipe, Swagger, JWT
├── packages
│   ├── auth     # JWT helpers, roles, permission checks
│   ├── config   # Shared TypeScript and ESLint config
│   ├── db       # Prisma schema, client export, seed setup
│   ├── types    # Shared enums, DTOs, Zod schemas
│   └── ui       # Shared React UI primitives
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop

## Getting Started

```bash
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Root Scripts

- `pnpm dev` runs all development servers through Turbo.
- `pnpm build` builds all apps and packages.
- `pnpm lint` runs ESLint across the workspace.
- `pnpm typecheck` validates TypeScript across the workspace.
- `pnpm db:generate` generates Prisma Client.
- `pnpm db:migrate` applies Prisma migrations.
- `pnpm db:seed` runs the Prisma seed.

## Services

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

## Notes

The UI components are implemented with shadcn/ui conventions: Tailwind, Radix-compatible composition, `class-variance-authority`, and `tailwind-merge`. Run `pnpm install` before generating the lockfile or extending the component set with the shadcn CLI.
