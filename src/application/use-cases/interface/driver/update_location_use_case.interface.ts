export interface LocationUpdatePayload {
  reservationId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: string; // ISO string from client (optional, server will override)
}

export interface IUpdateLocationUseCase {
  execute(driverId: string, payload: LocationUpdatePayload): Promise<void>;
}

