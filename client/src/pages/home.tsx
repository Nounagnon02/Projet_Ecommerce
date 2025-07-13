import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingBag, User, Heart, Search, ShoppingCart, Star } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

export default function Home() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch featured products
  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products/featured"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Fetch cart items count
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number }) => {
      const response = await apiRequest("POST", "/api/cart", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit ajouté au panier avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout au panier",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-[hsl(249,83%,58%)] to-[hsl(258,90%,60%)] rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">KaritéShop</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher des produits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <Heart className="w-6 h-6" />
              </button>
              <Link href="/cart">
                <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="ml-2"
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[hsl(249,83%,58%)] to-[hsl(258,90%,60%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Découvrez la Beauté Naturelle du Karité
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Produits 100% naturels et biologiques directement du Burkina Faso.
              Nourrissez votre peau avec la richesse ancestrale du beurre de karité.
            </p>
            <Button
              size="lg"
              className="bg-white text-[hsl(249,83%,58%)] hover:bg-gray-100 font-semibold px-8 py-3"
            >
              Découvrir nos produits
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Produits Phares
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une sélection de nos meilleurs produits de beurre de karité,
              reconnus pour leur qualité exceptionnelle et leurs bienfaits naturels.
            </p>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-300"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3"></div>
                    <div className="h-3 bg-gray-300 rounded mb-3"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: Product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={product.images?.[0] || "/api/placeholder/300/300"}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">Rupture de stock</span>
                      </div>
                    )}
                    {product.originalPrice && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{ Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100) }%
                      </div>
                    )}
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                      <Heart className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(parseFloat(product.rating || "0"))
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {product.rating} ({product.reviewCount})
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {parseFloat(product.price).toFixed(2)}€
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {parseFloat(product.originalPrice).toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      className="w-full"
                      disabled={product.stock === 0 || addToCartMutation.isPending}
                      variant={product.stock > 0 ? "default" : "secondary"}
                      onClick={() => handleAddToCart(product.id)}
                    >
                      {product.stock > 0 ? (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {addToCartMutation.isPending ? "Ajout..." : "Ajouter au panier"}
                        </>
                      ) : (
                        "Indisponible"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi Choisir Notre Karité ?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌿</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">100% Naturel</h4>
              <p className="text-gray-600">
                Aucun additif chimique, conservateur artificiel ou parfum synthétique.
                Pure qualité naturelle.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏺</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Tradition Ancestrale</h4>
              <p className="text-gray-600">
                Méthodes traditionnelles de production transmises de génération en génération
                par les femmes du Burkina Faso.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Bienfaits Prouvés</h4>
              <p className="text-gray-600">
                Hydratation intense, protection anti-âge, réparation et adoucissement
                pour tous types de peau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingBag className="w-6 h-6" />
                <span className="text-xl font-bold">KaritéShop</span>
              </div>
              <p className="text-gray-400">
                Votre partenaire beauté naturelle depuis 2020.
                Des produits authentiques directement d'Afrique.
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Produits</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Beurre de Karité Pur</a></li>
                <li><a href="#" className="hover:text-white">Produits Parfumés</a></li>
                <li><a href="#" className="hover:text-white">Gamme Bébé</a></li>
                <li><a href="#" className="hover:text-white">Soins Anti-Âge</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white">Livraison</a></li>
                <li><a href="#" className="hover:text-white">Retours</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Légal</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white">RGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KaritéShop. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}