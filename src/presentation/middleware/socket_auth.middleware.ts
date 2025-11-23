import { Socket } from 'socket.io';
import { AuthenticatedSocket } from '../../infrastructure/config/server/socket.config';

/**
 * Socket authentication middleware helper
 * Checks if socket is authenticated
 */
export function isSocketAuthenticated(socket: Socket): socket is AuthenticatedSocket {
  const authSocket = socket as AuthenticatedSocket;
  return !!authSocket.data?.user;
}

/**
 * Gets user payload from authenticated socket
 */
export function getSocketUser(socket: Socket): { userId: string; email: string; role?: string } | null {
  const authSocket = socket as AuthenticatedSocket;
  return authSocket.data?.user || null;
}

