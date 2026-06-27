/**
 * Typed BroadcastChannel message protocol for cross-tab communication
 * between the Voice Simulator (elderly phone) and Guardian Dashboard.
 */

export type AloXeMessage =
  | {
      type: "BOOKING_STARTED";
      payload: {
        destination: string;
        price: number;
        provider: string;
      };
    }
  | {
      type: "DRIVER_ASSIGNED";
      payload: {
        driverName: string;
        plate: string;
        eta: number;
        provider: string;
      };
    }
  | {
      type: "DRIVER_ARRIVED";
      payload: {
        driverName: string;
        plate: string;
        provider: string;
      };
    }
  | { type: "TRIP_COMPLETED" }
  | {
      type: "REMOTE_BOOKING";
      payload: {
        destination: string;
        provider: string;
        price: number;
        eta: number;
      };
    }
  | { type: "CANCEL_TRIP" };

/** Type-safe helper to post a message to the BroadcastChannel */
export function postAloXeMessage(
  channel: BroadcastChannel | null,
  message: AloXeMessage,
) {
  if (channel) {
    channel.postMessage(message);
  }
}
