import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import { loginSchema, registerSchema, insertCartItemSchema, insertReviewSchema, insertOrderSchema } from "@shared/mysql-schema";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";

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

  // Order routes
  app.get('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getOrders(req.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== req.userId) {
        return res.status(404).json({ message: "Commande non trouvée" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération de la commande" });
    }
  });

  // CinetPay payment routes
  app.post('/api/payment/initiate', requireAuth, async (req: any, res) => {
    try {
      const { amount, currency = 'XOF', description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }

      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      // Get user info
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(401).json({ message: "Utilisateur non trouvé" });
      }

      // CinetPay API payload
      const paymentData = {
        apikey: process.env.CINETPAY_API_KEY || '',
        site_id: process.env.CINETPAY_SITE_ID || '',
        transaction_id: transactionId,
        amount: Math.round(amount), // Ensure integer
        currency,
        description: description || 'Achat de produits de karité',
        customer_name: user.name?.split(' ')[0] || 'Client',
        customer_surname: user.name?.split(' ').slice(1).join(' ') || '',
        customer_email: user.email,
        customer_phone_number: '+22500000000', // Default phone
        notify_url: `${req.protocol}://${req.get('host')}/api/payment/notify`,
        return_url: `${req.protocol}://${req.get('host')}/payment/success`,
        channels: 'ALL',
        lang: 'FR'
      };

      // Call CinetPay API
      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.code === '201') {
        // Store transaction in database
        const order = await storage.createOrder(req.userId, {
          totalAmount: amount.toString(),
          status: 'pending',
          paymentMethod: 'cinetpay',
          transactionId: transactionId,
          shippingAddress: '',
          billingAddress: ''
        });

        res.json({
          success: true,
          payment_url: result.data.payment_url,
          payment_token: result.data.payment_token,
          transaction_id: transactionId,
          order_id: order.id
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.message || 'Erreur lors de l\'initialisation du paiement' 
        });
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ message: "Erreur lors de l'initialisation du paiement" });
    }
  });

  // CinetPay notification handler (IPN)
  app.post('/api/payment/notify', async (req, res) => {
    try {
      const { cpm_trans_id, cpm_amount, cpm_currency, cpm_result, cpm_trans_status } = req.body;

      console.log('CinetPay notification received:', req.body);

      if (cpm_result === '00' && cpm_trans_status === 'ACCEPTED') {
        // Payment successful - update order status
        const orders = await storage.getOrders(0); // Get all orders to find by transaction ID
        const order = orders.find(o => o.transactionId === cpm_trans_id);
        
        if (order) {
          // Update order status to completed
          await storage.updateOrderStatus(order.id, 'completed');
          
          // Clear user's cart if payment successful
          if (order.userId) {
            await storage.clearCart(order.userId);
          }
          
          console.log(`Payment successful for transaction ${cpm_trans_id}`);
        }
      } else {
        // Payment failed - update order status
        const orders = await storage.getOrders(0);
        const order = orders.find(o => o.transactionId === cpm_trans_id);
        
        if (order) {
          await storage.updateOrderStatus(order.id, 'failed');
          console.log(`Payment failed for transaction ${cpm_trans_id}`);
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Notification handling error:', error);
      res.status(500).send('ERROR');
    }
  });

  // Check payment status
  app.get('/api/payment/status/:transactionId', requireAuth, async (req: any, res) => {
    try {
      const { transactionId } = req.params;

      // Check with CinetPay API
      const checkData = {
        apikey: process.env.CINETPAY_API_KEY || '',
        site_id: process.env.CINETPAY_SITE_ID || '',
        transaction_id: transactionId
      };

      const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkData)
      });

      const result = await response.json();
      
      if (result.code === '00') {
        const paymentData = result.data;
        
        // Update local order status based on CinetPay response
        const orders = await storage.getOrders(req.userId);
        const order = orders.find(o => o.transactionId === transactionId);
        
        if (order && paymentData.status === 'ACCEPTED') {
          await storage.updateOrderStatus(order.id, 'completed');
          await storage.clearCart(req.userId);
        }

        res.json({
          success: true,
          status: paymentData.status,
          amount: paymentData.amount,
          currency: paymentData.currency
        });
      } else {
        res.json({
          success: false,
          message: result.message || 'Transaction non trouvée'
        });
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({ message: "Erreur lors de la vérification du statut" });
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
