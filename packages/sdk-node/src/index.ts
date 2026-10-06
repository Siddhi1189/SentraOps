import http from 'http';
import https from 'https';

export interface Breadcrumb {
  category: 'console' | 'http' | 'custom';
  message: string;
  level?: 'info' | 'warning' | 'error' | 'debug';
  data?: Record<string, any>;
  timestamp: string;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}

export interface RequestContext {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  [key: string]: any;
}

export interface CaptureOptions {
  tags?: Record<string, string>;
  user?: UserContext;
  extra?: Record<string, any>;
  request?: RequestContext;
  level?: 'error' | 'warning' | 'info';
}

export interface SentraOpsOptions {
  dsn: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  autoCaptureExceptions?: boolean;
  autoCaptureRejections?: boolean;
  captureBreadcrumbs?: boolean;
  maxBreadcrumbs?: number;
}

export interface ParsedDsn {
  apiKey: string;
  host: string;
  protocol: string;
  projectId: string;
  ingestUrl: string;
}

const MAX_BREADCRUMBS = 20;
const MAX_QUEUE_SIZE = 30;

class SentraOpsClient {
  private options: SentraOpsOptions | null = null;
  private dsn: ParsedDsn | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private retryQueue: Array<{ payload: any; attempts: number }> = [];
  private isProcessingQueue = false;
  private isInitialized = false;

  public init(options: SentraOpsOptions): void {
    if (!options || !options.dsn) {
      console.warn('[SentraOps] DSN is required to initialize SentraOps SDK.');
      return;
    }

    try {
      this.dsn = this.parseDsn(options.dsn);
    } catch (err: any) {
      console.warn(`[SentraOps] Failed to parse DSN: ${err.message}`);
      return;
    }

    this.options = {
      sampleRate: 1.0,
      autoCaptureExceptions: true,
      autoCaptureRejections: true,
      captureBreadcrumbs: true,
      maxBreadcrumbs: MAX_BREADCRUMBS,
      ...options,
    };

    if (this.options.captureBreadcrumbs) {
      this.instrumentConsole();
      this.instrumentHttp();
    }

    if (this.options.autoCaptureExceptions) {
      this.instrumentUncaughtExceptions();
    }

    if (this.options.autoCaptureRejections) {
      this.instrumentUnhandledRejections();
    }

    this.isInitialized = true;
  }

  public parseDsn(dsn: string): ParsedDsn {
    const url = new URL(dsn);
    const apiKey = url.username;
    if (!apiKey) {
      throw new Error('Invalid DSN: Missing API key in username component');
    }

    const host = url.host;
    const protocol = url.protocol;
    const projectId = url.pathname.replace(/^\/+/, '');

    if (!projectId) {
      throw new Error('Invalid DSN: Missing project ID in path');
    }

    const ingestUrl = `${protocol}//${host}/api/ingest/events`;

    return {
      apiKey,
      host,
      protocol,
      projectId,
      ingestUrl,
    };
  }

  public addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const max = this.options?.maxBreadcrumbs || MAX_BREADCRUMBS;
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });
    if (this.breadcrumbs.length > max) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  public captureException(error: any, options: CaptureOptions = {}): string | null {
    if (!this.isInitialized || !this.dsn || !this.options) {
      return null;
    }

    // Sample rate check
    if (typeof this.options.sampleRate === 'number' && this.options.sampleRate < 1.0) {
      if (Math.random() > this.options.sampleRate) {
        return null;
      }
    }

    const errObj = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
    const type = error?.name || errObj.name || 'Error';
    const message = error?.message || errObj.message || 'Unknown error';
    const stack = error?.stack || errObj.stack || '';

    const payload = {
      projectId: this.dsn.projectId,
      type,
      message,
      stack,
      environment: this.options.environment || 'production',
      release: this.options.release || null,
      level: options.level || 'error',
      tags: { ...(options.tags || {}), ...(options.extra ? { extra: JSON.stringify(options.extra) } : {}) },
      breadcrumbs: this.getBreadcrumbs(),
      user: options.user || null,
      request: options.request || null,
      occurredAt: new Date().toISOString(),
    };

    this.sendEvent(payload);
    return payload.occurredAt;
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', options: CaptureOptions = {}): string | null {
    if (!this.isInitialized || !this.dsn || !this.options) {
      return null;
    }

    if (typeof this.options.sampleRate === 'number' && this.options.sampleRate < 1.0) {
      if (Math.random() > this.options.sampleRate) {
        return null;
      }
    }

    const dummyError = new Error(message);

    const payload = {
      projectId: this.dsn.projectId,
      type: 'Message',
      message,
      stack: dummyError.stack || '',
      environment: this.options.environment || 'production',
      release: this.options.release || null,
      level,
      tags: { ...(options.tags || {}), ...(options.extra ? { extra: JSON.stringify(options.extra) } : {}) },
      breadcrumbs: this.getBreadcrumbs(),
      user: options.user || null,
      request: options.request || null,
      occurredAt: new Date().toISOString(),
    };

    this.sendEvent(payload);
    return payload.occurredAt;
  }

  public expressErrorHandler() {
    return (err: any, req: any, res: any, next: (err?: any) => void) => {
      try {
        const requestData: RequestContext = {
          url: req.originalUrl || req.url,
          method: req.method,
          headers: req.headers ? { ...req.headers } : undefined,
          query: req.query ? { ...req.query } : undefined,
        };

        if (requestData.headers) {
          delete requestData.headers['authorization'];
          delete requestData.headers['cookie'];
          delete requestData.headers['x-sentraops-key'];
        }

        const user = req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : undefined;

        this.captureException(err, {
          request: requestData,
          user,
        });
      } catch {
        // Never fail inside error handler
      }

      next(err);
    };
  }

  private sendEvent(payload: any): void {
    if (!this.dsn) return;

    // Fire and forget non-blocking delivery
    this.dispatch(payload).catch(() => {
      this.enqueueRetry(payload);
    });
  }

  private async dispatch(payload: any): Promise<void> {
    if (!this.dsn) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(this.dsn.ingestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sentraops-key': this.dsn.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok && response.status >= 500) {
        throw new Error(`Ingest responded with status ${response.status}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private enqueueRetry(payload: any): void {
    if (this.retryQueue.length >= MAX_QUEUE_SIZE) {
      this.retryQueue.shift(); // Drop oldest when full
    }
    this.retryQueue.push({ payload, attempts: 1 });
    this.scheduleQueueFlush();
  }

  private scheduleQueueFlush(): void {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    setTimeout(async () => {
      try {
        while (this.retryQueue.length > 0) {
          const item = this.retryQueue.shift();
          if (!item) break;
          try {
            await this.dispatch(item.payload);
          } catch {
            if (item.attempts < 3) {
              this.retryQueue.push({ payload: item.payload, attempts: item.attempts + 1 });
            }
            break; // Stop flushing this turn on failure
          }
        }
      } finally {
        this.isProcessingQueue = false;
        if (this.retryQueue.length > 0) {
          this.scheduleQueueFlush();
        }
      }
    }, 5000);
  }

  private instrumentConsole(): void {
    const levels: Array<'log' | 'info' | 'warn' | 'error'> = ['log', 'info', 'warn', 'error'];
    for (const level of levels) {
      const original = console[level];
      console[level] = (...args: any[]) => {
        try {
          const message = args
            .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');
          this.addBreadcrumb({
            category: 'console',
            level: level === 'log' ? 'info' : level === 'warn' ? 'warning' : level,
            message: message.slice(0, 1000),
          });
        } catch {
          // Ignore breadcrumb capture error
        }
        return original.apply(console, args);
      };
    }
  }

  private instrumentHttp(): void {
    const wrapRequest = (module: typeof http | typeof https) => {
      const originalRequest = module.request;
      // @ts-ignore
      module.request = (...args: any[]) => {
        try {
          let urlStr = '';
          let method = 'GET';
          if (typeof args[0] === 'string') {
            urlStr = args[0];
            if (args[1] && typeof args[1] === 'object' && args[1].method) {
              method = args[1].method;
            }
          } else if (args[0] instanceof URL) {
            urlStr = args[0].toString();
            if (args[1] && typeof args[1] === 'object' && args[1].method) {
              method = args[1].method;
            }
          } else if (args[0] && typeof args[0] === 'object') {
            const host = args[0].host || args[0].hostname || 'localhost';
            const path = args[0].path || '/';
            method = args[0].method || 'GET';
            urlStr = `${host}${path}`;
          }

          // Do not create breadcrumbs for SentraOps's own ingest calls
          if (this.dsn && urlStr.includes(this.dsn.host)) {
            // @ts-ignore
            return originalRequest.apply(module, args);
          }

          this.addBreadcrumb({
            category: 'http',
            level: 'info',
            message: `${method.toUpperCase()} ${urlStr}`,
            data: { method, url: urlStr },
          });
        } catch {
          // Ignore
        }
        // @ts-ignore
        return originalRequest.apply(module, args);
      };
    };

    try {
      wrapRequest(http);
      wrapRequest(https);
    } catch {
      // Ignore
    }
  }

  private instrumentUncaughtExceptions(): void {
    process.on('uncaughtException', (err: any) => {
      try {
        this.captureException(err, { tags: { uncaught: 'true' } });
      } catch {
        // Ignore
      }
    });
  }

  private instrumentUnhandledRejections(): void {
    process.on('unhandledRejection', (reason: any) => {
      try {
        this.captureException(reason, { tags: { unhandledRejection: 'true' } });
      } catch {
        // Ignore
      }
    });
  }
}

const client = new SentraOpsClient();

export const init = client.init.bind(client);
export const captureException = client.captureException.bind(client);
export const captureMessage = client.captureMessage.bind(client);
export const expressErrorHandler = client.expressErrorHandler.bind(client);
export const addBreadcrumb = client.addBreadcrumb.bind(client);
export const getBreadcrumbs = client.getBreadcrumbs.bind(client);
export const clearBreadcrumbs = client.clearBreadcrumbs.bind(client);
export const parseDsn = client.parseDsn.bind(client);

export default {
  init,
  captureException,
  captureMessage,
  expressErrorHandler,
  addBreadcrumb,
  getBreadcrumbs,
  clearBreadcrumbs,
  parseDsn,
};
