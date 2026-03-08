declare module "pg" {
  export type QueryResult<T = Record<string, unknown>> = {
    rowCount: number | null;
    rows: T[];
  };

  export class Pool {
    constructor(config?: { connectionString?: string; max?: number });

    end(): Promise<void>;
  }

  export class Client {
    constructor(config?: { connectionString?: string });

    connect(): Promise<void>;
    end(): Promise<void>;
    query<T = Record<string, unknown>>(
      text: string,
      values?: unknown[],
    ): Promise<QueryResult<T>>;
  }
}
