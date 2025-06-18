// Chat types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    executionTime?: number;
    tools?: ToolCall[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
  settings: ChatSettings;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

// MCP types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'running' | 'stopped' | 'error' | 'installing';
  type: 'builtin' | 'external';
  enabled: boolean;
  autoStart: boolean;
  config?: Record<string, any>;
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  installedAt?: string;
  startedAt?: string;
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required: boolean;
  }[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
}

// Extension types
export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  latestVersion: string;
  author: string;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  featured: boolean;
  installed: boolean;
  enabled: boolean;
  installedAt?: string;
  config?: Record<string, any>;
  mcpServers?: MCPServer[];
  icon?: string;
  screenshots?: string[];
  changelog?: ChangelogEntry[];
  dependencies?: string[];
  permissions?: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface ExtensionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

// File system types
export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  permissions?: number;
  isReadable?: boolean;
  isWritable?: boolean;
  isExecutable?: boolean;
  children?: FileSystemItem[];
}

export interface FileContent {
  content: string;
  size: number;
  modified: Date;
  encoding: string;
}

export interface FileWatcher {
  id: string;
  path: string;
  recursive: boolean;
  events: string[];
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  id?: string;
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connectionId?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

// Settings types
export interface AppSettings {
  apiKey: string;
  defaultModel: string;
  theme: 'dark' | 'light' | 'auto';
  fontSize: number;
  autoSave: boolean;
  notifications: boolean;
  maxChatHistory: number;
  fileWatchingEnabled: boolean;
  allowedDirectories: string[];
  mcpSettings: MCPSettings;
}

export interface MCPSettings {
  autoStartServers: boolean;
  maxConcurrentServers: number;
  serverTimeout: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
}

export interface ChatCompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  message: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// UI types
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  closable?: boolean;
  modified?: boolean;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// Task types (for Devin-like functionality)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  type: 'file_operation' | 'code_generation' | 'analysis' | 'mcp_operation';
  steps: TaskStep[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  logs?: string[];
}

// Excel-specific types
export interface ExcelWorkbook {
  path: string;
  name: string;
  worksheets: ExcelWorksheet[];
  modified: Date;
  size: number;
}

export interface ExcelWorksheet {
  name: string;
  rowCount: number;
  columnCount: number;
  data?: any[][];
  charts?: ExcelChart[];
}

export interface ExcelChart {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  dataRange: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ExcelOperation {
  type: 'read' | 'write' | 'format' | 'formula' | 'chart';
  workbook: string;
  worksheet?: string;
  range?: string;
  data?: any;
  options?: Record<string, any>;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

// Store types
export interface AppState {
  settings: AppSettings;
  chat: {
    sessions: ChatSession[];
    currentSession: string | null;
    models: GeminiModel[];
  };
  mcp: {
    servers: MCPServer[];
    extensions: Extension[];
    categories: ExtensionCategory[];
  };
  files: {
    currentPath: string;
    items: FileSystemItem[];
    openFiles: Map<string, FileContent>;
    watchers: FileWatcher[];
  };
  ui: {
    sidebarOpen: boolean;
    currentPage: string;
    notifications: NotificationItem[];
    tasks: Task[];
  };
  websocket: ConnectionStatus;
}