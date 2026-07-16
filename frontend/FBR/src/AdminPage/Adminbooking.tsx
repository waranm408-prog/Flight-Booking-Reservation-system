import { useEffect, useState } from 'react';
import api from '../api/axios';
import AdminSidebar from './AdminSidebar';

type Passenger = {
  name: string;
  phone: string;
  email: string;
};

type Booking = {
  _id: string;
  userEmail: string;
  flightName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  cabinClass: string;
  passengers: Passenger[];
  seats: string[];
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  createdAt: string;
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data.bookings || []);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      setSuccess(response.data.booking?.status ? `Booking marked as ${response.data.booking.status}.` : 'Booking updated.');
      loadBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to update booking.');
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Admin Control</p>
              <h2 className="text-2xl font-semibold">Booking History</h2>
              <p className="mt-2 text-sm text-slate-300">Review bookings by user, confirm them, and see the real booking history from the backend.</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <div className="text-slate-300">Total bookings</div>
              <div className="text-2xl font-semibold">{bookings.length}</div>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800">Bookings</h3>

          {loading ? (
            <div className="mt-4 text-sm text-slate-500">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">No booking history found.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{booking.flightName}</div>
                      <div className="text-sm text-slate-600">{booking.origin} → {booking.destination}</div>
                      <div className="mt-2 text-sm text-slate-500">User: {booking.userEmail || 'Unknown user'}</div>
                      <div className="mt-1 text-xs text-slate-500">Booked on {new Date(booking.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                      <div className="text-slate-500">Status</div>
                      <div className="font-semibold text-slate-900">{booking.status}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>Class: {booking.cabinClass}</span>
                    <span>Seats: {booking.seats.join(', ') || '—'}</span>
                    <span>Passengers: {booking.passengers.length}</span>
                    <span>Amount: ₹{booking.amount}</span>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-medium text-slate-700">Passenger details</div>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {booking.passengers.map((passenger, index) => (
                        <div key={`${booking._id}-${index}`}>
                          {passenger.name} • {passenger.phone || 'No phone'} • {passenger.email || 'No email'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => updateStatus(booking._id, 'confirmed')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      Confirm
                    </button>
                    <button onClick={() => updateStatus(booking._id, 'cancelled')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                      Cancel
                    </button>
                    <button onClick={() => updateStatus(booking._id, 'completed')} className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                      Mark Completed
                    </button>
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
