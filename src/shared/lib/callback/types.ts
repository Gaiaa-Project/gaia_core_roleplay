export type CallbackHandler<T = unknown, A extends unknown[] = unknown[]> = (
  ...args: A
) => T | Promise<T>;

export type ServerCallbackHandler<T = unknown, A extends unknown[] = unknown[]> = (
  sessionId: number,
  ...args: A
) => T | Promise<T>;

export interface PendingCallback<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export const CALLBACK_EVENTS = {
  SERVER_REQUEST: '__gaia_cb_server_req',
  SERVER_RESPONSE: '__gaia_cb_server_res',
  CLIENT_REQUEST: '__gaia_cb_client_req',
  CLIENT_RESPONSE: '__gaia_cb_client_res',
} as const;
