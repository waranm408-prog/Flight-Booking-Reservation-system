var express = require('express');
var jwt = require('jsonwebtoken');
var axios = require('axios');
var router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'FBR_SECRET_KEY';
const FLIGHTAWARE_API_KEY = process.env.flightaware_api_key || process.env.FLIGHTAWARE_API_KEY;
const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

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
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function parseTimeToMinutes(value) {
  if (!value) return null;
  const text = value.toString().trim();
  if (!text) return null;

  const meridiemMatch = text.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();

    if (hours === 12) hours = 0;
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    if (minutes < 0 || minutes > 59 || hours < 0 || hours > 23) return null;
    return hours * 60 + minutes;
  }

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (minutes < 0 || minutes > 59 || hours < 0 || hours > 23) return null;
  return hours * 60 + minutes;
}

function buildPrice(originCode, destinationCode, cabinClass) {
  const base = (originCode.charCodeAt(0) + destinationCode.charCodeAt(0) + originCode.charCodeAt(1) + destinationCode.charCodeAt(1)) % 7000 + 8000;
  if (cabinClass === 'Business') return `₹${(base * 1.65).toFixed(0)}`;
  if (cabinClass === 'First') return `₹${(base * 2.25).toFixed(0)}`;
  return `₹${base}`;
}

function buildFallbackFlights(origin, destination, cabinClass, departureDate, departureTime) {
  const originCode = getAirportCode(origin) || 'MAA';
  const destinationCode = getAirportCode(destination) || 'BLR';
  const price = buildPrice(originCode, destinationCode, cabinClass);
  const baseDate = departureDate ? new Date(departureDate) : new Date();
  if (Number.isNaN(baseDate.getTime())) {
    baseDate.setTime(Date.now());
  }

  const selectedMinutes = parseTimeToMinutes(departureTime);

  const formatDateTime = (hours, minutes) => {
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const fallbackSchedules = [
    { hours: 8, minutes: 30 },
    { hours: 12, minutes: 15 },
    { hours: 18, minutes: 50 },
  ];

  if (selectedMinutes !== null) {
    fallbackSchedules.unshift({ hours: Math.floor(selectedMinutes / 60), minutes: selectedMinutes % 60 });
    fallbackSchedules.push({ hours: Math.min(23, Math.floor(selectedMinutes / 60) + 2), minutes: selectedMinutes % 60 });
  }

  const flights = fallbackSchedules.map((schedule, index) => {
    const departureDateTime = new Date(baseDate);
    departureDateTime.setHours(schedule.hours, schedule.minutes, 0, 0);

    const arrivalDateTime = new Date(departureDateTime);
    arrivalDateTime.setHours(arrivalDateTime.getHours() + 1, arrivalDateTime.getMinutes() + 40, 0, 0);

    return {
      id: `fallback-${index + 1}`,
      airline: index === 0 ? 'SkyJet' : index === 1 ? 'BlueAir' : 'AeroLink',
      logo: '',
      departureTime: departureDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: arrivalDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      duration: index === 0 ? '1h 40m' : index === 1 ? '1h 50m' : '1h 45m',
      stops: index === 1 ? 1 : 0,
      price: index === 0 ? price : index === 1 ? `₹${Number(price.replace(/[^0-9]/g, '')) + 1200}` : `₹${Number(price.replace(/[^0-9]/g, '')) + 1800}`,
      cabinClass,
      origin: originCode,
      destination: destinationCode,
      flightNo: index === 0 ? 'SJ-204' : index === 1 ? 'BA-318' : 'AL-412',
    };
  });

  if (selectedMinutes === null) {
    return flights;
  }

  return flights.filter((flight) => {
    const departureMinutes = parseTimeToMinutes(flight.departureTime);
    return departureMinutes !== null && selectedMinutes !== null && departureMinutes >= selectedMinutes;
  });
}

function mapFlightAwareFlight(item, originCode, destinationCode, cabinClass) {
  const airlineName = item.airline || item.airlineName || item.airline_name || item.operator || item.operatorName || 'FlightAware';
  const departure = item.scheduled_out || item.actual_departure || item.departureTime || item.departure_time || item.departure || '';
  const arrival = item.scheduled_in || item.actual_arrival || item.arrivalTime || item.arrival_time || item.arrival || '';

  return {
    id: item.ident || item.flightNumber || item.flight_number || item.faFlightID || `${originCode}-${destinationCode}-${Math.random().toString(36).slice(2, 8)}`,
    airline: airlineName,
    logo: '',
    departureTime: formatTime(departure),
    arrivalTime: formatTime(arrival),
    duration: item.duration || item.estimated_duration || item.flight_duration || 'N/A',
    stops: item.stops || 0,
    price: item.price || buildPrice(originCode, destinationCode, cabinClass),
    cabinClass: cabinClass || 'Economy',
    origin: item.origin?.code || item.origin?.airport_code || item.origin || originCode,
    destination: item.destination?.code || item.destination?.airport_code || item.destination || destinationCode,
    flightNo: item.ident || item.flightNumber || item.flight_number || item.faFlightID || 'LIVE',
  };
}

async function fetchLiveFlights(from, to, cabinClass, departureDate, departureTime, useFallback = true) {
  const originCode = getAirportCode(from);
  const destinationCode = getAirportCode(to);

  if (!originCode) {
    return useFallback ? buildFallbackFlights(from, to, cabinClass, departureDate, departureTime) : [];
  }

  if (!FLIGHTAWARE_API_KEY) {
    return useFallback ? buildFallbackFlights(from, to, cabinClass, departureDate, departureTime) : [];
  }

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

    if (departureTime) {
      const selectedMinutes = parseTimeToMinutes(departureTime);
      flights = flights.filter((flight) => {
        const flightMinutes = parseTimeToMinutes(flight.departureTime);
        return flightMinutes !== null && selectedMinutes !== null && flightMinutes >= selectedMinutes;
      });
    }

    return flights.length > 0 ? flights : (useFallback ? buildFallbackFlights(from, to, cabinClass, departureDate, departureTime) : []);
  } catch (error) {
    console.error('FlightAware request failed, using fallback flights:', error.message);
    return useFallback ? buildFallbackFlights(from, to, cabinClass, departureDate, departureTime) : [];
  }
}

router.get('/', async function (req, res) {
  try {
    const from = (req.query.from || 'chennai').toString().trim();
    const to = (req.query.to || 'bangalore').toString().trim();
    const cabinClass = (req.query.cabinClass || 'Economy').toString().trim();
    const departureDate = (req.query.departureDate || '').toString().trim();
    const departureTime = (req.query.departureTime || '').toString().trim();
    const flights = await fetchLiveFlights(from, to, cabinClass, departureDate, departureTime);
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
    const departureTime = (req.query.departureTime || '').toString().trim();
    const flights = await fetchLiveFlights(from, to, cabinClass, departureDate, departureTime);
    res.json({ flights });
  } catch (error) {
    console.error('Search flights failed:', error);
    res.status(500).json({ message: error.message || 'Search failed.' });
  }
});

module.exports = router;
module.exports.fetchLiveFlights = fetchLiveFlights;
