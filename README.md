# Bazario Backend

Backend API for Bazario — a marketplace application similar to OLX, Avito, and Shpok, built for the Ukrainian market.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Installation](#installation)
- [Configuration]()
- [Running the Project]()
- [API Documentation]()
- [Testing]()
- [License]()

---

## Overview
The **Bazario Backend** serves as the backend logic and API layer for the Bazario application. It handles user authentication, listing creation, and other core functionalities.

---

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Logging**: Winston + Loggly
- **Testing**: Jest
- **API Validation**: express-validator

---

## Features
- **User Authentication**: JWT-based authentication with refresh tokens.
- **Session Management**: Redis for token storage.
- **Device Management**: User devices and login tracking.
- **Email Activation**: Account activation via email with SMTP.
- **Error Handling**: Centralized error handling middleware.
- **Logging**: Console and Loggly integration.
- **Request Validation**: Validates all incoming API requests.

---

## Installation
   ```bash
   git clone https://github.com/Alex-us/bazario-backend.git
   cd bazario-backend
   npm install
   ```

