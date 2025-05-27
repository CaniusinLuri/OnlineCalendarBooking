import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  alias: text("alias").unique(),
  profileDescription: text("profile_description"),
  profileImage: text("profile_image"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'super_admin'
  timezone: text("timezone").notNull().default("UTC"),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  defaultCalendarCount: integer("default_calendar_count").default(3),
  defaultBookingPageCount: integer("default_booking_page_count").default(2),
  defaultTeamCount: integer("default_team_count").default(3),
  receiveAgendaEmail: boolean("receive_agenda_email").default(true),
  agendaEmailTime: text("agenda_email_time").default("09:00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendars table
export const calendars = pgTable("calendars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
  isPrimary: boolean("is_primary").default(false),
  syncEnabled: boolean("sync_enabled").default(false),
  syncDirection: text("sync_direction").default("one_way"), // 'one_way' | 'two_way'
  titleReplacement: text("title_replacement").default("prefix"), // 'replace' | 'prefix'
  titlePrefix: text("title_prefix"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar integrations
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  calendarId: integer("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google' | 'microsoft' | 'apple' | 'mailcow' | 'ical'
  externalCalendarId: text("external_calendar_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Booking pages
export const bookingPages = pgTable("booking_pages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  calendarId: integer("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  alias: text("alias").notNull(),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  duration: integer("duration").notNull().default(30), // minutes
  bufferBefore: integer("buffer_before").default(0), // minutes
  bufferAfter: integer("buffer_after").default(0), // minutes
  maxBookingsPerVisitor: integer("max_bookings_per_visitor").default(5),
  description: text("description"),
  availableSlots: jsonb("available_slots"), // JSON array of time slots
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingPageId: integer("booking_page_id").notNull().references(() => bookingPages.id, { onDelete: "cascade" }),
  visitorEmail: text("visitor_email").notNull(),
  visitorName: text("visitor_name"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("confirmed"), // 'confirmed' | 'cancelled' | 'completed'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  emails: text("emails").array(), // Array of email addresses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meetings table
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  calendarId: integer("calendar_id").notNull().references(() => calendars.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetingType: text("meeting_type").notNull().default("virtual"), // 'virtual' | 'in_person'
  location: text("location"),
  videoUrl: text("video_url"),
  participants: text("participants").array(), // Array of email addresses
  bufferBefore: integer("buffer_before").default(0), // minutes
  bufferAfter: integer("buffer_after").default(0), // minutes
  travelBuffer: integer("travel_buffer").default(0), // minutes for in-person meetings
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'completed' | 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alias blacklist table
export const aliasBlacklist = pgTable("alias_blacklist", {
  id: serial("id").primaryKey(),
  alias: text("alias").notNull().unique(),
  reason: text("reason"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User availability
export const userAvailability = pgTable("user_availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // 24-hour format "HH:MM"
  endTime: text("end_time").notNull(), // 24-hour format "HH:MM"
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  calendars: many(calendars),
  bookingPages: many(bookingPages),
  teams: many(teams),
  meetings: many(meetings),
  availability: many(userAvailability),
}));

export const calendarsRelations = relations(calendars, ({ one, many }) => ({
  user: one(users, {
    fields: [calendars.userId],
    references: [users.id],
  }),
  integrations: many(calendarIntegrations),
  bookingPages: many(bookingPages),
  meetings: many(meetings),
}));

export const calendarIntegrationsRelations = relations(calendarIntegrations, ({ one }) => ({
  calendar: one(calendars, {
    fields: [calendarIntegrations.calendarId],
    references: [calendars.id],
  }),
}));

export const bookingPagesRelations = relations(bookingPages, ({ one, many }) => ({
  user: one(users, {
    fields: [bookingPages.userId],
    references: [users.id],
  }),
  calendar: one(calendars, {
    fields: [bookingPages.calendarId],
    references: [calendars.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  bookingPage: one(bookingPages, {
    fields: [bookings.bookingPageId],
    references: [bookingPages.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  user: one(users, {
    fields: [teams.userId],
    references: [users.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  calendar: one(calendars, {
    fields: [meetings.calendarId],
    references: [calendars.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertCalendarSchema = createInsertSchema(calendars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCalendarSchema = createSelectSchema(calendars);

export const insertBookingPageSchema = createInsertSchema(bookingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectBookingPageSchema = createSelectSchema(bookingPages);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectBookingSchema = createSelectSchema(bookings);

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTeamSchema = createSelectSchema(teams);

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectMeetingSchema = createSelectSchema(meetings);

export const insertAliasBlacklistSchema = createInsertSchema(aliasBlacklist).omit({
  id: true,
  createdAt: true,
});

export const selectAliasBlacklistSchema = createSelectSchema(aliasBlacklist);

export const insertUserAvailabilitySchema = createInsertSchema(userAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserAvailabilitySchema = createSelectSchema(userAvailability);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCalendar = z.infer<typeof insertCalendarSchema>;
export type Calendar = typeof calendars.$inferSelect;
export type InsertBookingPage = z.infer<typeof insertBookingPageSchema>;
export type BookingPage = typeof bookingPages.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertAliasBlacklist = z.infer<typeof insertAliasBlacklistSchema>;
export type AliasBlacklist = typeof aliasBlacklist.$inferSelect;
export type InsertUserAvailability = z.infer<typeof insertUserAvailabilitySchema>;
export type UserAvailability = typeof userAvailability.$inferSelect;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
