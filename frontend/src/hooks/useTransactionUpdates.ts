// frontend/src/hooks/useTransactionUpdates.ts
//
// Subscribes to the backend's TransactionsGateway over a WebSocket and calls
// back for every 'transaction' event pushed to the current user — the push
// side of what GET /transactions returns, same shape, so callers can treat a
// live event exactly like a row from that endpoint.

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { baseURL } from '../api/axiosInstance';

export interface RealtimeTransaction {
  id: number;
  amount: number;
  createdAt: string;
  direction: 'IN' | 'OUT';
  counterpartyEmail: string;
}

/**
 * @param onTransaction called with each pushed transaction. Read fresh on
 * every call via a ref, so passing an inline arrow function every render
 * does not tear down and reopen the socket — only mount/unmount and a token
 * change do that.
 */
export function useTransactionUpdates(onTransaction: (tx: RealtimeTransaction) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onTransaction);
  handlerRef.current = onTransaction;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: Socket = io(baseURL, {
      auth: { token },
      // Skip the long-polling fallback: on localhost there is no proxy that
      // would need it, and it only delays the first connection attempt.
      transports: ['websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('transaction', (tx: RealtimeTransaction) => handlerRef.current(tx));

    return () => {
      socket.disconnect();
    };
    // Intentionally just [] — this reads the token once per mount. A token
    // that changes without a full remount (e.g. a fresh login after logout)
    // is already followed by a navigation that remounts the page tree.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected };
}
