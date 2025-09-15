export interface Logger {
    error(message: string, obj?: Record<string, any>): void;
    secureError(message: string, payload: any): string;
    info(...args: any[]): void;
    warn(...args: any[]): void;
}

export interface LoggerOptions {
    env?: string;
    appName?: string;
    lokiUrl?: string;
    secureUrl?: string;
}

export declare function createLogger(options?: LoggerOptions): Logger;