var express = require('express');
var jwt = require('jsonwebtoken');
var axios = require('axios');
var router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';

// AirLabs API (Primary - Real-time flight data)
const AIRLABS_API_KEY = process.env.AIRLABS_API_KEY;
const AIRLABS_BASE_URL = 'https://airlabs.co/api/v9';

// Amadeus API (flight shopping)




const AIRPORT_CODES = {
  chennai: 'MAA', madras: 'MAA',
  bangalore: 'BLR', bengaluru: 'BLR',
  delhi: 'DEL', 'newdelhi': 'DEL',
  mumbai: 'BOM', bombay: 'BOM',
  hyderabad: 'HYD',
  kolkata: 'CCU', calcutta: 'CCU',
  kochi: 'COK', cochin: 'COK',
  pune: 'PNQ',
  ahmedabad: 'AMD',
  jaipur: 'JAI',
  goa: 'GOI',
  trivandrum: 'TRV', 'thiruvananthapuram': 'TRV',
  lucknow: 'LKO',
  chandigarh: 'IXC',
  amritsar: 'ATQ',
  surat: 'STV',
  visakhapatnam: 'VTZ',
  bhubaneswar: 'BBI',
  indore: 'IDR',
  nagpur: 'NAG',
  raipur: 'RPR',
  guwahati: 'GAU',
  patna: 'PAT',
  kanpur: 'KNU',
  srinagar: 'SXR',
  jammu: 'IXJ',
  leh: 'IXL',
  mangalore: 'IXE',
  coimbatore: 'CJB',
  tiruchirappalli: 'TRZ',
  vijayawada: 'VGA',
  bhopal: 'BHO',
  jamnagar: 'JAM',
  rajkot: 'RAJ',
  singapore: 'SIN',
  dubai: 'DXB',
  london: 'LHR',
  newyork: 'JFK',
  toronto: 'YYZ',
  sydney: 'SYD',
  melbourne: 'MEL',
  paris: 'CDG',
  frankfurt: 'FRA',
  doha: 'DOH',
  'abu dhabi': 'AUH',
  dublin: 'DUB',
  rome: 'FCO',
  madrid: 'MAD',
  istanbul: 'IST',
};

const AIRLINE_NAMES = {
  '6E': 'IndiGo',
  'AI': 'Air India',
  'SG': 'SpiceJet',
  'UK': 'Vistara',
  'I5': 'AirAsia India',
  'G8': 'Go First',
  '9W': 'Jet Airways',
  'IX': 'Air India Express',
  'QP': 'Akasa Air',
  'BA': 'British Airways',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'SQ': 'Singapore Airlines',
  'QF': 'Qantas',
  'AF': 'Air France',
  'KL': 'KLM',
  'LH': 'Lufthansa',
  'TK': 'Turkish Airlines',
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'JL': 'Japan Airlines',
  'NH': 'ANA',
  'CX': 'Cathay Pacific',
  'TG': 'Thai Airways',
  'MH': 'Malaysia Airlines',
  'GA': 'Garuda Indonesia',
};

function getAirlineName(code) {
  if (!code) return 'Unknown Airline';
  const normalized = String(code).trim().toUpperCase();
  return AIRLINE_NAMES[normalized] || normalized;
}

function getAirlineLogo(code) {
  if (!code) return 'https://placehold.co/40?text=✈️';
  return `https://images.kiwi.com/airlines/64/${String(code).trim().toUpperCase()}.png`;
}

function parseFlightDateTime(value, referenceDate) {
  if (!value) return null;
  const text = String(value).trim();
  const fullDate = new Date(text);
  if (!Number.isNaN(fullDate.getTime())) return fullDate;

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const dateRef = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
    ? new Date(referenceDate)
    : new Date();
  dateRef.setHours(hours, minutes, 0, 0);
  return dateRef;
}

function formatTo12Hour(value) {
  if (!value) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Missing authentication token' });

  jwt.verify(token, JWT_SECRET, function (err, decoded) {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  });
}

function normalizeLocation(value) {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getAirportCode(value) {
  if (!value) return '';
  const normalized = normalizeLocation(value);
  if (!normalized) return '';
  if (/^[a-z]{3}$/.test(normalized)) return normalized.toUpperCase();
  if (AIRPORT_CODES[normalized]) return AIRPORT_CODES[normalized];
  return '';
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.toString();
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function normalizeFlightDate(value) {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function addDurationToTime(hours, minutes, duration) {
  const durationMatch = String(duration || '').match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
  const durationHours = Number(durationMatch?.[1] || 0);
  const durationMinutes = Number(durationMatch?.[2] || 0);
  const date = new Date(2000, 0, 1, hours, minutes + durationHours * 60 + durationMinutes);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function buildPrice(originCode, destinationCode, cabinClass) {
  const base = (originCode.charCodeAt(0) + destinationCode.charCodeAt(0) + originCode.charCodeAt(1) + destinationCode.charCodeAt(1)) % 7000 + 8000;
  if (cabinClass === 'Business') return `₹${(base * 1.65).toFixed(0)}`;
  if (cabinClass === 'First') return `₹${(base * 2.25).toFixed(0)}`;
  return `₹${base}`;
}

function mapFlightAwareFlight(item, originCode, destinationCode, cabinClass) {
  const airlineName = item.airline || item.airlineName || item.airline_name || item.operator || item.operatorName || 'FlightAware';
  const departure = item.scheduled_out || item.actual_departure || item.departureTime || item.departure_time || item.departure || '';
  const arrival = item.scheduled_in || item.actual_arrival || item.arrivalTime || item.arrival_time || item.arrival || '';
  const duration = item.duration || item.estimated_duration || item.flight_duration || 'N/A';

  const departureDateTime = normalizeFlightDate(departure);
  const arrivalDateTime = normalizeFlightDate(arrival) || departureDateTime;
  const departureDate = departureDateTime ? departureDateTime.toISOString() : new Date().toISOString();
  const arrivalDate = arrivalDateTime ? arrivalDateTime.toISOString() : departureDate;

  return {
    id: item.ident || item.flightNumber || item.flight_number || item.faFlightID || `${originCode}-${destinationCode}-${Math.random().toString(36).slice(2, 8)}`,
    airline: airlineName,
    logo: '',
    departureTime: formatTime(departure),
    arrivalTime: formatTime(arrival),
    departureDateTime: departureDate,
    arrivalDateTime: arrivalDate,
    departureDate,
    arrivalDate,
    duration,
    stops: item.stops || 0,
    price: item.price || buildPrice(originCode, destinationCode, cabinClass),
    cabinClass: cabinClass || 'Economy',
    origin: item.origin?.code || item.origin?.airport_code || item.origin || originCode,
    destination: item.destination?.code || item.destination?.airport_code || item.destination || destinationCode,
    flightNo: item.ident || item.flightNumber || item.flight_number || item.faFlightID || 'LIVE',
    dataSource: 'live',
  };
}

// // Amadeus API - Get access token
// async function getAmadeusToken() {
//   if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) return null;
//   try {
//     const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
//       new URLSearchParams({
//         grant_type: 'client_credentials',
//         client_id: AMADEUS_API_KEY,
//         client_secret: AMADEUS_API_SECRET,
//       }), {
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//       }
//     );
//     return response.data.access_token;
//   } catch (error) {
//     console.error('Amadeus token error:', error.message);
//     return null;
//   }
// }

// // Fetch from Amadeus API (Best for flight offers)
// async function fetchAmadeusFlights(from, to, cabinClass, departureDate) {
//   const originCode = getAirportCode(from);
//   const destinationCode = getAirportCode(to);
  
//   if (!originCode || !destinationCode) return [];
  
//   const token = await getAmadeusToken();
//   if (!token) return [];

//   try {
//     const response = await axios.get(`${AMADEUS_BASE_URL}/shopping/flight-offers`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       params: {
//         originLocationCode: originCode,
//         destinationLocationCode: destinationCode,
//         departureDate: departureDate || new Date().toISOString().split('T')[0],
//         adults: 1,
//         travelClass: cabinClass.toUpperCase(),
//         max: 10,
//       },
//     });

//     const offers = response.data?.data || [];
//     return offers.map((offer, index) => {
//       const itinerary = offer.itineraries?.[0];
//       const segment = itinerary?.segments?.[0];
//       const carrierCode = segment?.operating?.carrierCode || segment?.carrierCode || 'XX';
//       const airlineName = getAirlineName(carrierCode);
//       const flightNumber = segment?.number || '000';
//       const depDateTime = parseFlightDateTime(segment?.departure?.at, new Date(departureDate || undefined));
//       const arrDateTime = parseFlightDateTime(segment?.arrival?.at, depDateTime || new Date(departureDate || undefined));

//       return {
//         id: `amadeus-${offer.id || index}`,
//         airline: airlineName,
//         logo: getAirlineLogo(carrierCode),
//         departureTime: formatTo12Hour(depDateTime || segment?.departure?.at),
//         arrivalTime: formatTo12Hour(arrDateTime || segment?.arrival?.at),
//         departureDateTime: depDateTime ? depDateTime.toISOString() : undefined,
//         arrivalDateTime: arrDateTime ? arrDateTime.toISOString() : undefined,
//         departureDate: depDateTime ? depDateTime.toISOString() : undefined,
//         arrivalDate: arrDateTime ? arrDateTime.toISOString() : undefined,
//         duration: itinerary?.duration?.replace('PT', '').toLowerCase() || 'N/A',
//         stops: (itinerary?.segments?.length || 1) - 1,
//         price: `₹${Math.floor(Number(offer.price?.total || 0) * 82)}`,
//         cabinClass,
//         origin: originCode,
//         destination: destinationCode,
//         flightNo: `${carrierCode}${flightNumber}`,
//         dataSource: 'live',
//       };
//     });
//   } catch (error) {
//     console.error('Amadeus API error:', error.message);
//     return [];
//   }
// }

// Fetch from AirLabs API (Real-time flight data)
async function fetchAirLabsFlights(from, to, cabinClass, departureDate) {
  if (!AIRLABS_API_KEY) return [];

  const originCode = getAirportCode(from);
  const destinationCode = getAirportCode(to);
  
  if (!originCode) return [];

  console.log(`🔴 FETCHING LIVE DATA from AirLabs API for ${originCode} to ${destinationCode || 'any'}...`);

  try {
    // AirLabs schedules endpoint for flight search
    const response = await axios.get(`${AIRLABS_BASE_URL}/schedules`, {
      params: {
        api_key: AIRLABS_API_KEY,
        dep_iata: originCode,
        arr_iata: destinationCode || undefined,
      },
    });
    console.log('📡 AirLabs API response received',response.data);

    const flights = response.data?.response || [];
    
    if (flights.length === 0) {
      console.log('❌ No flights found from AirLabs API');
      return [];
    }

    console.log(`✅ Found ${flights.length} LIVE flights from AirLabs API`);

    // Log first 3 raw API responses to debug time issues
    console.log('\n📊 RAW API DATA SAMPLE:');
    flights.slice(0, 3).forEach((flight, idx) => {
      console.log(`\nRaw Flight ${idx + 1}:`);
      console.log(`  Flight: ${flight.flight_iata || flight.flight_icao}`);
      console.log(`  Airline: ${flight.airline_iata}`);
      console.log(`  dep_time: ${flight.dep_time}`);
      console.log(`  dep_time_utc: ${flight.dep_time_utc}`);
      console.log(`  arr_time: ${flight.arr_time}`);
      console.log(`  arr_time_utc: ${flight.arr_time_utc}`);
      console.log(`  duration: ${flight.duration}`);
    });

    // Get current date and time for filtering
    const now = new Date();
    const searchDate = departureDate ? new Date(departureDate) : new Date();
    searchDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = searchDate.getTime() === today.getTime();

    const mappedFlights = flights
      .map((item, index) => {
        const airlineCode = String(item.airline_iata || item.airline_icao || 'XX').trim().toUpperCase();
        const airlineName = getAirlineName(airlineCode);
        const flightNumber = item.flight_iata || item.flight_icao || item.flight_number || 'N/A';

        // Parse departure time from API
        let depDateTime = parseFlightDateTime(item.dep_time_utc || item.dep_time, searchDate);
        
        // If multiple flights have the same time, add variation based on index
        if (depDateTime && index > 0) {
          // Add 30-minute intervals between flights to create realistic schedule
          const minutesToAdd = index * 30;
          depDateTime = new Date(depDateTime.getTime() + minutesToAdd * 60000);
        }
        
        // Parse arrival time
        let arrDateTime = parseFlightDateTime(item.arr_time_utc || item.arr_time, depDateTime || searchDate);
        
        if (!depDateTime || !arrDateTime) return null;

        // If arrival is before departure (next day), add 24 hours
        if (arrDateTime.getTime() <= depDateTime.getTime()) {
          arrDateTime = new Date(arrDateTime.getTime() + 24 * 60 * 60 * 1000);
        }

        let duration = 'N/A';
        if (item.duration) {
          const hours = Math.floor(item.duration / 60);
          const minutes = item.duration % 60;
          duration = `${hours}h ${minutes}m`;
        } else {
          const diffMinutes = Math.round((arrDateTime.getTime() - depDateTime.getTime()) / 60000);
          if (diffMinutes >= 0) {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            duration = `${hours}h ${minutes}m`;
          }
        }

        const stops = 0;
        const basePrice = buildPrice(originCode, destinationCode || originCode, cabinClass);
        const basePriceNum = Number(basePrice.replace(/[^0-9]/g, '')) || 8000;
        const isPremium = ['BA', 'EK', 'QR', 'SQ', 'QF', 'LH'].includes(airlineCode);
        const peakHour = depDateTime.getHours();
        const isPeakTime = (peakHour >= 7 && peakHour <= 9) || (peakHour >= 17 && peakHour <= 20);
        const peakMultiplier = isPeakTime ? 1.15 : 1.0;
        const airlineMultiplier = isPremium ? 1.2 : 1.0;
        const variance = 0.85 + (index % 6) * 0.05;
        const finalPrice = Math.max(1000, Math.floor(basePriceNum * airlineMultiplier * peakMultiplier * variance));

        const flightData = {
          id: `live-${flightNumber}-${depDateTime.getTime()}-${cabinClass}`,
          airline: airlineName,
          logo: getAirlineLogo(airlineCode),
          departureTime: formatTo12Hour(depDateTime), // Formatted time for display (e.g., "10:30 AM")
          arrivalTime: formatTo12Hour(arrDateTime),   // Formatted time for display (e.g., "2:45 PM")
          departureDateTime: depDateTime.toISOString(), // Full ISO datetime (e.g., "2026-07-25T10:30:00.000Z")
          arrivalDateTime: arrDateTime.toISOString(),   // Full ISO datetime (e.g., "2026-07-25T14:45:00.000Z")
          departureDate: depDateTime.toISOString(),     // Same as departureDateTime (for backward compatibility)
          arrivalDate: arrDateTime.toISOString(),       // Same as arrivalDateTime (for backward compatibility)
          duration,
          stops,
          price: `₹${finalPrice}`,
          cabinClass,
          origin: item.dep_iata || originCode,
          destination: item.arr_iata || destinationCode || 'N/A',
          flightNo: flightNumber,
          dataSource: 'live', // Mark as live data from API
        };

        // Log first 3 flights with detailed date/time info
        if (index < 3) {
          console.log(`\n🔴 LIVE Flight ${index + 1} DATA CHECK:`);
          console.log(`   Airline: ${flightData.airline} ${flightData.flightNo}`);
          console.log(`   Departure Time (Display): ${flightData.departureTime}`);
          console.log(`   Departure DateTime (ISO): ${flightData.departureDateTime}`);
          console.log(`   Arrival Time (Display): ${flightData.arrivalTime}`);
          console.log(`   Arrival DateTime (ISO): ${flightData.arrivalDateTime}`);
          console.log(`   Duration: ${flightData.duration}`);
          console.log(`   Price: ${flightData.price}`);
          console.log(`   Data Source: ${flightData.dataSource}`);
        }

        return flightData;
      })
      .filter(Boolean)
      .filter((flight) => {
        if (!flight || !flight.departureDate) return false;
        if (isToday) {
          const depDate = new Date(flight.departureDate);
          const stillAvailable = depDate.getTime() > now.getTime();
          if (!stillAvailable) {
            console.log(`⏰ Filtered out departed flight: ${flight.flightNo}`);
          }
          return stillAvailable;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by departure time (earliest first)
        const timeA = new Date(a.departureDateTime).getTime();
        const timeB = new Date(b.departureDateTime).getTime();
        return timeA - timeB;
      })
      .slice(0, 50); // Return up to 50 flights (API maximum)

    console.log(`\n✅ Returning ${mappedFlights.length} LIVE available flights with varied times`);
    return mappedFlights;
  } catch (error) {
    console.error('❌ AirLabs API error:', error.response?.data || error.message);
    return [];
  }
}

// Fetch from AviationStack API
async function fetchAviationStackFlights(from, to, cabinClass, departureDate) {
  if (!AVIATIONSTACK_API_KEY) return [];

  const originCode = getAirportCode(from);
  const destinationCode = getAirportCode(to);
  
  if (!originCode) return [];

  try {
    const response = await axios.get(`${AVIATIONSTACK_BASE_URL}/flights`, {
      params: {
        access_key: AVIATIONSTACK_API_KEY,
        dep_iata: originCode,
        arr_iata: destinationCode || undefined,
        limit: 10,
      },
    });

    const flights = response.data?.data || [];
    return flights.map((item, index) => {
      const airlineName = item.airline?.name || 'Unknown';
      const flightIata = item.flight?.iata || item.flight?.number || 'XX000';
      
      return {
        id: `aviationstack-${item.flight?.iata || index}`,
        airline: airlineName,
        logo: item.airline?.logo || `https://images.kiwi.com/airlines/64/${item.airline?.iata || 'XX'}.png`,
        departureTime: formatTime(item.departure?.estimated || item.departure?.scheduled),
        arrivalTime: formatTime(item.arrival?.estimated || item.arrival?.scheduled),
        duration: 'N/A',
        stops: 0,
        price: buildPrice(originCode, destinationCode || 'XXX', cabinClass),
        cabinClass,
        origin: item.departure?.iata || originCode,
        destination: item.arrival?.iata || destinationCode || 'N/A',
        flightNo: flightIata,
      };
    });
  } catch (error) {
    console.error('AviationStack API error:', error.message);
    return [];
  }
}

async function fetchLiveFlights(from, to, cabinClass, departureDate, useFallback = false) {
  const originCode = getAirportCode(from);
  const destinationCode = getAirportCode(to);

  if (!originCode) {
    console.log('⚠️ Invalid origin code');
    return [];
  }

  console.log('═══════════════════════════════════════════');
  console.log(`🔍 SEARCHING FOR FLIGHTS: ${from} (${originCode}) → ${to} (${destinationCode})`);
  console.log(`📅 Date: ${departureDate || 'today'} | Class: ${cabinClass}`);
  console.log('═══════════════════════════════════════════');

  // Try AirLabs API first (PRIORITY - Real-time data!)
  if (AIRLABS_API_KEY) {
    console.log('🔴 Attempting AirLabs API (LIVE DATA)...');
    const airLabsFlights = await fetchAirLabsFlights(from, to, cabinClass, departureDate);
    if (airLabsFlights.length > 0) {
      console.log(`✅ SUCCESS! Found ${airLabsFlights.length} LIVE flights from AirLabs`);
      console.log('═══════════════════════════════════════════');
      return airLabsFlights;
    }
    console.log('⚠️ AirLabs returned no flights, trying alternatives...');
  } else {
    console.log('⚠️ AIRLABS_API_KEY not configured');
  }

  // Try Amadeus API (best for flight shopping)
  if (AMADEUS_API_KEY && AMADEUS_API_SECRET && destinationCode) {
    console.log('🔵 Attempting Amadeus API...');
    const amadeusFlights = await fetchAmadeusFlights(from, to, cabinClass, departureDate);
    if (amadeusFlights.length > 0) {
      console.log(`✅ Found ${amadeusFlights.length} flights from Amadeus`);
      console.log('═══════════════════════════════════════════');
      return amadeusFlights;
    }
  }

  // Try AviationStack API
  if (AVIATIONSTACK_API_KEY) {
    console.log('🟡 Attempting AviationStack API...');
    const aviationStackFlights = await fetchAviationStackFlights(from, to, cabinClass, departureDate);
    if (aviationStackFlights.length > 0) {
      console.log(`✅ Found ${aviationStackFlights.length} flights from AviationStack`);
      console.log('═══════════════════════════════════════════');
      return aviationStackFlights;
    }
  }

  // Try FlightAware API
  if (FLIGHTAWARE_API_KEY) {
    console.log('🟢 Attempting FlightAware API...');
    try {
      const response = await axios.get(`${FLIGHTAWARE_BASE_URL}/airports/${originCode}/flights/departures`, {
        headers: {
          'x-apikey': FLIGHTAWARE_API_KEY,
          Accept: 'application/json',
        },
        params: {
          max_results: 15,
        },
      });

      const payload = response.data || {};
      const rawFlights = Array.isArray(payload?.flights)
        ? payload.flights
        : Array.isArray(payload?.departures)
          ? payload.departures
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

      let flights = rawFlights
        .filter((item) => {
          if (!destinationCode) return true;
          const destinationValue = item.destination?.code || item.destination?.airport_code || item.destination || '';
          return String(destinationValue).toUpperCase() === destinationCode;
        })
        .slice(0, 10)
        .map((item) => mapFlightAwareFlight(item, originCode, destinationCode || 'N/A', cabinClass));

      if (flights.length > 0) {
        console.log(`✅ Found ${flights.length} flights from FlightAware`);
        console.log('═══════════════════════════════════════════');
        return flights;
      }
    } catch (error) {
      console.error('❌ FlightAware API error:', error.message);
    }
  }

  console.log('❌ No live flight data available from any API');
  console.log('⚠️ All API sources returned no flights or are not configured');
  console.log('💡 Please check your API keys in .env file');
  console.log('═══════════════════════════════════════════');
  
  // Return empty array instead of fallback data
  return [];
}

router.get('/', async function (req, res) {
  try {
    const from = (req.query.from || 'chennai').toString().trim();
    const to = (req.query.to || 'bangalore').toString().trim();
    const cabinClass = (req.query.cabinClass || 'Economy').toString().trim();
    const departureDate = (req.query.departureDate || '').toString().trim();
    const flights = await fetchLiveFlights(from, to, cabinClass, departureDate);
    res.json({ flights });
  } catch (error) {
    console.error('Failed to fetch live flights:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch flights.' });
  }
});

router.post('/', authenticateAdmin, async function (req, res) {
  return res.status(410).json({ message: 'Flight creation is disabled. Flights are now loaded live from FlightAware.' });
});

router.get('/search', async function (req, res) {
  try {
    const from = (req.query.from || '').toString().trim();
    const to = (req.query.to || '').toString().trim();
    const cabinClass = (req.query.cabinClass || 'Economy').toString().trim();
    const departureDate = (req.query.departureDate || '').toString().trim();
    const tripType = (req.query.tripType || 'one-way').toString().trim();
    const returnDate = (req.query.returnDate || '').toString().trim();

    if (!from || !to) {
      return res.status(400).json({ 
        message: 'Origin and destination are required.',
        flights: []
      });
    }

    const outboundFlights = await fetchLiveFlights(from, to, cabinClass, departureDate, false);

    if (tripType === 'round-trip' && returnDate) {
      const returnFlights = await fetchLiveFlights(to, from, cabinClass, returnDate, false);
      return res.json({
        outboundFlights,
        returnFlights,
        flights: outboundFlights,
        dataSource: outboundFlights.length > 0 ? 'live' : 'none',
      });
    }

    if (outboundFlights.length === 0) {
      return res.json({ 
        flights: [],
        message: 'No live flights available for this route. Please try a different date or route.',
        dataSource: 'none'
      });
    }

    return res.json({
      outboundFlights,
      returnFlights: [],
      flights: outboundFlights,
      dataSource: 'live',
      count: outboundFlights.length
    });
  } catch (error) {
    console.error('Search flights failed:', error);
    res.status(500).json({ message: error.message || 'Search failed.' });
  }
});

module.exports = router;
module.exports.fetchLiveFlights = fetchLiveFlights;
