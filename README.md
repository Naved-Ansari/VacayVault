# ✈️ VacayVault — Personal Travel Expense Tracker

VacayVault is a simple, modern, responsive travel expense tracker built for personal use. It lets you organize trips, log travel expenses across foreign currencies with live INR conversion, visualize spending breakdowns with charts, and export PDF travel reports.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or newer
- **PostgreSQL**: Running locally on port `5432` with a database named `vacayvault`
  - Default user: `postgres`
  - Default password: `admin` (can be customized in `server/.env`)

If the database doesn't exist yet, create it in PostgreSQL:
```sql
CREATE DATABASE vacayvault;
```

---

### 2. How to Run the Application

You can run the app in **one terminal** (from the root) or in **two separate terminals**:

#### Option A: One-Command Startup (Recommended)
From the repository root (`VacayVault`):
```bash
npm install
npm run dev
```
*This concurrently boots up both the backend API server and the Vite frontend client.*

#### Option B: Separate Terminals

**Terminal 1 — Backend Server (Express + PostgreSQL):**
```bash
cd server
npm install
npm run dev
```
*Runs on [http://localhost:5000](http://localhost:5000). On startup, it automatically creates any missing database tables, seeds default categories/family members, and updates currency exchange rates.*

**Terminal 2 — Frontend Client (React + Vite + TypeScript):**
```bash
cd client
npm install
npm run dev
```
*Runs on [http://localhost:5173](http://localhost:5173).*

---

## 🌐 Application URLs

| Service | URL | Description |
|---|---|---|
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | Interactive web application |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | REST API endpoints |
| **Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API health & DB connectivity |

---

## 🛠️ Key Features

- **Trips Management**: Create, edit, and delete vacation itineraries with multi-destination support and custom confirmation dialogs.
- **Trip Deletion**: Safe, two-click deletion with custom glassmorphism confirmation modals from both the Trips grid and Trip Details view.
- **Expense Tracking**: Quick expense entry with category, subcategory, date, payment member, and notes.
- **Multi-Currency & Auto INR Conversion**: Log expenses in EUR, USD, AED, GBP, THB, JPY, SGD, etc., auto-converted to INR with live exchange rates.
- **Visual Analytics**: Interactive category donut charts, destination bar charts, and daily spending trend lines.
- **PDF Report Generation**: Download polished trip expense reports in a single click.
- **Dark Mode**: Sleek dark aesthetic with glassmorphism and rich color accents.
