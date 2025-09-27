import { NextRequest, NextResponse } from 'next/server';
import { HotelBedsClient } from '@/services/hotelbeds-client';
import { HotelBedsCredentials, SimplifiedHotel } from '@/types/hotelbeds';
import { randomUUID } from 'crypto';

// Mock hotel data for fallback
const mockHotels: SimplifiedHotel[] = [
  {
    id: '1',
    name: 'The Plaza Hotel',
    description: 'Luxury hotel in the heart of the city',
    location: 'New York, US',
    rating: 5,
    price: 500,
    currency: 'USD',
    imageUrl: 'https://via.placeholder.com/400x300?text=The+Plaza+Hotel',
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant'],
    coordinates: { latitude: 40.7644, longitude: -73.9744 },
    checkIn: '',
    checkOut: '',
    roomType: 'Deluxe King Room',
    availability: 'available',
  },
  {
    id: '2',
    name: 'Marriott Downtown',
    description: 'Modern business hotel with excellent amenities',
    location: 'Los Angeles, US',
    rating: 4,
    price: 325,
    currency: 'USD',
    imageUrl: 'https://via.placeholder.com/400x300?text=Marriott+Downtown',
    amenities: ['Free WiFi', 'Business Center', 'Gym', 'Parking'],
    coordinates: { latitude: 34.0522, longitude: -118.2437 },
    checkIn: '',
    checkOut: '',
    roomType: 'Executive Suite',
    availability: 'available',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = body;

    // Validate required parameters
    if (!destination || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters: destination, checkIn, checkOut' },
        { status: 400 }
      );
    }

    // Get HotelBeds credentials from environment variables
    const apiKey = process.env.HOTELBEDS_API_KEY;
    const secret = process.env.HOTELBEDS_SECRET;

    console.log('🔑 HotelBeds API credentials check:', {
      apiKey: apiKey ? `Present (${apiKey.substring(0, 8)}...)` : 'Missing',
      secret: secret ? `Present (${secret.substring(0, 4)}...)` : 'Missing',
      environment: 'test',
      baseUrl: 'https://api.test.hotelbeds.com'
    });

    // Try HotelBeds API if credentials are available
    if (apiKey && secret && apiKey !== 'your_hotelbeds_api_key_here' && secret !== 'your_hotelbeds_secret_here') {
      console.log('✅ HotelBeds credentials validated, attempting API call...');
      try {
        const hotelBedsClient = new HotelBedsClient({
          apiKey,
          secret,
        } as HotelBedsCredentials);

        console.log('🔍 Calling HotelBeds API with:', {
          destination,
          checkIn,
          checkOut,
          adults,
          children,
          rooms
        });

        const hotels = await hotelBedsClient.searchSimplifiedHotels(
          destination,
          checkIn,
          checkOut,
          rooms,
          adults,
          children
        );

        console.log(`✅ HotelBeds API returned ${hotels.length} hotels`);

        return NextResponse.json({
          success: true,
          data: hotels,
          source: 'hotelbeds',
          metadata: {
            totalResults: hotels.length,
            searchId: randomUUID(),
            timestamp: new Date().toISOString(),
          },
        });

      } catch (hotelBedsError) {
        const errorMessage = hotelBedsError instanceof Error ? hotelBedsError.message : 'Unknown error';
        const errorDetails = {
          error: hotelBedsError,
          message: errorMessage,
          stack: hotelBedsError instanceof Error ? hotelBedsError.stack : undefined,
          timestamp: new Date().toISOString(),
          requestParams: { destination, checkIn, checkOut, adults, children, rooms }
        };

        console.error('❌ HotelBeds API error:', errorDetails);

        // Return API error instead of silently falling back to mock data
        return NextResponse.json({
          success: false,
          error: `HotelBeds API Error: ${errorMessage}`,
          errorType: 'HOTELBEDS_API_ERROR',
          details: {
            message: errorMessage,
            suggestion: 'Check API credentials, destination code, or try again later'
          },
          source: 'hotelbeds-error'
        }, { status: 500 });
      }
    } else {
      console.log('⚠️ HotelBeds credentials invalid or missing');
      console.log('💡 Set HOTELBEDS_API_KEY and HOTELBEDS_SECRET in .env.local to use live data');

      // Return error instead of silently using mock data
      return NextResponse.json({
        success: false,
        error: 'HotelBeds API credentials not configured',
        errorType: 'MISSING_CREDENTIALS',
        details: {
          message: 'API credentials are missing or invalid',
          suggestion: 'Configure HOTELBEDS_API_KEY and HOTELBEDS_SECRET environment variables',
          foundCredentials: {
            apiKey: apiKey ? 'Present but invalid' : 'Missing',
            secret: secret ? 'Present but invalid' : 'Missing'
          }
        },
        source: 'configuration-error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Hotel search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        source: 'error'
      },
      { status: 500 }
    );
  }
}