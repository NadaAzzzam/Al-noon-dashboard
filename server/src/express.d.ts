import type { Locale } from "./i18n.js";

declare module "express" {
  export interface Request {
    locale?: Locale;
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
    [key: string]: unknown;
  }

  export type NextFunction = (err?: unknown) => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

  export interface StaticOptions {
    etag?: boolean;
    index?: boolean | string | string[];
    lastModified?: boolean;
    maxAge?: number | string;
    redirect?: boolean;
    setHeaders?: (res: Response, path: string, stat: unknown) => void;
  }

  export interface Express {
    (): Application;
    json(options?: { inflate?: boolean; limit?: number | string; reviver?: (key: string, value: unknown) => unknown; strict?: boolean; type?: string | string[] }): RequestHandler;
    static(root: string, options?: StaticOptions): RequestHandler;
  }

  export interface Application {
    disable(setting: string): this;
    use(...handlers: unknown[]): this;
    get(path: string | string[], ...handlers: unknown[]): this;
    post(path: string, ...handlers: unknown[]): this;
    put(path: string, ...handlers: unknown[]): this;
    patch(path: string, ...handlers: unknown[]): this;
    delete(path: string, ...handlers: unknown[]): this;
    listen(port?: number, callback?: () => void): unknown;
    /** @see https://expressjs.com/en/api.html#app.disable */
    set?(setting: string, val?: unknown): this;
  }

  export interface Router {
    use(...handlers: unknown[]): this;
    get(path: string, ...handlers: unknown[]): this;
    post(path: string, ...handlers: unknown[]): this;
    put(path: string, ...handlers: unknown[]): this;
    patch(path: string, ...handlers: unknown[]): this;
    delete(path: string, ...handlers: unknown[]): this;
    [key: string]: unknown;
  }

  const express: Express;
  export default express;
}
