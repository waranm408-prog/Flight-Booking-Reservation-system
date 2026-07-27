import { useEffect, useState } from 'react';
import api from '../api/axios';
import AdminSidebar from './AdminSidebar';

type Passenger = {
  name: string;
  phone: string;
  email: string;
};

type PaymentRecord = {
  _id: string;
  userEmail: string;
  flightName: string;
  flightNo?: string;
  origin: string;
  destination: string;
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  createdAt: string;
  passengers: Passenger[];
  seats: string[];
  tripType?: 'one-way' | 'round-trip';
  returnFlightName?: string;
  returnFlightNo?: string;
  returnDate?: string;
  returnSeats?: string[];
  departureDate?: string;
  cabinClass?: string;
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      const bookings = (response.data.bookings || []).filter((booking: any) => booking.paymentId || booking.orderId);
      setPayments(bookings);
      setError('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId: string, status: string) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      setSuccess(response.data.booking?.status ? `Payment marked as ${response.data.booking.status}.` : 'Payment updated.');
      loadPayments();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to update payment.');
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <AdminSidebar>
      <div className="space-y-6">
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Admin Control</p>
              <h2 className="text-2xl font-semibold">Payment Records</h2>
              <p className="mt-2 text-sm text-slate-300">Review user-based payments, confirm them, and track the real payment flow from the database.</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <div className="text-slate-300">Payments</div>
              <div className="text-2xl font-semibold">{payments.length}</div>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">{success}</div> : null}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800">Confirmed and Called Payments</h3>

          {loading ? (
            <div className="mt-4 text-sm text-slate-500">Loading payment records...</div>
          ) : payments.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">No payment records found.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {payments.map((payment) => (
                <div key={payment._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3">
                    {/* Header with Flight Name and Trip Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900">{payment.flightName}</div>
                      {payment.tripType === 'round-trip' ? (
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
                    </div>
                    
                    {/* Flight Route Cards */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {/* Outbound Card */}
                      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-blue-700">Outbound</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900">{payment.origin} → {payment.destination}</div>
                        <div className="mt-2 text-xs text-slate-600">Seats: {payment.seats?.join(', ') || '—'}</div>
                      </div>

                      {/* Return Card (only for round-trip) */}
                      {payment.tripType === 'round-trip' ? (
                        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3 shadow-sm">
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg className="h-4 w-4 text-indigo-600 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="text-xs font-bold uppercase text-indigo-700">Return</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900">{payment.destination} → {payment.origin}</div>
                          {payment.returnSeats && payment.returnSeats.length > 0 && (
                            <div className="mt-2 text-xs text-slate-600">Seats: {payment.returnSeats.join(', ')}</div>
                          )}
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

                      {/* Amount Card */}
                      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-green-700">
                            {payment.tripType === 'round-trip' ? 'Round Trip' : 'One-Way'}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">Total Amount</div>
                        <div className="text-2xl font-bold text-green-700">₹{payment.amount.toLocaleString()}</div>
                      </div>

                      {/* Payment Details Card */}
                      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-xs font-bold uppercase text-purple-700">Details</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className={`inline-block rounded-full px-2.5 py-1 font-bold mb-1 ${
                            payment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            payment.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {payment.status === 'confirmed' ? '✓ Confirmed' : 
                             payment.status === 'completed' ? '✓ Completed' :
                             payment.status === 'cancelled' ? '✗ Cancelled' : payment.status}
                          </div>
                          <div className="text-slate-600">
                            <div className="font-semibold text-slate-700">Passengers: {payment.passengers.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User & Payment Info */}
                    <div className="mt-2 pt-3 border-t border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">
                        <span className="font-semibold">User:</span> {payment.userEmail || 'Unknown user'}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span><span className="font-semibold">Payment ID:</span> {payment.paymentId || 'N/A'}</span>
                        <span>•</span>
                        <span><span className="font-semibold">Order ID:</span> {payment.orderId || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                      <button onClick={() => updatePaymentStatus(payment._id, 'confirmed')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                        Confirm Payment
                      </button>
                      <button onClick={() => updatePaymentStatus(payment._id, 'pending')} className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
                        Mark Pending
                      </button>
                      <button onClick={() => updatePaymentStatus(payment._id, 'cancelled')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors">
                        Cancel
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
