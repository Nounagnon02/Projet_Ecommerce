import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreConstructor = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreConstructor({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Identifiants incorrects" 
        });
      }

      const isPasswordValid = await storage.verifyPassword(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Identifiants incorrects" 
        });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ 
          success: false, 
          message: "Données invalides",
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Erreur serveur" 
      });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "Un compte avec cette adresse email existe déjà" 
        });
      }

      const newUser = await storage.createUser({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
      });

      // Store user in session
      (req.session as any).userId = newUser.id;
      
      const { password, ...userWithoutPassword } = newUser;
      res.json({ 
        success: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ 
          success: false, 
          message: "Données invalides",
          errors: error.issues 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Erreur serveur" 
      });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Erreur lors de la déconnexion" 
        });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  const httpServer = createServer(app);
  return httpServer;
}
