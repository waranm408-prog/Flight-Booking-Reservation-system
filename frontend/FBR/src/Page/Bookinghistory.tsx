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
  flightNo: string;
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
}

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

const formatDateTime = (dateString?: string, fallbackDate?: string) => {
  const parsedDate = parseDateValue(dateString) || parseDateValue(fallbackDate);
  if (!parsedDate) return 'N/A';

  return parsedDate.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateValue = (value?: string, fallbackValue?: string) => {
  const dateCandidate = value || fallbackValue;
  if (!dateCandidate) return 'N/A';

  const parsedDate = parseDateValue(dateCandidate);
  if (!parsedDate) return dateCandidate;

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeValue = (value?: string, fallbackValue?: string) => {
  const timeCandidate = value || fallbackValue;
  if (!timeCandidate) return 'N/A';

  const trimmedValue = timeCandidate.trim();
  if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(trimmedValue)) {
    return trimmedValue;
  }

  const parsedDate = parseDateValue(timeCandidate);
  if (!parsedDate) return trimmedValue;

  return parsedDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function Bookinghistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatBookingDate = (dateString?: string) => {
    return formatDateTime(dateString);
  };

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
    y += lineHeight;
    doc.text(`Booked on: ${formatBookingDate(booking.createdAt)}`, margin, y);
    y += lineHeight * 2;

    doc.setFontSize(14);
    doc.text('Flight & Route Details', margin, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`Flight: ${booking.flightName}`, margin, y);
    y += lineHeight;
    if (booking.flightNo) {
      doc.text(`Flight Number: ${booking.flightNo}`, margin, y);
      y += lineHeight;
    }
    doc.text(`Route: ${booking.origin} → ${booking.destination}`, margin, y);
    y += lineHeight * 2;

    if (booking.tripType === 'round-trip') {
      doc.setFontSize(13);
      doc.text('Return Flight:', margin, y);
      y += lineHeight;
      doc.setFontSize(12);
      doc.text(`Route: ${booking.destination} → ${booking.origin}`, margin, y);
      y += lineHeight;
      if (booking.returnFlightName) {
        doc.text(`Flight: ${booking.returnFlightName}`, margin, y);
        y += lineHeight;
      }
      if (booking.returnSeats && booking.returnSeats.length > 0) {
        doc.text(`Return Seats: ${booking.returnSeats.join(', ')}`, margin, y);
        y += lineHeight;
      }
      y += lineHeight;
    }
    
    doc.text(`Cabin Class: ${booking.cabinClass}`, margin, y);
    y += lineHeight;
    if (booking.duration) {
      doc.text(`Duration: ${booking.duration}`, margin, y);
      y += lineHeight;
    }
    if (booking.stops !== undefined) {
      doc.text(`Stops: ${booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}`, margin, y);
      y += lineHeight;
    }
    y += lineHeight;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 px-4 py-8 text-slate-800 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* Header Card */}
          <div className="mb-8 relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-white shadow-xl">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-blue-100/50 to-transparent">
              <div className="flex h-full flex-col justify-around py-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="mx-auto h-1 w-1 rounded-full bg-blue-300/50"></div>
                ))}
              </div>
            </div>

            <div className="p-6 pl-12">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt size={20} className="text-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Your Bookings</p>
                  </div>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">Travel History</h2>
                  <p className="mt-1 text-sm text-slate-600">View and manage your flight reservations</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 px-5 py-3 shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wide text-blue-100">Total Bookings</div>
                  <div className="mt-1 text-3xl font-bold text-white">{bookings.length}</div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-12 text-center shadow-lg">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-lg font-semibold text-slate-600">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-3xl border-2 border-slate-200 bg-white p-12 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Plane size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Bookings Yet</h3>
              <p className="mt-2 text-slate-500">Start exploring flights and book your next adventure!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking._id} className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-xl transition-all hover:shadow-2xl">
                  {/* Decorative perforated edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-100/50 to-transparent">
                    <div className="flex h-full flex-col justify-around py-4">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="mx-auto h-1 w-1 rounded-full bg-slate-300/50"></div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 pl-12">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-dashed border-slate-200 pb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Plane size={20} className="text-blue-600" />
                          <h3 className="text-xl font-bold text-slate-900">{booking.flightName}</h3>
                        </div>
                        {booking.flightNo && (
                          <p className="mt-1 text-sm text-slate-500">Flight {booking.flightNo}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          <span className="font-semibold">Booked:</span> {formatBookingDate(booking.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                          booking.status === 'confirmed' 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300' 
                            : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300'
                        }`}>
                          {booking.status === 'confirmed' ? '✓ Confirmed' : booking.status}
                        </span>
                      </div>
                    </div>

                    {/* Flight Details Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Outbound Flight Card */}
                      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-md">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</div>
                            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Outbound</span>
                          </div>
                          <Plane size={16} className="text-blue-600" />
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Date</div>
                            <div className="mt-1 font-bold text-slate-900">{formatDateValue(booking.departureDate)}</div>
                          </div>
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Time</div>
                            <div className="mt-1 font-bold text-blue-700">{formatTimeValue(booking.departureTime)}</div>
                          </div>
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Route</div>
                            <div className="mt-1 font-bold text-slate-900">{booking.origin} → {booking.destination}</div>
                          </div>

                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Cabin Class</div>
                            <div className="mt-1 font-bold text-slate-900">{booking.cabinClass || 'N/A'}</div>
                          </div>

                          {booking.duration && (
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Duration</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.duration}</div>
                            </div>
                          )}

                          {booking.stops !== undefined && (
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Stops</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}</div>
                            </div>
                          )}
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Seats</div>
                            <div className="mt-1 font-bold text-slate-900">{booking.seats?.join(', ') || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Return Flight Card or One-way Indicator */}
                      {booking.tripType === 'round-trip' ? (
                        <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-md">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</div>
                              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">Return</span>
                            </div>
                            <Plane size={16} className="rotate-180 text-indigo-600" />
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Date</div>
                              <div className="mt-1 font-bold text-slate-900">{formatDateValue(booking.returnDepartureDate || booking.returnDate)}</div>
                            </div>
                            
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Time</div>
                              <div className="mt-1 font-bold text-indigo-700">{formatTimeValue(booking.returnDepartureTime)}</div>
                            </div>
                            
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Route</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.destination} → {booking.origin}</div>
                            </div>

                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Cabin Class</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.cabinClass || 'N/A'}</div>
                            </div>

                            {booking.duration && (
                              <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                                <div className="text-xs font-semibold text-slate-500">Duration</div>
                                <div className="mt-1 font-bold text-slate-900">{booking.duration}</div>
                              </div>
                            )}

                            {booking.stops !== undefined && (
                              <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                                <div className="text-xs font-semibold text-slate-500">Stops</div>
                                <div className="mt-1 font-bold text-slate-900">{booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}</div>
                              </div>
                            )}
                            
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Seats</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.returnSeats?.join(', ') || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 shadow-md flex items-center justify-center">
                          <div className="text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                              <Plane size={24} className="text-slate-400" />
                            </div>
                            <div className="text-sm font-bold text-slate-600">One-Way Trip</div>
                            <div className="mt-1 text-xs text-slate-500">No return flight</div>
                          </div>
                        </div>
                      )}

                      {/* Payment Receipt Card */}
                      <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-md">
                        <div className="mb-3 flex items-center gap-2">
                          <Receipt size={18} className="text-green-600" />
                          <span className="text-xs font-bold uppercase tracking-wide text-green-700">Payment</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2.5 shadow-sm">
                            <div className="text-xs font-semibold text-green-700">Total Amount</div>
                            <div className="mt-1 text-xl font-bold text-green-800">₹{booking.amount.toLocaleString()}</div>
                          </div>
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Order ID</div>
                            <div className="mt-1 text-xs font-mono text-slate-700">{booking.orderId.substring(0, 20)}...</div>
                          </div>
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Payment ID</div>
                            <div className="mt-1 text-xs font-mono text-slate-700">{booking.paymentId.substring(0, 20)}...</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passengers Info */}
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Passengers ({booking.passengers.length})</div>
                      <div className="space-y-1">
                        {booking.passengers.map((passenger, index) => (
                          <div key={`${passenger.email}-${index}`} className="text-xs text-slate-700">
                            <span className="font-semibold">{passenger.name}</span> • {passenger.phone}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-2 border-t-2 border-dashed border-slate-200 pt-4">
                      <button
                        onClick={() => updateStatus(booking._id, 'confirmed')}
                        className="group flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <CheckCircle2 size={16} />
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => updateStatus(booking._id, 'cancelled')}
                        className="group flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <XCircle size={16} />
                        Cancel Booking
                      </button>
                      <button
                        onClick={() => generateBookingPdf(booking)}
                        className="group flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <Download size={16} />
                        Download Receipt
                      </button>
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
