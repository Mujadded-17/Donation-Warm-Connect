# Donation App

## Setup

### 1. Clone repo

git clone <repo-url>

### 2. Start database

docker compose up -d

### 3. Setup backend

cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan serve

Backend runs on:
http://127.0.0.1:8000

### 4. Setup frontend

cd client
npm install
npm run dev

Frontend runs on:
http://localhost:5173




# **Project Title : Donation-Warm-Connect**

---

## Team Members

1. **Mujadded Morshed Chowdhury**  
   - **Role:** Team Lead  
   - **Email:** mujaddedc@gmail.com  
   - **ID:** 20230104149  

2. **Silvia Alam**  
   - **Role:** Back-end Developer  
   - **Email:** silviaalam134@gmail.com  
   - **ID:** 20230104150  

3. **Samprity Haque**  
   - **Role:** Front-end Developer 
   - **Email:** haquesamprity4@gmail.com  
   - **ID:** 20230104151  

4. **Afifah Maksurah**  
   - **Role:** Front-end & Back-end Developer
   - **Email:** maksurahafifah@gmail.com
   - **ID** 20230104128  

---

## Project Overview


### Objective
WarmConnect is a community-focused donation platform built to bridge the gap between people who want to help and people who need help. Many individuals have usable items they no longer need, while others struggle to access basic necessities. WarmConnect brings these two groups together through a simple and secure digital platform.

### Target Audience
- Individuals who want to donate usable items such as clothes, books, food, or household goods  
- People in need of essential items who may not have easy access to donation centers  
- Community volunteers or organizations involved in charity and social welfare activities
- Students and young professionals interested in participating in social impact initiatives


---

## Tech Stack

### Backend
- Laravel

### Database
- MySQL database

### Frontend
- React.js 
- Tailwind CSS / Bootstrap  

### Rendering Method
- Client-Side Rendering (CSR)

---

## UI Design
- **Figma Link:** *https://l.messenger.com/l.php?u=https%3A%2F%2Fwww.figma.com%2Fproto%2FkhvUiaaPEgow4S7tXj0Fat%2FWarm-Connect%3Fpage-id%3D0%253A1%26node-id%3D1-16%26viewport%3D40%252C137%252C0.06%26t%3D0wMB8llFpp41PCgS-1%26scaling%3Dscale-down-width%26content-scaling%3Dfixed&h=AT22y0ozxRw7Dhwe3XT_F34IGzQ2bumfk3oW-p7ndtRNHBWCiPTx9gBWa-W8nXObBXXxNEKGGYskpGKPgHSpP6uvYG4P-MHAlEEPUh2hLD9vEddorK7DzRxproSeXXKuInPUDQ*  

---

## Project Features

### Core Features
- User authentication (JWT-based login & registration)  
- Donation listing system where donors can post items for donation  
- Donation request system for users in need  
- Donation status tracking (Available, Requested, Completed) 
- Category-based browsing of donation items

### CRUD Operations

- **Users**
  - Create: User registration  
  - Read: View user profile information  
  - Update: Update user profile details  
  - Delete: Remove user account  

- **Donations**
  - Create: Add new donation listing  
  - Read: View available donation listings  
  - Update: Edit donation details  
  - Delete: Remove donation listing  

- **Donation Requests**
  - Create: Request a donation  
  - Read: View donation request status  
  - Update: Approve or reject donation requests  
  - Delete: Cancel donation request  

---


### API Endpoints (Approximate)

- `POST /auth/register`  
  - Register a new user  

- `POST /auth/login`  
  - User login and JWT token generation  

- `GET /donations`  
  - Retrieve a list of all donation listings  

- `POST /donations`  
  - Create a new donation listing  

- `PUT /donations/{id}`  
  - Update details of a specific donation listing  

- `DELETE /donations/{id}`  
  - Delete a specific donation listing  

- `POST /donations/{id}/request`  
  - Request a donation item  

- `GET /requests`  
  - Retrieve all donation requests for the user  

- `PUT /requests/{id}/status`  
  - Update status (approve/reject) of a donation request  

---

### Project Milestones

- **Milestone 1: System Setup and Authentication**  
  - Set up Laravel project with XAMPP  
  - Design database schema and perform migrations  
  - Implement user registration and JWT-based login  
  - Define user roles (Donor, Receiver)  

- **Milestone 2: Donation Management**  
  - Implement CRUD operations for donation listings  
  - Enable donation request functionality  
  - Add donation status tracking  
  - Implement category-based filtering  

- **Milestone 3: Finalization and Testing**  
  - Improve user interface and user experience  
  - Conduct security and performance testing  
  - Fix bugs and optimize performance  
  - Prepare documentation and deploy the application  

