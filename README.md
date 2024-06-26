# Crypto Trading Backend Services

This repository contains two backend services: Account Manager and Transaction Manager, which manage user accounts and transactions (send/withdraw) for a crypto trading application. The services are built using Fastify, Prisma ORM with MongoDB, Firebase auth for authentication, and Docker for containerization.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Running the Application](#running-the-application)
- [Common Issues](#common-issues)
- [API Documentation](#api-documentation)

## Key Features

**User Authentication and Registration**

- Users can register with their email and password, with credentials securely managed using Firebase Authentication.
- After logging in, clients receive an Access Token, which they must use to call other APIs.

**Account Management**

- Users can have multiple accounts (e.g., credit, debit, loan). For the scope of this assignment, users must submit a list of accounts in the request body during registration.
- Users can retrieve all their accounts (requires access token). I have implemented caching to reduce database queries; user account data will be cached for 1 minute.
- Users can get all transactions for specific accounts (requires access token).

**Transactions**

- Transactions are processed by a simulated API. I use Prisma transactions to ensure data consistency. Make sure to rollback transaction when errors occur.
- Users can send money from one account to another, money will be converted to the recipient currency.
- Users can withdraw money from an account.

**Data validation**

- I use Fastify's schema validation to ensure that all API requests and responses adhere to predefined formats.
- The schemas validate request bodies, query parameters, headers, and responses to cover all aspects of API communication.
  Swagger Integration
- I integrated Swagger for API documentation, providing a clear and interactive interface for developers to understand and interact with the API endpoints.

## Tech Stack

- Backend
  - Node.js: The core runtime environment powering the backend, known for its performance and scalability.
  - Fastify: A high-performance web framework for Node.js, chosen for its speed and low overhead.
  - Firebase: Used for authentication.
  - Prisma: An ORM (Object-Relational Mapping) tool for efficient database management and querying.
  - TypeScript: Enhances JavaScript with static typing, improving code quality and maintainability.
- Development tools
  - Docker: The application is containerized using Docker, ensuring consistent environments across development, testing, and production.
  - TSX: Used to run TypeScript files directly, supporting hot-reloading for a smoother development experience.
- Documentation
  - Swagger: The app uses Swagger for API documentation, providing a clear and interactive interface for developers to understand and interact with the API endpoints.

## Architecture

The application consists of two main services:

1. **Account Manager Service**:

   - Manages user registration, login, and account information.
   - Routes:
     - [POST] `/api/accounts/register`: Register a new user with accounts.
     - [POST] `/api/accounts/login`: Login a user, after login, client will receive an `access token`.
     - [GET] `/api/accounts`: Get all accounts of the logged-in user (requires authentication), client can pass the `skip` and `limit` query for pagination.
     - [GET] `/api/accounts/:accountId/transactions`: Get transactions for a specific account (requires authentication), client can pass the `skip` and `limit` query for pagination.

**_Note: see [API Documentation](#api-documentation) for details API documentation_**

2. **Transaction Manager Service**:

   - Manages sending and withdrawing funds between accounts.
   - Routes:

     - [POST] `/api/transactions/send`: Send funds to another account (requires authentication).

     ```mermaid
        sequenceDiagram
        autonumber
        participant Client
        participant FastifyServer
        participant Database
        participant SimulatedAPI

        Client->>FastifyServer: POST /send
        FastifyServer->>Database: Retrieve user with email and accounts
        Database-->>FastifyServer: User and accounts data

        alt Account ID is the same as To Address
            FastifyServer-->>Client: 400 Cannot send to yourself
        else Account ID is different from To Address
            FastifyServer->>Database: Retrieve recipient account with id: toAddress
            Database-->>FastifyServer: Recipient account data

            alt Recipient account not found
                FastifyServer-->>Client: 404 Recipient account not found
            else Recipient account found
                FastifyServer->>FastifyServer: Convert amount to recipient's currency

                alt Sender account not found or does not belong to user
                    FastifyServer-->>Client: 401 Cannot perform this action
                else Sender account found
                    alt Insufficient balance
                        FastifyServer-->>Client: 400 Insufficient balance
                    else Sufficient balance
                        FastifyServer->>Database: Create transaction with status 'pending'
                        Database-->>FastifyServer: Transaction data

                        FastifyServer->>SimulatedAPI: Process transaction
                        SimulatedAPI-->>FastifyServer: Transaction processed

                        FastifyServer->>Database: Begin transaction
                        par Update sender account balance
                            FastifyServer->>Database: Decrement sender balance
                        and Update receiver account balance
                            FastifyServer->>Database: Increment receiver balance
                        and Update transaction status
                            FastifyServer->>Database: Update transaction to 'completed'
                        end
                        Database-->>FastifyServer: Transaction updates

                        FastifyServer-->>Client: 200 Transaction completed successfully
                    end
                end
            end
        end

        alt Error occurs
            FastifyServer->>Database: Update transaction to 'cancelled'
            Database-->>FastifyServer: Transaction status updated
            FastifyServer-->>Client: 500 Internal server error
        end

     ```

     - [POST] `/api/transactions/withdraw`: Withdraw funds from an account (requires authentication).

     ```mermaid
        sequenceDiagram
        autonumber
        participant Client
        participant FastifyServer
        participant Database
        participant SimulatedAPI

        Client->>FastifyServer: POST /withdraw
        FastifyServer->>Database: Retrieve user with email and accounts
        Database-->>FastifyServer: User and accounts data

        alt Account not found or does not belong to user
            FastifyServer-->>Client: 403 Cannot perform this action
        else Account found
            alt Insufficient balance
                FastifyServer-->>Client: 400 Insufficient balance
            else Sufficient balance
                FastifyServer->>Database: Create transaction with status 'PENDING'
                Database-->>FastifyServer: Transaction data

                FastifyServer->>SimulatedAPI: Process transaction
                SimulatedAPI-->>FastifyServer: Transaction processed

                FastifyServer->>Database: Begin transaction
                par Update sender account balance
                    FastifyServer->>Database: Decrement sender balance
                and Update transaction status
                    FastifyServer->>Database: Update transaction to 'COMPLETED'
                end
                Database-->>FastifyServer: Transaction updates

                FastifyServer-->>Client: 200 Transaction completed successfully
            end
        end

        alt Error occurs
            FastifyServer->>Database: Update transaction to 'CANCELLED'
            Database-->>FastifyServer: Transaction status updated
            FastifyServer-->>Client: 500 Internal server error
        end
     ```

## Running the application

#### Step 1: Clone the Repository

```bash
git clone https://github.com/btrongtin/saola-crypto-trading-backend
cd saola-crypto-trading-backend
```

#### Step 2: Set Up Environment Variables:

Put the `.env` file I shared with you via email to the root folder (**please rename the file to `.env` if it was automatically renamed to `env` by Gmail**).

#### Step 3: Run the Application with Docker Compose

Navigate to the root directory of the cloned repository and run the following command:

```bash
docker-compose up
```

### Common Issues

- **Conflict Prisma client build**: When the `schema.prisma` file is updated, the old Docker build might not use the latest Prisma client. To fix this, remove the old build by running the following commands
```bash
docker-compose down --rmi all -v
docker-compose up --build
```

## API documentation

API documentation is provided using Swagger. Once the application is running, you can access the Swagger UI at:

```bash
    http://localhost:3000/docs
```

![swagger demo](https://github.com/btrongtin/saola-crypto-trading-backend/blob/main/swagger-demo.png?raw=true)