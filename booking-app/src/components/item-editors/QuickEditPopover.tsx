'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit3,
  Check,
  X,
  Clock,
  DollarSign,
  Type
} from 'lucide-react';
import { TravelItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import moment from 'moment';

interface QuickEditPopoverProps {
  item: TravelItem;
  onSave: (updates: Partial<TravelItem>) => void;
  onCancel: () => void;
  onFullEdit: () => void;
  position: { x: number; y: number };
}

export function QuickEditPopover({ 
  item, 
  onSave, 
  onCancel, 
  onFullEdit, 
  position 
}: QuickEditPopoverProps) {
  const [editField, setEditField] = useState<'name' | 'time' | 'price' | null>(null);
  const [tempValues, setTempValues] = useState({
    name: item.name,
    startTime: moment(item.startDate).format('HH:mm'),
    endTime: item.endDate ? moment(item.endDate).format('HH:mm') : '',
    price: item.price.toString(),
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editField]);

  // Handle clicks outside popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleSaveField = () => {
    if (!editField) return;

    let updates: Partial<TravelItem> = {};

    switch (editField) {
      case 'name':
        updates.name = tempValues.name;
        break;
      case 'time':
        // Update time while keeping the same date
        const startDate = moment(item.startDate).format('YYYY-MM-DD');
        const endDate = item.endDate ? moment(item.endDate).format('YYYY-MM-DD') : startDate;
        
        updates.startDate = moment(`${startDate} ${tempValues.startTime}`).toISOString();
        if (tempValues.endTime) {
          updates.endDate = moment(`${endDate} ${tempValues.endTime}`).toISOString();
        }
        break;
      case 'price':
        updates.price = parseFloat(tempValues.price);
        break;
    }

    onSave(updates);
    setEditField(null);
  };

  const handleCancelEdit = () => {
    setTempValues({
      name: item.name,
      startTime: moment(item.startDate).format('HH:mm'),
      endTime: item.endDate ? moment(item.endDate).format('HH:mm') : '',
      price: item.price.toString(),
    });
    setEditField(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveField();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Calculate safe position within viewport
  const safePosition = {
    left: Math.max(10, Math.min(position.x - 140, window.innerWidth - 290)), // Center horizontally, keep in bounds
    top: Math.max(10, position.y - 200), // Position above the clicked element
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onCancel}
      />
      
      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px] z-50"
        style={{
          left: safePosition.left,
          top: safePosition.top,
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Quick Edit</h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Quick Edit Fields */}
      <div className="space-y-3">
        {/* Name */}
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-gray-400" />
          {editField === 'name' ? (
            <div className="flex-1 flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={tempValues.name}
                onChange={(e) => setTempValues(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={handleKeyPress}
                className="text-sm"
                placeholder="Item name"
              />
              <Button size="sm" onClick={handleSaveField}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded flex items-center justify-between"
              onClick={() => setEditField('name')}
            >
              <span className="text-sm truncate">{item.name}</span>
              <Edit3 className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          {editField === 'time' ? (
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Input
                  ref={inputRef}
                  type="time"
                  value={tempValues.startTime}
                  onChange={(e) => setTempValues(prev => ({ ...prev, startTime: e.target.value }))}
                  onKeyDown={handleKeyPress}
                  className="text-sm w-24"
                />
                {item.endDate && (
                  <>
                    <span className="text-xs text-gray-400">to</span>
                    <Input
                      type="time"
                      value={tempValues.endTime}
                      onChange={(e) => setTempValues(prev => ({ ...prev, endTime: e.target.value }))}
                      onKeyDown={handleKeyPress}
                      className="text-sm w-24"
                    />
                  </>
                )}
              </div>
              <Button size="sm" onClick={handleSaveField}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded flex items-center justify-between"
              onClick={() => setEditField('time')}
            >
              <span className="text-sm">
                {moment(item.startDate).format('HH:mm')}
                {item.endDate && ` - ${moment(item.endDate).format('HH:mm')}`}
              </span>
              <Edit3 className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          {editField === 'price' ? (
            <div className="flex-1 flex items-center space-x-2">
              <Input
                ref={inputRef}
                type="number"
                step="0.01"
                value={tempValues.price}
                onChange={(e) => setTempValues(prev => ({ ...prev, price: e.target.value }))}
                onKeyDown={handleKeyPress}
                className="text-sm"
                placeholder="0.00"
              />
              <Button size="sm" onClick={handleSaveField}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div 
              className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded flex items-center justify-between"
              onClick={() => setEditField('price')}
            >
              <span className="text-sm font-medium">
                {formatCurrency(item.price * item.quantity)}
              </span>
              <Edit3 className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 mt-4 pt-3 border-t">
        <Button size="sm" variant="outline" onClick={onFullEdit} className="flex-1">
          <Edit3 className="w-3 h-3 mr-1" />
          Full Edit
        </Button>
        <Button size="sm" onClick={onCancel} className="flex-1">
          Done
        </Button>
      </div>
      </div>
    </>
  );
}