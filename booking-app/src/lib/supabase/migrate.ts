import { createClient } from './client';
import { Database } from '@/types/database';

type Tables = Database['public']['Tables'];

/**
 * Migration helper for moving data from Zustand stores to Supabase
 * This preserves existing functionality while adding database persistence
 */
export class SupabaseMigrator {
  private supabase = createClient();

  /**
   * Migrate quotes from local storage to Supabase
   */
  async migrateQuotes(quotes: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const quote of quotes) {
      try {
        const { error } = await this.supabase.from('quotes').upsert({
          id: quote.id,
          user_id: quote.userId,
          client_id: quote.clientId,
          quote_number: quote.quoteNumber || `Q-${Date.now()}`,
          title: quote.title || 'Untitled Quote',
          status: quote.status || 'draft',
          total_amount: quote.totalAmount || 0,
          currency: quote.currency || 'USD',
          items: quote.items || [],
          valid_until: quote.validUntil,
          notes: quote.notes,
          created_at: quote.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ quote: quote.id, error });
      }
    }

    return results;
  }

  /**
   * Migrate bookings from local storage to Supabase
   */
  async migrateBookings(bookings: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const booking of bookings) {
      try {
        const { error } = await this.supabase.from('bookings').upsert({
          id: booking.id,
          user_id: booking.userId,
          quote_id: booking.quoteId,
          booking_reference: booking.bookingReference || `BK-${Date.now()}`,
          status: booking.status || 'pending',
          total_amount: booking.totalAmount || 0,
          currency: booking.currency || 'USD',
          booking_data: booking.bookingData || booking,
          payment_status: booking.paymentStatus || 'pending',
          notes: booking.notes,
          created_at: booking.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ booking: booking.id, error });
      }
    }

    return results;
  }

  /**
   * Migrate tasks from local storage to Supabase
   */
  async migrateTasks(tasks: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const task of tasks) {
      try {
        const { error } = await this.supabase.from('tasks').upsert({
          id: task.id,
          user_id: task.userId,
          booking_id: task.bookingId,
          title: task.title,
          description: task.description,
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          due_date: task.dueDate,
          completed_at: task.completedAt,
          attachments: task.attachments,
          created_at: task.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ task: task.id, error });
      }
    }

    return results;
  }

  /**
   * Migrate commissions from local storage to Supabase
   */
  async migrateCommissions(commissions: any[]) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const commission of commissions) {
      try {
        const { error } = await this.supabase.from('commissions').upsert({
          id: commission.id,
          user_id: commission.userId,
          booking_id: commission.bookingId,
          amount: commission.amount || 0,
          currency: commission.currency || 'USD',
          rate: commission.rate || 0,
          status: commission.status || 'pending',
          paid_at: commission.paidAt,
          notes: commission.notes,
          created_at: commission.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ commission: commission.id, error });
      }
    }

    return results;
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus() {
    try {
      const [quotes, bookings, tasks, commissions] = await Promise.all([
        this.supabase.from('quotes').select('count', { count: 'exact' }),
        this.supabase.from('bookings').select('count', { count: 'exact' }),
        this.supabase.from('tasks').select('count', { count: 'exact' }),
        this.supabase.from('commissions').select('count', { count: 'exact' }),
      ]);

      return {
        quotes: quotes.count || 0,
        bookings: bookings.count || 0,
        tasks: tasks.count || 0,
        commissions: commissions.count || 0,
      };
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return null;
    }
  }
}