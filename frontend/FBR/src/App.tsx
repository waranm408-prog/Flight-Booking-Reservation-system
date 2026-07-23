// Removed SpeedInsights import to fix: Cannot find module '@vercel/speed-insights/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './Page/Home';
import About from './Page/About';
import Support from './Page/Support';
import Flights from './Page/Flights';
import Seat from './Page/Seat';
import BookNow from './Page/BookNow';
import UserDetails from './components/UserDetails';
import Bookinghistory from './Page/Bookinghistory';
import BookingConfirmation from './Page/BookingConfirmation';
import ForgotPassword from './components/ForgotPassword';
import AdminSidebar from './AdminPage/AdminSidebar';
import AdminDashboard from './AdminPage/AdminDashboard';
import AdminUsers from './AdminPage/AdminUsers';
import AdminFlights from './AdminPage/Adminflights';
import AdminBookings from './AdminPage/Adminbooking';
import AdminPayments from './AdminPage/Adminpayment';

function App() {

  return (
    <>
     <BrowserRouter>
     <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/navbar" element={<Navbar />} />
       <Route path="/signup" element={<Signup />} />
         <Route path="/login" element={<Login />} />
         <Route path="/about" element={<About/>}/>
         <Route path="/support" element={<Support/>}/>
         <Route path="/flights" element={<Flights/>}/>
         <Route path="/seat" element={<Seat/>}/>
         <Route path="/book-now" element={<BookNow />} />
         <Route path="/user-details" element={<UserDetails />} />
         <Route path="/booking-history" element={<Bookinghistory />} />
         <Route path="/booking-confirmation" element={<BookingConfirmation />} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
         <Route path="/admin/*" element={<AdminSidebar />}>
           <Route index element={<AdminDashboard/>} />
          
             
         </Route>
        <Route path="/admin-users" element={<AdminUsers />} />
         <Route path="/admin-flights" element={<AdminFlights />} />
         <Route path="/admin-payments" element={<AdminPayments />} />
         <Route path="/admin-bookings" element={<AdminBookings />} /> 
        
      </Routes>
     </BrowserRouter>
      
    </>
  )
}

export default App
