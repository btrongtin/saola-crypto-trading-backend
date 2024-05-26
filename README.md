# Crypto Trading Backend Services

This repository contains two backend services: Account Manager and Transaction Manager, which manage user accounts and transactions (send/withdraw) for a crypto trading application. The services are built using Fastify, Prisma ORM with MongoDB, Firebase auth for authentication, and Docker for containerization.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)

## Project Overview

The application provides the following features:

- **User Registration and Login**: Users can register and log in to the system.
- **Account Management**: Each user can have multiple accounts (e.g., credit, debit, loan).
- **Transaction Management**: Users can send and withdraw funds, with all transactions being recorded.

## Architecture

The application consists of two main services:

1. **Account Manager Service**:

   - Manages user registration, login, and account information.
   - Routes:
     - [POST] `/api/accounts/register`: Register a new user with accounts.
     - [POST] `/api/accounts/login`: Login a user.
     - [GET] `/api/accounts`: Get user accounts (requires authentication).
     - [GET] `/api/accounts/:accountId/transactions`: Get transactions for a specific account (requires authentication).

2. **Transaction Manager Service**:
   - Manages sending and withdrawing funds between accounts.
   - Routes:
     - [POST] `/api/transactions/send`: Send funds to another account (requires authentication).
     - [POST] `/api/transactions/withdraw`: Withdraw funds from an account (requires authentication).

## Running the application

- Clone the repo to your local machine
  ```bash
  git clone https://github.com/your-repo/crypto-trading-backend.git
  cd crypto-trading-backend
  ```
- Setup environment variables: put the `.env` file I shared with you via email to the root folder
- Run the application with docker-compose:
  ```bash
  docker-compose up
  ```

## API documentation

API documentation is provided using Swagger. Once the application is running, you can access the Swagger UI at:

```bash
    http://localhost:3000/docs
```
