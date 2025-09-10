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
  Plane, 
  Calendar, 
  Clock, 
  Loader2, 
  Search,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { flightService } from '@/services/flight-api';
import { 
  FlightType, 
  EnhancedFlightDetails, 
  BookingClass
} from '@/types/booking';
import { formatCurrency } from '@/lib/utils';

interface FlightBuilderProps {
  onSubmit: (flightData: {
    type: string;
    name: string;
    startDate: string;
    endDate?: string;
    price: number;
    quantity: number;
    details: EnhancedFlightDetails & { origin: string; destination: string };
  }) => void;
  onCancel: () => void;
  tripStartDate?: Date;
  tripEndDate?: Date;
}

export function FlightBuilder({ onSubmit, onCancel, tripStartDate, tripEndDate }: FlightBuilderProps) {
  const [flightType, setFlightType] = useState<FlightType>('return');
  const [searchResults, setSearchResults] = useState<EnhancedFlightDetails[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<EnhancedFlightDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    returnDate: tripEndDate ? tripEndDate.toISOString().split('T')[0] : '',
    departureTime: '',
    returnTime: '',
    adults: 1,
    children: 0,
    infants: 0,
    bookingClass: 'economy' as BookingClass,
  });

  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // Search airports as user types
  useEffect(() => {
    if (originSearch.length > 2) {
      flightService.getAirports(originSearch).then(() => {
        // Airport suggestions would be shown here
      });
    }
  }, [originSearch]);

  useEffect(() => {
    if (destSearch.length > 2) {
      flightService.getAirports(destSearch).then(() => {
        // Airport suggestions would be shown here
      });
    }
  }, [destSearch]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await flightService.searchFlights({
        type: 'flight',
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        returnDate: flightType === 'return' ? formData.returnDate : undefined,
        passengers: {
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants,
        },
      });

      if (response.success && response.data) {
        setSearchResults(response.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Flight search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFlight = (flight: EnhancedFlightDetails) => {
    setSelectedFlight(flight);
  };

  const handleConfirmBooking = () => {
    if (!selectedFlight) return;

    const flightData = {
      type: 'flight',
      name: flightType === 'return' 
        ? `${formData.origin} ⇄ ${formData.destination}`
        : `${formData.origin} → ${formData.destination}`,
      startDate: formData.departureDate,
      endDate: flightType === 'return' ? formData.returnDate : formData.departureDate,
      price: selectedFlight.totalPrice,
      quantity: 1,
      details: {
        ...selectedFlight,
        origin: formData.origin,
        destination: formData.destination,
      },
    };

    onSubmit(flightData);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <h3 className="text-xl font-semibold flex items-center space-x-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <span>Book Flight</span>
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Flight Type Selection */}
          <div className="flex space-x-4">
            {(['one-way', 'return', 'multi-city'] as FlightType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFlightType(type)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  flightType === type
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {type === 'one-way' && <ArrowRight className="w-4 h-4" />}
                {type === 'return' && <ArrowLeftRight className="w-4 h-4" />}
                {type === 'multi-city' && <Plane className="w-4 h-4" />}
                <span className="capitalize">{type.replace('-', ' ')}</span>
              </button>
            ))}
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">From</Label>
              <div className="relative">
                <Input
                  id="origin"
                  value={originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    setFormData(prev => ({ ...prev, origin: e.target.value }));
                  }}
                  placeholder="City or Airport"
                  className="pl-8"
                />
                <Plane className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <Label htmlFor="destination">To</Label>
              <div className="relative">
                <Input
                  id="destination"
                  value={destSearch}
                  onChange={(e) => {
                    setDestSearch(e.target.value);
                    setFormData(prev => ({ ...prev, destination: e.target.value }));
                  }}
                  placeholder="City or Airport"
                  className="pl-8"
                />
                <Plane className="w-4 h-4 absolute left-2 top-3 text-gray-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departureDate">Departure Date</Label>
              <div className="relative">
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="pl-8"
                />
                <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            {flightType === 'return' && (
              <div>
                <Label htmlFor="returnDate">Return Date</Label>
                <div className="relative">
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                    min={formData.departureDate}
                    className="pl-8"
                  />
                  <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departureTime">Preferred Departure Time</Label>
              <div className="relative">
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                  className="pl-8"
                />
                <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
              </div>
            </div>

            {flightType === 'return' && (
              <div>
                <Label htmlFor="returnTime">Preferred Return Time</Label>
                <div className="relative">
                  <Input
                    id="returnTime"
                    type="time"
                    value={formData.returnTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnTime: e.target.value }))}
                    className="pl-8"
                  />
                  <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="9"
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
                max="9"
                value={formData.children}
                onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="infants">Infants</Label>
              <Input
                id="infants"
                type="number"
                min="0"
                max="9"
                value={formData.infants}
                onChange={(e) => setFormData(prev => ({ ...prev, infants: parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="class">Class</Label>
              <Select
                value={formData.bookingClass}
                onValueChange={(value: BookingClass) => 
                  setFormData(prev => ({ ...prev, bookingClass: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium-economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full" 
            disabled={isSearching || !formData.origin || !formData.destination || !formData.departureDate}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching Flights...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Flights
              </>
            )}
          </Button>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Available Flights</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {searchResults.map((flight, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectFlight(flight)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedFlight === flight
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        {flight.outboundFlight && (
                          <div className="flex items-center space-x-4">
                            <div className="text-sm">
                              <p className="font-medium">Outbound</p>
                              <p className="text-gray-600">
                                {flight.outboundFlight.airline} {flight.outboundFlight.flightNumber}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p>{new Date(flight.outboundFlight.departureTime).toLocaleTimeString()}</p>
                              <p className="text-gray-600">{flight.outboundFlight.departureAirportCode}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="text-sm">
                              <p>{new Date(flight.outboundFlight.arrivalTime).toLocaleTimeString()}</p>
                              <p className="text-gray-600">{flight.outboundFlight.arrivalAirportCode}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {flightService.formatFlightDuration(flight.outboundFlight.duration)}
                            </div>
                          </div>
                        )}
                        
                        {flight.returnFlight && (
                          <div className="flex items-center space-x-4">
                            <div className="text-sm">
                              <p className="font-medium">Return</p>
                              <p className="text-gray-600">
                                {flight.returnFlight.airline} {flight.returnFlight.flightNumber}
                              </p>
                            </div>
                            <div className="text-sm">
                              <p>{new Date(flight.returnFlight.departureTime).toLocaleTimeString()}</p>
                              <p className="text-gray-600">{flight.returnFlight.departureAirportCode}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div className="text-sm">
                              <p>{new Date(flight.returnFlight.arrivalTime).toLocaleTimeString()}</p>
                              <p className="text-gray-600">{flight.returnFlight.arrivalAirportCode}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {flightService.formatFlightDuration(flight.returnFlight.duration)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(flight.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {flight.passengers.adults} adult{flight.passengers.adults > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Flight Summary */}
          {selectedFlight && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Selected Flight</h4>
              <div className="space-y-1 text-sm">
                <p>{formData.origin} → {formData.destination}</p>
                <p className="font-semibold text-green-700">
                  Total: {formatCurrency(selectedFlight.totalPrice)}
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
              disabled={!selectedFlight}
            >
              Add Flight to Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}