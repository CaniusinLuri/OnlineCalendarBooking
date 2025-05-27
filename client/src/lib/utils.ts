import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + duration);
  }
  
  return slots;
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateBookingUrl(userAlias: string, pageAlias: string): string {
  const baseUrl = import.meta.env.VITE_BASE_URL || 'https://smartcal.one';
  return `${baseUrl}/${userAlias}.${pageAlias}`;
}

export function calculateBufferTimes(meetingType: 'virtual' | 'in_person', duration: number) {
  const buffers = {
    virtual: { before: 5, after: 5 },
    in_person: { before: 30, after: 15 }
  };
  
  return buffers[meetingType] || buffers.virtual;
}

export function convertToUserTimezone(date: Date | string, timezone: string): Date {
  const d = new Date(date);
  return new Date(d.toLocaleString("en-US", { timeZone: timezone }));
}

export function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0 = Sunday, 1 = Monday, etc.
}

export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function getAvailableTimeSlots(
  availability: { startTime: string; endTime: string }[],
  existingBookings: { startTime: Date; endTime: Date }[],
  duration: number,
  bufferBefore: number = 0,
  bufferAfter: number = 0
): string[] {
  const slots: string[] = [];
  
  availability.forEach(({ startTime, endTime }) => {
    const baseSlots = getTimeSlots(startTime, endTime, duration + bufferBefore + bufferAfter);
    
    baseSlots.forEach(slot => {
      const slotStart = new Date(`2000-01-01T${slot}:00`);
      const slotEnd = addMinutes(slotStart, duration);
      
      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });
      
      if (!hasConflict) {
        slots.push(slot);
      }
    });
  });
  
  return slots;
}

export function validateAliasFormat(alias: string): boolean {
  // Alias should be alphanumeric, lowercase, with optional hyphens/underscores
  const aliasRegex = /^[a-z0-9_-]+$/;
  return aliasRegex.test(alias) && alias.length >= 3 && alias.length <= 50;
}

export function sanitizeAlias(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 50);
}
