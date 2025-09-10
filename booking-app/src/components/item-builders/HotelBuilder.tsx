'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Hotel, 
  Calendar, 
  Clock, 
  Loader2, 
  Search,
  Star,
  MapPin,
  Wifi,
  Car,
  Coffee
} from 'lucide-react';
import { hotelService } from '@/services/hotel-api';
import { 
  EnhancedHotelDetails
} from '@/types/booking';
import { formatCurrency } from '@/lib/utils';

interface HotelBuilderProps {
  onSubmit: (hotelData: {
    type: string;
    name: string;
    startDate: string;
    endDate: string;
    price: number;
    quantity: number;
    details: EnhancedHotelDetails;
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

export function HotelBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: HotelBuilderProps) {
  const [searchResults, setSearchResults] = useState<EnhancedHotelDetails[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<EnhancedHotelDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    destination: '',
    checkInDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    checkOutDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    adults: 2,
    children: 0,
    childrenAges: [] as number[],
    roomType: '',
    mealPlan: 'room-only',
    hotelRating: 3,
    priceRange: {
      min: 0,
      max: 1000,
    },
  });

  const [nights, setNights] = useState(0);
  const mealPlans = hotelService.getMealPlans();

  // Calculate nights when dates change
  useEffect(() => {
    if (formData.checkInDate && formData.checkOutDate) {
      const calculatedNights = hotelService.calculateNights(
        formData.checkInDate,
        formData.checkOutDate
      );
      setNights(calculatedNights);
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await hotelService.searchHotels({
        type: 'hotel',
        destination: formData.destination,
        departureDate: formData.checkInDate,
        returnDate: formData.checkOutDate,
        filters: {
          hotelRating: formData.hotelRating,
          priceRange: formData.priceRange,
        },
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Hotel search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectHotel = (hotel: EnhancedHotelDetails) => {
    setSelectedHotel(hotel);
  };

  const handleConfirmBooking = () => {
    if (!selectedHotel) return;

    const hotelData = {
      type: 'hotel',
      name: selectedHotel.hotelName,
      startDate: `${formData.checkInDate}T${formData.checkInTime}`,
      endDate: `${formData.checkOutDate}T${formData.checkOutTime}`,
      price: selectedHotel.totalPrice,
      quantity: 1,
      details: {
        ...selectedHotel,
        checkIn: {
          date: formData.checkInDate,
          time: formData.checkInTime,
        },
        checkOut: {
          date: formData.checkOutDate,
          time: formData.checkOutTime,
        },
        guests: {
          adults: formData.adults,
          children: formData.children,
          childrenAges: formData.childrenAges,
        },
      },
    };

    onSubmit(hotelData);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'Free WiFi': <Wifi className="w-4 h-4" />,
      'Parking': <Car className="w-4 h-4" />,
      'Breakfast': <Coffee className="w-4 h-4" />,
    };
    return iconMap[amenity] || null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <Hotel className="w-5 h-5 text-blue-600" />
            <span>Book Hotel</span>
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Destination */}
          <div>
            <Label htmlFor="destination">Destination</Label>
            <div className="relative">
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="City or Hotel Name"
                className="pl-8"
              />
              <MapPin className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
            </div>
          </div>

          {/* Check-in/out Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <div className="relative">
                <Input
                  id="checkInDate"
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                  className="pl-8"
                />
                <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <div className="relative">
                <Input
                  id="checkOutDate"
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                  min={formData.checkInDate}
                  className="pl-8"
                />
                <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Check-in/out Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <div className="relative">
                <Input
                  id="checkInTime"
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                  className="pl-8"
                />
                <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="checkOutTime">Check-out Time</Label>
              <div className="relative">
                <Input
                  id="checkOutTime"
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                  className="pl-8"
                />
                <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          {nights > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              {nights} night{nights > 1 ? 's' : ''} stay
            </div>
          )}

          {/* Guests */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={formData.adults}
                onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="10"
                value={formData.children}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setFormData(prev => ({ 
                    ...prev, 
                    children: count,
                    childrenAges: Array(count).fill(0)
                  }));
                }}
              />
            </div>

            <div>
              <Label htmlFor="mealPlan">Meal Plan</Label>
              <Select
                value={formData.mealPlan}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, mealPlan: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealPlans.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hotel Preferences */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rating">Minimum Rating</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="rating"
                  type="range"
                  min="1"
                  max="5"
                  value={formData.hotelRating}
                  onChange={(e) => setFormData(prev => ({ ...prev, hotelRating: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1">
                  {renderStars(formData.hotelRating)}
                </div>
              </div>
            </div>

            <div>
              <Label>Price Range</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.priceRange.min}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    priceRange: { ...prev.priceRange, min: parseInt(e.target.value) }
                  }))}
                  placeholder="Min"
                  className="w-24"
                />
                <span>-</span>
                <Input
                  type="number"
                  min="0"
                  value={formData.priceRange.max}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    priceRange: { ...prev.priceRange, max: parseInt(e.target.value) }
                  }))}
                  placeholder="Max"
                  className="w-24"
                />
                <span className="text-sm text-gray-500">per night</span>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full" 
            disabled={isSearching || !formData.destination || !formData.checkInDate || !formData.checkOutDate}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching Hotels...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Hotels
              </>
            )}
          </Button>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Available Hotels</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((hotel, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectHotel(hotel)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedHotel === hotel
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-semibold">{hotel.hotelName}</h5>
                          <div className="flex">{renderStars(hotel.hotelRating)}</div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {hotel.location.city}, {hotel.location.country}
                        </p>
                        
                        <p className="text-sm font-medium mb-1">{hotel.roomType}</p>
                        
                        {hotel.amenities && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {hotel.amenities.slice(0, 4).map((amenity, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center space-x-1">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </span>
                            ))}
                            {hotel.amenities.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{hotel.amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">{hotel.cancellationPolicy}</p>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(hotel.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {nights} night{nights > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(hotel.totalPrice / nights)}/night
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Hotel Summary */}
          {selectedHotel && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Selected Hotel</h4>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{selectedHotel.hotelName}</p>
                <p>{selectedHotel.roomType} • {nights} night{nights > 1 ? 's' : ''}</p>
                <p className="font-semibold text-green-700">
                  Total: {formatCurrency(selectedHotel.totalPrice)}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking} 
              disabled={!selectedHotel}
            >
              Add Hotel to Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}