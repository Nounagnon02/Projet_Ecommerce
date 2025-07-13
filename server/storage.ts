import { 
  users, products, categories, cartItems, orders, orderItems, reviews,
  type User, type InsertUser, type Product, type InsertProduct, 
  type Category, type InsertCategory, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type OrderItem, type Review, type InsertReview
} from "@shared/mysql-schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(userId: number, item: InsertCartItem): Promise<CartItem>;
  updateCartItem(userId: number, productId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(userId: number, productId: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Order operations
  getOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(userId: number, order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: number, status: string): Promise<Order | undefined>;
  
  // Review operations
  getProductReviews(productId: number): Promise<Review[]>;
  createReview(userId: number, review: InsertReview): Promise<Review>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(insertUser.password);
    await db.insert(users).values({ ...insertUser, password: hashedPassword });
    
    // Récupérer l'utilisateur nouvellement créé
    const [user] = await db.select().from(users)
      .where(eq(users.email, insertUser.email))
      .limit(1);
      
    if (!user) throw new Error("Failed to create user");
    return user;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .limit(8);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.isActive, true), eq(products.categoryId, categoryId)));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    await db.insert(products).values(product);
    
    // Récupérer le dernier produit inséré
    const [newProduct] = await db.select().from(products)
      .orderBy(desc(products.id))
      .limit(1);
      
    if (!newProduct) throw new Error("Failed to create product");
    return newProduct;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    await db.insert(categories).values(category);
    
    // Récupérer la dernière catégorie insérée
    const [newCategory] = await db.select().from(categories)
      .orderBy(desc(categories.id))
      .limit(1);
      
    if (!newCategory) throw new Error("Failed to create category");
    return newCategory;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async addToCart(userId: number, item: InsertCartItem): Promise<CartItem> {
    // Vérifier si l'article existe déjà dans le panier
    const [existingItem] = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId!)))
      .limit(1);

    if (existingItem) {
      // Mettre à jour la quantité si l'article existe
      await db.update(cartItems)
        .set({ quantity: existingItem.quantity! + (item.quantity || 1) })
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId!)));
      
      // Récupérer l'article mis à jour
      const [updatedItem] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId!)))
        .limit(1);
        
      if (!updatedItem) throw new Error("Failed to update cart item");
      return updatedItem;
    } else {
      // Ajouter un nouvel article au panier
      await db.insert(cartItems)
        .values({ ...item, userId });
      
      // Récupérer le nouvel article
      const [newItem] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId!)))
        .limit(1);
        
      if (!newItem) throw new Error("Failed to add item to cart");
      return newItem;
    }
  }

  async updateCartItem(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    await db.update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    
    // Récupérer l'article mis à jour
    const [updatedItem] = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .limit(1);
      
    return updatedItem;
  }

  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return result.affectedRows > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.affectedRows > 0;
  }

  // Order operations
  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return order;
  }

  async createOrder(userId: number, order: InsertOrder): Promise<Order> {
    await db.insert(orders)
      .values({ ...order, userId });
    
    // Récupérer la dernière commande créée
    const [newOrder] = await db.select().from(orders)
      .orderBy(desc(orders.id))
      .limit(1);
      
    if (!newOrder) throw new Error("Failed to create order");
    return newOrder;
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order | undefined> {
    await db.update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    
    // Récupérer la commande mise à jour
    const [updatedOrder] = await db.select().from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
      
    return updatedOrder;
  }

  // Review operations
  async getProductReviews(productId: number): Promise<Review[]> {
    return await db.select().from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(userId: number, review: InsertReview): Promise<Review> {
    await db.insert(reviews)
      .values({ ...review, userId });
    
    // Récupérer le dernier avis créé
    const [newReview] = await db.select().from(reviews)
      .orderBy(desc(reviews.id))
      .limit(1);
      
    if (!newReview) throw new Error("Failed to create review");
    return newReview;
  }
}

export const storage = new DatabaseStorage();