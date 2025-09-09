# BookingGPT v4.2

**Contact-Driven Travel Booking System with react-big-calendar Timeline**

[![Phase](https://img.shields.io/badge/Phase-1%20Development-blue)](./PHASE_1_DEV.md)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![react-big-calendar](https://img.shields.io/badge/react--big--calendar-Latest-green)](https://github.com/jquense/react-big-calendar)

## 🚀 Live Demo

```bash
npm run dev
# Open http://localhost:3000
```

### Demo Pages
- **Homepage** (`/`) - Project overview and navigation
- **Contacts** (`/contacts`) - Contact management system
- **Quote Wizard** (`/quote-wizard`) - Step-by-step travel quote builder
- **Timeline View** (`/timeline`) - react-big-calendar travel itinerary visualization

## ✨ Core Innovation: Contact-Driven Quote Builder

BookingGPT v4.2's breakthrough approach combines **contact relationship management** with **react-big-calendar timeline visualization** - transforming travel professional workflows into an integrated customer-centric experience.

### Key Features
- 👥 **Contact Management** - Complete customer relationship system
- 📅 **react-big-calendar Timeline** - Professional calendar interface for itinerary visualization
- 🎨 **Color-coded Travel Items** (flights, hotels, activities, transfers)
- 🖱️ **Drag & Drop Scheduling** using react-big-calendar's native capabilities
- 📱 **Mobile-first Design** with responsive calendar views
- ♿ **Full Accessibility** with keyboard navigation support
- ⚡ **Performance Optimized** for complex multi-day itineraries

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5, React 19, TypeScript
- **Calendar**: react-big-calendar with date-fns
- **Styling**: Tailwind CSS v3, shadcn/ui components
- **State Management**: Zustand
- **Data Storage**: localStorage (development), Supabase (future)
- **Performance**: Custom benchmarking system

### Contact-Quote-Timeline Flow
```
Contact Management → Quote Creation → Travel Items → Timeline Visualization
      ↓                    ↓              ↓               ↓
   ContactList         QuoteWizard    ItemManagement  CalendarView
```

### Project Structure
```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── contacts/          # Contact management components
│   ├── quote-wizard/      # Multi-step quote builder
│   ├── travel-items/      # Flight, hotel, activity components
│   ├── timeline/          # react-big-calendar integration
│   ├── performance/       # Performance testing utilities
│   └── ui/               # shadcn/ui components
├── store/                # Zustand state management
├── types/                # TypeScript interfaces
└── lib/                  # Utilities and local storage
```

## 🎯 Development Phases

### 🏗️ Phase 1: Contact & Calendar Integration (Current)
- [ ] Contact management system (CRUD operations)
- [ ] react-big-calendar timeline integration
- [ ] Quote-to-contact relationship system
- [ ] localStorage persistence layer
- [ ] Mobile-responsive design system

### 📋 Future Phases
- **Phase 2**: Enhanced Quote Wizard (Weeks 3-4)
- **Phase 3**: Advanced Timeline Features (Weeks 5-6)
- **Phase 4**: API Integration (Weeks 7-8)
- **Phase 5**: Supabase Migration (Weeks 9-10)
- **Phase 6**: Client Portal (Weeks 11-12)
- **Phase 7**: Payment & Booking (Weeks 13-15)

## 🎨 Component Usage Examples

### Contact Management
```tsx
import { ContactList } from '@/components/contacts/ContactList';
import { useContactStore } from '@/store/contact-store';

function ContactsPage() {
  const { contacts, addContact } = useContactStore();

  const handleAddContact = (contactData) => {
    addContact({
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone
    });
  };

  return <ContactList contacts={contacts} onAdd={handleAddContact} />;
}
```

### Quote Builder with Timeline
```tsx
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useQuoteStore } from '@/store/quote-store';

const localizer = momentLocalizer(moment);

function QuoteTimeline({ contactId }) {
  const { getQuotesByContact } = useQuoteStore();
  const quotes = getQuotesByContact(contactId);

  const events = quotes.flatMap(quote => 
    quote.items.map(item => ({
      id: item.id,
      title: item.name,
      start: new Date(item.startDate),
      end: new Date(item.endDate || item.startDate),
      resource: item.type // flight, hotel, activity
    }))
  );

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      views={['month', 'week', 'day', 'agenda']}
      defaultView="week"
    />
  );
}
```

### Travel Item Management
```tsx
import { useQuoteStore } from '@/store/quote-store';

function AddFlightForm({ quoteId }) {
  const { addItemToQuote } = useQuoteStore();

  const handleAddFlight = (flightData) => {
    addItemToQuote(quoteId, {
      type: 'flight',
      name: `${flightData.departureAirport} → ${flightData.arrivalAirport}`,
      startDate: flightData.departureDate,
      endDate: flightData.arrivalDate,
      price: flightData.price,
      details: {
        departure_airport: flightData.departureAirport,
        arrival_airport: flightData.arrivalAirport,
        airline: flightData.airline,
        flight_number: flightData.flightNumber
      }
    });
  };

  return (
    // Flight form JSX
  );
}
```

## 💾 Data Structure

### Contact-Centric Schema
```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  preferences?: TravelPreferences;
  quotes: string[]; // Quote IDs
  createdAt: Date;
}

interface TravelQuote {
  id: string;
  contactId: string;
  title: string;
  items: TravelItem[];
  totalCost: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  travelDates: { start: Date; end: Date };
  createdAt: Date;
}

interface TravelItem {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transfer';
  name: string;
  startDate: string;
  endDate?: string;
  price: number;
  quantity: number;
  details: Record<string, any>;
}
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Install react-big-calendar and date utilities
npm install react-big-calendar moment date-fns

# Start development server
npm run dev

# Run type checking
npm run type-check
```

### Environment Variables
```env
# Copy .env.local.example to .env.local
# localStorage is used for development - no external services required
```

## 🎪 Key Components

### Contact Store (Zustand)
- Contact CRUD operations
- Contact-quote relationship management
- Search and filtering capabilities
- localStorage persistence

### Quote Store (Zustand)
- Quote lifecycle management
- Travel item management
- Timeline data transformation
- Cost calculation and tracking

### react-big-calendar Integration
- Multiple view support (month, week, day, agenda)
- Event drag & drop capabilities
- Resource-based scheduling
- Custom event rendering for travel items

### Performance Monitoring
- Real-time render performance tracking
- Calendar interaction metrics
- Memory usage optimization
- Component re-render analysis

## 📊 Timeline Views

### Supported Calendar Views
- **Month View**: Overview of entire trip timeline
- **Week View**: Detailed daily scheduling
- **Day View**: Hour-by-hour itinerary
- **Agenda View**: List format for complex itineraries

### Travel Item Visualization
- **Flights**: Point-in-time events with airport codes
- **Hotels**: Multi-day spans with check-in/out
- **Activities**: Time-blocked experiences
- **Transfers**: Connection events between locations

## 🤝 Contributing

This project focuses on contact relationship management integrated with professional calendar functionality.

### Development Guidelines
- Follow existing TypeScript patterns
- Maintain react-big-calendar compatibility
- Test contact-quote relationships thoroughly
- Ensure mobile calendar usability
- Validate performance on large datasets

## 📄 License

MIT License - see LICENSE file for details

## 🎉 Success Metrics

**Phase 1 Goals:**
- ✅ Contact management system implementation
- ✅ react-big-calendar timeline integration
- ✅ Quote-contact relationship establishment
- ✅ localStorage persistence layer
- ✅ Mobile-responsive calendar interface

---

**Ready for Enhanced Quote Builder Development**

The contact-driven foundation with react-big-calendar timeline visualization provides the core infrastructure for BookingGPT v4.2's professional travel booking workflow.