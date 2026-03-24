# ChartStudio Backend

NestJS backend for chartstudio authentication.

Implemented features:

- User signup
- User signin
- User logout (JWT-protected endpoint)
- PostgreSQL integration with TypeORM
- Migration support for schema changes

## Tech Stack

- NestJS
- PostgreSQL
- TypeORM
- JWT authentication
- class-validator DTO validation
- bcryptjs password hashing

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Configure your PostgreSQL connection and JWT secret in `.env`.

## PostgreSQL With Docker (Development)

Start PostgreSQL container:

```bash
docker compose up -d postgres
```

Stop PostgreSQL container:

```bash
docker compose down
```

The backend connects to this container with these `.env` defaults:

- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5432`
- `DATABASE_USERNAME=postgres`
- `DATABASE_PASSWORD=postgres`
- `DATABASE_NAME=smartchartsdb`

If you run backend inside Docker later, set `DATABASE_HOST=postgres`.

## Environment Variables

Required variables:

- `PORT`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## Run the Project

```bash
# development
yarn migration:run
yarn start:dev

# production build
yarn build
yarn start:prod
```

## Migrations

```bash
# create an empty migration file
yarn migration:create

# generate migration from entity changes
yarn migration:generate

# apply pending migrations
yarn migration:run

# revert the last migration
yarn migration:revert
```

Current migration:

- `20260316000000-CreateUsersTable.ts`

## Authentication Endpoints

Base path: `/users`

- `POST /users/signup`
- `POST /users/signin`
- `POST /users/logout` (requires Bearer JWT)

Request payload for signup/signin:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Successful signup/signin response:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```
