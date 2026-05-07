export interface ProcurementApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}
