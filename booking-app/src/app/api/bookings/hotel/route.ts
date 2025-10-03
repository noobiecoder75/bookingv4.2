import { NextRequest, NextResponse } from 'next/server';
import { getHotelBedsHeaders, getHotelBedsBaseUrl } from '@/lib/hotelbeds/auth';

/**
 * HotelBeds Booking API Endpoint
 * Creates a hotel booking using HotelBeds Test API
 */
export async function POST(request: NextRequest) {
  try {
    const bookingRequest = await request.json();

    console.log('🏨 [HotelBeds Booking] Request received:', {
      quoteItemId: bookingRequest.quoteItemId,
      hotelCode: bookingRequest.hotelCode,
    });

    // Validate required fields
    if (!bookingRequest.hotelCode || !bookingRequest.rateKey || !bookingRequest.holder) {
      return NextResponse.json(
        { error: 'Missing required fields: hotelCode, rateKey, holder' },
        { status: 400 }
      );
    }

    // Prepare HotelBeds booking payload
    const hotelBedsPayload = {
      booking: {
        rateKey: bookingRequest.rateKey,
        holder: {
          name: bookingRequest.holder.firstName,
          surname: bookingRequest.holder.lastName,
        },
        rooms: bookingRequest.rooms || [
          {
            paxes: bookingRequest.paxes || [
              {
                roomId: 1,
                type: 'AD',
                name: bookingRequest.holder.firstName,
                surname: bookingRequest.holder.lastName,
              },
            ],
          },
        ],
        clientReference: bookingRequest.clientReference || `BKG-${Date.now()}`,
        remark: bookingRequest.remark || 'Booking via BookingGPT',
        tolerance: 2.00, // Price tolerance (optional)
      },
    };

    console.log('📤 [HotelBeds Booking] Sending to HotelBeds Test API...');

    // Call HotelBeds Booking API
    const baseUrl = getHotelBedsBaseUrl(false); // Use test environment
    const headers = getHotelBedsHeaders();

    const response = await fetch(`${baseUrl}/hotel-api/1.0/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(hotelBedsPayload),
    });

    const responseData = await response.json();

    console.log('📥 [HotelBeds Booking] Response status:', response.status);

    if (!response.ok) {
      console.error('❌ [HotelBeds Booking] Error:', responseData);

      return NextResponse.json(
        {
          success: false,
          error: 'HotelBeds booking failed',
          details: responseData.error || responseData,
          fallbackToManualTask: true, // Signal to create manual task
        },
        { status: response.status }
      );
    }

    // Extract booking details from response
    const booking = responseData.booking;

    console.log('✅ [HotelBeds Booking] Booking successful:', {
      reference: booking?.reference,
      status: booking?.status,
    });

    // Return standardized booking confirmation
    return NextResponse.json({
      success: true,
      bookingConfirmation: {
        bookingId: booking.reference,
        confirmationNumber: booking.reference,
        status: booking.status,
        hotelCode: booking.hotel?.code,
        hotelName: booking.hotel?.name,
        checkIn: booking.hotel?.checkIn,
        checkOut: booking.hotel?.checkOut,
        totalNet: booking.totalNet,
        totalAmount: booking.totalNet,
        currency: booking.currency,
        cancellationPolicies: booking.hotel?.rooms?.[0]?.rates?.[0]?.cancellationPolicies || [],
        createdAt: new Date().toISOString(),
        provider: 'hotelbeds',
        rawResponse: booking, // Store full response for reference
      },
    });
  } catch (error: any) {
    console.error('❌ [HotelBeds Booking] Exception:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        fallbackToManualTask: true,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve booking details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingReference = searchParams.get('reference');

    if (!bookingReference) {
      return NextResponse.json(
        { error: 'Missing booking reference' },
        { status: 400 }
      );
    }

    console.log('🔍 [HotelBeds Booking] Retrieving booking:', bookingReference);

    const baseUrl = getHotelBedsBaseUrl(false);
    const headers = getHotelBedsHeaders();

    const response = await fetch(`${baseUrl}/hotel-api/1.0/bookings/${bookingReference}`, {
      method: 'GET',
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [HotelBeds Booking] Retrieval error:', responseData);
      return NextResponse.json(
        { error: 'Booking not found', details: responseData },
        { status: response.status }
      );
    }

    const booking = responseData.booking;

    return NextResponse.json({
      success: true,
      booking: {
        bookingId: booking.reference,
        status: booking.status,
        hotelName: booking.hotel?.name,
        checkIn: booking.hotel?.checkIn,
        checkOut: booking.hotel?.checkOut,
        totalNet: booking.totalNet,
        currency: booking.currency,
        rawResponse: booking,
      },
    });
  } catch (error: any) {
    console.error('❌ [HotelBeds Booking] Retrieval exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to cancel a booking
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingReference = searchParams.get('reference');

    if (!bookingReference) {
      return NextResponse.json(
        { error: 'Missing booking reference' },
        { status: 400 }
      );
    }

    console.log('🗑️ [HotelBeds Booking] Cancelling booking:', bookingReference);

    const baseUrl = getHotelBedsBaseUrl(false);
    const headers = getHotelBedsHeaders();

    const response = await fetch(`${baseUrl}/hotel-api/1.0/bookings/${bookingReference}?cancellationFlag=CANCELLATION`, {
      method: 'DELETE',
      headers,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [HotelBeds Booking] Cancellation error:', responseData);
      return NextResponse.json(
        { error: 'Cancellation failed', details: responseData },
        { status: response.status }
      );
    }

    console.log('✅ [HotelBeds Booking] Booking cancelled');

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancellation: responseData,
    });
  } catch (error: any) {
    console.error('❌ [HotelBeds Booking] Cancellation exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
