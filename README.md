# GrandLine Server API

> A robust, scalable backend API for the GrandLine bus rental booking platform, built with Clean Architecture principles.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.6-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-orange.svg)](https://socket.io/)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Architecture Diagram](#architecture-diagram)
- [Contributing](#contributing)

## Overview

GrandLine Server is the backend API powering the GrandLine bus rental booking platform. It provides a comprehensive REST API with real-time capabilities for managing quotes, reservations, drivers, vehicles, payments, and more. The application follows **Clean Architecture** principles, ensuring maintainability, testability, and scalability.

### Key Capabilities

- **Quote Management**: Create, update, and manage quotes through their lifecycle (draft → submitted → quoted → paid)
- **Reservation System**: Handle bookings with payment processing, modifications, and cancellations
- **Driver Management**: Onboard and manage drivers with status tracking
- **Fleet Management**: Manage vehicle types, vehicles, and amenities
- **Real-time Communication**: Socket.io for chat, messages, and notifications
- **Payment Processing**: Stripe integration for secure payments
- **Background Jobs**: Bull queue for driver assignment and scheduled tasks
- **Email Notifications**: Automated emails for quotes, payments, and refunds
- **PDF Generation**: Generate invoices and reservation documents

## Architecture

This project follows **Clean Architecture** principles, organizing code into distinct layers with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Controllers, Routes, Middleware, Socket Handlers)     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   Application Layer                      │
│           (Use Cases, DTOs, Mappers)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Domain Layer                          │
│        (Entities, Repository Interfaces, Services)       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                Infrastructure Layer                      │
│  (Database, Repositories, External Services, Queue)     │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Domain Layer**: Core business logic, entities, and repository interfaces (no external dependencies)
- **Application Layer**: Use cases that orchestrate business operations
- **Infrastructure Layer**: Database implementations, external services, and framework-specific code
- **Presentation Layer**: HTTP controllers, routes, middleware, and Socket.io handlers

## Tech Stack

### Core Technologies

- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache/Queue**: Redis with Bull
- **Real-time**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### External Services

- **Payment Processing**: Stripe
- **Email Service**: Nodemailer
- **File Storage**: Cloudinary
- **PDF Generation**: PDFKit
- **Dependency Injection**: TSyringe

### Development Tools

- **Testing**: Vitest
- **Linting**: ESLint
- **Build Tool**: TypeScript Compiler
- **Logging**: Winston with daily rotation

## Features

### Core Features

- ✅ User authentication (JWT, OTP verification, Google OAuth)
- ✅ Quote creation and management
- ✅ Reservation booking and management
- ✅ Driver onboarding and management
- ✅ Vehicle and fleet management
- ✅ Amenity management
- ✅ Real-time chat and messaging
- ✅ Push notifications
- ✅ Payment processing (Stripe)
- ✅ Email notifications
- ✅ PDF invoice generation
- ✅ Admin dashboard APIs
- ✅ Pricing configuration
- ✅ Route calculation
- ✅ Background job processing

### Advanced Features

- 🔄 Real-time updates via Socket.io
- 📊 Comprehensive analytics and reporting
- 🔐 Role-based access control (Admin/User)
- 📧 Automated email templates
- 💰 Dynamic pricing with tax calculations
- 🚗 Driver assignment automation
- 📱 Deep linking support for mobile app
- 🔍 Advanced filtering and search

## Project Structure

```
server/
├── src/
│   ├── domain/                 # Domain Layer (Business Logic)
│   │   ├── entities/          # Domain entities (Quote, Reservation, Driver, etc.)
│   │   ├── repositories/      # Repository interfaces (contracts)
│   │   └── services/          # Domain services
│   │
│   ├── application/           # Application Layer (Use Cases)
│   │   ├── use-cases/         # Business operation implementations
│   │   ├── dtos/             # Data Transfer Objects
│   │   ├── mapper/           # Entity-DTO mappers
│   │   └── di/               # Dependency injection tokens
│   │
│   ├── infrastructure/         # Infrastructure Layer (External Concerns)
│   │   ├── database/         # MongoDB schemas and connections
│   │   ├── repositories/     # Repository implementations
│   │   ├── service/          # External service integrations
│   │   ├── queue/            # Bull queue setup and workers
│   │   ├── config/           # Server, database, Redis configuration
│   │   └── di/               # Dependency injection setup
│   │
│   ├── presentation/          # Presentation Layer (Entry Points)
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API route definitions
│   │   ├── middleware/       # Auth, validation, error handling
│   │   └── socket_handlers/  # Socket.io event handlers
│   │
│   ├── shared/                # Shared Utilities
│   │   ├── config/           # Configuration constants
│   │   ├── constants/        # Application constants
│   │   ├── logger/           # Logging utilities
│   │   ├── templates/        # Email templates
│   │   ├── types/            # Common types
│   │   └── utils/            # Helper functions
│   │
│   └── index.ts              # Application entry point
│
├── dist/                      # Compiled JavaScript output
├── logs/                      # Application logs
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (v6 or higher) - running locally or connection string
- **Redis** (v6 or higher) - for caching and queue management

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) section)

4. **Ensure MongoDB and Redis are running**:
   - MongoDB: `mongod` (or use MongoDB Atlas)
   - Redis: `redis-server` (or use Redis Cloud)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/grandline
MONGODB_RETRY_ATTEMPTS=3
MONGODB_RETRY_DELAY=1000
MONGODB_CONNECTION_TIMEOUT=30000

# Redis
REDIS_URI=redis://localhost:6379
REDIS_RETRY_ATTEMPTS=3
REDIS_RETRY_DELAY=1000
REDIS_CONNECTION_TIMEOUT=5000

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ACCESS_TOKEN_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d
RESET_PASSWORD_TOKEN_EXPIRY=5m

# CORS
CORS_ORIGIN=http://localhost:5173

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Deep Linking (Mobile App)
SCHEME=grandlinemobile
DEEP_LINK_BASE=grandlinemobile://reset-password
```

## Running the Application

### Development Mode

Run the server in development mode with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Production Mode

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

### Other Scripts

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/google` - Google OAuth login

#### Quotes
- `GET /quotes` - Get user's quotes
- `POST /quotes` - Create a quote draft
- `GET /quotes/:id` - Get quote details
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote
- `POST /quotes/:id/calculate-routes` - Calculate routes
- `POST /quotes/:id/calculate-pricing` - Calculate pricing
- `POST /quotes/:id/submit` - Submit quote

#### Reservations
- `GET /reservations` - Get user's reservations
- `GET /reservations/:id` - Get reservation details

#### Fleet Management
- `GET /vehicle-types` - Get vehicle types
- `GET /vehicles` - Get vehicles
- `GET /amenities` - Get amenities

#### Admin Endpoints
- `GET /admin/users` - Get all users
- `GET /admin/drivers` - Get all drivers
- `GET /admin/quotes` - Get all quotes
- `GET /admin/reservations` - Get all reservations
- `POST /admin/quotes/:id/assign-driver` - Assign driver to quote
- `PUT /admin/reservations/:id/status` - Update reservation status

#### Real-time (Socket.io)
- Chat events: `chat:create`, `chat:message`, `chat:typing`
- Notification events: `notification:new`, `notification:read`
- Message events: `message:send`, `message:delivered`, `message:read`

> **Note**: Full API documentation with request/response examples would be available in a separate API documentation tool (e.g., Swagger/OpenAPI).

## Testing

The project uses **Vitest** for testing with a focus on unit and integration tests.

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only (domain, application, shared layers)
npm run test:unit

# Run integration tests only (infrastructure, presentation layers)
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- Unit tests are located alongside source files (e.g., `*.test.ts`)
- Tests follow the same directory structure as source code
- Domain layer tests focus on business logic
- Integration tests verify database and API interactions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                       │
│              (Web Client / Mobile App / Admin Panel)             │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTP/REST + WebSocket
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    Presentation Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Controllers │  │   Routes     │  │  Socket Handlers     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │                │
│  ┌──────▼─────────────────▼──────────────────────▼──────────┐   │
│  │              Middleware (Auth, Validation, Error)          │   │
│  └──────────────────────────┬─────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                    Application Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │  Use Cases  │  │     DTOs     │  │      Mappers         │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘     │
└─────────┼─────────────────┼──────────────────────┼─────────────────┘
          │                 │                      │
┌─────────▼─────────────────▼──────────────────────▼─────────────────┐
│                       Domain Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │   Entities  │  │ Repositories│  │   Domain Services    │     │
│  │  (Interfaces)│  │ (Interfaces)│  │                      │     │
│  └──────────────┘  └─────────────┘  └──────────────────────┘     │
└─────────┬──────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │  MongoDB     │  │    Redis    │  │   External Services   │     │
│  │ Repositories │  │   (Queue)   │  │ (Stripe, Cloudinary)  │     │
│  └──────────────┘  └─────────────┘  └──────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
```

> **Note**: Add actual architecture diagram image here when available.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Follow Clean Architecture principles** - Keep business logic in domain/application layers
2. **Write tests** - Add tests for new features
3. **Follow TypeScript conventions** - Use strict mode, avoid `any`
4. **Follow naming conventions** - Use snake_case for files, camelCase for variables
5. **Update documentation** - Keep README and code comments up to date

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes following the architecture guidelines
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

ISC

---

**Built with ❤️ using Clean Architecture and TypeScript**

