import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import api from '../api/axios';
import AdminSidebar from './AdminSidebar';

type Flight = {
  _id: string;
  flightNo: string;
  airline: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  cabinClass: string;
  seatsAvailable: number;
};

export default function AdminFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      flightNo: '',
      airline: '',
      origin: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      arrivalTime: '',
      duration: '',
      stops: 0,
      price: '',
      cabinClass: 'Economy',
      seatsAvailable: 60,
    },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.flightNo) errors.flightNo = 'Flight number is required';
      if (!values.airline) errors.airline = 'Airline is required';
      if (!values.origin) errors.origin = 'Origin is required';
      if (!values.destination) errors.destination = 'Destination is required';
      if (!values.departureDate) errors.departureDate = 'Departure date is required';
      if (!values.departureTime) errors.departureTime = 'Departure time is required';
      if (!values.arrivalTime) errors.arrivalTime = 'Arrival time is required';
      if (!values.duration) errors.duration = 'Duration is required';
      if (!values.price) errors.price = 'Price is required';
      return errors;
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await api.post('/flights', values);
        setSuccess(response.data.message || 'Flight added successfully.');
        setError('');
        resetForm();
        loadFlights();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Unable to add flight.');
        setSuccess('');
      }
    },
  });

  const loadFlights = async () => {
    try {
      setLoading(true);
      const response = await api.get('/flights');
      setFlights(response.data.flights || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load flights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Admin Control</p>
              <h2 className="text-2xl font-semibold">Available Flights</h2>
              <p className="mt-2 text-sm text-slate-300">View stored flights from the backend database and add new routes with a form.</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <div className="text-slate-300">Stored flights</div>
              <div className="text-2xl font-semibold">{flights.length}</div>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-800">Flight Inventory</h3>
            {loading ? (
              <div className="mt-4 text-sm text-slate-500">Loading flights...</div>
            ) : flights.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">No flights found in the database.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {flights.map((flight) => (
                  <div key={flight._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{flight.airline} • {flight.flightNo}</div>
                        <div className="text-sm text-slate-600">{flight.origin} → {flight.destination}</div>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <div>₹{flight.price}</div>
                        <div>{flight.cabinClass}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{flight.departureDate}</span>
                      <span>{flight.departureTime} → {flight.arrivalTime}</span>
                      <span>{flight.duration}</span>
                      <span>{flight.seatsAvailable} seats</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-800">Add New Flight</h3>
            <form onSubmit={formik.handleSubmit} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Flight Number</label>
                  <input name="flightNo" value={formik.values.flightNo} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.flightNo ? <div className="mt-1 text-xs text-rose-600">{formik.errors.flightNo}</div> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Airline</label>
                  <input name="airline" value={formik.values.airline} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.airline ? <div className="mt-1 text-xs text-rose-600">{formik.errors.airline}</div> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Origin</label>
                  <input name="origin" value={formik.values.origin} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.origin ? <div className="mt-1 text-xs text-rose-600">{formik.errors.origin}</div> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Destination</label>
                  <input name="destination" value={formik.values.destination} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.destination ? <div className="mt-1 text-xs text-rose-600">{formik.errors.destination}</div> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Departure Date</label>
                  <input type="date" name="departureDate" value={formik.values.departureDate} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.departureDate ? <div className="mt-1 text-xs text-rose-600">{formik.errors.departureDate}</div> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Departure Time</label>
                  <input type="time" name="departureTime" value={formik.values.departureTime} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.departureTime ? <div className="mt-1 text-xs text-rose-600">{formik.errors.departureTime}</div> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Arrival Time</label>
                  <input type="time" name="arrivalTime" value={formik.values.arrivalTime} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.arrivalTime ? <div className="mt-1 text-xs text-rose-600">{formik.errors.arrivalTime}</div> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Duration</label>
                  <input name="duration" value={formik.values.duration} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="2h 30m" />
                  {formik.errors.duration ? <div className="mt-1 text-xs text-rose-600">{formik.errors.duration}</div> : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Stops</label>
                  <input type="number" name="stops" value={formik.values.stops} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Price</label>
                  <input name="price" value={formik.values.price} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
                  {formik.errors.price ? <div className="mt-1 text-xs text-rose-600">{formik.errors.price}</div> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Class</label>
                  <select name="cabinClass" value={formik.values.cabinClass} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2">
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">Seats Available</label>
                <input type="number" name="seatsAvailable" value={formik.values.seatsAvailable} onChange={formik.handleChange} className="w-full rounded-xl border border-slate-300 px-3 py-2" />
              </div>

              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700">
                Add Flight
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
}
