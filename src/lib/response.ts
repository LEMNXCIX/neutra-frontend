export async function readJsonResponse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    return (await response.json().catch(() => ({}))) as T;
  }

  return (await response.json()) as T;
}
