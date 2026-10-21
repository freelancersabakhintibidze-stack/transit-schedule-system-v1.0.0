/**
 * Typed errors raised by the data layer. The application treats these as
 * operational signals, not crashes: the global error handler surfaces a
 * dismissible banner and the UI degrades to safe empty states.
 */

/** Raised when a dataset fails integrity validation beyond repair. */
export class DataIntegrityError extends Error {
  readonly problems: readonly string[];

  constructor(message: string, problems: readonly string[] = []) {
    super(message);
    this.name = 'DataIntegrityError';
    this.problems = problems;
  }
}
