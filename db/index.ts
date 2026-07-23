export function getDb() {
  throw new Error(
    "This local React app does not use a database connection. Remove this helper or wire in your own persistence layer."
  );
}
