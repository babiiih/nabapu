// Minimal local stub of the AxiosError shape used by handle-server-error.
// The real `axios` package is only imported for its type here — it never
// reaches the client bundle. This stub keeps tsc green without a reinstall
// (npm hangs while C: is at 100% disk).
export class AxiosError extends Error {
  status?: number;
  response?: { data?: { title?: string } };
  constructor(message?: string) {
    super(message);
    this.name = 'AxiosError';
  }
}
export default AxiosError;
