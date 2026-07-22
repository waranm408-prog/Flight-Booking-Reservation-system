# Flight Booking & Reservation System

A full-stack web application for booking and managing flight reservations. The project includes a user-facing booking flow, an admin dashboard, secure authentication, payment integration, and live flight search functionality for travel planning.

## Project Overview

This platform allows users to:
- register and log in securely
- search for flights by route, date, and time
- view flight details and pricing
- book seats and complete payments
- view booking history and trip information

Admins can:
- access a dashboard with booking and user statistics
- review available flights
- manage booking-related operations
- monitor the overall system activity

## Live Demo

- Frontend: https://flight-booking-reservation-system-w.vercel.app

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Formik
- React Router
- Lucide Icons
- Axios

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs
- Razorpay integration
- Brevo / Sendinblue email support
- CORS

## Project Structure

```text
Flight Booking and Reservation System1/
├── backend/
│   ├── app.js
│   ├── package.json
│   ├── bin/
│   ├── middleware/
│   ├── Models/
│   │   ├── Booking.js
│   │   ├── Flight.js
│   │   └── User.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── bookings.js
│   │   ├── flights.js
│   │   ├── index.js
│   │   ├── payments.js
│   │   └── users.js
│   ├── utils/
│   ├── views/
│   └── public/
├── frontend/
│   └── FBR/
│       ├── src/
│       │   ├── AdminPage/
│       │   ├── Page/
│       │   ├── api/
│       │   ├── components/
│       │   └── assets/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig*.json
├── package.json
└── README
```

## Main Features

- User registration and login
- Password reset and authentication flow
- Flight search with route, date, and time filters
- Location suggestions in the search form
- Flight result cards with price and route details
- Seat selection and booking flow
- Payment processing with Razorpay
- Booking history and user profile view
- Admin dashboard with statistics and flight overview
- Email-based communication for booking-related updates

## Backend API Overview

### Authentication
- POST /users/signup
- POST /users/login
- POST /users/forgotpassword

### Flights
- GET /flights
- GET /flights/search
- GET /flights?from=...&to=...

### Bookings
- GET /bookings
- POST /bookings
- PUT /bookings/:id/status

### Payments
- POST /payments/create-order
- POST /payments/verify-payment

### Admin
- GET /admin/stats
- GET /admin/flights
- GET /admin/users

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB instance
- Razorpay credentials
- Brevo / SendInBlue API key

### 1. Clone the repository

```bash
git clone https://github.com/waranm408-prog/Flight-Booking-Reservation-system.git
cd Flight-Booking-Reservation-system
```

### 2. Backend setup


Create a `.env` file inside the backend folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
BREVO_API_KEY=your_brevo_api_key
FLIGHTAWARE_API_KEY=your_flightaware_api_key
```




## Demo Credentials

### User
- Email: maheshsiva408@gmail.com
- Password: mahesh@02

### Admin
- Email: admin@gmail.com
- Password: admin1234

## Notes

- The app uses a live flight lookup flow and can fall back gracefully when the external data source is unavailable.
- The admin panel provides a dashboard for monitoring bookings and flight information.
- The app is designed for educational and demonstration purposes and may require valid environment variables for full functionality.

## License

This project is open source and available under the MIT License.
