import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Receipt, XCircle, CheckCircle2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import Navbar from '../components/Navbar';
import api from '../api/axios';

interface Passenger {
  name: string;
  phone: string;
  email: string;
}

interface BookingItem {
  _id: string;
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
}

export default function Bookinghistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    const currentUser = localStorage.getItem('CurrentUser');
    const email = currentUser ? JSON.parse(currentUser).email : '';

    if (!email) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/bookings', { params: { email } });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/bookings/${id}/status`, { status });
      loadBookings();
    } catch (error) {
      console.error(error);
    }
  };

  const generateBookingPdf = (booking: BookingItem) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const lineHeight = 18;
    let y = margin;

    const header = `Booking Receipt - ${booking.flightName}`;
    doc.setFontSize(18);
    doc.text(header, margin, y);
    y += 30;

    doc.setFontSize(12);
    doc.text(`Order ID: ${booking.orderId}`, margin, y);
    y += lineHeight;
    doc.text(`Payment ID: ${booking.paymentId}`, margin, y);
    y += lineHeight;
    doc.text(`Status: ${booking.status}`, margin, y);
    y += lineHeight;
    doc.text(`Amount: ₹${booking.amount.toLocaleString()}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text('Flight & Route Details', margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`Flight: ${booking.flightName}`, margin, y);
    y += lineHeight;
    doc.text(`Route: ${booking.origin} → ${booking.destination}`, margin, y);
    y += lineHeight;
    doc.text(`Departure: ${booking.departureTime}`, margin, y);
    y += lineHeight;
    doc.text(`Arrival: ${booking.arrivalTime}`, margin, y);
    y += lineHeight;
    doc.text(`Cabin Class: ${booking.cabinClass}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text('Passenger Details', margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    booking.passengers.forEach((passenger, index) => {
      const passengerText = `${index + 1}. ${passenger.name || 'N/A'} | ${passenger.phone || 'N/A'} | ${passenger.email || 'N/A'}`;
      doc.text(passengerText, margin, y);
      y += lineHeight;
      if (y > 760) {
        doc.addPage();
        y = margin;
      }
    });
    y += lineHeight;

    doc.setFontSize(14);
    doc.text('Seats', margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(booking.seats.join(', ') || 'N/A', margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text('Airline / Booking Notes', margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`This document confirms your flight booking details and payment receipt. Please keep it for your records.`, margin, y, { maxWidth: 520 });

    const filename = `booking_receipt_${booking._id}.pdf`;
    doc.save(filename);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 md:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Bookings</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Booking history</h2>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {bookings.length} Records
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">No bookings yet.</div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Plane size={18} />
                        <span className="font-semibold">{booking.flightName}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-800">Route:</span> {booking.origin} → {booking.destination}</p>
                        <p><span className="font-semibold text-slate-800">Time:</span> {booking.departureTime} • {booking.arrivalTime}</p>
                        <p><span className="font-semibold text-slate-800">Cabin:</span> {booking.cabinClass}</p>
                        <p><span className="font-semibold text-slate-800">Seats:</span> {booking.seats.join(', ') || 'Not selected'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Receipt size={16} />
                        <span className="font-semibold">Receipt</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p><span className="font-semibold text-slate-800">Amount:</span> RS {booking.amount.toLocaleString()}</p>
                        <p><span className="font-semibold text-slate-800">Order:</span> {booking.orderId}</p>
                        <p><span className="font-semibold text-slate-800">Payment:</span> {booking.paymentId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Passengers</p>
                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                          {booking.passengers.map((passenger, index) => (
                            <p key={`${passenger.email}-${index}`}>
                              {passenger.name} • {passenger.phone} • {passenger.email}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateStatus(booking._id, 'confirmed')}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                          >
                            <CheckCircle2 size={16} className="mr-1 inline" /> Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(booking._id, 'cancelled')}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                          >
                            <XCircle size={16} className="mr-1 inline" /> Cancel
                          </button>
                          <button
                            onClick={() => generateBookingPdf(booking)}
                            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
                          >
                            <Download size={16} className="mr-1 inline" /> Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
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
