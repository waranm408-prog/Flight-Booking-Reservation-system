import { useMemo, useState, useEffect } from "react";
import { useFormik } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plane, Armchair, UserRound, CreditCard, Phone, Mail } from "lucide-react";
import Navbar from "../components/Navbar";
import RazorpayCheckout from "../components/RazorpayCheckout";
import api from "../api/axios";

interface FlightSummary {
  id: number | string;
  airline: string;
  logo?: string;
  origin: string;
  destination: string;
  departureTime: string;          // Formatted time string (e.g., "10:30 AM")
  arrivalTime: string;            // Formatted time string (e.g., "2:45 PM")
  departureDateTime?: string;     // Full ISO datetime (e.g., "2026-07-25T10:30:00.000Z")
  arrivalDateTime?: string;       // Full ISO datetime (e.g., "2026-07-25T14:45:00.000Z")
  departureDate?: string;         // ISO date for backward compatibility
  arrivalDate?: string;           // ISO date for backward compatibility
  duration?: string;
  stops?: number;
  price: string;
  cabinClass: string;
  flightNo?: string;
  dataSource?: string;
}

interface BookingState {
  flight?: FlightSummary;
  outboundFlight?: FlightSummary;  // Alternative naming
  returnFlight?: FlightSummary;
  passengers?: number;
  selectedSeats?: string[];
  returnSelectedSeats?: string[];
  trip?: {
    from?: string;
    to?: string;
    cabinClass?: string;
    tripType?: 'one-way' | 'round-trip';
    departureDate?: string;
    returnDate?: string;
  };
  // Premium seat pricing information
  seatPricing?: {
    outboundSeatPrice: number;
    returnSeatPrice: number;
    totalSeatPrice: number;
    premiumSeatCharge: number;
  };
  // Total pricing information
  pricing?: {
    baseFlightPrice: number;
    seatCharges: number;
    grandTotal: number;
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
  Array.from({ length: count }, () => ({ name: "", phone:"", email: "" }));

const getNotificationStorageKey = (email?: string) => {
  const normalizedEmail = (email || "").trim().toLowerCase();
  return normalizedEmail ? `userNotifications:${normalizedEmail}` : "userNotifications:guest";
};

const normalizeFlightDateFields = (flight?: FlightSummary) => {
  if (!flight) return undefined;

  const departureDateTime = flight.departureDateTime || flight.departureDate;
  const arrivalDateTime = flight.arrivalDateTime || flight.arrivalDate;
  const departureDate = flight.departureDate || flight.departureDateTime;
  const arrivalDate = flight.arrivalDate || flight.arrivalDateTime;

  return {
    ...flight,
    departureDateTime,
    arrivalDateTime,
    departureDate,
    arrivalDate,
  };
};

function BookNow() {
  const location = useLocation();
  const navigate = useNavigate();

  const normalizeBookingState = (value: BookingState | null | undefined): BookingState | null => {
    if (!value) return null;

    const normalizedFlight = normalizeFlightDateFields(value.flight ?? value.outboundFlight);
    const normalizedReturnFlight = normalizeFlightDateFields(value.returnFlight);

    return {
      ...value,
      flight: normalizedFlight,
      outboundFlight: normalizedFlight,
      returnFlight: normalizedReturnFlight,
      trip: value.trip ? { ...value.trip } : undefined,
    };
  };

  const getStoredBookingData = () => {
    if (typeof window === 'undefined') return null;

    try {
      const savedData = sessionStorage.getItem('bookingData');
      if (!savedData) return null;
      return normalizeBookingState(JSON.parse(savedData) as BookingState);
    } catch (error) {
      console.error('Failed to parse booking data from session storage:', error);
      return null;
    }
  };

  const [bookingData, setBookingData] = useState<BookingState | null>(() => {
    const incomingState = location.state as BookingState | undefined;
    const normalizedIncomingState = normalizeBookingState(incomingState);

    if (normalizedIncomingState) {
      sessionStorage.setItem('bookingData', JSON.stringify(normalizedIncomingState));
      return normalizedIncomingState;
    }

    return getStoredBookingData();
  });

  useEffect(() => {
    const incomingState = location.state as BookingState | undefined;
    const normalizedIncomingState = normalizeBookingState(incomingState);

    if (normalizedIncomingState) {
      sessionStorage.setItem('bookingData', JSON.stringify(normalizedIncomingState));
      setBookingData(normalizedIncomingState);
      return;
    }

    const restoredData = getStoredBookingData();
    if (restoredData) {
      setBookingData(restoredData);
    }
  }, [location.state]);

  const normalizedBookingState = useMemo(() => normalizeBookingState(bookingData), [bookingData]);
  const normalizedFlight = useMemo(
    () => normalizeFlightDateFields(normalizedBookingState?.flight ?? normalizedBookingState?.outboundFlight),
    [normalizedBookingState]
  );
  const normalizedReturnFlight = useMemo(
    () => normalizeFlightDateFields(normalizedBookingState?.returnFlight),
    [normalizedBookingState]
  );

  const passengers = normalizedBookingState?.passengers ?? 1;
  const selectedSeats = normalizedBookingState?.selectedSeats ?? [];
  const returnSelectedSeats = normalizedBookingState?.returnSelectedSeats ?? [];
  const trip = normalizedBookingState?.trip;
  const seatPricing = normalizedBookingState?.seatPricing;
  const pricing = normalizedBookingState?.pricing;
  const paymentKey = `flightPayment:${normalizedFlight?.id || 'unknown'}:${selectedSeats.slice().sort().join('-')}`;

  useEffect(() => {
    console.log('📋 BookNow Page - Received State:', {
      normalizedFlight: {
        airline: normalizedFlight?.airline,
        departureDate: normalizedFlight?.departureDate,
        departureDateTime: normalizedFlight?.departureDateTime,
        departureTime: normalizedFlight?.departureTime,
      },
      normalizedReturnFlight: normalizedReturnFlight ? {
        airline: normalizedReturnFlight?.airline,
        departureDate: normalizedReturnFlight?.departureDate,
        departureDateTime: normalizedReturnFlight?.departureDateTime,
        departureTime: normalizedReturnFlight?.departureTime,
      } : null,
      trip: {
        departureDate: trip?.departureDate,
        returnDate: trip?.returnDate,
      },
    });
  }, [location.state]);

  const passengerCount = Math.max(1, Math.min(6, passengers));
  const passengerLabels = useMemo(() => Array.from({ length: passengerCount }, (_, index) => index + 1), [passengerCount]);
  const basePrice = Number.parseInt((normalizedFlight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  const returnBasePrice = Number.parseInt((normalizedReturnFlight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  
  // Use pricing from seat page if available (includes premium seat charges), otherwise calculate base flight price
  const totalPrice = pricing?.grandTotal ?? (basePrice * passengerCount + (trip?.tripType === 'round-trip' ? returnBasePrice * passengerCount : 0));
  const seatCharges = seatPricing?.totalSeatPrice ?? 0;
  const hasSelectedFlight = Boolean(normalizedFlight?.airline);
  const outboundTimeLabel = normalizedFlight?.departureTime || 'N/A';
  const returnTimeLabel = normalizedReturnFlight?.departureTime || 'N/A';
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const completedPayment = sessionStorage.getItem(paymentKey);
    if (completedPayment) {
      navigate('/booking-confirmation', { state: JSON.parse(completedPayment), replace: true });
    }
  }, [navigate, paymentKey]);

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
      setPaymentError(null);
    },
  });

  const handleDetailChange = (index: number, field: "name" | "phone" | "email", value: string) => {
    // For phone field, allow only digits and limit to 15 characters
    if (field === "phone") {
      const digitsOnly = value.replace(/\D/g, '');
      const limitedDigits = digitsOnly.slice(0, 15);
      formik.setFieldValue(`travelers[${index}].${field}`, limitedDigits);
    } else {
      formik.setFieldValue(`travelers[${index}].${field}`, value);
    }
  };

  const handlePaymentSuccess = async (payment: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    try {
      const storedUser = localStorage.getItem('CurrentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const userEmail = currentUser?.email || formik.values.travelers[0]?.email || '';

      // Debug: Log received flight data
      console.log('🟢 BookNow received data:', {
        normalizedFlight,
        normalizedReturnFlight,
        trip,
        flightDepartureDate: normalizedFlight?.departureDate,
        flightArrivalDate: normalizedFlight?.arrivalDate,
      });

      // Transform travelers data to convert phone to number
      const transformedTravelers = formik.values.travelers.map(traveler => ({
        name: traveler.name,
        phone: traveler.phone ? Number(traveler.phone.replace(/\D/g, '')) : null,
        email: traveler.email,
      }));

      const verification = await api.post('/payments/verify', {
        ...payment,
        bookingData: {
          userId: currentUser?._id || null,
          flightId: normalizedFlight?.id || '',
          userEmail,
          flightName: normalizedFlight?.airline || 'Flight',
          flightNo: normalizedFlight?.flightNo || '',
          airline: normalizedFlight?.airline || '',
          origin: trip?.from || normalizedFlight?.origin || 'Origin',
          destination: trip?.to || normalizedFlight?.destination || 'Destination',
          departureTime: normalizedFlight?.departureTime || '',
          arrivalTime: normalizedFlight?.arrivalTime || '',
          departureDate: normalizedFlight?.departureDateTime || normalizedFlight?.departureDate || '',
          arrivalDate: normalizedFlight?.arrivalDateTime || normalizedFlight?.arrivalDate || '',
          duration: normalizedFlight?.duration || '',
          stops: normalizedFlight?.stops || 0,
          cabinClass: normalizedFlight?.cabinClass || trip?.cabinClass || 'Economy',
          passengers: transformedTravelers,
          seats: selectedSeats,
          flid: normalizedReturnFlight?.id || null,
          isRoundTrip: trip?.tripType === 'round-trip',
          tripType: trip?.tripType || 'one-way',
          returnDate: normalizedReturnFlight?.departureDateTime || normalizedReturnFlight?.departureDate || '',
          returnFlightName: normalizedReturnFlight?.airline || '',
          returnFlightNo: normalizedReturnFlight?.flightNo || '',
          returnDepartureTime: normalizedReturnFlight?.departureTime || '',
          returnArrivalTime: normalizedReturnFlight?.arrivalTime || '',
          returnDepartureDate: normalizedReturnFlight?.departureDateTime || normalizedReturnFlight?.departureDate || '',
          returnArrivalDate: normalizedReturnFlight?.arrivalDateTime || normalizedReturnFlight?.arrivalDate || '',
          returnSeats: returnSelectedSeats,
          amount: totalPrice,
          dataSource: normalizedFlight?.dataSource || 'live',
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
        
        const confirmation = {
          bookingId: verification.data.booking?.id || verification.data.booking?._id || payment.razorpay_payment_id,
          paymentId: payment.razorpay_payment_id,
          orderId: payment.razorpay_order_id,
          flight: {
            airline: normalizedFlight?.airline,
            cabinClass: normalizedFlight?.cabinClass || trip?.cabinClass,
            flightNo: normalizedFlight?.flightNo,
            departureTime: normalizedFlight?.departureTime,
            arrivalTime: normalizedFlight?.arrivalTime,
            departureDate: normalizedFlight?.departureDate,
            arrivalDate: normalizedFlight?.arrivalDate,
            duration: normalizedFlight?.duration,
            stops: normalizedFlight?.stops,
            price: basePrice * passengerCount,
          },
          returnFlight: normalizedReturnFlight ? {
            airline: normalizedReturnFlight.airline,
            cabinClass: normalizedReturnFlight.cabinClass || trip?.cabinClass,
            flightNo: normalizedReturnFlight.flightNo,
            departureTime: normalizedReturnFlight.departureTime,
            arrivalTime: normalizedReturnFlight.arrivalTime,
            departureDate: normalizedReturnFlight.departureDate,
            arrivalDate: normalizedReturnFlight.arrivalDate,
            duration: normalizedReturnFlight.duration,
            stops: normalizedReturnFlight.stops,
            price: returnBasePrice * passengerCount,
          } : undefined,
          trip,
          passengers: passengerCount,
          selectedSeats,
          returnSelectedSeats,
          amount: totalPrice,
          bookingDate: new Date().toISOString(),
        };

        // Debug: Log confirmation data being passed
        console.log('🟣 Passing to confirmation page:', confirmation);
        console.log('🟣 Flight dates:', {
          departureDate: confirmation.flight?.departureDate,
          arrivalDate: confirmation.flight?.arrivalDate,
          tripDepartureDate: confirmation.trip?.departureDate,
        });
        sessionStorage.setItem(paymentKey, JSON.stringify(confirmation));
        
        // Clear booking data from session storage after successful payment
        sessionStorage.removeItem('bookingData');
        
        navigate('/booking-confirmation', { state: confirmation, replace: true });
        setPaymentError(null);
      }
    } catch (error) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPaymentError(responseMessage || 'Payment verification failed. Please contact support.');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 px-4 py-8 text-slate-800 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to seat selection
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* LEFT: Flight Summary & Passenger Form */}
            <div className="space-y-6">
              {/* Flight Summary Card - Ticket Style */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-white shadow-xl">
                {/* Decorative perforated edge */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-blue-100/50 to-transparent">
                  <div className="flex h-full flex-col justify-around py-4">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="mx-auto h-1 w-1 rounded-full bg-blue-300/50"></div>
                    ))}
                  </div>
                </div>

                <div className="p-6 pl-12">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-blue-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plane size={20} className="text-blue-600" />
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Flight Booking</p>
                      </div>
                      <h2 className="mt-2 text-2xl font-bold text-slate-900">Reservation Details</h2>
                    </div>
                  </div>

                  {hasSelectedFlight ? (
                    <div className="mt-6 space-y-4">
                      {/* Airline & Route */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Airline</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">{normalizedFlight?.airline || "Selected flight"}</p>
                          </div>
                          <div className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                            {normalizedFlight?.cabinClass || trip?.cabinClass || "Economy"}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                          <Plane size={18} className="text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">
                              {trip?.from || normalizedFlight?.origin || "Origin"} → {trip?.to || normalizedFlight?.destination || "Destination"}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">{normalizedFlight?.flightNo || 'Flight'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Outbound Flight Details */}
                      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Outbound Journey</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-white p-3 shadow-sm">
                            <p className="text-xs text-slate-500 font-semibold">Departure</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              {normalizedFlight?.departureDate 
                                ? new Date(normalizedFlight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : "N/A"}
                            </p>
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">{outboundTimeLabel}</p>
                          </div>
                          
                          <div className="rounded-lg bg-white p-3 shadow-sm">
                            <p className="text-xs text-slate-500 font-semibold">Seats</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedSeats.length > 0 ? (
                                selectedSeats.map(seat => (
                                  <span key={seat} className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                                    <Armchair size={10} />
                                    {seat}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500">No seats</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Return Flight Details */}
                      {trip?.tripType === 'round-trip' && normalizedReturnFlight && (
                        <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</div>
                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Return Journey</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                              <p className="text-xs text-slate-500 font-semibold">Departure</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {normalizedReturnFlight?.departureDate 
                                  ? new Date(normalizedReturnFlight.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                  : "N/A"}
                              </p>
                              <p className="text-xs font-semibold text-indigo-600 mt-0.5">{returnTimeLabel}</p>
                            </div>
                            
                            <div className="rounded-lg bg-white p-3 shadow-sm">
                              <p className="text-xs text-slate-500 font-semibold">Seats</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {returnSelectedSeats.length > 0 ? (
                                  returnSelectedSeats.map(seat => (
                                    <span key={seat} className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                                      <Armchair size={10} />
                                      {seat}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-500">No seats</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-bold text-amber-700">⚠️ No flight selected</p>
                      <p className="mt-2 text-sm text-amber-700">
                        Please choose a flight first from the flight list before continuing with the booking.
                      </p>
                    </div>
                  )}
                </div>
              </div>


            </div>

            {/* RIGHT: Pricing Summary & Passenger Form */}
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Pricing Summary Card - Ticket Stub Style */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xl">
                {/* Decorative perforated edge */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100/50 to-transparent">
                  <div className="flex h-full flex-col justify-around py-4">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="mx-auto h-1 w-1 rounded-full bg-slate-300/50"></div>
                    ))}
                  </div>
                </div>

                <div className="p-6 pr-12">
                  <div className="mb-4 flex items-center gap-2 border-b-2 border-dashed border-slate-200 pb-3">
                    <CreditCard size={20} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Price Breakdown</h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                      <span className="flex items-center gap-2 text-slate-700">
                        <UserRound size={14} className="text-blue-600" />
                        Passengers
                      </span>
                      <span className="font-bold text-slate-900">{passengerCount}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-slate-600">Total seats</span>
                      <span className="font-semibold text-slate-900">
                        {selectedSeats.length + (trip?.tripType === 'round-trip' ? returnSelectedSeats.length : 0)}
                      </span>
                    </div>

                    <div className="my-3 border-t border-dashed border-slate-200"></div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5">
                        <span className="flex items-center gap-2 text-slate-700">
                          <Plane size={14} className="text-blue-600" />
                          Outbound flight
                        </span>
                        <span className="font-bold text-blue-700">₹{(basePrice * passengerCount).toLocaleString()}</span>
                      </div>

                      {trip?.tripType === 'round-trip' && normalizedReturnFlight && (
                        <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2.5">
                          <span className="flex items-center gap-2 text-slate-700">
                            <Plane size={14} className="rotate-180 text-indigo-600" />
                            Return flight
                          </span>
                          <span className="font-bold text-indigo-700">₹{(returnBasePrice * passengerCount).toLocaleString()}</span>
                        </div>
                      )}

                      {seatCharges > 0 && (
                        <>
                          {seatPricing?.outboundSeatPrice && seatPricing.outboundSeatPrice > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
                              <span className="flex items-center gap-2 text-slate-700">
                                <Armchair size={14} className="text-amber-600" />
                                Outbound premium seats
                              </span>
                              <span className="font-bold text-amber-700">+₹{seatPricing.outboundSeatPrice.toLocaleString()}</span>
                            </div>
                          )}
                          {trip?.tripType === 'round-trip' && seatPricing?.returnSeatPrice && seatPricing.returnSeatPrice > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
                              <span className="flex items-center gap-2 text-slate-700">
                                <Armchair size={14} className="text-amber-600" />
                                Return premium seats
                              </span>
                              <span className="font-bold text-amber-700">+₹{seatPricing.returnSeatPrice.toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="my-3 border-t-2 border-slate-300"></div>

                    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 shadow-sm">
                      <span className="text-base font-bold text-slate-800">Grand Total</span>
                      <span className="text-xl font-bold text-green-700">₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Form Card - Modern Style */}
              <div className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-2 border-b-2 border-dashed border-blue-100 pb-3">
                  <UserRound size={20} className="text-blue-600" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Traveler Details</h3>
                    <p className="text-xs text-slate-500">Enter passenger information</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {passengerLabels.map((label, index) => {
                    const isFirstPassenger = index === 0;
                    const traveler = formik.values.travelers[index] ?? { name: "", phone: "", email: "" };

                    return (
                      <div 
                        key={label} 
                        className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {label}
                          </div>
                          <p className="text-sm font-bold text-slate-700">
                            Passenger {label}
                            {isFirstPassenger && <span className="ml-2 text-xs text-blue-600">(Primary contact)</span>}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <UserRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder={`Full name ${isFirstPassenger ? '(required)' : ''}`}
                              value={traveler.name}
                              onChange={(e) => handleDetailChange(index, "name", e.target.value)}
                              className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              required={isFirstPassenger}
                            />
                          </div>

                          {isFirstPassenger && (
                            <>
                              <div className="relative">
                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="tel"
                                  placeholder="Phone number (required)"
                                  value={traveler.phone}
                                  onChange={(e) => handleDetailChange(index, "phone", e.target.value)}
                                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  required
                                />
                              </div>

                              <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="email"
                                  placeholder="Email address (required)"
                                  value={traveler.email}
                                  onChange={(e) => handleDetailChange(index, "email", e.target.value)}
                                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  required
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

              {/* Payment Button */}
              <button
                type="submit"
                className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg transition-all ${
                  hasSelectedFlight 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.98]" 
                    : "cursor-not-allowed bg-slate-400"
                }`}
                disabled={!hasSelectedFlight || isPaying}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <CreditCard size={20} />
                {isPaying ? (
                  <>
                    <span className="animate-pulse">Processing...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </>
                ) : (
                  "Proceed to Secure Payment"
                )}
              </button>

              {paymentError && (
                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-rose-700">⚠️ {paymentError}</p>
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



