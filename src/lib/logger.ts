/**
 * Isomorphic Structured Logger
 * Safe to import and use in both Server Components, Client Components, and API Routes.
 */
const generateTraceId = () => Math.random().toString(36).substring(2, 15);

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogOptions {
  category?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  status?: "none" | "open" | "resolved";
}

export interface LogPayload {
  level: LogLevel;
  category: string;
  message: string;
  userId: string | null;
  requestId: string;
  status: string;
  metadata: Record<string, any>;
}

// Sensitive keys that must be automatically redacted from metadata
const SENSITIVE_KEYS = [
  "password", "token", "secret", "key", "authorization", 
  "signature", "cvv", "card", "bearer", "cookie", "session"
];

// Helper to determine environment
const isServer = typeof window === "undefined";

// Client-side session correlation ID
let clientSessionId = "";
if (!isServer) {
  try {
    clientSessionId = sessionStorage.getItem("vocabpod_session_id") || "";
    if (!clientSessionId) {
      clientSessionId = `sess_${generateTraceId()}`;
      sessionStorage.setItem("vocabpod_session_id", clientSessionId);
    }
  } catch (e) {
    clientSessionId = `sess_temp_${generateTraceId()}`;
  }
}

// Server-side Supabase Client Instance (Lazy-loaded, Reused)
let serverSupabaseClient: any = null;

// Client-side Batching Array
let logBuffer: LogPayload[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
const BATCH_SIZE_LIMIT = 20;
const BATCH_FLUSH_INTERVAL_MS = 3000;

// Client-side Log History for Bug Report Attachments
let sessionLogHistory: LogPayload[] = [];
const HISTORY_LIMIT = 50;

/**
 * Deeply sanitizes metadata to redact sensitive values (PII protection)
 */
function sanitizeMetadata(data: any): any {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(sanitizeMetadata);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk));
    if (isSensitive) {
      sanitized[key] = "[REDACTED_PII]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeMetadata(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

class Logger {
  private getMinLevel(): LogLevel {
    if (isServer) {
      // Server level defaults to INFO in development, WARN in production
      return process.env.NODE_ENV === "development" ? "DEBUG" : "INFO";
    }

    // Client level check
    try {
      const diagLocal = localStorage.getItem("vocabpod_diagnostics_enabled");
      if (diagLocal === "true") {
        return "DEBUG"; // Diagnostics enabled -> capture everything
      }
    } catch (e) {}

    return "WARN"; // Default client level: only send warnings/errors
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    const minLevel = this.getMinLevel();
    return levels[level] >= levels[minLevel];
  }

  private formatConsole(level: LogLevel, category: string, message: string, traceId: string, metadata?: any) {
    const colors: Record<LogLevel, string> = {
      DEBUG: "\x1b[90m", // Gray
      INFO: "\x1b[32m",  // Green
      WARN: "\x1b[33m",  // Yellow
      ERROR: "\x1b[31m"  // Red
    };
    const reset = "\x1b[0m";
    const timestamp = new Date().toISOString();
    
    if (isServer) {
      console.log(
        `${colors[level] || ""}[${timestamp}] [${level}] [${category}] [Trace: ${traceId}] ${message}${reset}`,
        metadata ? JSON.stringify(metadata) : ""
      );
    } else {
      const styles = {
        DEBUG: "color: #8E8E93;",
        INFO: "color: #34C759; font-weight: bold;",
        WARN: "color: #FF9500; font-weight: bold;",
        ERROR: "color: #FF3B30; font-weight: bold;"
      };
      console.log(
        `%c[${timestamp}] [${level}] [${category}] [Trace: ${traceId}] %c${message}`,
        styles[level],
        "color: inherit;",
        metadata || ""
      );
    }
  }

  private getRequestId(optionsId?: string): string {
    if (optionsId) return optionsId;
    if (isServer) {
      const globalStorage = (globalThis as any).__vocabpod_trace_storage__;
      if (globalStorage) {
        try {
          const store = globalStorage.getStore();
          return store?.requestId || `req_untraced_${generateTraceId()}`;
        } catch (e) {}
      }
      return `req_untraced_${generateTraceId()}`;
    }
    return clientSessionId;
  }

  private async getSupabaseClient() {
    if (serverSupabaseClient) return serverSupabaseClient;
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials missing for logger.");
    serverSupabaseClient = createClient(supabaseUrl, supabaseKey);
    return serverSupabaseClient;
  }

  private async flushClientBatch() {
    if (logBuffer.length === 0) return;
    const batch = [...logBuffer];
    logBuffer = []; // Clear buffer
    
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }

    try {
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: batch }),
        keepalive: true
      }).catch(err => {
        // Silent catch
      });
    } catch (err) {}
  }

  private async dispatchLog(
    level: LogLevel,
    message: string,
    options: LogOptions = {}
  ) {
    const category = options.category || "GENERAL";
    const requestId = this.getRequestId(options.requestId);
    const userId = options.userId || null;
    const status = options.status || "none";
    const sanitizedMetadata = sanitizeMetadata(options.metadata || {});

    // 1. Filter logs based on minimum level configuration
    if (!this.shouldLog(level) && category !== "BUG_REPORT") {
      return;
    }

    // 2. Discard any logs (except server errors) that are not attached to a user
    // This explicitly prevents anonymous telemetry from consuming bandwidth
    // Bug reports also REQUIRE a user ID now.
    if (!userId && !isServer) {
      return;
    }

    // 2. Always log to local console first for quick debugging
    this.formatConsole(level, category, message, requestId, sanitizedMetadata);

    const payload: LogPayload = {
      level,
      category,
      message,
      userId,
      requestId,
      status,
      metadata: sanitizedMetadata
    };

    // 3. Persist log
    if (isServer) {
      // Server-side: Write to Supabase.
      // We will still fire-and-forget here internally so we don't block `logger.info()`.
      // BUT, we'll try to await it inside `waitUntil` if possible, OR rely on the batch endpoint handling for robust async.
      // Actually, since Next.js doesn't easily expose waitUntil inside utility functions without passing it down,
      // it is highly recommended to await logger calls if they are CRITICAL (like BUG_REPORT).
      // Since `logger.info` is sync to the user, we will return a promise that users can optionally await.
      
      const insertPromise = this.getSupabaseClient().then(supabase => 
        supabase.from("application_logs").insert({
          level: payload.level,
          category: payload.category,
          message: payload.message,
          user_id: payload.userId,
          request_id: payload.requestId,
          status: payload.status,
          metadata: payload.metadata
        })
      ).catch(err => console.error("Logger direct database insertion failed:", err));

      return insertPromise;
    } else {
      // Client-side: Batching to prevent DDoS
      logBuffer.push(payload);

      // Keep a running history of logs on the client for session diagnostics (e.g. bug report attachments)
      sessionLogHistory.push(payload);
      if (sessionLogHistory.length > HISTORY_LIMIT) {
        sessionLogHistory.shift(); // Keep latest 50 logs
      }

      if (logBuffer.length >= BATCH_SIZE_LIMIT) {
        this.flushClientBatch();
      } else if (!batchTimeout) {
        batchTimeout = setTimeout(() => this.flushClientBatch(), BATCH_FLUSH_INTERVAL_MS);
      }
    }
  }

  public getSessionLogs(): LogPayload[] {
    return sessionLogHistory;
  }

  public debug(message: string, options?: LogOptions) {
    return this.dispatchLog("DEBUG", message, options);
  }

  public info(message: string, options?: LogOptions) {
    return this.dispatchLog("INFO", message, options);
  }

  public warn(message: string, options?: LogOptions) {
    return this.dispatchLog("WARN", message, options);
  }

  public error(message: string, options?: LogOptions) {
    return this.dispatchLog("ERROR", message, options);
  }
  
  // Public method to force flush the client batch (e.g. before navigating away)
  public flush() {
    if (!isServer) {
      this.flushClientBatch();
    }
  }
}

export const logger = new Logger();
