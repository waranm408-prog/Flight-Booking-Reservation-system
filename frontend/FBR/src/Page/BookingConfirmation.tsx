import { CheckCircle2, Home, ReceiptText, Calendar, Clock, Plane } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

interface BookingConfirmationState {
  bookingId?: string;
  paymentId?: string;
  orderId?: string;
  flight?: {
    airline?: string;
    cabinClass?: string;
    flightNo?: string;
    departureTime?: string;
    arrivalTime?: string;
    departureDate?: string;
    departureDateTime?: string;
    arrivalDate?: string;
    arrivalDateTime?: string;
    duration?: string;
    stops?: number;
    price?: number;
  };
  returnFlight?: {
    airline?: string;
    cabinClass?: string;
    flightNo?: string;
    departureTime?: string;
    arrivalTime?: string;
    departureDate?: string;
    departureDateTime?: string;
    arrivalDate?: string;
    arrivalDateTime?: string;
    duration?: string;
    stops?: number;
    price?: number;
  };
  trip?: {
    from?: string;
    to?: string;
    tripType?: 'one-way' | 'round-trip';
    departureDate?: string;
    returnDate?: string;
  };
  passengers?: number;
  selectedSeats?: string[];
  returnSelectedSeats?: string[];
  amount?: number;
  bookingDate?: string;
}

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = (location.state || {}) as BookingConfirmationState;

  // Get booking date/time (when the booking was made)
  const bookingDateTime = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
  
  // Format booking date and time
  const formatBookingDate = () => {
    return bookingDateTime.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBookingTime = () => {
    return bookingDateTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const outboundTime = booking.flight?.departureTime || 'N/A';
  const outboundArrivalTime = booking.flight?.arrivalTime || 'N/A';
  const outboundDate = booking.flight?.departureDate || booking.trip?.departureDate || 'N/A';
  const returnTime = booking.returnFlight?.departureTime || 'N/A';
  const returnArrivalTime = booking.returnFlight?.arrivalTime || 'N/A';
  const returnDate = booking.returnFlight?.departureDate || booking.trip?.returnDate || 'N/A';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800 md:px-6">
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Payment confirmed</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Your booking is confirmed</h1>
            <p className="mt-3 max-w-lg text-sm text-slate-600">
              Your payment was successful and your seats have been reserved.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Trip overview</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {booking.trip?.tripType === 'round-trip' ? 'Round Trip Booking' : 'One Way Booking'}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {booking.trip?.tripType === 'round-trip' ? '2 legs' : '1 leg'}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-blue-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Outbound card</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Flight</span>
                    <span className="font-semibold text-slate-900">{booking.flight?.airline || "Selected flight"}</span>
                  </div>
                  {booking.flight?.flightNo && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Flight Number</span>
                      <span className="font-semibold text-slate-900">{booking.flight.flightNo}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Route</span>
                    <span className="font-semibold text-slate-900">{booking.trip?.from || "Origin"} → {booking.trip?.to || "Destination"}</span>
                  </div>
                  {booking.flight?.cabinClass && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Class</span>
                      <span className="font-semibold text-slate-900">{booking.flight.cabinClass}</span>
                    </div>
                  )}
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-600">Departure date</span>
                      <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{booking.flight?.departureDate || booking.trip?.departureDate || "N/A"}</span>
                    </div>
                  </div>
                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-600">Departure time</span>
                      <span className="font-semibold text-slate-900">{booking.flight?.departureTime || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Seats</span>
                    <span className="font-semibold text-slate-900">{booking.selectedSeats?.join(", ") || "N/A"}</span>
                  </div>
                </div>
              </div>

              {booking.trip?.tripType === 'round-trip' && booking.returnFlight && (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Return card</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Flight</span>
                      <span className="font-semibold text-slate-900">{booking.returnFlight.airline || "Return flight"}</span>
                    </div>
                    {booking.returnFlight.flightNo && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Flight Number</span>
                        <span className="font-semibold text-slate-900">{booking.returnFlight.flightNo}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Route</span>
                      <span className="font-semibold text-slate-900">{booking.trip?.to || "Destination"} → {booking.trip?.from || "Origin"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Class</span>
                      <span className="font-semibold text-slate-900">{booking.returnFlight.cabinClass || booking.flight?.cabinClass || "Economy"}</span>
                    </div>
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">Return date</span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{booking.returnFlight?.departureDate || booking.trip?.returnDate || "N/A"}</span>
                      </div>
                    </div>
                    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">Return time</span>
                        <span className="font-semibold text-slate-900">{booking.returnFlight?.departureTime || "N/A"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Return seats</span>
                      <span className="font-semibold text-slate-900">{booking.returnSelectedSeats?.join(", ") || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Price details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Passengers</span>
                  <span className="font-semibold text-slate-900">{booking.passengers || 1}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Trip type</span>
                  <span className="font-semibold text-slate-900">{booking.trip?.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}</span>
                </div>
                {booking.flight?.price !== undefined && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Outbound price</span>
                    <span className="font-semibold text-slate-900">₹{booking.flight.price.toLocaleString()}</span>
                  </div>
                )}
                {booking.trip?.tripType === 'round-trip' && booking.returnFlight?.price !== undefined && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Return price</span>
                    <span className="font-semibold text-slate-900">₹{booking.returnFlight.price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 mt-3">
                  <span className="font-semibold text-slate-700">Total payment</span>
                  <span className="text-lg font-bold text-emerald-600">₹{(booking.amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Date & Time Section */}
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="mb-3 flex items-center gap-2 font-semibold text-blue-700">
              <Calendar size={16} /> Booking Information
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-600">Booked on</span>
                <span className="font-semibold text-blue-900">{formatBookingDate()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-blue-600">Booking time</span>
                <span className="font-semibold text-blue-900">{formatBookingTime()}</span>
              </div>
            </div>
          </div>

          {/* Flight Schedule Section */}
          {(booking.flight?.departureDate || booking.flight?.departureTime || booking.returnFlight?.departureDate || booking.returnFlight?.departureTime) && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold text-emerald-700">
                <Plane size={16} /> Flight Schedule
              </p>
              <div className="space-y-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Starting</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    {outboundTime && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600">Start time</span>
                        <span className="font-semibold text-slate-900">{outboundTime}</span>
                      </div>
                    )}
                    {outboundArrivalTime && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600">Arrival time</span>
                        <span className="font-semibold text-slate-900">{outboundArrivalTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-slate-600">Departure date</span>
                      <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{outboundDate}</span>
                    </div>
                  </div>
                  {(booking.flight?.duration || booking.flight?.stops !== undefined) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {booking.flight?.duration && (
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <Clock size={14} className="mx-auto mb-1 text-emerald-600" />
                          <p className="text-xs text-slate-600">Duration</p>
                          <p className="mt-1 font-semibold text-slate-900">{booking.flight.duration}</p>
                        </div>
                      )}
                      {booking.flight?.stops !== undefined && (
                        <div className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-xs text-slate-600">Stops</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {booking.flight.stops === 0 ? 'Non-stop' : `${booking.flight.stops} stop${booking.flight.stops > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {booking.trip?.tripType === 'round-trip' && booking.returnFlight && (
                  <div className="rounded-xl bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Return</p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {returnTime && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-600">Return time</span>
                          <span className="font-semibold text-slate-900">{returnTime}</span>
                        </div>
                      )}
                      {returnArrivalTime && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-600">Return arrival time</span>
                          <span className="font-semibold text-slate-900">{returnArrivalTime}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">Return date</span>
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900">{returnDate}</span>
                      </div>
                    </div>
                    {(booking.returnFlight.duration || booking.returnFlight.stops !== undefined) && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {booking.returnFlight.duration && (
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <Clock size={14} className="mx-auto mb-1 text-emerald-600" />
                            <p className="text-xs text-slate-600">Return duration</p>
                            <p className="mt-1 font-semibold text-slate-900">{booking.returnFlight.duration}</p>
                          </div>
                        )}
                        {booking.returnFlight.stops !== undefined && (
                          <div className="rounded-xl bg-slate-50 p-3 text-center">
                            <p className="text-xs text-slate-600">Return stops</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {booking.returnFlight.stops === 0 ? 'Non-stop' : `${booking.returnFlight.stops} stop${booking.returnFlight.stops > 1 ? 's' : ''}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 p-5 text-xs text-slate-500">
            <p className="flex items-center gap-2 font-semibold text-slate-700"><ReceiptText size={15} /> Payment details</p>
            <p>Booking ID: {booking.bookingId || "Available in booking history"}</p>
            <p>Payment ID: {booking.paymentId || "Available in booking history"}</p>
            {booking.orderId ? <p>Order ID: {booking.orderId}</p> : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/booking-history")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View booking history
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Home size={16} /> Back to home
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default BookingConfirmation;
