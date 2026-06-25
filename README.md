# 🛡️ CivicTrackGuard
**AI-Powered Hyperlocal Problem Solver for Community Heroes**

Built for the **Vibe2Ship Hackathon** under the problem statement: **Community Hero - Hyperlocal Problem Solver**.

![CivicTrackGuard Banner](./frontend/public/banner-placeholder.png) 
*(Note: Replace with actual screenshot)*

## 🌟 The Vision
CivicTrackGuard bridges the gap between citizens and local authorities. Every day, hyperlocal issues like potholes, garbage dumps, and broken streetlights go unnoticed or unresolved due to a lack of transparency and an inefficient reporting process. 

**CivicTrackGuard solves this by:**
1. **Making Reporting Effortless:** Snap a photo, add a brief description, and you're done.
2. **Leveraging Agentic AI (Google Gemini):** AI automatically categorizes the issue, predicts its severity, routes it to the correct department, and calculates a trust score.
3. **Ensuring Transparent Tracking:** From `PENDING` to `RESOLVED`, the entire lifecycle is public and trackable.
4. **Gamifying Civic Duty:** Citizens earn points, unlock badges, and climb the Leaderboard for making their communities better.

---

## 🚀 Key Features

*   **🤖 Google Gemini AI Integration:** Deep agentic AI analysis. Gemini acts as an intelligent triage agent, classifying unstructured reports into structured, actionable data for authorities.
*   **🗺️ Interactive Local Map:** A real-time heatmap (using Leaflet & OpenStreetMap) visualizing the exact location and severity of civic issues in the neighborhood.
*   **📊 Dynamic Dashboard:** Comprehensive analytics for local authorities to track pending vs. resolved issues, categorize problems, and measure community engagement.
*   **🔐 Secure Role-Based Access:** Distinct experiences for standard Citizens (reporting, voting, commenting) and Admins (verifying and updating statuses).
*   **🏆 Community Gamification:** A dynamic leaderboard that rewards users with points and badges ("Community Hero", "Civic Champion") based on their engagement.
*   **📱 Premium, Responsive UI:** A modern, glassmorphism-inspired dark theme built with React, Vite, Tailwind CSS v4, and Framer Motion for buttery-smooth animations.

---

## 🛠️ Tech Stack

**Frontend:**
*   React 19 + Vite
*   Tailwind CSS v4 (Custom Glassmorphism UI)
*   Framer Motion (Animations)
*   React Router v7
*   Axios & React-Hot-Toast
*   Leaflet & React-Leaflet (Mapping)
*   Recharts (Analytics)

**Backend:**
*   Java 21 + Spring Boot 3.3.4
*   Spring Security + JWT Authentication
*   Spring Data JPA + Hibernate
*   MySQL Database
*   Google Gemini API (Generative AI integration)
*   Cloudinary API (Image hosting)

---

## 🧠 How the AI Works

When a user submits an issue, our backend calls the **Google Gemini 1.5 Flash API**. 
Gemini acts as an autonomous agent that reads the title, description, and location, and responds with a strict JSON structure containing:
*   **Category:** Standardizes chaotic reports (e.g., "road broken" -> `ROAD_DAMAGE`).
*   **Severity Prediction:** Assigns `HIGH`, `MEDIUM`, or `LOW` priority based on risk (e.g., live wires = `HIGH`).
*   **Department Routing:** Instantly identifies the exact municipal department responsible.
*   **Summary & Explanation:** Generates a concise summary and explains *why* the severity was chosen.
*   **Trust Score:** Evaluates the credibility of the report based on the provided details.

---

## 💻 Local Development Setup

### Prerequisites
*   Java 21
*   Maven 3.8+
*   Node.js 20+
*   MySQL Server

### Backend Setup
1. Open MySQL and create a database: `CREATE DATABASE civictrackguard;`
2. Navigate to the backend folder: `cd backend`
3. Update `src/main/resources/application.properties` with your credentials (MySQL, Cloudinary, Gemini API).
4. Run the Spring Boot app: `mvn spring-boot:run`
*(The backend runs on `http://localhost:8080`)*

### Frontend Setup
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
*(The frontend runs on `http://localhost:5173`)*

---

## 🔐 Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | admin@civictrack.com | (Create via Register, then manually update DB to `ADMIN`) |
| **Citizen** | citizen@example.com | (Any newly registered account) |

*(Note: Passwords are securely hashed using BCrypt. The backend ensures that password hashes are NEVER exposed in any API responses.)*

---

## 🎯 Hackathon Impact
CivicTrackGuard perfectly aligns with the **Vibe2Ship: Community Hero** track. It transforms passive residents into active community heroes by providing them with a frictionless, AI-enhanced, and highly rewarding platform to fix their hyperlocal environment.
