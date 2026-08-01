import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Receipt, XCircle } from 'lucide-react';
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

// Decode common HTML entities and numeric entity references safely in the browser.
const decodeHtmlEntities = (str?: string) => {
  if (!str) return '';
  try {
    if (typeof document !== 'undefined') {
      const txt = document.createElement('textarea');
      txt.innerHTML = str;
      return txt.value;
    }
    // Fallback: simple numeric/entity decode for non-DOM environments
    return String(str).replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (_m, n) => {
      if (n[0] === '#') {
        const isHex = n[1] === 'x' || n[1] === 'X';
        const code = parseInt(isHex ? n.slice(2) : n.slice(1), isHex ? 16 : 10);
        return String.fromCharCode(code || 0);
      }
      const map: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
      return map[n] || '';
    });
  } catch (e) {
    return String(str);
  }
};

const sanitizeString = (value?: string | null) => {
  if (value === undefined || value === null) return '';
  let s = String(value);
  s = decodeHtmlEntities(s);
  // remove common control characters that break layout
  s = s.replace(/[\x00-\x1F\x7F]/g, '');
  // Normalize common superscript digits to regular digits
  const superscriptMap: Record<string, string> = {
    '\u00B9': '1', '\u00B2': '2', '\u00B3': '3',
    '\u2070': '0','\u2071': 'i','\u2074': '4','\u2075': '5','\u2076': '6','\u2077': '7','\u2078': '8','\u2079': '9'
  };
  s = s.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079]/g, (ch) => superscriptMap[ch] || '');
  // remove stray ampersand artifacts
  s = s.replace(/&/g, '');
  // collapse spaces around commas and between digits (e.g., `1 6 , 1 3 8` -> `16,138`)
  s = s.replace(/\s*,\s*/g, ',');
  // remove spaces between digits iteratively
  while (/\d\s+\d/.test(s)) {
    s = s.replace(/(\d)\s+(\d)/g, '$1$2');
  }
  // collapse excessive whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const getDisplayValue = (value?: string | null, fallback = 'No data available') => {
  const cleaned = sanitizeString(value);
  return cleaned || fallback;
};

const formatCurrency = (amount?: number | string | null): string => {
  if (amount === undefined || amount === null || amount === '') return '₹0';

  let cleanValue: string;
  
  // If it's already a number, convert to string
  if (typeof amount === 'number') {
    cleanValue = String(amount);
  } else {
    // If it's a string, sanitize it first
    cleanValue = sanitizeString(amount);
    
    // Remove ALL non-numeric characters except digits, dot, comma, and minus
    // This handles corrupted text like ¹&1&6&,&1&3&8
    cleanValue = cleanValue.replace(/[^\d.,-]/g, '');
    
    // Remove any currency symbols that might remain
    cleanValue = cleanValue.replace(/[₹$€£¥]/g, '');
    
    // Normalize: remove spaces between digits
    cleanValue = cleanValue.replace(/\s+/g, '');
    
    // Remove commas (they'll be re-added by toLocaleString)
    cleanValue = cleanValue.replace(/,/g, '');
  }
  
  // Parse to number
  const numericAmount = parseFloat(cleanValue);
  
  // If parsing fails, return ₹0
  if (isNaN(numericAmount)) {
    console.warn('Failed to parse amount:', amount, '-> cleaned:', cleanValue);
    return '₹0';
  }
  
  // Format with Indian locale (adds commas in correct positions)
  return `₹${numericAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}`;
};

const formatShortValue = (value?: string | null, fallback = 'No data available') => {
  const displayValue = getDisplayValue(value, fallback);
  return displayValue.length > 20 ? `${displayValue.slice(0, 20)}...` : displayValue;
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
      
      // Show success message
      if (status === 'cancelled') {
       
      } else if (status === 'confirmed') {
        
      }
      
      // Reload bookings to reflect the change
      loadBookings();
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to update booking status. Please try again.';
      alert(errorMessage);
    }
  };

  // Sanitize text helper to remove corrupt & characters and clean strings
  const sanitizeText = (text: any): string => {
    if (text === undefined || text === null || text === '') return 'N/A';
    
    // Convert to string and remove any & separators between characters
    let cleanText = String(text);
    
    // Remove pattern like &R&o&u&t&e& or ¹&1&6&,&1&3&8
    cleanText = cleanText.replace(/&(.)/g, '$1');
    
    // Remove standalone & characters
    cleanText = cleanText.replace(/&/g, '');
    
    // Trim whitespace
    cleanText = cleanText.trim();
    
    return cleanText || 'N/A';
  };

  // Safe value wrapper with sanitization
  const getSafeValue = (value: any, fallback = 'N/A'): string => {
    const cleaned = sanitizeText(value);
    return cleaned === 'N/A' ? fallback : cleaned;
  };

  const generateBookingPdf = (booking: BookingItem) => {
    // Helper function to extract clean numeric amount from any format
    const getCleanAmount = (amount?: number | string | null): number => {
      if (amount === undefined || amount === null || amount === '') return 0;
      
      if (typeof amount === 'number') return amount;
      
      // Remove ALL non-numeric characters including currency symbols, superscripts, etc.
      let cleanValue = String(amount)
        .replace(/[₹$€£¥]/g, '') // Remove currency symbols
        .replace(/[\u00B9\u00B2\u00B3\u2070-\u2079]/g, '') // Remove superscripts
        .replace(/[^\d.,-]/g, '') // Keep only digits, dot, comma, minus
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/,/g, ''); // Remove commas
      
      const numericAmount = parseFloat(cleanValue);
      return isNaN(numericAmount) ? 0 : numericAmount;
    };

    // Sanitize and prepare all data ONCE at the start
    const bookingId = getSafeValue(booking.orderId || booking._id);
    const status = getSafeValue(booking.status, 'Pending');
    const tripType = booking.tripType === 'round-trip' ? 'Round Trip' : 'One Way';
    const orderId = getSafeValue(booking.orderId);
    const paymentId = getSafeValue(booking.paymentId);
    
    // Get clean numeric amount and format for PDF (using Rs. instead of ₹ for better PDF compatibility)
    // Note: UI cards use formatCurrency() which displays ₹, but PDF uses ASCII-safe "Rs." prefix
    const amountNumeric = getCleanAmount(booking.amount);
    const amountFormatted = 'Rs. ' + amountNumeric.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    // Modern Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 100, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('FLIGHT BOOKING RECEIPT', margin, 50);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Booking Confirmation', margin, 75);

    y = 130;

    // Booking Info Section
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 80, 8, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 80, 8, 8, 'S');
    
    y += 25;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING INFORMATION', margin + 15, y);
    
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    const bookingInfo = [
      'Booking ID: ' + bookingId,
      'Status: ' + status,
      'Trip Type: ' + tripType
    ];
    
    bookingInfo.forEach((line) => {
      doc.text(line, margin + 15, y);
      y += 15;
    });

    y += 20;

    // Outbound Flight Section
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 130, 8, 8, 'F');
    
    y += 25;
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('OUTBOUND FLIGHT', margin + 15, y);
    
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    const flightName = getSafeValue(booking.flightName);
    const flightNo = getSafeValue(booking.flightNo);
    const origin = getSafeValue(booking.origin);
    const destination = getSafeValue(booking.destination);
    const departDate = formatDateValue(booking.departureDate);
    const departTime = formatTimeValue(booking.departureTime);
    const cabin = getSafeValue(booking.cabinClass);
    const seats = booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'N/A';
    const duration = getSafeValue(booking.duration);
    const stops = booking.stops === 0 ? 'Non-stop' : getSafeValue(booking.stops);
    
    const outboundInfo = [
      'Flight: ' + flightName + ' (' + flightNo + ')',
      'Route: ' + origin + ' to ' + destination,
      'Date: ' + departDate,
      'Time: ' + departTime,
      'Cabin: ' + cabin,
      'Seats: ' + seats,
      'Duration: ' + duration + ' | Stops: ' + stops
    ];
    
    outboundInfo.forEach((line) => {
      doc.text(line, margin + 15, y);
      y += 15;
    });

    y += 20;

    // Return Flight Section (if round-trip)
    if (booking.tripType === 'round-trip') {
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 110, 8, 8, 'F');
      
      y += 25;
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RETURN FLIGHT', margin + 15, y);
      
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      
      const returnFlightName = getSafeValue(booking.returnFlightName || booking.flightName);
      const returnFlightNo = getSafeValue(booking.returnFlightNo || booking.flightNo);
      const returnDate = formatDateValue(booking.returnDepartureDate || booking.returnDate);
      const returnTime = formatTimeValue(booking.returnDepartureTime);
      const returnSeats = booking.returnSeats && booking.returnSeats.length > 0 ? booking.returnSeats.join(', ') : 'N/A';
      
      const returnInfo = [
        'Flight: ' + returnFlightName + ' (' + returnFlightNo + ')',
        'Route: ' + destination + ' to ' + origin,
        'Date: ' + returnDate,
        'Time: ' + returnTime,
        'Return Seats: ' + returnSeats
      ];
      
      returnInfo.forEach((line) => {
        doc.text(line, margin + 15, y);
        y += 15;
      });

      y += 20;
    }

    // Passenger Details Section
    const passengerHeight = Math.min(60 + (booking.passengers.length * 15), 120);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), passengerHeight, 8, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), passengerHeight, 8, 8, 'S');
    
    y += 25;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PASSENGER DETAILS', margin + 15, y);
    
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    if (booking.passengers && booking.passengers.length > 0) {
      booking.passengers.forEach((passenger, index) => {
        const passengerName = getSafeValue(passenger.name, 'Unnamed');
        const passengerPhone = getSafeValue(passenger.phone, 'No phone');
        const passengerEmail = getSafeValue(passenger.email, 'No email');
        
        const passengerLine = (index + 1) + '. ' + passengerName + ' | ' + passengerPhone + ' | ' + passengerEmail;
        doc.text(passengerLine, margin + 15, y);
        y += 15;
      });
    } else {
      doc.text('No passenger details available', margin + 15, y);
      y += 15;
    }

    y += 20;

    // ============================================
    // SECTION 5: PAYMENT SUMMARY
    // ============================================
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 120, 8, 8, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(2);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 120, 8, 8, 'S');
    
    y += 25;
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', margin + 15, y);
    
    y += 25;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    // Payment Status
    doc.text('Payment Status: ' + status.toUpperCase(), margin + 15, y);
    y += 20;
    
    // Total Amount Paid - using PDF-safe formatted value
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Total Amount Paid:', margin + 15, y);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(amountFormatted, pageWidth - margin - 150, y);
    
    y += 25;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    
    // Order ID - using pre-sanitized value
    doc.text('Order ID: ' + orderId, margin + 15, y);
    y += 12;
    
    // Payment ID - using pre-sanitized value
    doc.text('Payment ID: ' + paymentId, margin + 15, y);

    y += 30;

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your booking. Have a pleasant journey!', margin, footerY + 20);

    // Save PDF with sanitized filename
    const filename = 'Flight_Receipt_' + booking._id.substring(0, 8) + '.pdf';
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
              <p className="mt-2 text-slate-500">Your reservation history will appear here once you make a booking.</p>
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
                          <h3 className="text-xl font-bold text-slate-900">{getDisplayValue(booking.flightName, 'Flight details unavailable')}</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{getDisplayValue(booking.flightNo, 'No flight number available')}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          <span className="font-semibold">Booked:</span> {formatBookingDate(booking.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="font-semibold">Reference:</span> {getDisplayValue(booking.orderId || booking._id, 'No booking reference available')}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                          booking.status === 'confirmed' 
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300' 
                            : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300'
                        }`}>
                          {booking.status === 'confirmed' ? '✓ Confirmed' : getDisplayValue(booking.status, 'Pending')}
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
                            <div className="mt-1 font-bold text-slate-900 break-words max-w-full">{getDisplayValue(booking.origin, 'Not available')} → {getDisplayValue(booking.destination, 'Not available')}</div>
                          </div>

                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Cabin Class</div>
                            <div className="mt-1 font-bold text-slate-900 truncate">{getDisplayValue(booking.cabinClass, 'No cabin class available')}</div>
                          </div>

                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Duration</div>
                            <div className="mt-1 font-bold text-slate-900 truncate">{getDisplayValue(booking.duration, 'No duration available')}</div>
                          </div>

                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Stops</div>
                            <div className="mt-1 font-bold text-slate-900">{booking.stops === undefined ? 'No stop data available' : booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}</div>
                          </div>
                          
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                            <div className="text-xs font-semibold text-slate-500">Seats</div>
                            <div className="mt-1 font-bold text-slate-900 break-words max-w-full">{booking.seats && booking.seats.length > 0 ? booking.seats.join(', ') : 'No seat data available'}</div>
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
                              <div className="mt-1 font-bold text-slate-900 break-words max-w-full">{getDisplayValue(booking.destination, 'Not available')} → {getDisplayValue(booking.origin, 'Not available')}</div>
                            </div>

                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Cabin Class</div>
                              <div className="mt-1 font-bold text-slate-900 truncate">{getDisplayValue(booking.cabinClass, 'No cabin class available')}</div>
                            </div>

                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Duration</div>
                              <div className="mt-1 font-bold text-slate-900 truncate">{getDisplayValue(booking.duration, 'No duration available')}</div>
                            </div>

                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Stops</div>
                              <div className="mt-1 font-bold text-slate-900">{booking.stops === undefined ? 'No stop data available' : booking.stops === 0 ? 'Non-stop' : `${booking.stops} stop(s)`}</div>
                            </div>
                            
                            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                              <div className="text-xs font-semibold text-slate-500">Seats</div>
                              <div className="mt-1 font-bold text-slate-900 break-words max-w-full">{booking.returnSeats && booking.returnSeats.length > 0 ? booking.returnSeats.join(', ') : 'No return seat data available'}</div>
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
                      <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-md overflow-hidden">
                        <div className="mb-3 flex items-center gap-2">
                          <Receipt size={18} className="text-green-600" />
                          <span className="text-xs font-bold uppercase tracking-wide text-green-700">Payment</span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {/* Total Amount with Flexbox */}
                          <div className="rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2.5 shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="text-xs font-semibold text-green-700">Total Amount</div>
                              <div className="text-xl font-bold text-green-800 break-all">{formatCurrency(booking.amount)}</div>
                            </div>
                          </div>
                          
                          {/* Order ID */}
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm overflow-hidden">
                            <div className="text-xs font-semibold text-slate-500 mb-1">Order ID</div>
                            <div className="text-xs font-mono text-slate-700 break-all" title={booking.orderId}>
                              {formatShortValue(booking.orderId)}
                            </div>
                          </div>
                          
                          {/* Payment ID */}
                          <div className="rounded-lg bg-white px-3 py-2 shadow-sm overflow-hidden">
                            <div className="text-xs font-semibold text-slate-500 mb-1">Payment ID</div>
                            <div className="text-xs font-mono text-slate-700 break-all" title={booking.paymentId}>
                              {formatShortValue(booking.paymentId)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passengers Info */}
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Passengers ({booking.passengers.length})</div>
                      <div className="space-y-1">
                        {booking.passengers.length > 0 ? (
                          booking.passengers.map((passenger, index) => (
                            <div key={`${passenger.email}-${index}`} className="text-xs text-slate-700">
                              <span className="font-semibold">{getDisplayValue(passenger.name, 'Unnamed passenger')}</span> • {getDisplayValue(passenger.phone, 'No phone available')}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-600">No passenger data available</div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-wrap gap-2 border-t-2 border-dashed border-slate-200 pt-4">
                      {/* Show Cancel button only if not already cancelled */}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(booking._id, 'cancelled')}
                          className="group flex items-center gap-2 rounded-xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-all hover:shadow-md active:scale-95"
                        >
                          <XCircle size={16} />
                          Cancel Booking
                        </button>
                      )}
                      
                      {/* Download Receipt button always visible */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          generateBookingPdf(booking);
                        }}
                        className="group flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition-all hover:shadow-md active:scale-95"
                      >
                        <Receipt size={16} />
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
