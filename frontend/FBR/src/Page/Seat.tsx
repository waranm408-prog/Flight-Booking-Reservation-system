import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Armchair, CheckCircle2, Plane, ArrowRight, Crown } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

interface FlightSummary {
  id: number | string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  departureDateTime?: string;     // Full ISO datetime from API
  arrivalDateTime?: string;       // Full ISO datetime from API
  departureDate?: string;
  arrivalDate?: string;
  duration?: string;
  stops?: number;
  price: string;
  cabinClass: string;
  flightNo?: string;
  dataSource?: string;
}

interface SeatState {
  flight?: FlightSummary;
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
}

function Seat() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SeatState | undefined;
  const storageKey = "flightBookingSelection";

  const storedSelection = useMemo<SeatState | undefined>(() => {
    if (typeof window === "undefined") return undefined;

    try {
      const saved = window.sessionStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as SeatState) : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const rawFlight = state?.flight ?? storedSelection?.flight;
  const rawReturnFlight = state?.returnFlight ?? storedSelection?.returnFlight;
  const flight = rawFlight;
  const returnFlight = rawReturnFlight;
  const passengers = Math.max(1, Math.min(6, state?.passengers ?? storedSelection?.passengers ?? 1));
  const trip = state?.trip ?? storedSelection?.trip;
  const basePrice = Number.parseInt((flight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  const returnBasePrice = Number.parseInt((returnFlight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  const totalPrice = basePrice * passengers + (trip?.tripType === 'round-trip' ? returnBasePrice * passengers : 0);

  const seatRows = useMemo(() => ["A", "B", "C", "D", "E", "F"], []);
  const seatNumbers = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []);

  const [selectedSeats, setSelectedSeats] = useState<string[]>(storedSelection?.selectedSeats ?? []);
  const [returnSelectedSeats, setReturnSelectedSeats] = useState<string[]>(storedSelection?.returnSelectedSeats ?? []);
  const [outboundBookedSeats, setOutboundBookedSeats] = useState<string[]>([]);
  const [returnBookedSeats, setReturnBookedSeats] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [, setActiveTab] = useState<'outbound' | 'return'>('outbound');
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Premium/Emergency exit rows (rows 1-2 and 12)
  const premiumSeats = useMemo(() => {
    const premium: string[] = [];
    seatRows.forEach(row => {
      [1, 2, 12].forEach(num => {
        premium.push(`${row}${num}`);
      });
    });
    return premium;
  }, [seatRows]);

  const PREMIUM_SEAT_PRICE = 500;

  // Calculate seat prices
  const outboundSeatPrice = useMemo(() => {
    return selectedSeats.reduce((total, seat) => {
      return total + (premiumSeats.includes(seat) ? PREMIUM_SEAT_PRICE : 0);
    }, 0);
  }, [selectedSeats, premiumSeats]);

  const returnSeatPrice = useMemo(() => {
    return returnSelectedSeats.reduce((total, seat) => {
      return total + (premiumSeats.includes(seat) ? PREMIUM_SEAT_PRICE : 0);
    }, 0);
  }, [returnSelectedSeats, premiumSeats]);

  const grandTotal = totalPrice + outboundSeatPrice + returnSeatPrice;

  useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      if (!flight?.id) {
        setAvailabilityLoading(false);
        setAvailabilityError("This flight is missing its identity. Please return to search and choose it again.");
        return;
      }

      setAvailabilityLoading(true);
      setAvailabilityError("");

      try {
        const requests = [
          api.get(`/payments/seats/${encodeURIComponent(String(flight.id))}`),
          ...(trip?.tripType === 'round-trip' && returnFlight?.id
            ? [api.get(`/payments/seats/${encodeURIComponent(String(returnFlight.id))}`)]
            : []),
        ];

        const responses = await Promise.all(requests);
        if (!active) return;

        const outboundBooked = Array.isArray(responses[0]?.data?.bookedSeats)
          ? responses[0].data.bookedSeats.map((seat: string) => seat.toUpperCase())
          : [];

        const returnBooked = Array.isArray(responses[1]?.data?.bookedSeats)
          ? responses[1].data.bookedSeats.map((seat: string) => seat.toUpperCase())
          : [];

        setOutboundBookedSeats(outboundBooked);
        setReturnBookedSeats(returnBooked);
        setSelectedSeats((currentSeats) => currentSeats.filter((seat) => !outboundBooked.includes(seat)));
        setReturnSelectedSeats((currentSeats) => currentSeats.filter((seat) => !returnBooked.includes(seat)));
      } catch (error) {
        console.error("Seat availability error:", error);
        if (active) {
          setAvailabilityError("Unable to load live seat availability. Please try again.");
        }
      } finally {
        if (active) setAvailabilityLoading(false);
      }
    };

    void loadAvailability();
    return () => {
      active = false;
    };
  }, [flight?.id, returnFlight?.id, trip?.tripType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ flight, returnFlight, passengers, trip, selectedSeats, returnSelectedSeats })
      );
    }
  }, [flight, returnFlight, passengers, trip, selectedSeats, returnSelectedSeats, storageKey]);

  const toggleSeat = (seat: string, segment: 'outbound' | 'return') => {
    const currentlyBookedSeats = segment === 'return' ? returnBookedSeats : outboundBookedSeats;
    if (currentlyBookedSeats.includes(seat)) {
      return;
    }

    if (segment === 'return') {
      if (returnSelectedSeats.includes(seat)) {
        setReturnSelectedSeats(returnSelectedSeats.filter((item) => item !== seat));
        return;
      }

      if (returnSelectedSeats.length >= passengers) {
        return;
      }

      setReturnSelectedSeats([...returnSelectedSeats, seat]);
      return;
    }

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((item) => item !== seat));
      return;
    }

    if (selectedSeats.length >= passengers) {
      return;
    }

    setSelectedSeats([...selectedSeats, seat]);
  };

  const handleContinue = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('CurrentUser');
    if (!token) {
      alert('Please Login');
      setTimeout(() => navigate('/login'), 800);
      return;
    }

    navigate('/book-now', {
      state: {
        flight,
        outboundFlight: flight,
        returnFlight,
        passengers,
        trip,
        selectedSeats,
        returnSelectedSeats,
        // Premium seat pricing information
        seatPricing: {
          outboundSeatPrice,
          returnSeatPrice,
          totalSeatPrice: outboundSeatPrice + returnSeatPrice,
          premiumSeatCharge: PREMIUM_SEAT_PRICE,
        },
        // Grand total including flights + premium seats
        pricing: {
          baseFlightPrice: totalPrice,
          seatCharges: outboundSeatPrice + returnSeatPrice,
          grandTotal,
        },
      },
    });
  };

  const handleProceedToReturnSeats = () => {
    if (selectedSeats.length === passengers) {
      setActiveTab('return');
    }
  };

  const canProceedToBooking = trip?.tripType === 'round-trip'
    ? selectedSeats.length === passengers && returnSelectedSeats.length === passengers
    : selectedSeats.length === passengers;

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <button
            onClick={() => navigate(-1)}
            className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to flights
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Seat Selection</p>
                  <h2 className="text-2xl font-bold text-slate-900">Choose your seats</h2>
                </div>
                <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {passengers} seat{passengers > 1 ? "s" : ""} needed
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-500">Selected route</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {trip?.from || "Your trip"} → {trip?.to || "Destination"}
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  {flight?.airline || "Premium flight"}
                </div>
              </div>

              <div className="mb-4 flex items-center justify-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-slate-300 bg-white"></div>
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-blue-600"></div>
                  Selected
                </div>
              </div>

              <div className="space-y-6">
                {/* Outbound Cabin - Airplane Paper Format */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-white shadow-xl">
                  {/* Decorative perforated edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-blue-100/50 to-transparent">
                    <div className="flex h-full flex-col justify-around py-4">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="mx-auto h-1 w-1 rounded-full bg-blue-300/50"></div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 pl-12">
                    {/* Ticket Header */}
                    <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-blue-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Plane size={20} className="text-blue-600" />
                          <div className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Outbound Flight</div>
                        </div>
                        <div className="mt-2 text-lg font-bold text-slate-800">{trip?.from || "Origin"} → {trip?.to || "Destination"}</div>
                        <div className="mt-1 text-xs text-slate-500">{flight?.airline || "Flight"} • {flight?.cabinClass || "Economy"}</div>
                      </div>
                      <div className="text-right">
                        <div className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                          {selectedSeats.length}/{passengers} SEATS
                        </div>
                      </div>
                    </div>

                    {/* Airplane Cabin Layout */}
                    <div className="space-y-3">
                      {/* Legend */}
                      <div className="mb-4 flex flex-wrap items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-slate-300 bg-white"></div>
                          <span className="text-slate-600">Available</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded bg-blue-600"></div>
                          <span className="text-slate-600">Selected</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded bg-slate-300"></div>
                          <span className="text-slate-600">Occupied</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 rounded border-2 border-amber-400 bg-amber-50"></div>
                          <Crown size={12} className="text-amber-600" />
                          <span className="text-slate-600">Premium (+₹{PREMIUM_SEAT_PRICE})</span>
                        </div>
                      </div>

                      {/* Airplane Nose */}
                      <div className="flex justify-center">
                        <div className="h-8 w-24 rounded-t-full border-t-2 border-l-2 border-r-2 border-blue-300 bg-gradient-to-b from-blue-100 to-transparent"></div>
                      </div>

                      {/* Seat Grid: A B C | Aisle | D E F */}
                      <div className="space-y-2">
                        {seatNumbers.map((number) => (
                          <div key={number} className="flex items-center justify-center gap-2">
                            {/* Row Label Left */}
                            <div className="w-6 text-center text-xs font-bold text-slate-400">{number}</div>
                            
                            {/* Left Section: A B C */}
                            <div className="flex gap-1.5">
                              {['A', 'B', 'C'].map(row => {
                                const seat = `${row}${number}`;
                                const isSelected = selectedSeats.includes(seat);
                                const isBooked = outboundBookedSeats.includes(seat);
                                const isPremium = premiumSeats.includes(seat);
                                const isDisabled = isBooked || (!isSelected && selectedSeats.length >= passengers);
                                const isHovered = hoveredSeat === seat;

                                return (
                                  <div key={seat} className="relative">
                                    <button
                                      type="button"
                                      onClick={() => toggleSeat(seat, 'outbound')}
                                      onMouseEnter={() => setHoveredSeat(seat)}
                                      onMouseLeave={() => setHoveredSeat(null)}
                                      disabled={isDisabled}
                                      className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                        isSelected
                                          ? "scale-105 border-2 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                                          : isBooked
                                            ? "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-400"
                                            : isPremium
                                              ? "border-2 border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100 hover:shadow-md"
                                              : "border-2 border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                                      } ${isDisabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                    >
                                      <Armchair size={14} className="mb-0.5" />
                                      <span className="text-[9px]">{seat}</span>
                                      {isSelected && (
                                        <CheckCircle2 size={12} className="absolute -right-1 -top-1 text-white drop-shadow" />
                                      )}
                                      {isPremium && !isSelected && (
                                        <Crown size={10} className="absolute -right-1 -top-1 text-amber-600" />
                                      )}
                                    </button>
                                    
                                    {/* Tooltip */}
                                    {isHovered && !isBooked && (
                                      <div className="absolute -top-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl">
                                        <div className="text-xs font-bold text-slate-800">{seat}</div>
                                        <div className="text-xs text-slate-600">{flight?.cabinClass || 'Economy'}</div>
                                        {isPremium && (
                                          <div className="mt-1 text-xs font-semibold text-amber-600">
                                            +₹{PREMIUM_SEAT_PRICE} • Extra legroom
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Aisle */}
                            <div className="flex h-10 w-12 items-center justify-center">
                              <div className="h-px w-full border-t-2 border-dashed border-blue-200"></div>
                            </div>

                            {/* Right Section: D E F */}
                            <div className="flex gap-1.5">
                              {['D', 'E', 'F'].map(row => {
                                const seat = `${row}${number}`;
                                const isSelected = selectedSeats.includes(seat);
                                const isBooked = outboundBookedSeats.includes(seat);
                                const isPremium = premiumSeats.includes(seat);
                                const isDisabled = isBooked || (!isSelected && selectedSeats.length >= passengers);
                                const isHovered = hoveredSeat === seat;

                                return (
                                  <div key={seat} className="relative">
                                    <button
                                      type="button"
                                      onClick={() => toggleSeat(seat, 'outbound')}
                                      onMouseEnter={() => setHoveredSeat(seat)}
                                      onMouseLeave={() => setHoveredSeat(null)}
                                      disabled={isDisabled}
                                      className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                        isSelected
                                          ? "scale-105 border-2 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                                          : isBooked
                                            ? "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-400"
                                            : isPremium
                                              ? "border-2 border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100 hover:shadow-md"
                                              : "border-2 border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                                      } ${isDisabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                    >
                                      <Armchair size={14} className="mb-0.5" />
                                      <span className="text-[9px]">{seat}</span>
                                      {isSelected && (
                                        <CheckCircle2 size={12} className="absolute -right-1 -top-1 text-white drop-shadow" />
                                      )}
                                      {isPremium && !isSelected && (
                                        <Crown size={10} className="absolute -right-1 -top-1 text-amber-600" />
                                      )}
                                    </button>
                                    
                                    {isHovered && !isBooked && (
                                      <div className="absolute -top-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl">
                                        <div className="text-xs font-bold text-slate-800">{seat}</div>
                                        <div className="text-xs text-slate-600">{flight?.cabinClass || 'Economy'}</div>
                                        {isPremium && (
                                          <div className="mt-1 text-xs font-semibold text-amber-600">
                                            +₹{PREMIUM_SEAT_PRICE} • Extra legroom
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Row Label Right */}
                            <div className="w-6 text-center text-xs font-bold text-slate-400">{number}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Flight Cabin - Airplane Paper Format */}
                {trip?.tripType === 'round-trip' && returnFlight && (
                  <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-white via-indigo-50/30 to-white shadow-xl">
                    {/* Decorative perforated edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-indigo-100/50 to-transparent">
                      <div className="flex h-full flex-col justify-around py-4">
                        {[...Array(20)].map((_, i) => (
                          <div key={i} className="mx-auto h-1 w-1 rounded-full bg-indigo-300/50"></div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 pl-12">
                      {/* Ticket Header */}
                      <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-indigo-200 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Plane size={20} className="rotate-180 text-indigo-600" />
                            <div className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">Return Flight</div>
                          </div>
                          <div className="mt-2 text-lg font-bold text-slate-800">{trip?.to || "Destination"} → {trip?.from || "Origin"}</div>
                          <div className="mt-1 text-xs text-slate-500">{returnFlight?.airline || "Flight"} • {returnFlight?.cabinClass || "Economy"}</div>
                        </div>
                        <div className="text-right">
                          <div className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                            {returnSelectedSeats.length}/{passengers} SEATS
                          </div>
                        </div>
                      </div>

                      {/* Airplane Cabin Layout */}
                      <div className="space-y-3">
                        {/* Airplane Nose */}
                        <div className="flex justify-center">
                          <div className="h-8 w-24 rounded-t-full border-t-2 border-l-2 border-r-2 border-indigo-300 bg-gradient-to-b from-indigo-100 to-transparent"></div>
                        </div>

                        {/* Seat Grid */}
                        <div className="space-y-2">
                          {seatNumbers.map((number) => (
                            <div key={number} className="flex items-center justify-center gap-2">
                              <div className="w-6 text-center text-xs font-bold text-slate-400">{number}</div>
                              
                              <div className="flex gap-1.5">
                                {['A', 'B', 'C'].map(row => {
                                  const seat = `${row}${number}`;
                                  const isSelected = returnSelectedSeats.includes(seat);
                                  const isBooked = returnBookedSeats.includes(seat);
                                  const isPremium = premiumSeats.includes(seat);
                                  const isDisabled = isBooked || (!isSelected && returnSelectedSeats.length >= passengers);
                                  const isHovered = hoveredSeat === seat;

                                  return (
                                    <div key={seat} className="relative">
                                      <button
                                        type="button"
                                        onClick={() => toggleSeat(seat, 'return')}
                                        onMouseEnter={() => setHoveredSeat(seat)}
                                        onMouseLeave={() => setHoveredSeat(null)}
                                        disabled={isDisabled}
                                        className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                          isSelected
                                            ? "scale-105 border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                            : isBooked
                                              ? "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-400"
                                              : isPremium
                                                ? "border-2 border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100 hover:shadow-md"
                                                : "border-2 border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md"
                                        } ${isDisabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                      >
                                        <Armchair size={14} className="mb-0.5" />
                                        <span className="text-[9px]">{seat}</span>
                                        {isSelected && <CheckCircle2 size={12} className="absolute -right-1 -top-1 text-white drop-shadow" />}
                                        {isPremium && !isSelected && <Crown size={10} className="absolute -right-1 -top-1 text-amber-600" />}
                                      </button>
                                      
                                      {isHovered && !isBooked && (
                                        <div className="absolute -top-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl">
                                          <div className="text-xs font-bold text-slate-800">{seat}</div>
                                          <div className="text-xs text-slate-600">{returnFlight?.cabinClass || 'Economy'}</div>
                                          {isPremium && <div className="mt-1 text-xs font-semibold text-amber-600">+₹{PREMIUM_SEAT_PRICE} • Extra legroom</div>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex h-10 w-12 items-center justify-center">
                                <div className="h-px w-full border-t-2 border-dashed border-indigo-200"></div>
                              </div>

                              <div className="flex gap-1.5">
                                {['D', 'E', 'F'].map(row => {
                                  const seat = `${row}${number}`;
                                  const isSelected = returnSelectedSeats.includes(seat);
                                  const isBooked = returnBookedSeats.includes(seat);
                                  const isPremium = premiumSeats.includes(seat);
                                  const isDisabled = isBooked || (!isSelected && returnSelectedSeats.length >= passengers);
                                  const isHovered = hoveredSeat === seat;

                                  return (
                                    <div key={seat} className="relative">
                                      <button
                                        type="button"
                                        onClick={() => toggleSeat(seat, 'return')}
                                        onMouseEnter={() => setHoveredSeat(seat)}
                                        onMouseLeave={() => setHoveredSeat(null)}
                                        disabled={isDisabled}
                                        className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                          isSelected
                                            ? "scale-105 border-2 border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                            : isBooked
                                              ? "cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-400"
                                              : isPremium
                                                ? "border-2 border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-100 hover:shadow-md"
                                                : "border-2 border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md"
                                        } ${isDisabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                      >
                                        <Armchair size={14} className="mb-0.5" />
                                        <span className="text-[9px]">{seat}</span>
                                        {isSelected && <CheckCircle2 size={12} className="absolute -right-1 -top-1 text-white drop-shadow" />}
                                        {isPremium && !isSelected && <Crown size={10} className="absolute -right-1 -top-1 text-amber-600" />}
                                      </button>
                                      
                                      {isHovered && !isBooked && (
                                        <div className="absolute -top-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl">
                                          <div className="text-xs font-bold text-slate-800">{seat}</div>
                                          <div className="text-xs text-slate-600">{returnFlight?.cabinClass || 'Economy'}</div>
                                          {isPremium && <div className="mt-1 text-xs font-semibold text-amber-600">+₹{PREMIUM_SEAT_PRICE} • Extra legroom</div>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="w-6 text-center text-xs font-bold text-slate-400">{number}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {availabilityLoading ? (
                <p className="mt-3 text-center text-sm text-slate-500">Loading live seat availability...</p>
              ) : null}
              {availabilityError ? (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm text-rose-700">
                  {availabilityError}
                </p>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-3xl border-2 border-green-200 bg-gradient-to-br from-white via-green-50/20 to-white p-6 shadow-xl">
              {/* Decorative corner */}
              <div className="absolute right-0 top-0 h-20 w-20 bg-gradient-to-bl from-green-100/30 to-transparent"></div>
              
              <div className="relative">
                <div className="flex items-center gap-2 border-b-2 border-dashed border-green-200 pb-3">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-600">Booking Summary</p>
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900">Your Selection</h3>

                {/* Flight Details Card */}
                <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Flight</span>
                    <span className="font-bold text-slate-900">{flight?.airline || "Selected flight"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Route</span>
                    <span className="font-bold text-slate-900">{trip?.from || "Origin"} → {trip?.to || "Destination"}</span>
                  </div>
                  
                  {/* Outbound Date & Time */}
                  {flight?.departureDateTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Departure Date</span>
                      <span className="font-bold text-blue-700">
                        {new Date(flight.departureDateTime).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {flight?.departureTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Departure Time</span>
                      <span className="font-bold text-slate-900">{flight.departureTime}</span>
                    </div>
                  )}

                  {/* Return Date & Time - Only for Round Trip */}
                  {trip?.tripType === 'round-trip' && returnFlight && (
                    <>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <p className="text-xs font-semibold text-indigo-600 mb-2">RETURN FLIGHT</p>
                      </div>
                      {returnFlight.departureDateTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Return Date</span>
                          <span className="font-bold text-indigo-700">
                            {new Date(returnFlight.departureDateTime).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {returnFlight.departureTime && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Return Time</span>
                          <span className="font-bold text-slate-900">{returnFlight.departureTime}</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Class</span>
                    <span className="font-bold text-slate-900">{flight?.cabinClass || trip?.cabinClass || "Economy"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Passengers</span>
                    <span className="font-bold text-slate-900">{passengers}</span>
                  </div>
                </div>

                {/* Selected Seats - Outbound */}
                <div className="mt-4 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-700">
                    <Plane size={16} />
                    Outbound Seats
                  </div>
                  {selectedSeats.length > 0 ? (
                    <>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {selectedSeats.map(seat => {
                          const isPremium = premiumSeats.includes(seat);
                          return (
                            <div key={seat} className="relative">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow">
                                <Armchair size={12} />
                                {seat}
                              </span>
                              {isPremium && (
                                <Crown size={10} className="absolute -right-1 -top-1 text-amber-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {outboundSeatPrice > 0 && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                          <span className="text-xs font-semibold text-amber-700">Premium seats</span>
                          <span className="text-xs font-bold text-amber-700">+₹{outboundSeatPrice}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">Select {passengers} seat{passengers > 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Selected Seats - Return */}
                {trip?.tripType === 'round-trip' && returnFlight && (
                  <div className="mt-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-indigo-700">
                      <Plane size={16} className="rotate-180" />
                      Return Seats
                    </div>
                    {returnSelectedSeats.length > 0 ? (
                      <>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {returnSelectedSeats.map(seat => {
                            const isPremium = premiumSeats.includes(seat);
                            return (
                              <div key={seat} className="relative">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white shadow">
                                  <Armchair size={12} />
                                  {seat}
                                </span>
                                {isPremium && (
                                  <Crown size={10} className="absolute -right-1 -top-1 text-amber-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {returnSeatPrice > 0 && (
                          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                            <span className="text-xs font-semibold text-amber-700">Premium seats</span>
                            <span className="text-xs font-bold text-amber-700">+₹{returnSeatPrice}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">
                        {selectedSeats.length === passengers ? `Select ${passengers} return seat${passengers > 1 ? 's' : ''}` : 'Select outbound seats first'}
                      </p>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="mt-4 rounded-2xl border-2 border-green-200 bg-green-50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Base price</span>
                    <span className="font-bold text-slate-900">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  {outboundSeatPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">Outbound seats</span>
                      <span className="font-bold text-amber-700">+₹{outboundSeatPrice}</span>
                    </div>
                  )}
                  {returnSeatPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">Return seats</span>
                      <span className="font-bold text-amber-700">+₹{returnSeatPrice}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-green-300 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">Grand Total</span>
                    <span className="text-2xl font-bold text-green-700">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* CTA Button */}
                {trip?.tripType === 'round-trip' && returnFlight ? (
                  <div className="mt-6 space-y-3">
                    {selectedSeats.length === passengers && returnSelectedSeats.length < passengers && (
                      <button
                        onClick={handleProceedToReturnSeats}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700"
                      >
                        Proceed to Return Seat Selection
                        <ArrowRight size={18} />
                      </button>
                    )}
                    {canProceedToBooking && (
                      <button
                        onClick={handleContinue}
                        disabled={availabilityLoading || Boolean(availabilityError)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Proceed to Booking
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleContinue}
                    disabled={!canProceedToBooking || availabilityLoading || Boolean(availabilityError)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Confirm Seats & Proceed to Booking
                    <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Seat;
