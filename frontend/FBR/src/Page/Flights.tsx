import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Calendar, MapPin, Users, Search, Plane, ArrowRight, ArrowLeftRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";


interface Flights {
  id: number | string;
  airline: string;
  logo: string;
  departureTime: string;          // Formatted time (e.g., "10:30 AM")
  arrivalTime: string;            // Formatted time (e.g., "2:45 PM")
  departureDateTime?: string;     // Full ISO datetime (e.g., "2026-07-25T10:30:00.000Z")
  arrivalDateTime?: string;       // Full ISO datetime (e.g., "2026-07-25T14:45:00.000Z")
  departureDate?: string;         // ISO date for backward compatibility
  arrivalDate?: string;           // ISO date for backward compatibility
  duration: string;
  stops: number;
  price: string;
  cabinClass: string;
  origin: string;
  destination: string;
  flightNo?: string;
  dataSource?: string;
}

const locationSuggestions = [
  'Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Kochi', 'Pune',
  'Ahmedabad', 'Jaipur', 'Goa', 'Trivandrum', 'Lucknow', 'Chandigarh', 'Amritsar',
  'Surat', 'Visakhapatnam', 'Bhubaneswar', 'Indore', 'Nagpur', 'Raipur', 'Guwahati',
  'Patna', 'Kanpur', 'Srinagar', 'Jammu', 'Leh', 'Mangalore', 'Coimbatore',
  'Tiruchirappalli', 'Vijayawada', 'Bhopal', 'Jamnagar', 'Rajkot', 'Singapore',
  'Dubai', 'London', 'New York', 'Toronto', 'Sydney', 'Melbourne', 'Paris', 'Frankfurt',
  'Doha', 'Abu Dhabi', 'Dublin', 'Rome', 'Madrid', 'Istanbul'
];

const parseDateOnly = (value: string | Date | number | null | undefined) => {
  if (value == null || value === "") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  let date: Date;
  if (value instanceof Date) {
    date = new Date(value.getTime());
  } else if (typeof value === "number") {
    date = new Date(value);
  } else {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      date = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      date = new Date(trimmed);
    }
  }

  if (Number.isNaN(date.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDisplayDate = (value: string) => {
  return parseDateOnly(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

function Flights() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flights[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flights[]>([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<Flights | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<Flights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [swapping, setSwapping] = useState(false);

  const [hasHydratedSearch, setHasHydratedSearch] = useState(false);
  const [searchParams] = useSearchParams();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Format date in local timezone to avoid UTC conversion issues
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const minDepartureDate = `${year}-${month}-${day}`;

  const searchDepartureDate = searchParams.get('departureDate') || "";
  const searchReturnDate = searchParams.get('returnDate') || "";
  const searchTripType = searchParams.get('tripType') || "one-way";
  const departureDateIsValid = searchDepartureDate
    ? parseDateOnly(searchDepartureDate).getTime() >= today.getTime()
    : false;
  const returnDateIsValid = searchReturnDate
    ? parseDateOnly(searchReturnDate).getTime() >= today.getTime()
    : false;
  const initialDepartureDate = departureDateIsValid ? searchDepartureDate : "";
  const initialReturnDate = returnDateIsValid ? searchReturnDate : "";

  // Validation schema using Yup
  const validationSchema = Yup.object({
    fromLocation: Yup.string().required('Departure location is required'),
    toLocation: Yup.string().required('Destination is required'),
    departureDate: Yup.date()
      .min(today, 'Departure date cannot be in the past')
      .required('Departure date is required'),
    returnDate: Yup.date().when('tripType', {
      is: 'round-trip',
      then: (schema) => schema
        .min(Yup.ref('departureDate'), 'Return date must be after departure date')
        .required('Return date is required for round trip'),
      otherwise: (schema) => schema.notRequired(),
    }),
    tripType: Yup.string().oneOf(['one-way', 'round-trip']).required(),
  });

  const formik = useFormik({
    initialValues: {
      tripType: searchTripType as 'one-way' | 'round-trip',
      fromLocation: searchParams.get('from') || "",
      toLocation: searchParams.get('to') || "",
      departureDate: initialDepartureDate,
      returnDate: initialReturnDate,
      passengers: "1",
      cabinClass: "Economy",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!values.departureDate) {
        setError("Please select a departure date.");
        setFlights([]);
        setReturnFlights([]);
        setLoading(false);
        return;
      }

      const selectedDate = values.departureDate;
      if (selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = parseDateOnly(selectedDate);
        if (selected < today) {
          setError("");
          setFlights([]);
          setReturnFlights([]);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError("");
      setFlights([]);
      setReturnFlights([]);

      try {
        const searchResponse = await api.get('/flights/search', {
          params: {
            from: values.fromLocation,
            to: values.toLocation,
            departureDate: values.departureDate,
            returnDate: values.returnDate,
            tripType: values.tripType,
            cabinClass: values.cabinClass,
          },
        });

        const outboundFlights: Flights[] = searchResponse.data?.outboundFlights || searchResponse.data?.flights || [];
        const inboundFlights: Flights[] = searchResponse.data?.returnFlights || [];

        setSelectedOutboundFlight(null);
        setSelectedReturnFlight(null);

        if (outboundFlights.length === 0) {
          setFlights([]);
          setReturnFlights([]);
          setError("No flights found for the selected route.");
        } else {
          setFlights([...outboundFlights]);
          setReturnFlights(values.tripType === 'round-trip' ? [...inboundFlights] : []);
          setError("");
        }
      } catch (err) {
        console.error('Flight fetch error:', err);
        setFlights([]);
        setReturnFlights([]);
        setError("Failed to fetch flights. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    formik.handleChange(event);

    if (!value.trim()) {
      setSuggestions([]);
      setActiveField(null);
      return;
    }

    const filtered = locationSuggestions.filter((location) =>
      location.toLowerCase().includes(value.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 6));
    setActiveField(name === 'fromLocation' ? 'from' : 'to');
  };

  const selectSuggestion = (location: string) => {
    if (activeField === 'from') {
      formik.setFieldValue('fromLocation', location);
    } else if (activeField === 'to') {
      formik.setFieldValue('toLocation', location);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  // Swap locations function
  const handleSwapLocations = () => {
    if (swapping) return; // Prevent double-click
    
    setSwapping(true);
    const tempFrom = formik.values.fromLocation;
    const tempTo = formik.values.toLocation;
    
    formik.setFieldValue('fromLocation', tempTo);
    formik.setFieldValue('toLocation', tempFrom);
    
    setTimeout(() => setSwapping(false), 600); // Match animation duration
  };

  const normalizeDateValue = (value: string) => {
    const date = parseDateOnly(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (!value) {
      formik.setFieldValue(name, "");
      return;
    }

    const selectedDate = normalizeDateValue(value);
    if (selectedDate.getTime() < today.getTime()) {
      formik.setFieldValue(name, minDepartureDate);
      return;
    }

    if (name === 'departureDate') {
      formik.setFieldValue('departureDate', value);

      if (formik.values.returnDate) {
        const returnDate = normalizeDateValue(formik.values.returnDate);
        if (returnDate.getTime() < selectedDate.getTime()) {
          formik.setFieldValue('returnDate', '');
        }
      }
      return;
    }

    formik.setFieldValue(name, value);
  };

  const isLoggedIn = () => {
    return Boolean(
      localStorage.getItem('authToken') ||
      localStorage.getItem('CurrentUser')
    );
  };

  const handleSelectOutboundFlight = (flight: Flights) => {
    setSelectedOutboundFlight(flight);
  };

  const handleSelectReturnFlight = (flight: Flights) => {
    setSelectedReturnFlight(flight);
  };

  const buildDateTimeFromTripDate = (tripDate?: string, timeValue?: string) => {
    if (!tripDate || !timeValue) return undefined;

    const normalizedTime = timeValue.trim();
    const timeMatch = normalizedTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);

    if (!timeMatch) return undefined;

    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] || 0);
    const meridiem = (timeMatch[3] || "").toUpperCase();

    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    }

    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    const [year, month, day] = tripDate.split('-').map(Number);
    if (!year || !month || !day) return undefined;

    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
    return date.toISOString();
  };

  const syncFlightWithTripDate = (flight?: Flights | null, tripDate?: string) => {
    if (!flight || !tripDate) return flight;

    return {
      ...flight,
      departureDate: tripDate,
      arrivalDate: tripDate,
      departureDateTime: buildDateTimeFromTripDate(tripDate, flight.departureTime),
      arrivalDateTime: buildDateTimeFromTripDate(tripDate, flight.arrivalTime),
    };
  };

  const buildSeatSelectionState = () => {
    const sanitizedTrip = {
      from: formik.values.fromLocation?.trim() || "",
      to: formik.values.toLocation?.trim() || "",
      cabinClass: formik.values.cabinClass,
      tripType: formik.values.tripType,
      departureDate: formik.values.departureDate || undefined,
      ...(formik.values.tripType === 'round-trip' && formik.values.returnDate
        ? { returnDate: formik.values.returnDate }
        : {}),
    };

    const syncedOutboundFlight = syncFlightWithTripDate(selectedOutboundFlight, sanitizedTrip.departureDate);
    const syncedReturnFlight = formik.values.tripType === 'round-trip'
      ? syncFlightWithTripDate(selectedReturnFlight, sanitizedTrip.returnDate || sanitizedTrip.departureDate)
      : selectedReturnFlight;

    return {
      flight: syncedOutboundFlight,
      outboundFlight: syncedOutboundFlight,
      returnFlight: syncedReturnFlight,
      passengers: Number(formik.values.passengers) || 1,
      trip: sanitizedTrip,
    };
  };

  const handleContinueToSeatSelection = () => {
    setAuthError("");

    if (!selectedOutboundFlight) {
      setAuthError('Please select an outbound flight first.');
      return;
    }

    if (formik.values.tripType === 'round-trip' && !selectedReturnFlight) {
      setAuthError('Please select a return flight to continue.');
      return;
    }

    if (!isLoggedIn()) {
      setAuthError('Please Login');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    // Debug: Log the flight data being passed
    const nextState = buildSeatSelectionState();

    console.log('🔵 Passing to Seat page:', nextState);

    navigate('/seat-selection', {
      replace: true,
      state: nextState,
    });
  };

  useEffect(() => {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const departureDate = searchParams.get('departureDate') || '';
    const returnDate = searchParams.get('returnDate') || '';

    const validatedDepartureDate = departureDate
      ? parseDateOnly(departureDate).getTime() >= today.getTime()
        ? departureDate
        : ''
      : '';

    const validatedReturnDate = returnDate
      ? parseDateOnly(returnDate).getTime() >= today.getTime()
        ? returnDate
        : ''
      : '';

    if ((from || to || departureDate || returnDate) && !hasHydratedSearch) {
      setHasHydratedSearch(true);
      formik.setValues({
        tripType: searchTripType as 'one-way' | 'round-trip',
        fromLocation: from,
        toLocation: to,
        departureDate: validatedDepartureDate,
        returnDate: validatedReturnDate,
        passengers: formik.values.passengers,
        cabinClass: formik.values.cabinClass,
      });
    }
  }, [searchParams, hasHydratedSearch, searchTripType, formik, today]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 py-15">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 md:px-50">
          {formik.values.fromLocation && formik.values.toLocation 
            ? `Flights from ${formik.values.fromLocation} to ${formik.values.toLocation}` 
            : "Search Flights"}
        </h2>
        {/* Formik Form */}
        <form
          onSubmit={formik.handleSubmit}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 max-w-6xl mx-auto mb-10"
        >
          {/* Trip Type Selection */}
          <div className="mb-6 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="one-way"
                checked={formik.values.tripType === 'one-way'}
                onChange={(e) => {
                  formik.handleChange(e);
                  if (e.target.checked) {
                    formik.setFieldValue('returnDate', '');
                  }
                }}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">One Way</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                value="round-trip"
                checked={formik.values.tripType === 'round-trip'}
                onChange={formik.handleChange}
                className="w-4 h-4 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">Round Trip</span>
            </label>
          </div>

          {/* Cabin Class */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              name="cabinClass"
              value={formik.values.cabinClass}
              onChange={formik.handleChange}
              className="border p-2 rounded-lg text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="Economy">Economy</option>
              
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* From */}
            <div className={`p-3 bg-slate-50 rounded-xl border transition-all ${
              formik.errors.fromLocation && formik.touched.fromLocation 
                ? 'border-red-500' 
                : 'border-transparent focus-within:border-blue-500'
            }`}>
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <MapPin size={14} className="text-slate-400" />
                Flying From
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fromLocation"
                  placeholder="City (e.g., Chennai)"
                  value={formik.values.fromLocation}
                  onChange={handleLocationChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-transparent outline-none text-sm font-medium transition-transform ${
                    swapping ? 'animate-pulse' : ''
                  }`}
                  required
                />
                {activeField === 'from' && suggestions.length > 0 ? (
                  <ul className="absolute z-20 mt-2 max-h-44 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((location) => (
                      <li
                        key={location}
                        className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => selectSuggestion(location)}
                      >
                        {location}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {formik.errors.fromLocation && formik.touched.fromLocation && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.fromLocation}</p>
              )}
            </div>

            {/* Swap Button */}
            <div className="hidden lg:flex items-center justify-center -mx-2">
              <button
                type="button"
                onClick={handleSwapLocations}
                disabled={swapping}
                className={`p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all ${
                  swapping ? 'animate-spin' : ''
                } disabled:opacity-50`}
                title="Swap locations"
              >
                <ArrowLeftRight size={20} />
              </button>
            </div>

            {/* To */}
            <div className={`p-3 bg-slate-50 rounded-xl border transition-all ${
              formik.errors.toLocation && formik.touched.toLocation 
                ? 'border-red-500' 
                : 'border-transparent focus-within:border-blue-500'
            }`}>
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <MapPin size={14} className="text-slate-400" />
                Where To?
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="toLocation"
                  placeholder="Destination (e.g., Bangalore)"
                  value={formik.values.toLocation}
                  onChange={handleLocationChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-transparent outline-none text-sm font-medium transition-transform ${
                    swapping ? 'animate-pulse' : ''
                  }`}
                  required
                />
                {activeField === 'to' && suggestions.length > 0 ? (
                  <ul className="absolute z-20 mt-2 max-h-44 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((location) => (
                      <li
                        key={location}
                        className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        onClick={() => selectSuggestion(location)}
                      >
                        {location}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {formik.errors.toLocation && formik.touched.toLocation && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.toLocation}</p>
              )}
            </div>

            {/* Mobile Swap Button */}
            <div className="lg:hidden col-span-full flex justify-center -my-2">
              <button
                type="button"
                onClick={handleSwapLocations}
                disabled={swapping}
                className={`px-4 py-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all text-sm font-semibold flex items-center gap-2 ${
                  swapping ? 'animate-pulse' : ''
                } disabled:opacity-50`}
              >
                <ArrowLeftRight size={16} className={swapping ? 'animate-spin' : ''} />
                Swap Locations
              </button>
            </div>

            {/* Departure */}
            <div className={`p-3 bg-slate-50 rounded-xl border transition-all ${
              formik.errors.departureDate && formik.touched.departureDate 
                ? 'border-red-500' 
                : 'border-transparent focus-within:border-blue-500'
            }`}>
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <Calendar size={14} className="text-slate-400" />
                Departure
              </label>
              <input
                type="date"
                name="departureDate"
                value={formik.values.departureDate}
                onChange={handleDateChange}
                onBlur={formik.handleBlur}
                min={minDepartureDate}
                className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
                required
              />
              {formik.errors.departureDate && formik.touched.departureDate && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.departureDate as string}</p>
              )}
            </div>

            {/* Return - Conditional Rendering */}
            {formik.values.tripType === 'round-trip' && (
              <div className={`p-3 bg-slate-50 rounded-xl border transition-all ${
                formik.errors.returnDate && formik.touched.returnDate 
                  ? 'border-red-500' 
                  : 'border-transparent focus-within:border-blue-500'
              }`}>
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                  <Calendar size={14} className="text-slate-400" />
                  Return
                </label>
                <input
                  type="date"
                  name="returnDate"
                  value={formik.values.returnDate}
                  onChange={handleDateChange}
                  onBlur={formik.handleBlur}
                  min={formik.values.departureDate || minDepartureDate}
                  className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
                  required={formik.values.tripType === 'round-trip'}
                />
                {formik.errors.returnDate && formik.touched.returnDate && (
                  <p className="text-xs text-red-500 mt-1">{formik.errors.returnDate as string}</p>
                )}
              </div>
            )}

            {/* Passengers */}
            <div className="p-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <Users size={14} className="text-slate-400" />
                Passengers
              </label>
              <select
                name="passengers"
                value={formik.values.passengers}
                onChange={formik.handleChange}
                className="w-full bg-transparent outline-none text-sm font-medium cursor-pointer text-slate-700"
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4+ Passengers</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading || !formik.isValid}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-md shadow-blue-200 cursor-pointer disabled:cursor-not-allowed"
            >
              <Search size={18} />
              {loading ? "Searching..." : "Explore Flights"}
            </button>
          </div>
        </form>

        {/* Flight Results Container */}
        <div className="max-w-6xl mx-auto px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-500 font-medium">Finding the best flight options...</p>
            </div>
          )}

          {(error || authError) && (
            <div className={`rounded-xl p-4 text-center font-medium ${authError ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {authError || error}
            </div>
          )}

          {!loading && !error && !authError && flights.length === 0 && formik.values.fromLocation && formik.values.toLocation && (
            <div className="rounded-xl p-6 text-center bg-slate-50 border border-slate-200">
              <div className="text-4xl mb-3">✈️</div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Flights Available</h3>
              <p className="text-slate-600">
                {(() => {
                  const searchDate = parseDateOnly(formik.values.departureDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  searchDate.setHours(0, 0, 0, 0);
                  
                  if (searchDate.getTime() === today.getTime()) {
                    return "All flights for today have departed. Please try searching for tomorrow or another date.";
                  }
                  return `No flights found for the route ${formik.values.fromLocation} to ${formik.values.toLocation} on ${formatDisplayDate(formik.values.departureDate)}.`;
                })()}
              </p>
            </div>
          )}

          {!loading && flights.length > 0 && (
            <div className="space-y-6">
              {/* Round Trip Layout */}
              {formik.values.tripType === 'round-trip' ? (
                <>
                  {/* Header Info */}
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className="text-center md:text-left">
                        <p className="text-sm text-blue-700 font-medium">Round Trip Selection</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Select one outbound and one return flight to continue
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                          <span className="text-slate-500">Outbound:</span>{' '}
                          <span className="font-bold text-blue-700">{flights.length} flights</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-lg border border-indigo-200">
                          <span className="text-slate-500">Return:</span>{' '}
                          <span className="font-bold text-indigo-700">{returnFlights.length} flights</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Outbound Flights */}
                    <div className="space-y-4">
                      <div className="sticky top-4 z-10 bg-slate-50 rounded-xl px-4 py-3 border-l-4 border-blue-600 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <Plane size={20} className="text-blue-600" />
                              Outbound Flights
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {formik.values.fromLocation} → {formik.values.toLocation}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                              {formatDisplayDate(formik.values.departureDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Outbound Flight Cards */}
                      <div className="space-y-3">
                        {flights.map((flight) => {
                          const isSelected = selectedOutboundFlight?.id === flight.id;
                          return (
                            <div
                              key={flight.id}
                              onClick={() => handleSelectOutboundFlight(flight)}
                              className={`relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'border-2 border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100'
                                  : 'border border-slate-200 hover:border-blue-300 hover:shadow-md'
                              }`}
                            >
                              {/* Selected Badge & Checkmark */}
                              {isSelected && (
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}

                              {/* Live Data Badge */}
                              {flight.dataSource === 'live' && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                  LIVE
                                </div>
                              )}

                              {/* Airline Info */}
                              <div className="flex items-center gap-3 mb-4">
                                <img
                                  src={flight.logo}
                                  alt={flight.airline}
                                  className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1.5 border border-slate-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/48?text=Airline';
                                  }}
                                />
                                <div>
                                  <h4 className="font-bold text-slate-800 text-base">{flight.airline}</h4>
                                  <p className="text-xs text-slate-500">{flight.flightNo || 'Flight'}</p>
                                </div>
                              </div>

                              {/* Time & Route */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-center">
                                  <p className="text-2xl font-bold text-slate-800">{flight.departureTime}</p>
                                  <p className="text-xs text-slate-500 mt-1">{flight.origin}</p>
                                </div>

                                <div className="flex flex-col items-center px-4">
                                  <p className="text-xs text-slate-500 mb-1">{flight.duration}</p>
                                  <div className="flex items-center gap-1">
                                    <div className="h-px w-12 bg-slate-300"></div>
                                    <Plane size={16} className="text-blue-600 rotate-90" />
                                    <div className="h-px w-12 bg-slate-300"></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                                  </p>
                                </div>

                                <div className="text-center">
                                  <p className="text-2xl font-bold text-slate-800">{flight.arrivalTime}</p>
                                  <p className="text-xs text-slate-500 mt-1">{flight.destination}</p>
                                </div>
                              </div>

                              {/* Footer: Price & Class */}
                              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-medium">
                                  {flight.cabinClass}
                                </span>
                                <p className="text-2xl font-bold text-blue-600">{flight.price}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Return Flights */}
                    <div className="space-y-4">
                      <div className="sticky top-4 z-10 bg-slate-50 rounded-xl px-4 py-3 border-l-4 border-indigo-600 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                              <Plane size={20} className="text-indigo-600 rotate-180" />
                              Return Flights
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {formik.values.toLocation} → {formik.values.fromLocation}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                              {formatDisplayDate(formik.values.returnDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Return Flight Cards */}
                      <div className="space-y-3">
                        {returnFlights.length > 0 ? (
                          returnFlights.map((flight) => {
                            const isSelected = selectedReturnFlight?.id === flight.id;
                            return (
                              <div
                                key={flight.id}
                                onClick={() => handleSelectReturnFlight(flight)}
                                className={`relative bg-white rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-2 border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100'
                                    : 'border border-slate-200 hover:border-indigo-300 hover:shadow-md'
                                }`}
                              >
                                {/* Selected Badge & Checkmark */}
                                {isSelected && (
                                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1.5 shadow-lg">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}

                                {/* Live Data Badge */}
                                {flight.dataSource === 'live' && (
                                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    LIVE
                                  </div>
                                )}

                                {/* Airline Info */}
                                <div className="flex items-center gap-3 mb-4">
                                  <img
                                    src={flight.logo}
                                    alt={flight.airline}
                                    className="w-12 h-12 rounded-lg object-contain bg-slate-50 p-1.5 border border-slate-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://via.placeholder.com/48?text=Airline';
                                    }}
                                  />
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-base">{flight.airline}</h4>
                                    <p className="text-xs text-slate-500">{flight.flightNo || 'Flight'}</p>
                                  </div>
                                </div>

                                {/* Time & Route */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">{flight.departureTime}</p>
                                    <p className="text-xs text-slate-500 mt-1">{flight.origin}</p>
                                  </div>

                                  <div className="flex flex-col items-center px-4">
                                    <p className="text-xs text-slate-500 mb-1">{flight.duration}</p>
                                    <div className="flex items-center gap-1">
                                      <div className="h-px w-12 bg-slate-300"></div>
                                      <Plane size={16} className="text-indigo-600 rotate-90" />
                                      <div className="h-px w-12 bg-slate-300"></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                                    </p>
                                  </div>

                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">{flight.arrivalTime}</p>
                                    <p className="text-xs text-slate-500 mt-1">{flight.destination}</p>
                                  </div>
                                </div>

                                {/* Footer: Price & Class */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-medium">
                                    {flight.cabinClass}
                                  </span>
                                  <p className="text-2xl font-bold text-indigo-600">{flight.price}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-slate-600 font-medium">No return flights available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sticky Bottom Summary Bar */}
                  {selectedOutboundFlight && selectedReturnFlight && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-2xl z-50 animate-slideUp">
                      <div className="max-w-6xl mx-auto px-4 py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          {/* Left: Selected Flights Summary */}
                          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            {/* Outbound Summary */}
                            <div className="bg-blue-50 rounded-lg px-4 py-2 border border-blue-200">
                              <p className="text-xs text-blue-600 font-semibold mb-1">OUTBOUND</p>
                              <p className="text-sm font-bold text-slate-800">{selectedOutboundFlight.airline}</p>
                              <p className="text-xs text-slate-600">{formatDisplayDate(formik.values.departureDate)}</p>
                            </div>

                            {/* Return Summary */}
                            <div className="bg-indigo-50 rounded-lg px-4 py-2 border border-indigo-200">
                              <p className="text-xs text-indigo-600 font-semibold mb-1">RETURN</p>
                              <p className="text-sm font-bold text-slate-800">{selectedReturnFlight.airline}</p>
                              <p className="text-xs text-slate-600">{formatDisplayDate(formik.values.returnDate)}</p>
                            </div>

                            {/* Total Price */}
                            <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-200">
                              <p className="text-xs text-green-600 font-semibold mb-1">TOTAL PRICE</p>
                              <p className="text-2xl font-bold text-green-700">
                                ₹{(
                                  parseFloat(selectedOutboundFlight.price.replace('₹', '').replace(/,/g, '')) + 
                                  parseFloat(selectedReturnFlight.price.replace('₹', '').replace(/,/g, ''))
                                ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </p>
                            </div>
                          </div>

                          {/* Right: CTA Button */}
                          <button
                            onClick={handleContinueToSeatSelection}
                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            Proceed to Seat Selection
                            <ArrowRight size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // ONE-WAY LAYOUT (Single Column Centered)
                <>
                  <div className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="font-semibold">Showing {flights.length} flights</span> from {formik.values.fromLocation} to {formik.values.toLocation}
                    </div>
                    <button
                      type="button"
                      onClick={handleContinueToSeatSelection}
                      disabled={!selectedOutboundFlight}
                      className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition-all"
                    >
                      Continue to Seat Selection
                    </button>
                  </div>

                  <div className="max-w-3xl mx-auto space-y-4">
                    <div className="bg-slate-50 rounded-xl px-4 py-3 border-l-4 border-blue-600 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Plane size={20} className="text-blue-600" />
                            Available Flights
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {formik.values.fromLocation} → {formik.values.toLocation}
                          </p>
                        </div>
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          {formatDisplayDate(formik.values.departureDate)}
                        </span>
                      </div>
                    </div>

                    {flights.map((flight) => {
                      const isSelected = selectedOutboundFlight?.id === flight.id;

                      return (
                        <div
                          key={flight.id}
                          onClick={() => handleSelectOutboundFlight(flight)}
                          className={`relative bg-white rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100'
                              : 'border border-slate-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          {/* Selected Badge & Checkmark */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}

                          {/* Live Data Badge */}
                          {flight.dataSource === 'live' && (
                            <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              LIVE DATA
                            </div>
                          )}

                          {/* Airline details */}
                          <div className="flex items-center gap-4 mb-5">
                            <img
                              src={flight.logo}
                              alt={flight.airline}
                              className="w-14 h-14 rounded-lg object-contain bg-slate-50 p-2 border border-slate-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/56?text=Airline';
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg">{flight.airline}</h4>
                              <p className="text-xs text-slate-500">{flight.flightNo || 'Flight'}</p>
                            </div>
                          </div>

                          {/* Time & Route */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-800">{flight.departureTime}</p>
                              <p className="text-xs text-slate-500 mt-1">{flight.origin}</p>
                            </div>

                            <div className="flex flex-col items-center px-6">
                              <p className="text-xs text-slate-500 mb-1">{flight.duration}</p>
                              <div className="flex items-center gap-2">
                                <div className="h-px w-16 bg-slate-300"></div>
                                <Plane size={18} className="text-blue-600 rotate-90" />
                                <div className="h-px w-16 bg-slate-300"></div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-800">{flight.arrivalTime}</p>
                              <p className="text-xs text-slate-500 mt-1">{flight.destination}</p>
                            </div>
                          </div>

                          {/* Footer: Price & Class */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                              {flight.cabinClass}
                            </span>
                            <p className="text-3xl font-bold text-blue-600">{flight.price}</p>
                          </div>
                        </div>
                  );
                })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default Flights;