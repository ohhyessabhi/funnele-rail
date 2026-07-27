/**
 * Funnele PM - TypeScript Types
 * Use these for frontend + API contracts
 */

// ============ ENUMS ============

export enum UserRole {
  ADMIN = "Admin",
  PM = "PM",
  SEO = "SEO",
  WEB_DESIGNER = "Web Designer",
  WEB_DEVELOPER = "Web Developer",
  EMAIL_MARKETING = "Email Marketing",
  GOOGLE_ADS = "Google Ads",
  META_ADS = "Meta Ads",
}

export enum TaskStatus {
  BACKLOG = "Backlog",
  READY = "Ready",
  IN_PROGRESS = "In Progress",
  CLIENT_REVIEW = "Client Review",
  APPROVED = "Approved",
  COMPLETED = "Completed",
  REVISION_REQUIRED = "Revision Required",
}

export enum TaskPriority {
  LOW = "Low",
  NORMAL = "Normal",
  HIGH = "High",
  URGENT = "Urgent",
}

export enum ProjectState {
  ACTIVE = "Active",
  PAUSED = "Paused",
  CANCELLED = "Cancelled",
}

export enum TaskSource {
  MANUAL = "Manual",
  TEAMWORK = "Teamwork",
  FIREFLIES = "Fireflies",
}

export enum InboxConfidence {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// ============ CORE TYPES ============

export interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  state: ProjectState;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  project_id?: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string;
  due_date?: string; // YYYY-MM-DD
  source: TaskSource;
  source_ref?: string; // Teamwork task ID, Fireflies meeting ID, etc.
  status_at: string; // When status last changed
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  auto: boolean; // True if auto-generated from status change
  created_at: string;
}

export interface TimeLog {
  id: string;
  task_id: string;
  member_id: string;
  minutes: number;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
}

export interface Deliverable {
  id: string;
  task_id: string;
  member_id?: string;
  url?: string;
  note?: string;
  created_at: string;
}

export interface InboxItem {
  id: string;
  org_id: string;
  source: "Teamwork" | "Fireflies";
  title: string;
  detail?: string;
  project_id?: string;
  confidence: InboxConfidence;
  evidence?: string; // Quote from source (timestamp + text)
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

// ============ VIEW MODELS (Frontend) ============

/**
 * Task with populated references (for list/drawer display)
 */
export interface TaskWithRelations extends Task {
  assignee?: User | null;
  project?: Project | null;
  comments?: Comment[];
  time_logs?: TimeLog[];
  deliverables?: Deliverable[];
}

/**
 * Context for rendering task row
 */
export interface TaskRowContext {
  task: TaskWithRelations;
  currentUserId: string;
  isAdmin: boolean;
  selectedTaskId?: string;
}

/**
 * Drawer context
 */
export interface DrawerContext {
  taskId: string;
  task: TaskWithRelations;
  members: User[];
  projects: Project[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => Promise<void>;
  onDelete: () => Promise<void>;
}

/**
 * App state (Zustand store)
 */
export interface AppState {
  // Auth
  user: User | null;
  org_id: string | null;
  isAdmin: boolean;
  loading: boolean;
  error?: string;

  // Data
  members: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  time_logs: TimeLog[];
  deliverables: Deliverable[];
  inbox: InboxItem[];

  // UI
  currentView: "dash" | "my-work" | "inbox" | "all-tasks" | "hours" | "team" | "project";
  currentProjectId?: string;
  selectedTaskId?: string;
  filters: {
    open: boolean;
    urgent: boolean;
    overdue: boolean;
  };
  searchQuery: string;

  // Actions
  setUser: (user: User | null) => void;
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<Task>;
  addComment: (taskId: string, body: string) => Promise<Comment>;
  setView: (view: AppState["currentView"], projectId?: string) => void;
  setSelectedTask: (id?: string) => void;
  setFilter: (filter: keyof AppState["filters"], value: boolean) => void;
  setSearchQuery: (q: string) => void;
}

// ============ API REQUEST/RESPONSE ============

export interface CreateTaskRequest {
  project_id?: string;
  title: string;
  notes?: string;
  priority?: TaskPriority;
  assignee_id?: string;
  due_date?: string;
}

export interface UpdateTaskRequest extends Partial<Task> {
  id: string;
}

export interface CreateCommentRequest {
  task_id: string;
  body: string;
}

export interface TeamworkWebhookPayload {
  type: "TASK.CREATED" | "TASK.UPDATED";
  data: {
    id: string; // Teamwork task ID
    name: string;
    description?: string;
    dueDate?: string;
    projectId?: string;
    priority?: number;
  };
}

export interface FirefliesExtractedTask {
  title: string;
  owner_name?: string;
  due_date?: string;
  project_name?: string;
  confidence: InboxConfidence;
  evidence: string; // Timestamp + verbatim quote
}

// ============ UTILITY TYPES ============

export type Maybe<T> = T | null | undefined;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
