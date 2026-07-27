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
  flightNo: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  tripType?: 'one-way' | 'round-trip';
  returnDate?: string;
  returnFlightName?: string;
  returnFlightNo?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnDepartureDate?: string;
  returnArrivalDate?: string;
  duration: string;
  stops: number;
  cabinClass: string;
  passengers: Passenger[];
  seats: string[];
  returnSeats?: string[];
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  createdAt: string;
  dataSource: string;
};

const parseDateValue = (value?: string) => {
  if (!value) return null;

  const trimmed = value.trim();
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (dateString?: string, fallbackDate?: string) => {
  const parsedDate = parseDateValue(dateString) || parseDateValue(fallbackDate);
  if (!parsedDate) return 'N/A';

  return parsedDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatBookingDate = (dateString?: string) => {
  const parsedDate = parseDateValue(dateString);
  if (!parsedDate) return 'N/A';

  return parsedDate.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
                  <div className="flex flex-col gap-3">
                    {/* Header with Flight Name and Trip Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900">{booking.flightName}</div>
                      {booking.flightNo && <span className="text-sm text-slate-500">({booking.flightNo})</span>}
                      {booking.tripType === 'round-trip' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          ROUND TRIP
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          ONE-WAY
                        </span>
                      )}
                      {booking.dataSource === 'live' && (
                        <span className="rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-bold text-green-700">LIVE</span>
                      )}
                    </div>
                    
                    {/* Card Grid View */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {/* Outbound Flight Card */}
                      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-blue-700">Outbound</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-xs text-slate-500">Route</div>
                            <div className="font-bold text-slate-900">{booking.origin} → {booking.destination}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Departure</div>
                            <div className="font-semibold text-slate-800">{formatDate(booking.departureDate, booking.createdAt)}</div>
                            <div className="text-xs text-blue-600 font-semibold">{booking.departureTime || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Seats</div>
                            <div className="font-semibold text-slate-800">{booking.seats?.join(', ') || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Return Flight Card or No Return */}
                      {booking.tripType === 'round-trip' ? (
                        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg className="h-4 w-4 text-indigo-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="text-xs font-bold uppercase text-indigo-700">Return</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <div className="text-xs text-slate-500">Route</div>
                              <div className="font-bold text-slate-900">{booking.destination} → {booking.origin}</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500">Departure</div>
                              <div className="font-semibold text-slate-800">{formatDate(booking.returnDate || booking.returnDepartureDate, booking.departureDate)}</div>
                              <div className="text-xs text-indigo-600 font-semibold">{booking.returnDepartureTime || 'N/A'}</div>
                            </div>
                            {booking.returnSeats && booking.returnSeats.length > 0 && (
                              <div>
                                <div className="text-xs text-slate-500">Seats</div>
                                <div className="font-semibold text-slate-800">{booking.returnSeats.join(', ')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 shadow-sm flex items-center justify-center">
                          <div className="text-center">
                            <svg className="h-6 w-6 text-slate-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <div className="text-xs font-semibold text-slate-500">No Return</div>
                          </div>
                        </div>
                      )}

                      {/* Flight Details Card */}
                      <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-amber-700">Flight Info</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-xs text-slate-500">Cabin Class</div>
                            <div className="font-semibold text-slate-800">{booking.cabinClass}</div>
                          </div>
                          {booking.duration && (
                            <div>
                              <div className="text-xs text-slate-500">Duration</div>
                              <div className="font-semibold text-slate-800">{booking.duration}</div>
                            </div>
                          )}
                          {booking.stops !== undefined && (
                            <div>
                              <div className="text-xs text-slate-500">Stops</div>
                              <div className="font-semibold text-slate-800">{booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment & Status Card */}
                      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-green-700">Payment</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <div className="text-xs text-green-600 font-semibold">
                              {booking.tripType === 'round-trip' ? 'Round Trip' : 'One-Way'}
                            </div>
                            <div className="text-xl font-bold text-green-700">₹{booking.amount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Passengers</div>
                            <div className="font-semibold text-slate-800">{booking.passengers.length}</div>
                          </div>
                          <div>
                            <div className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                              booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                              booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {booking.status === 'confirmed' ? '✓ Confirmed' : 
                               booking.status === 'completed' ? '✓ Completed' :
                               booking.status === 'cancelled' ? '✗ Cancelled' : booking.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User & Passenger Details */}
                    <div className="mt-2 pt-3 border-t border-slate-200">
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="font-semibold">User:</span> {booking.userEmail || 'Unknown user'}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        <span className="font-semibold">Booked on:</span> {formatBookingDate(booking.createdAt) || 'N/A'}
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2">
                        <div className="text-xs font-semibold text-slate-700 mb-1">Passenger Details:</div>
                        <div className="space-y-1 text-xs text-slate-600">
                          {booking.passengers.map((passenger, index) => (
                            <div key={`${booking._id}-${index}`}>
                              <span className="font-semibold">{passenger.name}</span> • {passenger.phone || 'No phone'} • {passenger.email || 'No email'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                      <button onClick={() => updateStatus(booking._id, 'confirmed')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                        Confirm
                      </button>
                      <button onClick={() => updateStatus(booking._id, 'cancelled')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => updateStatus(booking._id, 'pending')} className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
                        Mark Pending
                      </button>
                    </div>
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
