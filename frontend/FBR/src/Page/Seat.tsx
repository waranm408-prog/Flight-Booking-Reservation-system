import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Armchair, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

interface FlightSummary {
  id: number | string;
  airline: string;
  origin: string;
  destination: string;
  price: string;
  cabinClass: string;
}

interface SeatState {
  flight?: FlightSummary;
  passengers?: number;
  selectedSeats?: string[];
  trip?: {
    from?: string;
    to?: string;
    cabinClass?: string;
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

  const flight = state?.flight ?? storedSelection?.flight;
  const passengers = Math.max(1, Math.min(6, state?.passengers ?? storedSelection?.passengers ?? 1));
  const trip = state?.trip ?? storedSelection?.trip;
  const basePrice = Number.parseInt((flight?.price ?? "0").replace(/[^\d]/g, ""), 10) || 0;
  const totalPrice = basePrice * passengers;

  const seatRows = useMemo(() => ["A", "B", "C", "D", "E", "F"], []);
  const seatNumbers = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  const seatOptions = useMemo(
    () => seatRows.flatMap((row) => seatNumbers.map((number) => `${row}${number}`)),
    [seatRows, seatNumbers]
  );

  const [selectedSeats, setSelectedSeats] = useState<string[]>(storedSelection?.selectedSeats ?? []);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");

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
        const response = await api.get(`/payments/seats/${encodeURIComponent(String(flight.id))}`);
        if (!active) return;

        const liveBookedSeats = Array.isArray(response.data?.bookedSeats)
          ? response.data.bookedSeats.map((seat: string) => seat.toUpperCase())
          : [];
        setBookedSeats(liveBookedSeats);
        setSelectedSeats((currentSeats) => currentSeats.filter((seat) => !liveBookedSeats.includes(seat)));
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
  }, [flight?.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ flight, passengers, trip, selectedSeats })
      );
    }
  }, [flight, passengers, trip, selectedSeats, storageKey]);

  const toggleSeat = (seat: string) => {
    if (bookedSeats.includes(seat)) {
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
        passengers,
        trip,
        selectedSeats,
      },
    });
  };

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
                <div className="mb-2 flex items-center justify-between">
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

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Cabin View
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {seatOptions.map((seat) => {
                    const isSelected = selectedSeats.includes(seat);
                    const isBooked = bookedSeats.includes(seat);
                    const isDisabled = isBooked || (!isSelected && selectedSeats.length >= passengers);

                    return (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => toggleSeat(seat)}
                        disabled={isDisabled}
                        className={`flex items-center justify-center rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : isBooked
                              ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400"
                              : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600"
                        } ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                      >
                        <span className="mr-2">
                          <Armchair size={16} />
                        </span>
                        {seat}
                      </button>
                    );
                  })}
                </div>
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

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Passenger Summary</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Your booking</h3>

              <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Flight</span>
                  <span className="font-semibold text-slate-800">{flight?.airline || "Selected flight"}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Route</span>
                  <span className="font-semibold text-slate-800">{trip?.from || "Origin"} → {trip?.to || "Destination"}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Class</span>
                  <span className="font-semibold text-slate-800">{flight?.cabinClass || trip?.cabinClass || "Economy"}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Passengers</span>
                  <span className="font-semibold text-slate-800">{passengers}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Price</span>
                  <span className="font-semibold text-slate-800">RS {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <CheckCircle2 size={18} />
                  Selected seats
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Choose seats for all passengers"}
                </p>
              </div>

              <button
                type="button"
                disabled={availabilityLoading || Boolean(availabilityError) || selectedSeats.length !== passengers}
                onClick={handleContinue}
                className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue to Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Seat;
