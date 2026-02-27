declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export const expect: ((actual: unknown) => {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toMatchObject(obj: object): void;
    toContain(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toThrow(): void;
    toHaveProperty(key: string): void;
    toHaveLength(length: number): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
    [key: string]: unknown;
  }) & {
    any(constructor: unknown): unknown;
    objectContaining(obj: object): unknown;
  };
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export const vi: {
    mock: (path: string, factory: () => unknown) => void;
    fn: <T extends (...args: unknown[]) => unknown>(impl?: T) => T & {
      mockReturnValue: (v: unknown) => T & { toHaveBeenCalledWith(...args: unknown[]): void };
      toHaveBeenCalledWith(...args: unknown[]): void;
    };
  };
}
