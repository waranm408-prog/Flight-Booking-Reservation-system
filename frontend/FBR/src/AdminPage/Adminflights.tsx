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
};

export default function AdminFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
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
                    <span>{flight.departureTime} → {flight.arrivalTime}</span>
                    <span>{flight.duration}</span>
                    <span>{flight.stops} stop(s)</span>
                    {typeof flight.seatsAvailable === 'number' ? <span>{flight.seatsAvailable} seats</span> : null}
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
