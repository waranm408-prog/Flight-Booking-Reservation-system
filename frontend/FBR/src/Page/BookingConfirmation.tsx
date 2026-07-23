import { CheckCircle2, Home, ReceiptText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

interface BookingConfirmationState {
  bookingId?: string;
  paymentId?: string;
  orderId?: string;
  flight?: {
    airline?: string;
    cabinClass?: string;
  };
  trip?: {
    from?: string;
    to?: string;
  };
  passengers?: number;
  selectedSeats?: string[];
  amount?: number;
}

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = (location.state || {}) as BookingConfirmationState;

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

          <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Flight</span>
              <span className="font-semibold text-slate-900">{booking.flight?.airline || "Selected flight"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Route</span>
              <span className="font-semibold text-slate-900">{booking.trip?.from || "Origin"} → {booking.trip?.to || "Destination"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Seats</span>
              <span className="font-semibold text-slate-900">{booking.selectedSeats?.join(", ") || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Passengers</span>
              <span className="font-semibold text-slate-900">{booking.passengers || 1}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Total paid</span>
              <span className="font-semibold text-slate-900">RS {(booking.amount || 0).toLocaleString()}</span>
            </div>
          </div>

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
