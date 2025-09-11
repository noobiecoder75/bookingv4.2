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
  Hotel, 
  MapPin, 
  Car, 
  Calendar, 
  Clock, 
  DollarSign,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { TravelItem } from '@/types';
import { formatCurrency, getTravelItemColor } from '@/lib/utils';
import moment from 'moment';

interface EditItemModalProps {
  item: TravelItem;
  onSave: (updates: Partial<TravelItem>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EditItemModal({ item, onSave, onDelete, onCancel }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    name: item.name,
    startDate: moment(item.startDate).format('YYYY-MM-DD'),
    startTime: moment(item.startDate).format('HH:mm'),
    endDate: item.endDate ? moment(item.endDate).format('YYYY-MM-DD') : '',
    endTime: item.endDate ? moment(item.endDate).format('HH:mm') : '',
    price: item.price.toString(),
    quantity: item.quantity.toString(),
  });

  // Type-specific form fields
  const [flightDetails, setFlightDetails] = useState({
    departure_airport: item.details.departure_airport || '',
    arrival_airport: item.details.arrival_airport || '',
    airline: item.details.airline || '',
    flight_number: item.details.flight_number || '',
  });

  const [hotelDetails, setHotelDetails] = useState({
    hotel_name: item.details.hotel_name || '',
    location: item.details.location || '',
    room_type: item.details.room_type || '',
    nights: item.details.nights || 1,
  });

  const [activityDetails, setActivityDetails] = useState({
    location: item.details.location || '',
    duration: item.details.duration || 60,
    category: item.details.category || '',
    description: item.details.description || '',
  });

  const [transferDetails, setTransferDetails] = useState({
    from: item.details.from || '',
    to: item.details.to || '',
    vehicle_type: item.details.vehicle_type || '',
    duration: item.details.duration || 30,
  });

  const getItemIcon = () => {
    switch (item.type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'hotel': return <Hotel className="w-5 h-5" />;
      case 'activity': return <MapPin className="w-5 h-5" />;
      case 'transfer': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const handleSave = () => {
    // Combine date and time for proper datetime
    const startDateTime = moment(`${formData.startDate} ${formData.startTime}`).toISOString();
    const endDateTime = formData.endDate && formData.endTime 
      ? moment(`${formData.endDate} ${formData.endTime}`).toISOString()
      : undefined;

    // Prepare type-specific details
    let details = {};
    switch (item.type) {
      case 'flight':
        details = flightDetails;
        break;
      case 'hotel':
        details = hotelDetails;
        break;
      case 'activity':
        details = activityDetails;
        break;
      case 'transfer':
        details = transferDetails;
        break;
    }

    const updates: Partial<TravelItem> = {
      name: formData.name,
      startDate: startDateTime,
      endDate: endDateTime,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      details: { ...item.details, ...details },
    };

    onSave(updates);
  };

  const handleDelete = () => {
    if (confirm(`Delete ${item.name}?`)) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50/80 via-blue-50/80 to-purple-50/80 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-strong border-glass">
        <div className="sticky top-0 glass-white border-b border-glass p-6 z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <div style={{ color: getTravelItemColor(item.type) }}>
                {getItemIcon()}
              </div>
              <span>Edit {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="glass-card rounded-2xl p-6 shadow-medium border-glass space-y-4">
            <h4 className="font-semibold text-gray-900">Basic Information</h4>
            
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-8"
                  />
                  <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <div className="relative">
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="pl-8"
                  />
                  <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            {item.type === 'hotel' || formData.endDate ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="pl-8"
                    />
                    <Calendar className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="relative">
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="pl-8"
                    />
                    <Clock className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasEndDate"
                  checked={!!formData.endDate}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        endDate: prev.startDate,
                        endTime: prev.startTime,
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        endDate: '',
                        endTime: '',
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <Label htmlFor="hasEndDate">Add end date/time</Label>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="pl-8"
                  />
                  <DollarSign className="w-4 h-4 absolute left-2 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-4 glass-white rounded-xl border-glass">
              <p className="text-sm font-medium text-blue-700">
                Total: {formatCurrency(parseFloat(formData.price || '0') * parseInt(formData.quantity || '1'))}
              </p>
            </div>
          </div>

          {/* Type-specific Details */}
          <div className="glass-card rounded-2xl p-6 shadow-medium border-glass space-y-4">
            <h4 className="font-semibold text-gray-900">{item.type.charAt(0).toUpperCase() + item.type.slice(1)} Details</h4>

            {item.type === 'flight' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Departure Airport</Label>
                    <Input
                      value={flightDetails.departure_airport}
                      onChange={(e) => setFlightDetails(prev => ({ ...prev, departure_airport: e.target.value }))}
                      placeholder="e.g., JFK"
                    />
                  </div>
                  <div>
                    <Label>Arrival Airport</Label>
                    <Input
                      value={flightDetails.arrival_airport}
                      onChange={(e) => setFlightDetails(prev => ({ ...prev, arrival_airport: e.target.value }))}
                      placeholder="e.g., LAX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Airline</Label>
                    <Input
                      value={flightDetails.airline}
                      onChange={(e) => setFlightDetails(prev => ({ ...prev, airline: e.target.value }))}
                      placeholder="e.g., American Airlines"
                    />
                  </div>
                  <div>
                    <Label>Flight Number</Label>
                    <Input
                      value={flightDetails.flight_number}
                      onChange={(e) => setFlightDetails(prev => ({ ...prev, flight_number: e.target.value }))}
                      placeholder="e.g., AA123"
                    />
                  </div>
                </div>
              </div>
            )}

            {item.type === 'hotel' && (
              <div className="space-y-4">
                <div>
                  <Label>Hotel Name</Label>
                  <Input
                    value={hotelDetails.hotel_name}
                    onChange={(e) => setHotelDetails(prev => ({ ...prev, hotel_name: e.target.value }))}
                    placeholder="e.g., Marriott Downtown"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={hotelDetails.location}
                      onChange={(e) => setHotelDetails(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., New York, NY"
                    />
                  </div>
                  <div>
                    <Label>Room Type</Label>
                    <Select
                      value={hotelDetails.room_type}
                      onValueChange={(value) => setHotelDetails(prev => ({ ...prev, room_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">Standard Room</SelectItem>
                        <SelectItem value="Deluxe">Deluxe Room</SelectItem>
                        <SelectItem value="Suite">Suite</SelectItem>
                        <SelectItem value="Presidential">Presidential Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {item.type === 'activity' && (
              <div className="space-y-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={activityDetails.location}
                    onChange={(e) => setActivityDetails(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Central Park"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={activityDetails.category}
                      onValueChange={(value) => setActivityDetails(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sightseeing">Sightseeing</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="dining">Dining</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={activityDetails.duration}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setActivityDetails(prev => ({ ...prev, duration: isNaN(value) ? 0 : value }));
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={activityDetails.description}
                    onChange={(e) => setActivityDetails(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the activity"
                  />
                </div>
              </div>
            )}

            {item.type === 'transfer' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From</Label>
                    <Input
                      value={transferDetails.from}
                      onChange={(e) => setTransferDetails(prev => ({ ...prev, from: e.target.value }))}
                      placeholder="e.g., Airport"
                    />
                  </div>
                  <div>
                    <Label>To</Label>
                    <Input
                      value={transferDetails.to}
                      onChange={(e) => setTransferDetails(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="e.g., Hotel"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle Type</Label>
                    <Select
                      value={transferDetails.vehicle_type}
                      onValueChange={(value) => setTransferDetails(prev => ({ ...prev, vehicle_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="luxury">Luxury Car</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={transferDetails.duration}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setTransferDetails(prev => ({ ...prev, duration: isNaN(value) ? 0 : value }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="glass-card rounded-2xl p-6 shadow-medium border-glass">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-smooth"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </Button>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={onCancel} className="hover-lift transition-smooth">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 hover-lift transition-smooth">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}