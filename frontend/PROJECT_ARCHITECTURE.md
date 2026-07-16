# Flight Booking and Reservation System - Architecture & Design

## Project Overview
A comprehensive flight booking and reservation system built with MERN stack (MongoDB, Express.js, React.js, Node.js) and TailwindCSS.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React.js)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │    Search    │  │   Booking    │          │
│  │     Page     │→│    Flights   │→│    Process   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         ↓                  ↓                  ↓                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     User     │  │   Booking    │  │   Payment    │          │
│  │   Profile    │  │  Management  │  │   Gateway    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │    Flight    │  │   Booking    │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Payment    │  │    User      │  │ Notification │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                     Middleware Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │  Validation  │  │    Error     │          │
│  │  Middleware  │  │  Middleware  │  │   Handler    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER (MongoDB)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Users     │  │   Flights    │  │   Bookings   │          │
│  │  Collection  │  │  Collection  │  │  Collection  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Payments   │  │ Notifications│  │   Airlines   │          │
│  │  Collection  │  │  Collection  │  │  Collection  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Airline    │  │   Payment    │  │    Email     │          │
│  │     APIs     │  │   Gateway    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐                                               │
│  │     SMS      │                                               │
│  │   Service    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Application Flow Diagram

### 1. User Registration & Authentication Flow
```
┌──────────┐
│  User    │
└────┬─────┘
     │
     ├─→ Sign Up → Validate → Hash Password → Save to DB → Send Welcome Email
     │                                              ↓
     │                                        Generate JWT Token
     │                                              ↓
     └─→ Sign In → Validate → Verify Password → Generate JWT → Return Token
                                                     ↓
                                              Store in LocalStorage
```

### 2. Flight Search & Booking Flow
```
┌──────────────────────────────────────────────────────────────────┐
│                     Flight Search Process                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────┐    ┌────────────────┐    ┌─────────────────┐
│  User    │ →  │ Enter Search   │ →  │ Call Airline    │
│  Input   │    │   Criteria     │    │     APIs        │
└──────────┘    └────────────────┘    └─────────────────┘
                                              ↓
                                    ┌──────────────────┐
                                    │  Fetch Flights   │
                                    │  from Database   │
                                    └──────────────────┘
                                              ↓
                                    ┌──────────────────┐
                                    │  Apply Filters   │
                                    │  & Sort Results  │
                                    └──────────────────┘
                                              ↓
                                    ┌──────────────────┐
                                    │  Display Results │
                                    │  with Prices     │
                                    └──────────────────┘
                                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Booking Process                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌───────────────┐                          ┌────────────────┐
│ Select Flight │                          │  Select Seats  │
└───────┬───────┘                          └────────┬───────┘
        │                                           │
        └─────────────────┬─────────────────────────┘
                          ↓
                ┌──────────────────┐
                │ Enter Passenger  │
                │   Information    │
                └────────┬─────────┘
                         ↓
                ┌──────────────────┐
                │ Review Booking   │
                │    Details       │
                └────────┬─────────┘
                         ↓
                ┌──────────────────┐
                │   Initiate       │
                │   Payment        │
                └────────┬─────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                 ↓
┌───────────────┐              ┌──────────────────┐
│ Payment       │              │ Payment Success? │
│ Gateway       │              └──────────────────┘
└───────┬───────┘                       │
        │                               │
        └───────────────┬───────────────┘
                        ↓
            ┌──────────────────────┐
            │  Save Booking to DB  │
            └──────────┬───────────┘
                       ↓
            ┌──────────────────────┐
            │ Generate Booking ID  │
            └──────────┬───────────┘
                       ↓
            ┌──────────────────────┐
            │  Send Confirmation   │
            │   Email & SMS        │
            └──────────┬───────────┘
                       ↓
            ┌──────────────────────┐
            │  Display Success     │
            │     Message          │
            └──────────────────────┘
```

### 3. Booking Management Flow
```
┌──────────────────────────────────────────────────────────────────┐
│                    User Dashboard                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│ View Bookings │    │  View Profile  │    │ View History   │
└───────┬───────┘    └────────┬───────┘    └────────┬───────┘
        │                     │                     │
        ↓                     ↓                     ↓
┌───────────────┐    ┌────────────────┐    ┌────────────────┐
│ Booking       │    │ Update Profile │    │ Past Bookings  │
│ Details       │    │   Information  │    │   & Reports    │
└───────┬───────┘    └────────────────┘    └────────────────┘
        │
        ├─→ Modify Booking → Check Availability → Update → Confirm
        │
        ├─→ Cancel Booking → Verify → Process Refund → Update Status
        │
        └─→ Download Ticket → Generate PDF → Download
```

### 4. Real-Time Updates Flow
```
┌──────────────────────────────────────────────────────────────────┐
│                   Airline API Integration                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  Scheduled Jobs  │
                    │  (Cron/Workers)  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  Fetch Flight    │
                    │  Status Updates  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  Compare with    │
                    │  Current Data    │
                    └────────┬─────────┘
                             ↓
                  ┌──────────┴──────────┐
                  ↓                     ↓
        ┌──────────────────┐   ┌────────────────┐
        │  Update Database │   │ Check Affected │
        │                  │   │    Bookings    │
        └──────────────────┘   └────────┬───────┘
                                        ↓
                              ┌──────────────────┐
                              │  Send Notifications│
                              │  to Users        │
                              └──────────┬───────┘
                                         ↓
                        ┌────────────────┴────────────────┐
                        ↓                                 ↓
              ┌──────────────────┐            ┌──────────────────┐
              │  Email Alert     │            │   SMS Alert      │
              └──────────────────┘            └──────────────────┘
```

---

## Design Layers

### 1. Presentation Layer (Frontend - React.js + TailwindCSS)

#### Components Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Card.jsx
│   │   ├── Loader.jsx
│   │   └── Alert.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── flights/
│   │   ├── SearchForm.jsx
│   │   ├── FlightCard.jsx
│   │   ├── FlightList.jsx
│   │   ├── FilterPanel.jsx
│   │   └── SortOptions.jsx
│   ├── booking/
│   │   ├── BookingForm.jsx
│   │   ├── PassengerDetails.jsx
│   │   ├── SeatSelection.jsx
│   │   ├── BookingSummary.jsx
│   │   └── BookingConfirmation.jsx
│   ├── payment/
│   │   ├── PaymentForm.jsx
│   │   ├── PaymentMethods.jsx
│   │   └── PaymentSuccess.jsx
│   ├── dashboard/
│   │   ├── UserProfile.jsx
│   │   ├── BookingHistory.jsx
│   │   ├── BookingDetails.jsx
│   │   └── UpcomingFlights.jsx
│   └── admin/
│       ├── FlightManagement.jsx
│       ├── BookingReports.jsx
│       └── UserManagement.jsx
├── pages/
│   ├── Home.jsx
│   ├── SearchResults.jsx
│   ├── BookingPage.jsx
│   ├── PaymentPage.jsx
│   ├── Dashboard.jsx
│   ├── Profile.jsx
│   └── NotFound.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useFlights.js
│   ├── useBooking.js
│   └── usePayment.js
├── context/
│   ├── AuthContext.js
│   ├── BookingContext.js
│   └── NotificationContext.js
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── flightService.js
│   ├── bookingService.js
│   └── paymentService.js
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
└── App.jsx
```

#### Key Features by Component

**SearchForm Component:**
- Origin/Destination autocomplete
- Date pickers (departure/return)
- Passenger count selector
- Class selection (Economy, Business, First)
- Advanced filters toggle

**FlightCard Component:**
- Airline logo and name
- Departure/arrival times
- Duration and stops
- Price comparison
- Availability indicator
- Book now button

**BookingForm Component:**
- Passenger information fields
- Contact details
- Special requests
- Terms acceptance
- Price breakdown

**Dashboard Components:**
- Upcoming bookings list
- Past bookings history
- Booking details modal
- Cancellation functionality
- Download ticket option

---

### 2. Application Layer (Backend - Node.js + Express.js)

#### Directory Structure
```
server/
├── config/
│   ├── database.js
│   ├── passport.js
│   └── env.js
├── controllers/
│   ├── authController.js
│   ├── flightController.js
│   ├── bookingController.js
│   ├── paymentController.js
│   ├── userController.js
│   └── notificationController.js
├── middleware/
│   ├── auth.js
│   ├── validate.js
│   ├── errorHandler.js
│   └── rateLimit.js
├── models/
│   ├── User.js
│   ├── Flight.js
│   ├── Booking.js
│   ├── Payment.js
│   ├── Airline.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── flightRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── userRoutes.js
│   └── adminRoutes.js
├── services/
│   ├── airlineApiService.js
│   ├── paymentService.js
│   ├── emailService.js
│   ├── smsService.js
│   └── pdfService.js
├── utils/
│   ├── helpers.js
│   ├── validators.js
│   └── constants.js
├── jobs/
│   ├── flightUpdateJob.js
│   └── notificationJob.js
└── server.js
```

#### API Endpoints

**Authentication Routes:**
```
POST   /api/auth/register         - User registration
POST   /api/auth/login            - User login
POST   /api/auth/logout           - User logout
POST   /api/auth/forgot-password  - Password reset request
POST   /api/auth/reset-password   - Reset password
GET    /api/auth/verify-email     - Email verification
```

**Flight Routes:**
```
GET    /api/flights/search        - Search flights
GET    /api/flights/:id           - Get flight details
GET    /api/flights/popular       - Get popular routes
POST   /api/flights               - Create flight (admin)
PUT    /api/flights/:id           - Update flight (admin)
DELETE /api/flights/:id           - Delete flight (admin)
GET    /api/flights/status/:id    - Get real-time status
```

**Booking Routes:**
```
POST   /api/bookings              - Create new booking
GET    /api/bookings              - Get user bookings
GET    /api/bookings/:id          - Get booking details
PUT    /api/bookings/:id          - Modify booking
DELETE /api/bookings/:id          - Cancel booking
GET    /api/bookings/:id/ticket   - Download ticket PDF
POST   /api/bookings/:id/seats    - Select seats
```

**Payment Routes:**
```
POST   /api/payments/initiate     - Initiate payment
POST   /api/payments/verify       - Verify payment
POST   /api/payments/refund       - Process refund
GET    /api/payments/:id          - Get payment details
GET    /api/payments/methods      - Get payment methods
```

**User Routes:**
```
GET    /api/users/profile         - Get user profile
PUT    /api/users/profile         - Update profile
GET    /api/users/bookings        - Get booking history
POST   /api/users/preferences     - Save preferences
```

**Admin Routes:**
```
GET    /api/admin/bookings        - Get all bookings
GET    /api/admin/reports         - Generate reports
GET    /api/admin/analytics       - Get analytics data
GET    /api/admin/users           - Manage users
```

---

### 3. Data Layer (MongoDB + Mongoose)

#### Database Schema Design

**User Schema:**
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  preferences: {
    seatPreference: String,
    mealPreference: String,
    newsletters: Boolean
  },
  role: String (enum: ['user', 'admin']),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Flight Schema:**
```javascript
{
  _id: ObjectId,
  flightNumber: String (required, unique),
  airline: ObjectId (ref: 'Airline'),
  origin: {
    code: String (required),
    city: String,
    airport: String,
    terminal: String
  },
  destination: {
    code: String (required),
    city: String,
    airport: String,
    terminal: String
  },
  departureTime: Date (required),
  arrivalTime: Date (required),
  duration: Number (minutes),
  stops: Number,
  stopLocations: [String],
  aircraft: {
    type: String,
    model: String
  },
  pricing: {
    economy: {
      price: Number,
      availableSeats: Number,
      totalSeats: Number
    },
    business: {
      price: Number,
      availableSeats: Number,
      totalSeats: Number
    },
    firstClass: {
      price: Number,
      availableSeats: Number,
      totalSeats: Number
    }
  },
  status: String (enum: ['scheduled', 'delayed', 'cancelled', 'boarding', 'departed', 'arrived']),
  amenities: [String],
  baggage: {
    cabin: String,
    checked: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Booking Schema:**
```javascript
{
  _id: ObjectId,
  bookingReference: String (required, unique),
  user: ObjectId (ref: 'User'),
  flight: ObjectId (ref: 'Flight'),
  passengers: [{
    firstName: String (required),
    lastName: String (required),
    dateOfBirth: Date,
    gender: String,
    passportNumber: String,
    nationality: String,
    seatNumber: String,
    mealPreference: String
  }],
  contactDetails: {
    email: String (required),
    phone: String (required)
  },
  bookingClass: String (enum: ['economy', 'business', 'firstClass']),
  totalPrice: Number (required),
  numberOfPassengers: Number,
  specialRequests: String,
  status: String (enum: ['pending', 'confirmed', 'cancelled', 'completed']),
  payment: ObjectId (ref: 'Payment'),
  bookingDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Payment Schema:**
```javascript
{
  _id: ObjectId,
  booking: ObjectId (ref: 'Booking'),
  user: ObjectId (ref: 'User'),
  amount: Number (required),
  currency: String (default: 'USD'),
  paymentMethod: String (enum: ['card', 'wallet', 'bank']),
  paymentGateway: String,
  transactionId: String (unique),
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  paymentDetails: {
    cardLast4: String,
    cardType: String,
    holderName: String
  },
  refundAmount: Number,
  refundDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Airline Schema:**
```javascript
{
  _id: ObjectId,
  name: String (required),
  code: String (required, unique),
  logo: String (URL),
  country: String,
  website: String,
  contactNumber: String,
  apiEndpoint: String,
  apiKey: String (encrypted),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Notification Schema:**
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  booking: ObjectId (ref: 'Booking'),
  type: String (enum: ['booking_confirmation', 'flight_update', 'reminder', 'cancellation']),
  channel: String (enum: ['email', 'sms', 'push']),
  subject: String,
  message: String,
  status: String (enum: ['pending', 'sent', 'failed']),
  sentAt: Date,
  createdAt: Date
}
```

---

### 4. Integration Layer

#### External Services Integration

**Payment Gateway Integration:**
```javascript
// Stripe / Razorpay / PayPal Integration
- Initialize payment session
- Create payment intent
- Handle webhooks for payment confirmation
- Process refunds
- Store transaction logs
```

**Airline API Integration:**
```javascript
// Real-time flight data providers
- Amadeus API
- Skyscanner API
- AviationStack API

Functions:
- Fetch flight schedules
- Get real-time flight status
- Retrieve seat availability
- Update pricing information
- Get delay/cancellation alerts
```

**Email Service (SendGrid / NodeMailer):**
```javascript
Templates:
- Welcome email
- Booking confirmation
- Flight update alerts
- Cancellation confirmation
- Password reset
- Promotional emails
```

**SMS Service (Twilio):**
```javascript
Notifications:
- Booking confirmation SMS
- Flight status updates
- Reminder before flight
- Gate change alerts
```

**PDF Generation (PDFKit / Puppeteer):**
```javascript
Documents:
- E-ticket generation
- Booking itinerary
- Invoice/receipt
- Boarding pass
```

---

## Security Implementation

### Authentication & Authorization
```
- JWT based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- OAuth 2.0 for social logins
- Email verification
- Two-factor authentication (optional)
```

### Data Security
```
- Input validation and sanitization
- SQL injection prevention (NoSQL injection for MongoDB)
- XSS protection
- CSRF tokens
- Rate limiting on APIs
- Encryption for sensitive data
- Secure payment processing (PCI DSS compliance)
```

### API Security
```
- HTTPS only
- CORS configuration
- API key authentication for admin routes
- Request rate limiting
- IP whitelisting for admin panel
```

---

## Performance Optimization

### Frontend Optimization
```
- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Debouncing search inputs
- Virtual scrolling for large lists
- Progressive Web App (PWA) features
```

### Backend Optimization
```
- Database indexing
- Query optimization
- Redis caching for frequent queries
- Connection pooling
- Gzip compression
- CDN for static assets
```

### Database Optimization
```
- Compound indexes for search queries
- Aggregation pipelines for reports
- Pagination for large datasets
- Database sharding (if needed)
```

---

## Monitoring & Analytics

### Application Monitoring
```
- Error tracking (Sentry)
- Performance monitoring (New Relic / DataDog)
- Uptime monitoring
- API response time tracking
```

### Business Analytics
```
- Booking conversion rates
- Popular routes analysis
- Revenue tracking
- User behavior analytics
- Search patterns analysis
- Cancellation rate monitoring
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Production Setup                         │
└─────────────────────────────────────────────────────────────────┘

Frontend (Netlify):
- React app build
- CDN distribution
- SSL certificate
- Environment variables

Backend (Render):
- Node.js server
- Auto-scaling
- Health checks
- Environment variables

Database:
- MongoDB Atlas
- Replica sets
- Automated backups
- Geographic distribution

Additional Services:
- Redis Cloud (caching)
- CloudFlare (DDoS protection)
- AWS S3 (file storage)
```

---

## Development Workflow

### Phase 1: Setup & Core Features (Week 1-2)
```
✓ Project setup and configuration
✓ Database schema design
✓ Authentication system
✓ Basic flight search functionality
```

### Phase 2: Booking System (Week 3-4)
```
✓ Flight search with filters
✓ Booking creation
✓ Seat selection
✓ Passenger details form
```

### Phase 3: Payment Integration (Week 5)
```
✓ Payment gateway integration
✓ Payment processing
✓ Booking confirmation
✓ Email notifications
```

### Phase 4: User Dashboard (Week 6)
```
✓ User profile management
✓ Booking history
✓ Booking modification/cancellation
✓ Ticket download
```

### Phase 5: Real-time Updates (Week 7)
```
✓ Airline API integration
✓ Flight status updates
✓ Notification system
✓ Real-time alerts
```

### Phase 6: Admin Panel & Analytics (Week 8)
```
✓ Admin dashboard
✓ Flight management
✓ Booking reports
✓ Analytics dashboard
```

### Phase 7: Testing & Deployment (Week 9-10)
```
✓ Unit testing
✓ Integration testing
✓ Performance optimization
✓ Deployment to production
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, Passport.js |
| Payment | Stripe/Razorpay |
| Email | SendGrid/NodeMailer |
| SMS | Twilio |
| Airline Data | Amadeus/Skyscanner API |
| PDF Generation | PDFKit/Puppeteer |
| File Storage | AWS S3/Cloudinary |
| Caching | Redis |
| Deployment | Netlify (Frontend), Render (Backend) |
| Version Control | Git, GitHub |

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=
REACT_APP_STRIPE_PUBLIC_KEY=
REACT_APP_GOOGLE_MAPS_API_KEY=
```

### Backend (.env)
```
NODE_ENV=
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRE=
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
AIRLINE_API_KEY=
REDIS_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
```

---

This architecture provides a scalable, secure, and maintainable foundation for your Flight Booking and Reservation System.
