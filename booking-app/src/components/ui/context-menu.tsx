'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ x, y, isOpen, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    // Adjust position if menu would go off screen
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) });
  }, [x, y, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {children}
    </div>
  );

  return createPortal(menu, document.body);
}

interface ContextMenuItemProps {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContextMenuItem({ onClick, icon, children, className = '' }: ContextMenuItemProps) {
  return (
    <button
      className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center space-x-2 transition-colors ${className}`}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}