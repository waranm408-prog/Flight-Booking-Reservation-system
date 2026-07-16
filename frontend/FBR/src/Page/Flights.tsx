import { useState, useEffect } from "react";
import { useFormik } from "formik";
import { Calendar, MapPin, Users, Search, Plane, Clock, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";


interface Flights {
  id: number;
  airline: string;
  logo: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  cabinClass: string;
  origin: string;
  destination: string;
}

function Flights() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flights[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");

  const [initialSearchDone, setInitialSearchDone] = useState(false);
  const [searchParams] = useSearchParams();

  const formik = useFormik({
    initialValues: {
      fromLocation: searchParams.get('from') || "",
      toLocation: searchParams.get('to') || "",
      departureDate: searchParams.get('departureDate') || "",
      returnDate: "",
      passengers: "1",
      cabinClass: "Economy",
    },
    onSubmit: async (values) => {
      setLoading(true);
      setError("");
      setFlights([]);

      try {
        const response = await api.get('/flights/search', {
          params: {
            from: values.fromLocation,
            to: values.toLocation,
            departureDate: values.departureDate,
          },
        });

        const fetchedFlights: Flights[] = response.data?.flights || [];
        if (fetchedFlights.length === 0) {
          setError("No flights found for the selected route.");
        }
        setFlights(fetchedFlights);
      } catch (err) {
        console.error('Flight fetch error:', err);
        setError("Failed to fetch flights. Please try again later.");
      } finally {
        setLoading(false);
      }
    },
  });

  const isLoggedIn = () => {
    return Boolean(
      localStorage.getItem('authToken') ||
      localStorage.getItem('CurrentUser')
    );
  };

  const handleSelectFlight = (flight: Flights) => {
    setAuthError("");

    if (!isLoggedIn()) {
      setAuthError('Please Login');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }

    navigate('/seat', {
      state: {
        flight,
        passengers: Number(formik.values.passengers) || 1,
        trip: {
          from: formik.values.fromLocation,
          to: formik.values.toLocation,
          cabinClass: formik.values.cabinClass,
        },
      },
    });
  };

  useEffect(() => {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const departureDate = searchParams.get('departureDate') || '';

    if (from && to && !initialSearchDone) {
      setInitialSearchDone(true);
      formik.setValues({
        fromLocation: from,
        toLocation: to,
        departureDate,
        returnDate: '',
        passengers: formik.values.passengers,
        cabinClass: formik.values.cabinClass,
      });
      formik.submitForm();
    }
  }, [searchParams, initialSearchDone]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 py-15">
        <h2 className=" text-2xl font-bold text-slate-800 mb-6 md:px-50">International Flights Search</h2>
        {/* Formik Form */}
        <form
          onSubmit={formik.handleSubmit}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-100 max-w-6xl mx-auto mb-10"
        >
          {/* Cabin Class */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              name="cabinClass"
              value={formik.values.cabinClass}
              onChange={formik.handleChange}
              className="border p-2 rounded-lg text-sm font-medium text-slate-600 bg-transparent outline-none cursor-pointer"
            >
              <option value="Economy">Economy</option>
              <option value="Premium">Premium Economy</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* From */}
            <div className="p-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <MapPin size={14} className="text-slate-400" />
                Flying From
              </label>
              <input
                type="text"
                name="fromLocation"
                placeholder="City  (e.g., chennai)"
                value={formik.values.fromLocation}
                onChange={formik.handleChange}
                className="w-full bg-transparent outline-none text-sm font-medium"
                required
              />
            </div>

            {/* To */}
            <div className="p-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <MapPin size={14} className="text-slate-400" />
                Where To?
              </label>
              <input
                type="text"
                name="toLocation"
                placeholder="Destination(e.g.,Bangalore)"
                value={formik.values.toLocation}
                onChange={formik.handleChange}
                className="w-full bg-transparent outline-none text-sm font-medium"
                required
              />
            </div>

            {/* Departure */}
            <div className="p-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <Calendar size={14} className="text-slate-400" />
                Departure
              </label>
              <input
                type="date"
                name="departureDate"
                value={formik.values.departureDate}
                onChange={formik.handleChange}
                className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
                required
              />
            </div>

            {/* Return */}
            <div className="p-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-blue-500 transition-all">
              <label className="text-xs text-slate-500 font-semibold flex items-center gap-1 mb-1">
                <Calendar size={14} className="text-slate-400" />
                Return
              </label>
              <input
                type="date"
                name="returnDate"
                value={formik.values.returnDate}
                onChange={formik.handleChange}
                className="w-full bg-transparent outline-none text-sm font-medium text-slate-700"
              />
            </div>

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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl flex items-center gap-2 transition-colors font-semibold shadow-md shadow-blue-200 cursor-pointer"
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

          {!loading && flights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                Available Flights from {formik.values.fromLocation} to {formik.values.toLocation}
              </h3>

              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  {/* Airline details */}
                  <div className="flex items-center gap-4 w-full md:w-1/4">
                    <img
                      src={flight.logo}
                      alt={flight.airline}
                      className="w-10 h-10 rounded-lg object-contain bg-slate-50 p-1"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = "https://placehold.co/40?text=✈️")}
                    />
                    <div>
                      <h4 className="font-bold text-slate-800">{flight.airline}</h4>
                      <p className="text-xs text-slate-400 font-medium">{flight.cabinClass}</p>
                      <p className="text-xs text-slate-400">{flight.origin} → {flight.destination}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center justify-between md:justify-center gap-6 w-full md:w-2/4">
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-800">{flight.departureTime}</p>
                      <p className="text-xs text-slate-400 font-medium">{flight.origin}</p>
                    </div>

                    <div className="flex flex-col items-center flex-1 max-w-[150px]">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={12} /> {flight.duration}
                      </span>
                      <div className="relative w-full flex items-center my-1">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="flex-1 border-t border-dashed border-slate-300 mx-1"></div>
                        <Plane size={14} className="text-blue-500 transform rotate-90" />
                        <div className="flex-1 border-t border-dashed border-slate-300 mx-1"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {flight.stops === 0 ? "Non-stop" : `${flight.stops} Stop`}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-base font-bold text-slate-800">{flight.arrivalTime}</p>
                      <p className="text-xs text-slate-400 font-medium">{flight.destination}</p>
                    </div>
                  </div>

                  {/* Pricing and Action Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-1/4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400 font-medium">Total Price</p>
                      <p className="text-2xl font-black text-slate-900">{flight.price}</p>
                    </div>
                    <button
                      onClick={() => handleSelectFlight(flight)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 group cursor-pointer"
                    >
                      Select Flight
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default Flights;