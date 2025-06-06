import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCalendarSchema, insertBookingPageSchema, insertBookingSchema, insertTeamSchema, insertMeetingSchema, insertAliasBlacklistSchema, User } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module "express-serve-static-core" {
  interface Request {
    user?: any; // You can replace `any` with your actual user type if you have one
  }
}


// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log("=== Authentication Debug ===");
  console.log("Request path:", req.path);
  console.log("Request method:", req.method);
  console.log("All headers:", req.headers);
  
  const authHeader = req.headers["authorization"];
  console.log("Auth header:", authHeader);
  
  const token = authHeader && authHeader.split(" ")[1];
  console.log("Token:", token ? 'Present' : 'Missing');

  if (!token) {
    console.log("No token found in request");
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    console.log("Attempting to verify token");
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log('Decoded token:', decoded);
    
    const user = await storage.getUser(decoded.userId);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User object:', user);
    
    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "Invalid token" });
    }

    // Set the complete user object
    req.user = user;
    console.log('Request user after setting:', req.user);
    console.log("=== Authentication Successful ===");
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Middleware to check Super Admin role
const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Super Admin access required" });
  }
  next();
};

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Log all incoming requests
  app.use((req, res, next) => {
    console.log('Incoming request:', {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body
    });
    next();
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // User routes
  app.get("/api/users", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password update route - moved before :id route
  app.put("/api/users/password", authenticateToken, async (req, res) => {
    try {
      console.log('=== Password Update Route ===');
      console.log('Request body:', req.body);
      console.log('User in request:', req.user);
      
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Verify current password
      const user = await storage.getUser(req.user.id);
      console.log('User from storage:', user);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User ID routes - moved after password route
  app.get("/api/users/:id", authenticateToken, async (req, res, next) => {
    // Skip if the ID is "password"
    if (req.params.id === "password") {
      return next();
    }
    
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only access their own data unless they're super admin
      if (req.user.role !== "super_admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own data unless they're super admin
      if (req.user.role !== "super_admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = req.body;
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Calendar routes
  app.get("/api/calendars", authenticateToken, async (req, res) => {
    try {
      const calendars = await storage.getUserCalendars(req.user.id);
      res.json(calendars);
    } catch (error) {
      console.error("Get calendars error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/calendars", authenticateToken, async (req, res) => {
    try {
      const calendarData = insertCalendarSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const calendar = await storage.createCalendar(calendarData);
      res.status(201).json(calendar);
    } catch (error) {
      console.error("Create calendar error:", error);
      res.status(400).json({ message: "Invalid calendar data" });
    }
  });

  app.put("/api/calendars/:id", authenticateToken, async (req, res) => {
    try {
      const calendarId = parseInt(req.params.id);
      const calendar = await storage.getCalendar(calendarId);
      
      if (!calendar || (calendar.userId !== req.user.id && req.user.role !== "super_admin")) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      const updatedCalendar = await storage.updateCalendar(calendarId, req.body);
      res.json(updatedCalendar);
    } catch (error) {
      console.error("Update calendar error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/calendars/:id", authenticateToken, async (req, res) => {
    try {
      const calendarId = parseInt(req.params.id);
      const calendar = await storage.getCalendar(calendarId);
      
      if (!calendar || (calendar.userId !== req.user.id && req.user.role !== "super_admin")) {
        return res.status(404).json({ message: "Calendar not found" });
      }

      await storage.deleteCalendar(calendarId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete calendar error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Booking page routes
  app.get("/api/booking-pages", authenticateToken, async (req, res) => {
    try {
      const bookingPages = await storage.getUserBookingPages(req.user.id);
      res.json(bookingPages);
    } catch (error) {
      console.error("Get booking pages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/booking-pages/pending", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const pendingPages = await storage.getPendingBookingPages();
      res.json(pendingPages);
    } catch (error) {
      console.error("Get pending booking pages error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/booking-pages", authenticateToken, async (req, res) => {
    try {
      // Check if alias is blacklisted
      const blacklistedAlias = await storage.getBlacklistedAlias(req.body.alias);
      if (blacklistedAlias) {
        return res.status(400).json({ message: "Alias is not allowed" });
      }

      const bookingPageData = insertBookingPageSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const bookingPage = await storage.createBookingPage(bookingPageData);
      res.status(201).json(bookingPage);
    } catch (error) {
      console.error("Create booking page error:", error);
      res.status(400).json({ message: "Invalid booking page data" });
    }
  });

  app.put("/api/booking-pages/:id", authenticateToken, async (req, res) => {
    try {
      const bookingPageId = parseInt(req.params.id);
      const bookingPage = await storage.getBookingPage(bookingPageId);
      
      if (!bookingPage || (bookingPage.userId !== req.user.id && req.user.role !== "super_admin")) {
        return res.status(404).json({ message: "Booking page not found" });
      }

      const updatedBookingPage = await storage.updateBookingPage(bookingPageId, req.body);
      res.json(updatedBookingPage);
    } catch (error) {
      console.error("Update booking page error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public booking routes (no authentication required)
  app.get("/api/public/booking/:userAlias/:pageAlias", async (req, res) => {
    try {
      const { userAlias, pageAlias } = req.params;
      const bookingPage = await storage.getBookingPageByAlias(userAlias, pageAlias);
      
      if (!bookingPage) {
        return res.status(404).json({ message: "Booking page not found" });
      }

      res.json(bookingPage);
    } catch (error) {
      console.error("Get public booking page error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/public/booking/:userAlias/:pageAlias", async (req, res) => {
    try {
      const { userAlias, pageAlias } = req.params;
      const bookingPage = await storage.getBookingPageByAlias(userAlias, pageAlias);
      
      if (!bookingPage) {
        return res.status(404).json({ message: "Booking page not found" });
      }

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        bookingPageId: bookingPage.id,
      });

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create public booking error:", error);
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  // Team routes
  app.get("/api/teams", authenticateToken, async (req, res) => {
    try {
      const teams = await storage.getUserTeams(req.user.id);
      res.json(teams);
    } catch (error) {
      console.error("Get teams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/teams", authenticateToken, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Create team error:", error);
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  // Meeting routes
  app.get("/api/meetings", authenticateToken, async (req, res) => {
    try {
      const meetings = await storage.getUserMeetings(req.user.id);
      res.json(meetings);
    } catch (error) {
      console.error("Get meetings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/meetings", authenticateToken, async (req, res) => {
    try {
      const meetingData = insertMeetingSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const meeting = await storage.createMeeting(meetingData);
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Create meeting error:", error);
      res.status(400).json({ message: "Invalid meeting data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Alias blacklist routes (Super Admin only)
  app.get("/api/admin/blacklist", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const blacklist = await storage.getAllBlacklistedAliases();
      res.json(blacklist);
    } catch (error) {
      console.error("Get blacklist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/blacklist", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const blacklistData = insertAliasBlacklistSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });

      const blacklistEntry = await storage.addToBlacklist(blacklistData);
      res.status(201).json(blacklistEntry);
    } catch (error) {
      console.error("Add to blacklist error:", error);
      res.status(400).json({ message: "Invalid blacklist data" });
    }
  });

  app.delete("/api/admin/blacklist/:alias", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { alias } = req.params;
      await storage.removeFromBlacklist(alias);
      res.status(204).send();
    } catch (error) {
      console.error("Remove from blacklist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Avatar upload route
  app.post("/api/users/avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Generate the URL for the uploaded file
      const avatarUrl = `/uploads/${req.file.filename}`;

      // Update user's profile with new avatar URL
      const updatedUser = await storage.updateUser(req.user.id, {
        profileImage: avatarUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // User availability routes
  app.get("/api/availability", authenticateToken, async (req, res) => {
    try {
      const availability = await storage.getUserAvailability(req.user.id);
      res.json(availability);
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/availability", authenticateToken, async (req, res) => {
    try {
      const availabilityData = req.body.map((item: any) => ({
        userId: req.user.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isAvailable: item.isAvailable
      }));

      const availability = await storage.setUserAvailability(availabilityData);
      res.json(availability);
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  const httpServer = createServer(app);
  return httpServer;
}
