/**
 * Random id used only to recognise a retry of the same bill (idempotency key).
 * It is not a secret, so Math.random is good enough.
 */
export function newClientRef(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
