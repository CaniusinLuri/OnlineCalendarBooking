import {
  users,
  calendars,
  bookingPages,
  bookings,
  teams,
  meetings,
  aliasBlacklist,
  userAvailability,
  calendarIntegrations,
  emailVerificationTokens,
  passwordResetTokens,
  type User,
  type InsertUser,
  type Calendar,
  type InsertCalendar,
  type BookingPage,
  type InsertBookingPage,
  type Booking,
  type InsertBooking,
  type Team,
  type InsertTeam,
  type Meeting,
  type InsertMeeting,
  type AliasBlacklist,
  type InsertAliasBlacklist,
  type UserAvailability,
  type InsertUserAvailability,
  type CalendarIntegration,
  type EmailVerificationToken,
  type PasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAlias(alias: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Calendar operations
  getCalendar(id: number): Promise<Calendar | undefined>;
  getUserCalendars(userId: number): Promise<Calendar[]>;
  createCalendar(calendar: InsertCalendar): Promise<Calendar>;
  updateCalendar(id: number, calendar: Partial<InsertCalendar>): Promise<Calendar | undefined>;
  deleteCalendar(id: number): Promise<boolean>;

  // Booking page operations
  getBookingPage(id: number): Promise<BookingPage | undefined>;
  getBookingPageByAlias(userAlias: string, pageAlias: string): Promise<BookingPage | undefined>;
  getUserBookingPages(userId: number): Promise<BookingPage[]>;
  createBookingPage(bookingPage: InsertBookingPage): Promise<BookingPage>;
  updateBookingPage(id: number, bookingPage: Partial<InsertBookingPage>): Promise<BookingPage | undefined>;
  deleteBookingPage(id: number): Promise<boolean>;
  getPendingBookingPages(): Promise<BookingPage[]>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingPageBookings(bookingPageId: number): Promise<Booking[]>;
  getUserBookings(userId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;

  // Team operations
  getTeam(id: number): Promise<Team | undefined>;
  getUserTeams(userId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // Meeting operations
  getMeeting(id: number): Promise<Meeting | undefined>;
  getUserMeetings(userId: number): Promise<Meeting[]>;
  getUserMeetingsInRange(userId: number, startDate: Date, endDate: Date): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: number, meeting: Partial<InsertMeeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: number): Promise<boolean>;

  // Alias blacklist operations
  getBlacklistedAlias(alias: string): Promise<AliasBlacklist | undefined>;
  getAllBlacklistedAliases(): Promise<AliasBlacklist[]>;
  addToBlacklist(blacklistEntry: InsertAliasBlacklist): Promise<AliasBlacklist>;
  removeFromBlacklist(alias: string): Promise<boolean>;

  // User availability operations
  getUserAvailability(userId: number): Promise<UserAvailability[]>;
  setUserAvailability(availability: InsertUserAvailability[]): Promise<UserAvailability[]>;

  // Calendar integration operations
  getCalendarIntegrations(calendarId: number): Promise<CalendarIntegration[]>;
  getUserIntegrations(userId: number): Promise<CalendarIntegration[]>;
  createCalendarIntegration(integration: any): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: number, integration: any): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: number): Promise<boolean>;

  // Email verification operations
  createEmailVerificationToken(token: any): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  markEmailVerificationTokenUsed(token: string): Promise<boolean>;

  // Password reset operations
  createPasswordResetToken(token: any): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(userId: number): Promise<{
    todayMeetings: number;
    pendingBookings: number;
    activeTeams: number;
    syncedCalendars: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByAlias(alias: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.alias, alias));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [user] = await db.update(users)
        .set({ 
          ...updateData,
          updatedAt: new Date() 
        })
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Update user error:****************************", error);
      return undefined;
    }
  }
  

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  // Calendar operations
  async getCalendar(id: number): Promise<Calendar | undefined> {
    const [calendar] = await db.select().from(calendars).where(eq(calendars.id, id));
    return calendar || undefined;
  }

  async getUserCalendars(userId: number): Promise<Calendar[]> {
    return await db.select().from(calendars).where(eq(calendars.userId, userId)).orderBy(desc(calendars.isPrimary), asc(calendars.alias));
  }

  async createCalendar(calendar: InsertCalendar): Promise<Calendar> {
    const [newCalendar] = await db.insert(calendars).values(calendar).returning();
    return newCalendar;
  }

  async updateCalendar(id: number, updateData: Partial<InsertCalendar>): Promise<Calendar | undefined> {
    const [calendar] = await db.update(calendars).set({ ...updateData, updatedAt: new Date() }).where(eq(calendars.id, id)).returning();
    return calendar || undefined;
  }

  async deleteCalendar(id: number): Promise<boolean> {
    const result = await db.delete(calendars).where(eq(calendars.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Booking page operations
  async getBookingPage(id: number): Promise<BookingPage | undefined> {
    const [bookingPage] = await db.select().from(bookingPages).where(eq(bookingPages.id, id));
    return bookingPage || undefined;
  }

  async getBookingPageByAlias(userAlias: string, pageAlias: string): Promise<BookingPage | undefined> {
    const [bookingPage] = await db
      .select()
      .from(bookingPages)
      .innerJoin(users, eq(bookingPages.userId, users.id))
      .where(and(eq(users.alias, userAlias), eq(bookingPages.alias, pageAlias), eq(bookingPages.isActive, true), eq(bookingPages.isApproved, true)));
    return bookingPage?.booking_pages || undefined;
  }

  async getUserBookingPages(userId: number): Promise<BookingPage[]> {
    return await db.select().from(bookingPages).where(eq(bookingPages.userId, userId)).orderBy(asc(bookingPages.alias));
  }

  async createBookingPage(bookingPage: InsertBookingPage): Promise<BookingPage> {
    const [newBookingPage] = await db.insert(bookingPages).values(bookingPage).returning();
    return newBookingPage;
  }

  async updateBookingPage(id: number, updateData: Partial<InsertBookingPage>): Promise<BookingPage | undefined> {
    const [bookingPage] = await db.update(bookingPages).set({ ...updateData, updatedAt: new Date() }).where(eq(bookingPages.id, id)).returning();
    return bookingPage || undefined;
  }

  async deleteBookingPage(id: number): Promise<boolean> {
    const result = await db.delete(bookingPages).where(eq(bookingPages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPendingBookingPages(): Promise<BookingPage[]> {
    return await db.select().from(bookingPages).where(eq(bookingPages.isApproved, false)).orderBy(asc(bookingPages.createdAt));
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingPageBookings(bookingPageId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.bookingPageId, bookingPageId)).orderBy(desc(bookings.startTime));
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .innerJoin(bookingPages, eq(bookings.bookingPageId, bookingPages.id))
      .where(eq(bookingPages.userId, userId))
      .orderBy(desc(bookings.startTime));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, updateData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set({ ...updateData, updatedAt: new Date() }).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.userId, userId)).orderBy(asc(teams.name));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, updateData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db.update(teams).set({ ...updateData, updatedAt: new Date() }).where(eq(teams.id, id)).returning();
    return team || undefined;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.delete(teams).where(eq(teams.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Meeting operations
  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting || undefined;
  }

  async getUserMeetings(userId: number): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(desc(meetings.startTime));
  }

  async getUserMeetingsInRange(userId: number, startDate: Date, endDate: Date): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.userId, userId), and(eq(meetings.startTime, startDate), eq(meetings.endTime, endDate))))
      .orderBy(asc(meetings.startTime));
  }

  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async updateMeeting(id: number, updateData: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [meeting] = await db.update(meetings).set({ ...updateData, updatedAt: new Date() }).where(eq(meetings.id, id)).returning();
    return meeting || undefined;
  }

  async deleteMeeting(id: number): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Alias blacklist operations
  async getBlacklistedAlias(alias: string): Promise<AliasBlacklist | undefined> {
    const [blacklistedAlias] = await db.select().from(aliasBlacklist).where(eq(aliasBlacklist.alias, alias));
    return blacklistedAlias || undefined;
  }

  async getAllBlacklistedAliases(): Promise<AliasBlacklist[]> {
    return await db.select().from(aliasBlacklist).orderBy(asc(aliasBlacklist.alias));
  }

  async addToBlacklist(blacklistEntry: InsertAliasBlacklist): Promise<AliasBlacklist> {
    const [newEntry] = await db.insert(aliasBlacklist).values(blacklistEntry).returning();
    return newEntry;
  }

  async removeFromBlacklist(alias: string): Promise<boolean> {
    const result = await db.delete(aliasBlacklist).where(eq(aliasBlacklist.alias, alias));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User availability operations
  async getUserAvailability(userId: number): Promise<UserAvailability[]> {
    return await db
      .select()
      .from(userAvailability)
      .where(eq(userAvailability.userId, userId))
      .orderBy(asc(userAvailability.dayOfWeek));
  }

  async setUserAvailability(availability: InsertUserAvailability[]): Promise<UserAvailability[]> {
    // First delete existing availability for the user
    await db
      .delete(userAvailability)
      .where(eq(userAvailability.userId, availability[0].userId));

    // Then insert new availability
    const result = await db
      .insert(userAvailability)
      .values(availability)
      .returning();

    return result;
  }

  // Calendar integration operations
  async getCalendarIntegrations(calendarId: number): Promise<CalendarIntegration[]> {
    return await db.select().from(calendarIntegrations).where(eq(calendarIntegrations.calendarId, calendarId));
  }

  async getUserIntegrations(userId: number): Promise<CalendarIntegration[]> {
    return await db
      .select()
      .from(calendarIntegrations)
      .innerJoin(calendars, eq(calendarIntegrations.calendarId, calendars.id))
      .where(eq(calendars.userId, userId));
  }

  async createCalendarIntegration(integration: any): Promise<CalendarIntegration> {
    const [newIntegration] = await db.insert(calendarIntegrations).values(integration).returning();
    return newIntegration;
  }

  async updateCalendarIntegration(id: number, updateData: any): Promise<CalendarIntegration | undefined> {
    const [integration] = await db.update(calendarIntegrations).set({ ...updateData, updatedAt: new Date() }).where(eq(calendarIntegrations.id, id)).returning();
    return integration || undefined;
  }

  async deleteCalendarIntegration(id: number): Promise<boolean> {
    const result = await db.delete(calendarIntegrations).where(eq(calendarIntegrations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Email verification operations
  async createEmailVerificationToken(token: any): Promise<EmailVerificationToken> {
    const [newToken] = await db.insert(emailVerificationTokens).values(token).returning();
    return newToken;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [verificationToken] = await db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
    return verificationToken || undefined;
  }

  async markEmailVerificationTokenUsed(token: string): Promise<boolean> {
    const result = await db.update(emailVerificationTokens).set({ used: true }).where(eq(emailVerificationTokens.token, token));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Password reset operations
  async createPasswordResetToken(token: any): Promise<PasswordResetToken> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markPasswordResetTokenUsed(token: string): Promise<boolean> {
    const result = await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Dashboard stats
  async getDashboardStats(userId: number): Promise<{
    todayMeetings: number;
    pendingBookings: number;
    activeTeams: number;
    syncedCalendars: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's meetings count
    const todayMeetingsResult = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.userId, userId), and(eq(meetings.startTime, today), eq(meetings.startTime, tomorrow))));

    // Get pending bookings count
    const pendingBookingsResult = await db
      .select()
      .from(bookings)
      .innerJoin(bookingPages, eq(bookings.bookingPageId, bookingPages.id))
      .where(and(eq(bookingPages.userId, userId), eq(bookings.status, "confirmed")));

    // Get active teams count
    const activeTeamsResult = await db.select().from(teams).where(eq(teams.userId, userId));

    // Get synced calendars count
    const syncedCalendarsResult = await db
      .select()
      .from(calendarIntegrations)
      .innerJoin(calendars, eq(calendarIntegrations.calendarId, calendars.id))
      .where(and(eq(calendars.userId, userId), eq(calendarIntegrations.isActive, true)));

    return {
      todayMeetings: todayMeetingsResult.length,
      pendingBookings: pendingBookingsResult.length,
      activeTeams: activeTeamsResult.length,
      syncedCalendars: syncedCalendarsResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
