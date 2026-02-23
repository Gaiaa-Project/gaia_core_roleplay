import { CallbackConfig } from '@/shared/config/callback_config';
import { GenerateUUID } from '@/shared/lib/callback/uuid';
import {
  CALLBACK_EVENTS,
  type PendingCallback,
  type ServerCallbackHandler,
} from '@/shared/lib/callback/types';

const pendingCallbacks = new Map<string, PendingCallback>();
const registeredCallbacks = new Map<string, ServerCallbackHandler>();

onNet(
  CALLBACK_EVENTS.CLIENT_RESPONSE,
  (requestId: string, success: boolean, ...args: unknown[]) => {
    const pending = pendingCallbacks.get(requestId);
    if (!pending) return;

    pendingCallbacks.delete(requestId);
    clearTimeout(pending.timeout);

    if (success) {
      pending.resolve(args[0]);
    } else {
      pending.reject(new Error(args[0] as string));
    }
  },
);

onNet(
  CALLBACK_EVENTS.SERVER_REQUEST,
  async (requestId: string, eventName: string, ...args: unknown[]) => {
    const sessionId = source;
    const handler = registeredCallbacks.get(eventName);

    if (!handler) {
      emitNet(
        CALLBACK_EVENTS.SERVER_RESPONSE,
        sessionId,
        requestId,
        false,
        `Callback '${eventName}' not registered`,
      );
      return;
    }

    try {
      const result = await handler(sessionId, ...args);
      emitNet(CALLBACK_EVENTS.SERVER_RESPONSE, sessionId, requestId, true, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      emitNet(CALLBACK_EVENTS.SERVER_RESPONSE, sessionId, requestId, false, message);
    }
  },
);

export function TriggerClientCallback<T = unknown>(
  sessionId: number,
  eventName: string,
  ...args: unknown[]
): Promise<T> {
  const requestId = GenerateUUID();
  const timeout = CallbackConfig.timeout;

  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      pendingCallbacks.delete(requestId);
      reject(new Error(`Callback '${eventName}' timed out after ${timeout}ms`));
    }, timeout);

    pendingCallbacks.set(requestId, {
      resolve: resolve as (value: unknown) => void,
      reject,
      timeout: timeoutHandle,
    });

    emitNet(CALLBACK_EVENTS.CLIENT_REQUEST, sessionId, requestId, eventName, ...args);
  });
}

export function RegisterServerCallback<T = unknown, A extends unknown[] = unknown[]>(
  eventName: string,
  handler: ServerCallbackHandler<T, A>,
): void {
  registeredCallbacks.set(eventName, handler as ServerCallbackHandler);
}

export function UnregisterServerCallback(eventName: string): boolean {
  return registeredCallbacks.delete(eventName);
}

export function IsServerCallbackRegistered(eventName: string): boolean {
  return registeredCallbacks.has(eventName);
}
