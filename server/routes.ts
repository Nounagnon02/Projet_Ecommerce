import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertCartItemSchema, insertReviewSchema } from "@shared/schema";
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

  // Middleware to check authentication
  const requireAuth = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentification requise" });
    }
    req.userId = userId;
    next();
  };

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des produits" });
    }
  });

  app.get('/api/products/featured', async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des produits en vedette" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du produit" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des catégories" });
    }
  });

  app.get('/api/categories/:id/products', async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des produits de la catégorie" });
    }
  });

  // Cart routes (require authentication)
  app.get('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du panier" });
    }
  });

  app.post('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(req.userId, validatedData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ message: "Données invalides", errors: error.issues });
      }
      res.status(500).json({ message: "Erreur lors de l'ajout au panier" });
    }
  });

  app.put('/api/cart/:productId', requireAuth, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.userId, productId, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Article non trouvé dans le panier" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du panier" });
    }
  });

  app.delete('/api/cart/:productId', requireAuth, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const success = await storage.removeFromCart(req.userId, productId);
      if (!success) {
        return res.status(404).json({ message: "Article non trouvé dans le panier" });
      }
      res.json({ message: "Article retiré du panier" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression de l'article" });
    }
  });

  app.delete('/api/cart', requireAuth, async (req: any, res) => {
    try {
      await storage.clearCart(req.userId);
      res.json({ message: "Panier vidé" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du vidage du panier" });
    }
  });

  // Review routes
  app.get('/api/products/:id/reviews', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des avis" });
    }
  });

  app.post('/api/products/:id/reviews', requireAuth, async (req: any, res) => {
    try {
      const productId = parseInt(req.params.id);
      const validatedData = insertReviewSchema.parse({ ...req.body, productId });
      const review = await storage.createReview(req.userId, validatedData);
      res.json(review);
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        return res.status(400).json({ message: "Données invalides", errors: error.issues });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'avis" });
    }
  });

  // Initialize database with sample data
  await initializeSampleData();

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData() {
  try {
    // Check if data already exists
    const existingProducts = await storage.getProducts();
    if (existingProducts.length > 0) {
      return; // Data already exists
    }

    // Create categories
    const categories = [
      { name: "Beurre de Karité Pur", description: "Beurre de karité 100% naturel et non raffiné", slug: "karite-pur" },
      { name: "Produits Parfumés", description: "Beurre de karité enrichi aux huiles essentielles", slug: "karite-parfume" },
      { name: "Gamme Bébé", description: "Produits spécialement formulés pour les bébés", slug: "karite-bebe" },
      { name: "Soins Anti-Âge", description: "Formules enrichies pour lutter contre le vieillissement", slug: "karite-anti-age" },
    ];

    const createdCategories = [];
    for (const category of categories) {
      const created = await storage.createCategory(category);
      createdCategories.push(created);
    }

    // Create sample products
    const products = [
      {
        name: "Beurre de Karité Bio Premium",
        description: "Beurre de karité 100% naturel et biologique du Burkina Faso. Non raffiné, riche en vitamines A, E et F. Idéal pour hydrater et nourrir tous types de peau.",
        price: "24.99",
        originalPrice: "29.99",
        stock: 50,
        categoryId: createdCategories[0].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.8",
        reviewCount: 156,
        isFeatured: true,
      },
      {
        name: "Beurre de Karité Parfumé Vanille",
        description: "Beurre de karité enrichi aux extraits naturels de vanille bourbon. Texture crémeuse et parfum délicat pour une expérience sensorielle unique.",
        price: "22.99",
        stock: 35,
        categoryId: createdCategories[1].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.6",
        reviewCount: 89,
        isFeatured: true,
      },
      {
        name: "Beurre de Karité Bébé Doux",
        description: "Formule extra-douce spécialement conçue pour les bébés. Hypoallergénique, sans parfum, testé dermatologiquement pour les peaux sensibles.",
        price: "19.99",
        originalPrice: "24.99",
        stock: 0,
        categoryId: createdCategories[2].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.9",
        reviewCount: 234,
        isFeatured: true,
      },
      {
        name: "Beurre de Karité Anti-Âge",
        description: "Enrichi en vitamines E et collagène naturel. Formule avancée pour réduire les signes de l'âge et maintenir l'élasticité de la peau.",
        price: "34.99",
        stock: 25,
        categoryId: createdCategories[3].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.7",
        reviewCount: 67,
        isFeatured: true,
      },
      {
        name: "Karité Lavande Relaxant",
        description: "Beurre de karité infusé à l'huile essentielle de lavande. Propriétés relaxantes et apaisantes pour un moment de détente absolue.",
        price: "26.99",
        stock: 42,
        categoryId: createdCategories[1].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.5",
        reviewCount: 78,
        isFeatured: false,
      },
      {
        name: "Karité Cacao Gourmand",
        description: "Texture riche et parfum gourmand de cacao. Nourrit intensément les peaux très sèches avec un parfum réconfortant.",
        price: "23.99",
        stock: 38,
        categoryId: createdCategories[1].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.4",
        reviewCount: 92,
        isFeatured: false,
      },
      {
        name: "Karité Bébé Bio Certifié",
        description: "Certification bio Ecocert. Formule ultra-pure pour les nourrissons dès la naissance. Texture légère et absorption rapide.",
        price: "28.99",
        stock: 20,
        categoryId: createdCategories[2].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.8",
        reviewCount: 145,
        isFeatured: false,
      },
      {
        name: "Sérum Karité Régénérant",
        description: "Concentré anti-âge au karité et acide hyaluronique. Stimule la régénération cellulaire pour une peau visiblement plus jeune.",
        price: "42.99",
        stock: 15,
        categoryId: createdCategories[3].id,
        images: ["/api/placeholder/400/400"],
        rating: "4.6",
        reviewCount: 34,
        isFeatured: false,
      },
    ];

    for (const product of products) {
      await storage.createProduct(product);
    }

    console.log("Base de données initialisée avec des données d'exemple");
  } catch (error) {
    console.error("Erreur lors de l'initialisation des données:", error);
  }
}
