import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Extract a safe message from unknown/axios errors for toasts
export function getErrorMessage(error: unknown, fallback: string = "Something went wrong. Please try again."): string {
  // Axios error shape: error.response?.data?.message
  if (typeof error === 'object' && error !== null) {
    const maybeAny = error as { response?: { data?: { message?: string } } ; message?: string };
    const apiMsg = maybeAny.response?.data?.message;
    if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) return apiMsg;
    if (typeof maybeAny.message === 'string' && maybeAny.message.trim().length > 0) return maybeAny.message;
  }
  return fallback;
}