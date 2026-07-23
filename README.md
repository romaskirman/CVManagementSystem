# CV Management System

A full-stack web application for managing reusable candidate profiles, customizable position templates, and automatically generated CVs.

## Stack

- TypeScript
- React + Vite
- Express
- PostgreSQL
- Prisma
- Bootstrap 5

## Core Features

- Role-based access: Candidate, Recruiter, Administrator
- Reusable Attribute Library
- Customizable Position Templates
- Automatically Generated CVs
- Global full-text search
- Discussions on position pages
- Likes for CVs
- Two UI languages
- Light and dark themes
- Optimistic locking for auto-save and updates

## Project Structure

```text
cv-management-system/
├─ client/
├─ server/
├─ package.json
├─ .env.example
├─ docker-compose.yml
└─ README.md
```

## Prerequisites

Install:

- Node.js 20+
- npm 10+
- Docker Desktop or local PostgreSQL

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment variables

Create:

- `server/.env`
- `client/.env`

You can start from the root `.env.example` and split the values appropriately.

### 4. Run Prisma migration and seed

These commands will be available after the server files are added:

```bash
npm run prisma:migrate -w server
npm run prisma:seed -w server
```

### 5. Start the application

```bash
npm run dev
```

This will run:

- backend on `http://localhost:4000`
- frontend on `http://localhost:5173`

## Main Functional Areas

### Public
- Register
- Sign in
- Browse positions in read-only mode
- View public statistics

### Candidate
- Manage profile
- Manage reusable attributes
- Manage projects
- Create and edit one CV per position
- Participate in discussions

### Recruiter
- Manage shared attribute library
- Create, duplicate, edit, delete positions
- Configure position access rules
- Browse candidate CVs in read-only mode
- Like CVs
- Participate in discussions

### Administrator
- Full access to all pages
- Manage users and roles
- Edit any profile, position, and CV

## Notes

- Positions and CVs are designed for table views, not gallery/tile layouts.
- The app uses external image hosting rather than storing uploaded images on the app server.
- Optimistic locking is used for profile auto-save, positions, and other concurrent edits.
- Full-text search is implemented with PostgreSQL capabilities.
