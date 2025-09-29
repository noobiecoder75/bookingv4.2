import { formatItemDetails } from '../travel-item-formatter';
import { TravelItem } from '@/types';

describe('formatItemDetails', () => {
  it('should format flight details correctly', () => {
    const flightItem: TravelItem = {
      id: '1',
      type: 'flight',
      name: 'Paris → Madrid',
      startDate: '2025-12-15',
      price: 850,
      quantity: 1,
      details: {
        departureTime: '2025-12-15T09:00:00Z',
        arrivalTime: '2025-12-15T10:30:00Z',
        flightNumber: 'IB1234',
        airline: 'Iberia',
        class: 'Economy'
      }
    };

    const result = formatItemDetails(flightItem);
    expect(result).toContain('Departure:');
    expect(result).toContain('Arrival:');
    expect(result).toContain('Flight: IB1234');
    expect(result).toContain('Iberia');
    expect(result).toContain('Class: Economy');
  });

  it('should format hotel details correctly', () => {
    const hotelItem: TravelItem = {
      id: '2',
      type: 'hotel',
      name: 'Sercotel AB Rivas',
      startDate: '2025-12-15',
      endDate: '2025-12-18',
      price: 821.65,
      quantity: 1,
      details: {
        checkIn: '2025-12-15',
        checkOut: '2025-12-18',
        roomType: 'Deluxe Room',
        guests: 2,
        amenities: ['wifi', 'breakfast', 'parking']
      }
    };

    const result = formatItemDetails(hotelItem);
    expect(result).toContain('Check-in:');
    expect(result).toContain('Check-out:');
    expect(result).toContain('3 nights');
    expect(result).toContain('Room: Deluxe Room');
    expect(result).toContain('2 guests');
    expect(result).toContain('Includes:');
  });

  it('should handle empty or invalid details gracefully', () => {
    const itemWithEmptyDetails: TravelItem = {
      id: '3',
      type: 'activity',
      name: 'City Tour',
      startDate: '2025-12-16',
      price: 75,
      quantity: 1,
      details: {}
    };

    const result = formatItemDetails(itemWithEmptyDetails);
    expect(result).toBe('');
  });

  it('should handle null details gracefully', () => {
    const itemWithNullDetails: TravelItem = {
      id: '4',
      type: 'transfer',
      name: 'Airport Transfer',
      startDate: '2025-12-15',
      price: 45,
      quantity: 1,
      details: null as any
    };

    const result = formatItemDetails(itemWithNullDetails);
    expect(result).toBe('');
  });

  it('should format generic details for unknown types', () => {
    const unknownTypeItem: TravelItem = {
      id: '5',
      type: 'unknown' as any,
      name: 'Mystery Service',
      startDate: '2025-12-16',
      price: 100,
      quantity: 1,
      details: {
        description: 'Special service with custom requirements'
      }
    };

    const result = formatItemDetails(unknownTypeItem);
    expect(result).toBe('Special service with custom requirements');
  });

  it('should format activity details correctly', () => {
    const activityItem: TravelItem = {
      id: '6',
      type: 'activity',
      name: 'Flamenco Show',
      startDate: '2025-12-16',
      price: 65,
      quantity: 1,
      details: {
        duration: '2 hours',
        time: '20:00',
        location: 'Madrid Center',
        includes: ['dinner', 'drinks']
      }
    };

    const result = formatItemDetails(activityItem);
    expect(result).toContain('Duration: 2 hours');
    expect(result).toContain('Time:');
    expect(result).toContain('Location: Madrid Center');
    expect(result).toContain('Includes: dinner, drinks');
  });

  it('should format transfer details correctly', () => {
    const transferItem: TravelItem = {
      id: '7',
      type: 'transfer',
      name: 'Hotel to Airport',
      startDate: '2025-12-18',
      price: 35,
      quantity: 1,
      details: {
        pickupLocation: 'Sercotel AB Rivas Hotel',
        dropoffLocation: 'Madrid-Barajas Airport',
        pickupTime: '08:00',
        vehicleType: 'Private Car',
        passengers: 2
      }
    };

    const result = formatItemDetails(transferItem);
    expect(result).toContain('Pickup: Sercotel AB Rivas Hotel');
    expect(result).toContain('Dropoff: Madrid-Barajas Airport');
    expect(result).toContain('Time:');
    expect(result).toContain('Vehicle: Private Car');
    expect(result).toContain('2 passengers');
  });
});