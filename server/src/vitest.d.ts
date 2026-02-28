declare module "vitest" {
  type ExpectMatchers = {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toMatchObject(obj: object): void;
    toContain(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toThrow(): void;
    toHaveProperty(key: string, value?: unknown): void;
    toHaveLength(length: number): void;
    toHaveBeenCalledWith(...args: unknown[]): void;
  };

  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  export const expect: ((actual: unknown) => ExpectMatchers & { not: ExpectMatchers }) & {
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
