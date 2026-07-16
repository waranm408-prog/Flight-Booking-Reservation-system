import { useMemo, useState, useEffect } from "react";
import { useFormik } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plane, Armchair, UserRound, CreditCard, Phone, Mail, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import RazorpayCheckout from "../components/RazorpayCheckout";
import api from "../api/axios";

interface FlightSummary {
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  cabinClass: string;
}

interface BookingState {
  flight?: FlightSummary;
  passengers?: number;
  selectedSeats?: string[];
  trip?: {
    from?: string;
    to?: string;
    cabinClass?: string;
  };
}

interface TravelerDetails {
  name: string;
  phone: string;
  email: string;
}

interface BookingFormValues {
  travelers: TravelerDetails[];
}

const buildTravelerDetails = (count: number): TravelerDetails[] =>
  Array.from({ length: count }, () => ({ name: "", phone: "", email: "" }));

const getNotificationStorageKey = (email?: string) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  return normalizedEmail ? `userNotifications:${normalizedEmail}` : "userNotifications:guest";
};

function BookNow() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingState | undefined;

  const flight = state?.flight;
  const passengers = state?.passengers ?? 1;
  const selectedSeats = state?.selectedSeats ?? [];
  const trip = state?.trip;

  const passengerCount = Math.max(1, Math.min(6, passengers));
  const passengerLabels = useMemo(() => Array.from({ length: passengerCount }, (_, index) => index + 1), [passengerCount]);
  const basePrice = Number.parseInt((flight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  const totalPrice = basePrice * passengerCount;
  const hasSelectedFlight = Boolean(flight?.airline);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('CurrentUser');
    if (storedUser) {
      try {
        setUserProfile(JSON.parse(storedUser));
      } catch {
        setUserProfile(null);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('CurrentUser');
    if (!token) {
      setPaymentError('Please Login');
      setTimeout(() => navigate('/login'), 1200);
    }
  }, []);

  const formik = useFormik<BookingFormValues>({
    initialValues: {
      travelers: buildTravelerDetails(passengerCount).map((traveler, index) => {
        if (index === 0 && userProfile) {
          return {
            ...traveler,
            name: userProfile.name || traveler.name,
            email: userProfile.email || traveler.email,
          };
        }
        return traveler;
      }),
    },
    enableReinitialize: true,
    validate: (values) => {
      const errors: Partial<Record<'travelers', TravelerDetails[]>> = {};
      const firstTraveler = values.travelers[0];
      const firstTravelerErrors: Partial<TravelerDetails> = {};

      if (!firstTraveler?.name?.trim()) {
        firstTravelerErrors.name = 'Passenger name is required';
      }
      if (!firstTraveler?.phone?.trim()) {
        firstTravelerErrors.phone = 'Phone number is required';
        
      }
      if (!firstTraveler?.email?.trim()) {
        firstTravelerErrors.email = 'Email is required';
      }

      if (Object.keys(firstTravelerErrors).length > 0) {
        errors.travelers = [firstTravelerErrors as TravelerDetails, ...(values.travelers.slice(1) || [])];
      }

      return errors;
    },
    onSubmit: () => {
      if (!hasSelectedFlight) {
        return;
      }

      const firstTraveler = formik.values.travelers[0];
      if (!firstTraveler?.name?.trim() || !firstTraveler?.phone?.trim() || !firstTraveler?.email?.trim()) {
        setPaymentError('Please enter the first passenger name, phone, and email to continue.');
        return;
      }

      setIsPaying(true);
      setPaymentSuccess(false);
      setPaymentError(null);
    },
  });

  const handleDetailChange = (index: number, field: "name" | "phone" | "email", value: string) => {
    formik.setFieldValue(`travelers[${index}].${field}`, value);
  };

  const handlePaymentSuccess = async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    try {
      const storedUser = localStorage.getItem('CurrentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const userEmail = currentUser?.email || formik.values.travelers[0]?.email || '';

      const verification = await api.post('/payments/verify', {
        ...payment,
        bookingData: {
          userId: currentUser?._id || null,
          userEmail,
          flightName: flight?.airline || 'Flight',
          origin: trip?.from || flight?.origin || 'Origin',
          destination: trip?.to || flight?.destination || 'Destination',
          departureTime: flight?.departureTime || '',
          arrivalTime: flight?.arrivalTime || '',
          cabinClass: flight?.cabinClass || trip?.cabinClass || 'Economy',
          passengers: formik.values.travelers,
          seats: selectedSeats,
          amount: totalPrice,
        },
      });

      if (verification.data.success) {
        const storageKey = getNotificationStorageKey(userEmail);
        const storedNotifications = localStorage.getItem(storageKey);
        const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
        const newNotification = {
          id: `${Date.now()}`,
          title: 'Payment confirmed',
          message: userEmail ? `Your confirmation email was sent to ${userEmail}.` : 'Your booking has been confirmed.',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(storageKey, JSON.stringify([newNotification, ...notifications].slice(0, 6)));
        window.dispatchEvent(new Event('notifications-updated'));
        setPaymentSuccess(true);
        setPaymentError(null);
      }
    } catch (error) {
      setPaymentError('Payment verification failed. Please contact support.');
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePaymentClose = () => {
    setIsPaying(false);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 md:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to seat selection
          </button>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Reservation</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Booking details</h2>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {hasSelectedFlight ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Flight</p>
                        <p className="text-lg font-bold text-slate-900">{flight?.airline || "Selected flight"}</p>
                      </div>
                      <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {flight?.cabinClass || trip?.cabinClass || "Economy"}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                      <Plane size={18} className="text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{trip?.from || flight?.origin || "Origin"} → {trip?.to || flight?.destination || "Destination"}</p>
                        <p className="text-sm text-slate-500">{flight?.departureTime || "Departure"} • {flight?.arrivalTime || "Arrival"}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-700">No flight selected</p>
                    <p className="mt-2 text-sm text-amber-700">
                      Please choose a flight first from the flight list before continuing with the booking.
                    </p>
                    <div className="mt-3 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-600">
                      Showing fallback results until a flight is selected.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Armchair size={18} className="text-blue-600" />
                  Selected seats
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((seat) => (
                      <span key={seat} className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No seats selected</span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={formik.handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Traveler</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Passenger details</h3>

              <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Passengers</span>
                  <span className="font-semibold text-slate-800">{passengerCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Seat count</span>
                  <span className="font-semibold text-slate-800">{selectedSeats.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Price</span>
                  <span className="font-semibold text-slate-800">RS {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <UserRound size={18} />
                  Passenger details
                </div>

                <div className="mt-4 space-y-4">
                  {passengerLabels.map((label, index) => {
                    const isFirstPassenger = index === 0;
                    const traveler = formik.values.travelers[index] ?? { name: "", phone: "", email: "" };

                    return (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="mb-3 text-sm font-semibold text-slate-700">Passenger {label}</p>

                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder={`Passenger ${label} name`}
                            value={traveler.name}
                            onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />

                          {isFirstPassenger && (
                            <>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                <Phone size={16} className="text-slate-400" />
                                <input
                                  type="tel"
                                  placeholder="Phone number"
                                  value={traveler.phone}
                                  onChange={(e) => handleDetailChange(index, "phone", e.target.value)}
                                  className="w-full border-0 bg-transparent text-sm outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                                <Mail size={16} className="text-slate-400" />
                                <input
                                  type="email"
                                  placeholder="Email address"
                                  value={traveler.email}
                                  onChange={(e) => handleDetailChange(index, "email", e.target.value)}
                                  className="w-full border-0 bg-transparent text-sm outline-none"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                  hasSelectedFlight ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 hover:bg-slate-500"
                }`}
                disabled={!hasSelectedFlight || isPaying}
              >
                <CreditCard size={16} />
                {isPaying ? "Preparing payment..." : "Continue to Payment"}
              </button>

              {paymentSuccess && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Payment verified successfully.
                </div>
              )}

              {paymentError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {paymentError}
                </div>
              )}

              {isPaying && hasSelectedFlight && (
                <RazorpayCheckout
                  amount={totalPrice}
                  receipt={`fbr-${Date.now()}`}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                />
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookNow;
