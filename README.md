# Lumina CRM 🏘️

[![Go Version](https://img.shields.io/github/go-mod/go-version/RuslanSidenko/real_estate_CRM?filename=backend%2Fgo.mod)](https://golang.org)
[![Next.js Version](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Lumina CRM** is a modern, high-performance Customer Relationship Management system specifically engineered for real estate professionals. Built with a focus on speed, security, and flexibility, Lumina provides the tools necessary to manage leads, properties, tasks, and deals with ease.

---

## ✨ Key Features

- 👤 **Dynamic RBAC:** Granular role-based access control with customizable permissions for every resource.
- 📋 **Lead Management:** Full CRUD operations for leads, including source tracking and interaction history.
- 🏠 **Property Portfolio:** Manage property listings with detailed attributes, status tracking, and image galleries.
- ⚙️ **Custom Fields:** Extend lead and property data models dynamically via the admin dashboard without code changes.
- 🛡️ **Secure Public API:** Incoming lead generation for external landing pages secured by API Keys.
- 📊 **Analytics Dashboard:** Real-time insights into lead conversion and agent productivity.
- 📅 **Task & Interaction Tracking:** Integrated task management and detailed logging of client interactions (Calls, Emails, Meetings).
- 🤝 **Deal Pipeline:** Track the entire sales cycle from offer to close.
- 🎨 **Modern UI:** Responsive, premium interface built with Next.js 16 and Tailwind CSS.

---

## 🛠️ Technology Stack

### Backend
- **Language:** Go (Golang) 1.25+
- **Framework:** Gin Web Framework
- **Database:** PostgreSQL 15+
- **Authentication:** JWT (JSON Web Tokens)
- **Middleware:** Custom RBAC, CORS, and API Key validation.

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Styling:** Tailwind CSS
- **Typing:** TypeScript
- **Auth handling:** Client-side JWT management.

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Scripting:** Shell / SQL

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (Optional, for local frontend development)
- [Go](https://golang.org/) (Optional, for local backend development)

### Quick Start with Docker
The easiest way to get Lumina CRM running is using Docker Compose:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RuslanSidenko/real_estate_CRM.git
   cd real_estate_CRM
   ```

2. **Launch the services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

### Manual Installation

#### Backend Setup
```bash
cd backend
go mod download
# Set environment variables in .env (see Backend Environment variables below)
go run cmd/api/main.go
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
├── backend/            # Go Gin API Server
│   ├── cmd/            # Main entry points
│   ├── internal/       # Core business logic, handlers, models, repository
│   └── .env            # Backend configuration
├── frontend/           # Next.js Web Application
│   ├── app/            # Next.js App Router (pages & layouts)
│   ├── public/         # Static assets
│   └── components/     # Reusable UI components
├── init.sql            # Initial Database Schema
└── docker-compose.yml  # Container orchestration
```

---

## 🔐 Environment Variables

### Backend (`/backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:password@db:5432/crm_db` |
| `PORT` | API Port | `8080` |
| `JWT_SECRET` | Secret key for token signing | *(Required)* |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Ruslan Sidenko](https://github.com/RuslanSidenko)
