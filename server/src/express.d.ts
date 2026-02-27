declare module "express" {
  export interface Request {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
    [key: string]: unknown;
  }

  export interface Response {
    status?: (code: number) => Response & { toHaveBeenCalledWith?(...args: unknown[]): void };
    json?: (body?: unknown) => Response & { toHaveBeenCalledWith?(...args: unknown[]): void };
    send?: (body?: unknown) => Response & { toHaveBeenCalledWith?(...args: unknown[]): void };
    [key: string]: unknown;
  }

  export type NextFunction = (err?: unknown) => void;
  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

  export interface Application {
    use(...handlers: unknown[]): this;
    get(path: string, ...handlers: unknown[]): this;
    post(path: string, ...handlers: unknown[]): this;
    put(path: string, ...handlers: unknown[]): this;
    patch(path: string, ...handlers: unknown[]): this;
    delete(path: string, ...handlers: unknown[]): this;
    listen(port?: number, callback?: () => void): unknown;
    [key: string]: unknown;
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

  function express(): Application;
  export default express;
}
