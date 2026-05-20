/** JSON success response in the project-wide `{ data, error }` envelope. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data, error: null }, { status });
}

/** JSON error response. */
export function err(message: string, status = 400): Response {
  return Response.json({ data: null, error: message }, { status });
}
