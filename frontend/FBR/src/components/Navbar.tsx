import { useState } from "react";
import { Menu,X, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import Profile from "./Profile";


const Navbar = () => {
  const [open, setOpen] = useState(false);

  

  return (
    <nav className="bg-slate-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Plane className="text-blue-500" size={30} />
            <h1 className="text-2xl font-bold">
              Sky<span className="text-blue-500">Elite</span>
               </h1>
              
           
          </div>

          {/* Desktop Menu */}
          <div className="flex items-center gap-8">
          <ul className="hidden md:flex items-center gap-8 text-lg">

              <li>
                <Link
                  to="/"
                  className="hover:text-blue-500 transition duration-300"
                >
                   Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-blue-500 transition duration-300"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/flights"
                  className="hover:text-blue-500 transition duration-300"
                >
                  Flights
                </Link>
              </li>
              <li>
                <Link
                  to="/booking-history"
                  className="hover:text-blue-500 transition duration-300"
                >
                  Booking History
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="hover:text-blue-500 transition duration-300"
                >
                  Support
                </Link>
              </li>
          
          </ul>
          
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/book-now"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full font-semibold transition"
            >
              Book Now
            </Link>
            <Profile />
          </div>
          {/* Mobile Icon */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <X size={30} />
            ) : (
              <Menu size={30} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ${
            open ? "max-h-96 py-4" : "max-h-0" 
          }`}
        >    
          <ul className="flex flex-col gap-5 text-center text-lg">
            
              <li >
                <Link
                  to="/"
                  className="block hover:text-blue-500"
                  onClick={() => setOpen(false)}
                >
                 Home
                </Link>
              </li>
              <li >
                <Link
                  to="/about"
                  className="block hover:text-blue-500"
                  onClick={() => setOpen(false)}
                >
                  About
                </Link>
              </li>
           <li >
                <Link 
                  to="/flights"
                  className="block hover:text-blue-500"
                  onClick={() => setOpen(false)}
                >
                 Flights
                </Link>
              </li>
              <li >
                <Link 
                  to="/booking-history"
                  className="block hover:text-blue-500"
                  onClick={() => setOpen(false)}
                >
                 Book History
                </Link>
              </li>
              <li >
                <Link 
                  to="/support"
                  className="block hover:text-blue-500"
                  onClick={() => setOpen(false)}
                >
                 Support
                </Link>
              </li>
           
           
           
           
           

            <Link
              to="/book-now"
              onClick={() => setOpen(false)}
              className="block bg-blue-600 hover:bg-blue-700 py-3 rounded-full font-semibold mx-5"
            >
              Book now
            </Link>
            <div className="mx-5">
              <Profile />
            </div>
          </ul>
          
        </div>
      </div>
    </nav>
  );
};

export default Navbar;