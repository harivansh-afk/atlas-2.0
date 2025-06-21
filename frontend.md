# Scheduled Tasks Feature - Frontend Implementation Plan

## Overview

This document outlines the comprehensive frontend implementation plan for the scheduled tasks feature. The frontend provides intuitive interfaces for creating, managing, and scheduling agent tasks derived from chat conversations.

## Architecture Integration

### Current System Integration Points

- **Routing**: Extends existing Next.js app router structure
- **Sidebar**: Integrates with current `SidebarLeft` component
- **Authentication**: Uses existing auth context and JWT handling
- **API Layer**: Extends current API client in `/lib/api.ts`
- **UI Components**: Leverages existing shadcn/ui component library
- **Styling**: Follows current design system and theme structure

## Page Structure & Routing

### 1. Tasks Management Pages

#### `/tasks` - Main Tasks Page
**Purpose**: Central hub for viewing and managing all scheduled tasks

**Layout Structure**:
```
/tasks
├── Sidebar (existing)
├── Main Content Area
│   ├── Page Header
│   │   ├── Title: "Scheduled Tasks"
│   │   ├── Create Task Button (+ icon)
│   │   └── Usage Indicator (reused component)
│   ├── Tasks List/Grid
│   │   ├── Task Cards (similar to agents page)
│   │   ├── Status Filters
│   │   ├── Search/Sort Controls
│   │   └── Pagination
│   └── Empty State (when no tasks exist)
```

**Key Components**:
- `TaskCard`: Display task summary, status, next execution
- `TaskFilters`: Filter by status, agent, schedule type
- `TaskActions`: Edit, delete, pause/resume, execute now
- `CreateTaskModal`: Quick task creation flow

#### `/tasks/new/[uuid]` - Task Configuration Page
**Purpose**: Edit and configure exported task prompts

**Layout Structure**:
```
/tasks/new/[uuid]
├── Full-width layout (no sidebar)
├── Header
│   ├── Back Button
│   ├── Task Name (editable)
│   └── Save/Cancel Actions
├── Main Content
│   ├── Prompt Editor Section
│   │   ├── Generated Prompt Display
│   │   ├── Edit Controls
│   │   └── Preview Mode
│   ├── Agent Configuration
│   │   ├── Agent Selector
│   │   ├── MCP Tools Display
│   │   └── Configuration Options
│   └── Scheduling Section
│       ├── Schedule Type Selector
│       ├── Date/Time Picker
│       ├── Recurrence Options
│       └── Advanced Settings
```

**Key Components**:
- `PromptEditor`: Rich text editor for prompt modification
- `AgentSelector`: Dropdown with agent selection
- `ScheduleBuilder`: Interactive scheduling interface
- `TaskPreview`: Preview of task configuration

### 2. Schedule Management Page

#### `/schedule` - Schedule Overview Page
**Purpose**: Calendar view and scheduling interface for all tasks

**Layout Structure**:
```
/schedule
├── Sidebar (existing)
├── Main Content Area
│   ├── Page Header
│   │   ├── Title: "Schedule"
│   │   ├── View Controls (Month/Week/Day)
│   │   └── Today Button
│   ├── Calendar Component
│   │   ├── Full-width calendar view
│   │   ├── Task execution indicators
│   │   ├── Hover previews
│   │   └── Click-to-edit functionality
│   ├── Scheduling Modal
│   │   ├── Task Selection
│   │   ├── Date/Time Configuration
│   │   ├── Recurrence Settings
│   │   └── Confirmation Actions
│   └── Upcoming Tasks Sidebar
│       ├── Next 7 days preview
│       ├── Overdue tasks
│       └── Quick actions
```

**Key Components**:
- `TaskCalendar`: Full-featured calendar with task display
- `SchedulingModal`: Modal for creating/editing schedules
- `UpcomingTasks`: Sidebar with upcoming executions
- `TaskTooltip`: Hover preview for calendar events

### 3. Thread Integration

#### Thread Page Enhancement
**Purpose**: Add task creation capability to existing thread pages

**Integration Points**:
```
Thread Top Bar Enhancement:
├── Existing Elements (unchanged)
├── New: Create Task Button
│   ├── Icon: Calendar/Clock icon
│   ├── Tooltip: "Create scheduled task"
│   └── Click Handler: Export thread flow
```

**Export Flow Modal**:
```
Export Thread Modal:
├── Header: "Create Scheduled Task"
├── Content
│   ├── Explanation Text
│   ├── Task Name Input
│   ├── Task Description Input (optional)
│   └── Preview of messages to be processed
├── Actions
│   ├── Cancel Button
│   └── Create Task Button
```

## Component Architecture

### 1. Core Task Components

#### TaskCard Component
```typescript
interface TaskCardProps {
  task: ScheduledTask;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onExecute: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
}

// Features:
// - Status indicator with color coding
// - Next execution time display
// - Agent name and avatar
// - Quick action buttons
// - Execution history preview
```

#### ScheduleBuilder Component
```typescript
interface ScheduleBuilderProps {
  initialSchedule?: TaskSchedule;
  onChange: (schedule: TaskSchedule) => void;
  timezone?: string;
}

// Features:
// - Schedule type selection (once, daily, weekly, monthly, cron)
// - Date/time picker with timezone support
// - Recurrence pattern builder
// - Cron expression editor (advanced mode)
// - Preview of next execution times
```

#### TaskCalendar Component
```typescript
interface TaskCalendarProps {
  tasks: ScheduledTask[];
  executions: TaskExecution[];
  onDateSelect: (date: Date) => void;
  onTaskClick: (task: ScheduledTask) => void;
  view: 'month' | 'week' | 'day';
}

// Features:
// - Full calendar view with task indicators
// - Color-coded task status
// - Drag-and-drop rescheduling
// - Multi-task day indicators
// - Execution status overlays
```

### 2. Sidebar Integration

#### Navigation Enhancement
```typescript
// Add to existing sidebar structure
const taskNavigation = {
  label: "Tasks",
  items: [
    {
      title: "All Tasks",
      url: "/tasks",
      icon: CheckSquare,
      badge: taskCount > 0 ? taskCount : undefined
    },
    {
      title: "Schedule",
      url: "/schedule", 
      icon: Calendar,
      badge: upcomingCount > 0 ? upcomingCount : undefined
    }
  ]
};

// Position: Above "Agent Playground" in sidebar
```

### 3. API Integration Layer

#### Task API Client
```typescript
// Extend existing /lib/api.ts
export interface ScheduledTask {
  task_id: string;
  name: string;
  description?: string;
  generated_prompt: string;
  agent_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  schedule_type?: 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';
  next_execution_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskExecution {
  execution_id: string;
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// API Functions
export const exportThread = async (threadId: string, options: ExportOptions): Promise<ScheduledTask>;
export const getTasks = async (filters?: TaskFilters): Promise<ScheduledTask[]>;
export const getTask = async (taskId: string): Promise<ScheduledTask>;
export const updateTask = async (taskId: string, updates: Partial<ScheduledTask>): Promise<ScheduledTask>;
export const deleteTask = async (taskId: string): Promise<void>;
export const scheduleTask = async (taskId: string, schedule: TaskSchedule): Promise<ScheduledTask>;
export const executeTask = async (taskId: string): Promise<TaskExecution>;
export const getTaskExecutions = async (taskId: string): Promise<TaskExecution[]>;
```

### 4. React Query Integration

#### Custom Hooks
```typescript
// Task Management Hooks
export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const useTask = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: !!taskId,
  });
};

export const useTaskExecutions = (taskId: string) => {
  return useQuery({
    queryKey: ['task-executions', taskId],
    queryFn: () => getTaskExecutions(taskId),
    enabled: !!taskId,
  });
};

// Mutation Hooks
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExportOptions & { threadId: string }) => 
      exportThread(data.threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<ScheduledTask> }) =>
      updateTask(taskId, updates),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

## User Experience Flow

### 1. Task Creation Flow

```
1. User in Thread Page
   ↓ Clicks "Create Task" button
2. Export Modal Opens
   ↓ User fills task details
3. Backend Processing
   ↓ LLM generates prompt
4. Redirect to /tasks/new/[uuid]
   ↓ User reviews/edits prompt
5. Task Configuration
   ↓ User sets schedule
6. Task Created
   ↓ Redirect to /tasks or /schedule
```

### 2. Task Management Flow

```
1. User visits /tasks
   ↓ Views all tasks
2. Task Actions Available:
   - Edit: Opens task editor
   - Delete: Confirmation dialog
   - Execute Now: Immediate execution
   - Pause/Resume: Status toggle
   - View History: Execution details
```

### 3. Scheduling Flow

```
1. User visits /schedule
   ↓ Views calendar
2. Scheduling Options:
   - Click date: Create new schedule
   - Click task: Edit existing schedule
   - Drag task: Reschedule
   - Modal: Advanced scheduling
```

## Design System Integration

### 1. Color Coding

```css
/* Task Status Colors */
.task-status-draft { @apply bg-gray-100 text-gray-700; }
.task-status-active { @apply bg-green-100 text-green-700; }
.task-status-paused { @apply bg-yellow-100 text-yellow-700; }
.task-status-completed { @apply bg-blue-100 text-blue-700; }
.task-status-failed { @apply bg-red-100 text-red-700; }

/* Execution Status Colors */
.execution-pending { @apply bg-gray-100; }
.execution-running { @apply bg-blue-100; }
.execution-completed { @apply bg-green-100; }
.execution-failed { @apply bg-red-100; }
```

### 2. Icon Usage

```typescript
// Task-related icons from Lucide React
import { 
  Calendar,
  Clock,
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Trash2,
  Edit3,
  Download
} from 'lucide-react';

// Icon mapping for different contexts
const taskIcons = {
  create: Calendar,
  schedule: Clock,
  execute: Play,
  pause: Pause,
  resume: Play,
  edit: Edit3,
  delete: Trash2,
  settings: Settings,
  export: Download,
  recurring: RotateCcw
};
```

### 3. Responsive Design

```css
/* Mobile-first responsive design */
.task-grid {
  @apply grid grid-cols-1 gap-4;
  @apply md:grid-cols-2 lg:grid-cols-3;
}

.calendar-container {
  @apply w-full overflow-x-auto;
  @apply lg:overflow-x-visible;
}

.task-card {
  @apply p-4 rounded-lg border;
  @apply hover:shadow-md transition-shadow;
  @apply focus-within:ring-2 focus-within:ring-primary;
}
```

## State Management

### 1. Local State Patterns

```typescript
// Task list state management
const [tasks, setTasks] = useState<ScheduledTask[]>([]);
const [filters, setFilters] = useState<TaskFilters>({});
const [selectedTask, setSelectedTask] = useState<string | null>(null);

// Calendar state management
const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [schedulingModal, setSchedulingModal] = useState<boolean>(false);
```

### 2. Context Providers

```typescript
// Task context for shared state
interface TaskContextType {
  selectedTasks: string[];
  setSelectedTasks: (tasks: string[]) => void;
  bulkActions: {
    delete: (taskIds: string[]) => Promise<void>;
    pause: (taskIds: string[]) => Promise<void>;
    resume: (taskIds: string[]) => Promise<void>;
  };
}

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementation
};
```

## Performance Optimizations

### 1. Data Loading Strategies

- **Pagination**: Implement virtual scrolling for large task lists
- **Lazy Loading**: Load task details on demand
- **Caching**: Aggressive caching with React Query
- **Prefetching**: Prefetch related data on hover

### 2. Component Optimizations

- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large lists and calendar views
- **Code Splitting**: Lazy load calendar and scheduling components
- **Debouncing**: For search and filter inputs

## Accessibility Considerations

### 1. Keyboard Navigation

- Full keyboard support for all interactive elements
- Logical tab order throughout interfaces
- Escape key handling for modals and dropdowns
- Arrow key navigation for calendar

### 2. Screen Reader Support

- Proper ARIA labels and descriptions
- Live regions for status updates
- Semantic HTML structure
- Alternative text for visual indicators

### 3. Visual Accessibility

- High contrast mode support
- Scalable text and UI elements
- Color-blind friendly status indicators
- Focus indicators for all interactive elements

## Error Handling & Loading States

### 1. Error Boundaries

```typescript
// Task-specific error boundary
export const TaskErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<TaskErrorFallback />}
      onError={(error) => {
        console.error('Task component error:', error);
        // Report to error tracking service
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### 2. Loading States

```typescript
// Comprehensive loading state management
const LoadingStates = {
  TaskList: () => <TaskListSkeleton />,
  TaskCard: () => <TaskCardSkeleton />,
  Calendar: () => <CalendarSkeleton />,
  ScheduleModal: () => <ModalSkeleton />
};
```

### 3. Error Messages

```typescript
// User-friendly error messages
const ErrorMessages = {
  TASK_NOT_FOUND: "Task not found or you don't have permission to access it.",
  EXPORT_FAILED: "Failed to export thread. Please try again.",
  SCHEDULE_CONFLICT: "This schedule conflicts with an existing task.",
  EXECUTION_FAILED: "Task execution failed. Check the error details.",
  NETWORK_ERROR: "Network error. Please check your connection."
};
```
