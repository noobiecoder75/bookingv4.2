import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BookingTask,
  TaskAttachment,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskFilters,
  TaskSummary,
} from '@/types/task';

interface TaskStore {
  tasks: BookingTask[];
  attachments: TaskAttachment[];

  // Task CRUD operations
  createTask: (taskData: Omit<BookingTask, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (id: string, updates: Partial<BookingTask>) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => BookingTask | undefined;

  // Task status management
  updateTaskStatus: (id: string, status: TaskStatus, notes?: string) => void;
  assignTask: (id: string, agentId: string, agentName: string) => void;
  completeTask: (id: string, completionNotes?: string) => void;
  blockTask: (id: string, reason: string) => void;
  unblockTask: (id: string) => void;

  // Bulk operations
  bulkUpdateStatus: (ids: string[], status: TaskStatus) => void;
  bulkAssign: (ids: string[], agentId: string, agentName: string) => void;

  // Filtering and querying
  getTasksByStatus: (status: TaskStatus) => BookingTask[];
  getTasksByAssignee: (agentId: string) => BookingTask[];
  getTasksByQuote: (quoteId: string) => BookingTask[];
  getTasksByCustomer: (customerId: string) => BookingTask[];
  getOverdueTasks: () => BookingTask[];
  getDueToday: () => BookingTask[];
  getDueSoon: (days?: number) => BookingTask[]; // Default 3 days
  filterTasks: (filters: TaskFilters) => BookingTask[];

  // Task summary
  getTaskSummary: (agentId?: string) => TaskSummary;

  // Attachment operations
  addAttachment: (attachmentData: Omit<TaskAttachment, 'id' | 'uploadedAt'>) => string;
  deleteAttachment: (id: string) => void;
  getAttachmentsByTask: (taskId: string) => TaskAttachment[];

  // Auto-generation helpers
  generateTasksFromQuoteItem: (quoteItem: {
    id: string;
    quoteId: string;
    type: string;
    name: string;
    supplierSource: string;
    details: any;
    customerId: string;
    customerName: string;
  }) => string[];
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      attachments: [],

      createTask: (taskData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const task: BookingTask = {
          ...taskData,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          tasks: [...state.tasks, task],
        }));

        return id;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      updateTaskStatus: (id, status, notes) => {
        const updates: Partial<BookingTask> = { status };

        if (notes) {
          updates.notes = notes;
        }

        if (status === 'completed') {
          updates.completedAt = new Date().toISOString();
        }

        get().updateTask(id, updates);
      },

      assignTask: (id, agentId, agentName) => {
        get().updateTask(id, {
          assignedTo: agentId,
          assignedToName: agentName,
        });
      },

      completeTask: (id, completionNotes) => {
        const updates: Partial<BookingTask> = {
          status: 'completed',
          completedAt: new Date().toISOString(),
        };

        if (completionNotes) {
          updates.notes = completionNotes;
        }

        get().updateTask(id, updates);
      },

      blockTask: (id, reason) => {
        get().updateTask(id, {
          status: 'blocked',
          blockedReason: reason,
        });
      },

      unblockTask: (id) => {
        get().updateTask(id, {
          status: 'pending',
          blockedReason: undefined,
        });
      },

      bulkUpdateStatus: (ids, status) => {
        ids.forEach((id) => get().updateTaskStatus(id, status));
      },

      bulkAssign: (ids, agentId, agentName) => {
        ids.forEach((id) => get().assignTask(id, agentId, agentName));
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status);
      },

      getTasksByAssignee: (agentId) => {
        return get().tasks.filter((task) => task.assignedTo === agentId);
      },

      getTasksByQuote: (quoteId) => {
        return get().tasks.filter((task) => task.quoteId === quoteId);
      },

      getTasksByCustomer: (customerId) => {
        return get().tasks.filter((task) => task.customerId === customerId);
      },

      getOverdueTasks: () => {
        const now = new Date();
        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          return new Date(task.dueDate) < now;
        });
      },

      getDueToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      },

      getDueSoon: (days = 3) => {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return get().tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          const dueDate = new Date(task.dueDate);
          return dueDate >= now && dueDate <= futureDate;
        });
      },

      filterTasks: (filters) => {
        let filtered = get().tasks;

        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter((task) => filters.status!.includes(task.status));
        }

        if (filters.priority && filters.priority.length > 0) {
          filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
        }

        if (filters.type && filters.type.length > 0) {
          filtered = filtered.filter((task) => filters.type!.includes(task.type));
        }

        if (filters.assignedTo) {
          filtered = filtered.filter((task) => task.assignedTo === filters.assignedTo);
        }

        if (filters.customerId) {
          filtered = filtered.filter((task) => task.customerId === filters.customerId);
        }

        if (filters.quoteId) {
          filtered = filtered.filter((task) => task.quoteId === filters.quoteId);
        }

        if (filters.dueDateFrom) {
          filtered = filtered.filter(
            (task) => task.dueDate && task.dueDate >= filters.dueDateFrom!
          );
        }

        if (filters.dueDateTo) {
          filtered = filtered.filter(
            (task) => task.dueDate && task.dueDate <= filters.dueDateTo!
          );
        }

        return filtered;
      },

      getTaskSummary: (agentId) => {
        let tasks = get().tasks;

        if (agentId) {
          tasks = tasks.filter((task) => task.assignedTo === agentId);
        }

        const now = new Date();
        const overdueTasks = tasks.filter((task) => {
          if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
            return false;
          }
          return new Date(task.dueDate) < now;
        });

        const dueToday = get().getDueToday().filter((task) =>
          agentId ? task.assignedTo === agentId : true
        );

        const dueSoon = get().getDueSoon(3).filter((task) =>
          agentId ? task.assignedTo === agentId : true
        );

        return {
          total: tasks.length,
          pending: tasks.filter((task) => task.status === 'pending').length,
          inProgress: tasks.filter((task) => task.status === 'in_progress').length,
          completed: tasks.filter((task) => task.status === 'completed').length,
          cancelled: tasks.filter((task) => task.status === 'cancelled').length,
          blocked: tasks.filter((task) => task.status === 'blocked').length,
          overdue: overdueTasks.length,
          dueToday: dueToday.length,
          dueSoon: dueSoon.length,
        };
      },

      addAttachment: (attachmentData) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const attachment: TaskAttachment = {
          ...attachmentData,
          id,
          uploadedAt: now,
        };

        set((state) => ({
          attachments: [...state.attachments, attachment],
        }));

        return id;
      },

      deleteAttachment: (id) => {
        set((state) => ({
          attachments: state.attachments.filter((attachment) => attachment.id !== id),
        }));
      },

      getAttachmentsByTask: (taskId) => {
        return get().attachments.filter((attachment) => attachment.taskId === taskId);
      },

      generateTasksFromQuoteItem: (quoteItem) => {
        const taskIds: string[] = [];

        // Determine task type based on item type
        const taskTypeMap: Record<string, TaskType> = {
          flight: 'book_flight',
          hotel: 'book_hotel',
          activity: 'book_activity',
          transfer: 'book_transfer',
        };

        const taskType = taskTypeMap[quoteItem.type] || 'book_hotel';

        // Calculate due date (e.g., 2 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        // Create main booking task
        const bookingTaskId = get().createTask({
          type: taskType,
          title: `Book ${quoteItem.name}`,
          description: `Complete booking for ${quoteItem.type}: ${quoteItem.name}`,
          priority: 'high',
          status: 'pending',
          quoteId: quoteItem.quoteId,
          quoteItemId: quoteItem.id,
          customerId: quoteItem.customerId,
          customerName: quoteItem.customerName,
          itemType: quoteItem.type as any,
          itemName: quoteItem.name,
          itemDetails: quoteItem.details,
          dueDate: dueDate.toISOString(),
        });

        taskIds.push(bookingTaskId);

        // Create upload confirmation task (due after booking)
        const uploadDueDate = new Date(dueDate);
        uploadDueDate.setDate(uploadDueDate.getDate() + 1);

        const uploadTaskId = get().createTask({
          type: 'upload_confirmation',
          title: `Upload confirmation for ${quoteItem.name}`,
          description: `Upload booking confirmation documents`,
          priority: 'medium',
          status: 'pending',
          quoteId: quoteItem.quoteId,
          quoteItemId: quoteItem.id,
          customerId: quoteItem.customerId,
          customerName: quoteItem.customerName,
          itemType: quoteItem.type as any,
          itemName: quoteItem.name,
          dueDate: uploadDueDate.toISOString(),
        });

        taskIds.push(uploadTaskId);

        return taskIds;
      },
    }),
    {
      name: 'task-storage',
      version: 1,
    }
  )
);
