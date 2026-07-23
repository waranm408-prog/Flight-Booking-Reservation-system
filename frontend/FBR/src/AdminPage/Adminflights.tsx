import { useEffect, useState } from 'react';
import api from '../api/axios';
import AdminSidebar from './AdminSidebar';

type Flight = {
  id: string;
  flightNo: string;
  airline: string;
  origin: string;
  destination: string;
  departureDate?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: string;
  cabinClass: string;
  seatsAvailable?: number;
  bookings: Booking[];
};

type Booking = {
  id: string;
  flightId?: string;
  flightName?: string;
  origin?: string;
  destination?: string;
  userEmail?: string;
  passengers?: { name?: string; email?: string }[];
  seats?: string[];
  amount?: number;
  status?: string;
  createdAt: string;
};

export default function AdminFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFlights = async () => {
    try {
      setLoading(true);
      setError('');
      const today = new Date().toISOString().slice(0, 10);
      const response = await api.get('/admin/flights', {
        params: {
          date: today,
        },
      });
      setFlights(response.data.flights || []);
      setTodayBookings(response.data.bookings || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load live flights.');
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
              <h2 className="text-2xl font-semibold">Today’s Available Flights</h2>
              <p className="mt-2 text-sm text-slate-300">Today’s flight names and schedules are listed here for quick admin review.</p>
            </div>
            <button
              onClick={loadFlights}
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh Live Flights
            </button>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800">Live Flight Inventory</h3>
          {loading ? (
            <div className="mt-4 text-sm text-slate-500">Loading today’s flights...</div>
          ) : flights.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">No flights are available for today yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {flights.map((flight) => (
                <div key={flight.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{flight.airline} • {flight.flightNo}</div>
                      <div className="text-sm text-slate-600">{flight.origin} → {flight.destination}</div>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <div>{flight.price}</div>
                      <div>{flight.cabinClass}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{flight.departureTime || '--:--'} → {flight.arrivalTime || '--:--'}</span>
                    <span>{flight.duration}</span>
                    <span>{flight.stops} stop(s)</span>
                    {typeof flight.seatsAvailable === 'number' ? <span>{flight.seatsAvailable} seats</span> : null}
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <div className="text-sm font-semibold text-slate-700">
                      Today’s bookings ({flight.bookings.length})
                    </div>
                    {flight.bookings.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No bookings for this flight today.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {flight.bookings.map((booking) => (
                          <div key={booking.id} className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-600">
                            <div className="flex flex-wrap justify-between gap-2">
                              <span className="font-semibold text-slate-800">{booking.userEmail || 'Guest booking'}</span>
                              <span className="font-semibold capitalize text-blue-700">{booking.status || 'pending'}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-3">
                              <span>Seats: {booking.seats?.join(', ') || '—'}</span>
                              <span>Passengers: {booking.passengers?.length || 0}</span>
                              <span>Amount: RS {(booking.amount || 0).toLocaleString()}</span>
                            </div>
                            <div className="mt-1 text-slate-500">Booked {new Date(booking.createdAt).toLocaleTimeString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-800">Today’s Booking Details</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {todayBookings.length} booking{todayBookings.length === 1 ? '' : 's'}
            </span>
          </div>
          {todayBookings.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No bookings were made today.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{booking.flightName || 'Flight booking'}</div>
                      <div className="text-slate-600">{booking.origin || 'Origin'} → {booking.destination || 'Destination'}</div>
                    </div>
                    <span className="font-semibold capitalize text-blue-700">{booking.status || 'pending'}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div>Customer: {booking.userEmail || 'Guest booking'}</div>
                    <div>Seats: {booking.seats?.join(', ') || '—'}</div>
                    <div>Passengers: {booking.passengers?.length || 0}</div>
                    <div>Amount: RS {(booking.amount || 0).toLocaleString()}</div>
                    <div>Booked: {new Date(booking.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminSidebar>
  );
}
