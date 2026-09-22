import { strings } from '@/constants/strings';

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  name?: unknown;
}

const asErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : {};

/** True when the phone had no internet (so we can show a Retry hint). */
export function isNetworkError(error: unknown): boolean {
  const { message, name } = asErrorLike(error);
  const text = `${typeof name === 'string' ? name : ''} ${typeof message === 'string' ? message : ''}`;
  return /network request failed|failed to fetch|network error|timeout|fetch failed|AuthRetryableFetchError/i.test(
    text,
  );
}

/**
 * Turns any error into a short, friendly sentence.
 * Our own database messages (raised with "raise exception", code P0001)
 * are already written in simple English, so they are shown as they are.
 */
export function friendlyError(error: unknown): string {
  if (isNetworkError(error)) return strings.common.networkError;
  const { message, code } = asErrorLike(error);
  if (code === 'P0001' && typeof message === 'string' && message.trim() !== '') return message;
  if (code === '23505') return 'This already exists.';
  if (code === '42501') return strings.common.noAccessBody;
  return strings.common.unknownError;
}
