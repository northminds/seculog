export interface Logger {
    error(message: string, obj?: Record<string, any>): void;
    secureError(message: string, payload: any): string;
    info(message: string, obj?: Record<string, any>): void;
    warn(message: string, obj?: Record<string, any>): void;
}

export interface LoggerOptions {
    env?: string;
    appName?: string;
    lokiUrl?: string;
    secureUrl?: string;
}

export declare function createLogger(options?: LoggerOptions): Logger;
