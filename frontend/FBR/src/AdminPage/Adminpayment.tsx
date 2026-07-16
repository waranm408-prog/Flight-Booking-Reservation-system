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
  origin: string;
  destination: string;
  amount: number;
  paymentId: string;
  orderId: string;
  status: string;
  createdAt: string;
  passengers: Passenger[];
  seats: string[];
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
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{payment.flightName}</div>
                      <div className="text-sm text-slate-600">{payment.origin} → {payment.destination}</div>
                      <div className="mt-2 text-sm text-slate-500">User: {payment.userEmail || 'Unknown user'}</div>
                      <div className="mt-1 text-xs text-slate-500">Payment ID: {payment.paymentId || 'N/A'}</div>
                      <div className="mt-1 text-xs text-slate-500">Order ID: {payment.orderId || 'N/A'}</div>
                    </div>

                    <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
                      <div className="text-slate-500">Status</div>
                      <div className="font-semibold text-slate-900">{payment.status}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>Amount: ₹{payment.amount}</span>
                    <span>Seats: {payment.seats.join(', ') || '—'}</span>
                    <span>Passengers: {payment.passengers.length}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => updatePaymentStatus(payment._id, 'confirmed')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      Confirm Payment
                    </button>
                    <button onClick={() => updatePaymentStatus(payment._id, 'completed')} className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900">
                      Mark Called
                    </button>
                    <button onClick={() => updatePaymentStatus(payment._id, 'cancelled')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                      Cancel
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
