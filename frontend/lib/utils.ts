import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// WebSocket utility functions
export const getWebSocketErrorMessage = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 1000:
        return "Connection closed normally";
      case 1001:
        return "Connection lost due to page navigation";
      case 1006:
        return "Connection lost unexpectedly. Please check your internet connection.";
      case 1011:
        return "Server encountered an error. Please try again later.";
      case 1012:
        return "Server is restarting. Please wait a moment and try again.";
      default:
        return `Connection error (${error.code}). Please try again.`;
    }
  }

  if (error?.message) {
    return error.message;
  }

  return "Unable to connect to chat service. Please check your connection and try again.";
};

export const getConnectionStatusMessage = (
  isConnected: boolean,
  isConnecting: boolean,
  connectionError: string | null
): { message: string; type: "success" | "warning" | "error" | "info" } => {
  if (connectionError) {
    return {
      message: connectionError,
      type: "error",
    };
  }

  if (isConnecting) {
    return {
      message: "Connecting to chat service...",
      type: "info",
    };
  }

  if (isConnected) {
    return {
      message: "Connected to chat service",
      type: "success",
    };
  }

  return {
    message: "Not connected to chat service",
    type: "warning",
  };
};
