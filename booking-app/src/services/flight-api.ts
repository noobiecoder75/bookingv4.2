import { flightAPI } from './api-client';
import {
  FlightType,
  EnhancedFlightDetails,
  APISearchRequest,
  APISearchResponse,
  FlightSegment,
  BookingClass,
} from '@/types/booking';

// Mock data for development
const mockFlights: EnhancedFlightDetails[] = [
  {
    flightType: 'return',
    outboundFlight: {
      flightNumber: 'BA123',
      airline: 'British Airways',
      airlineCode: 'BA',
      departureAirport: 'London Heathrow',
      departureAirportCode: 'LHR',
      departureTime: '2024-03-15T08:30:00',
      departureTerminal: '5',
      arrivalAirport: 'New York JFK',
      arrivalAirportCode: 'JFK',
      arrivalTime: '2024-03-15T11:45:00',
      arrivalTerminal: '7',
      duration: 495,
      bookingClass: 'economy',
      baggageAllowance: {
        cabin: '1x8kg',
        checked: '1x23kg',
      },
      mealService: true,
      aircraftType: 'Boeing 777-300ER',
    },
    returnFlight: {
      flightNumber: 'BA124',
      airline: 'British Airways',
      airlineCode: 'BA',
      departureAirport: 'New York JFK',
      departureAirportCode: 'JFK',
      departureTime: '2024-03-22T19:30:00',
      departureTerminal: '7',
      arrivalAirport: 'London Heathrow',
      arrivalAirportCode: 'LHR',
      arrivalTime: '2024-03-23T07:15:00',
      arrivalTerminal: '5',
      duration: 465,
      bookingClass: 'economy',
      baggageAllowance: {
        cabin: '1x8kg',
        checked: '1x23kg',
      },
      mealService: true,
      aircraftType: 'Boeing 777-300ER',
    },
    passengers: {
      adults: 2,
      children: 0,
      infants: 0,
    },
    totalPrice: 1250,
    priceBreakdown: {
      baseFare: 980,
      taxes: 220,
      fees: 50,
    },
  },
  {
    flightType: 'one-way',
    outboundFlight: {
      flightNumber: 'AA456',
      airline: 'American Airlines',
      airlineCode: 'AA',
      departureAirport: 'Los Angeles International',
      departureAirportCode: 'LAX',
      departureTime: '2024-03-15T10:00:00',
      departureTerminal: '4',
      arrivalAirport: 'Miami International',
      arrivalAirportCode: 'MIA',
      arrivalTime: '2024-03-15T18:30:00',
      arrivalTerminal: 'N',
      duration: 330,
      bookingClass: 'business',
      baggageAllowance: {
        cabin: '2x8kg',
        checked: '2x32kg',
      },
      mealService: true,
      aircraftType: 'Boeing 737 MAX 9',
    },
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    totalPrice: 850,
    priceBreakdown: {
      baseFare: 720,
      taxes: 100,
      fees: 30,
    },
  },
];

export class FlightService {
  async searchFlights(request: APISearchRequest): Promise<APISearchResponse<EnhancedFlightDetails>> {
    // In production, this would call the actual API
    // For now, return mock data with simulated delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Filter mock data based on request parameters
        let filteredFlights = [...mockFlights];

        // Apply price filter if provided
        if (request.filters?.priceRange) {
          filteredFlights = filteredFlights.filter(
            flight =>
              flight.totalPrice >= (request.filters?.priceRange?.min || 0) &&
              flight.totalPrice <= (request.filters?.priceRange?.max || Infinity)
          );
        }

        resolve({
          success: true,
          data: filteredFlights,
          metadata: {
            totalResults: filteredFlights.length,
            searchId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
        });
      }, 1000); // Simulate network delay
    });
  }

  async getFlightDetails(flightId: string): Promise<EnhancedFlightDetails | null> {
    // In production, this would fetch specific flight details
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockFlights[0]);
      }, 500);
    });
  }

  async bookFlight(
    _flightDetails: EnhancedFlightDetails,
    _passengerDetails: Array<{ name: string; email: string; dateOfBirth: string }>
  ): Promise<{ bookingReference: string; pnr: string }> {
    // In production, this would create an actual booking
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          bookingReference: `BK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          pnr: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        });
      }, 2000);
    });
  }

  async checkAvailability(
    flightNumber: string,
    date: string
  ): Promise<{ available: boolean; seats: number }> {
    // Check flight availability
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          available: true,
          seats: Math.floor(Math.random() * 50) + 1,
        });
      }, 500);
    });
  }

  async getSeatMap(
    flightNumber: string,
    bookingClass: BookingClass
  ): Promise<any> {
    // Get seat map for seat selection
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          rows: 30,
          seatsPerRow: 6,
          occupiedSeats: ['1A', '1B', '5C', '12D', '15E', '20F'],
          exitRows: [10, 20],
          premiumRows: [1, 2, 3],
        });
      }, 500);
    });
  }

  formatFlightDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  calculateLayoverTime(segments: FlightSegment[]): number {
    if (segments.length <= 1) return 0;
    
    let totalLayover = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      const arrival = new Date(segments[i].arrivalTime);
      const departure = new Date(segments[i + 1].departureTime);
      totalLayover += (departure.getTime() - arrival.getTime()) / (1000 * 60);
    }
    
    return totalLayover;
  }

  async getAirlines(): Promise<Array<{ code: string; name: string; logo?: string }>> {
    return [
      { code: 'BA', name: 'British Airways' },
      { code: 'AA', name: 'American Airlines' },
      { code: 'UA', name: 'United Airlines' },
      { code: 'DL', name: 'Delta Air Lines' },
      { code: 'LH', name: 'Lufthansa' },
      { code: 'AF', name: 'Air France' },
      { code: 'EK', name: 'Emirates' },
      { code: 'QR', name: 'Qatar Airways' },
    ];
  }

  async getAirports(query: string): Promise<Array<{ code: string; name: string; city: string; country: string }>> {
    const airports = [
      { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom' },
      { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States' },
      { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States' },
      { code: 'MIA', name: 'Miami International', city: 'Miami', country: 'United States' },
      { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
      { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
      { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
      { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
    ];

    const lowerQuery = query.toLowerCase();
    return airports.filter(
      airport =>
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery)
    );
  }
}

export const flightService = new FlightService();