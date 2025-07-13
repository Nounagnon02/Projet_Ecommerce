import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "wouter";
import type { CartItem, Product } from "@shared/mysql-schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/cart/${productId}`, { quantity });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("DELETE", `/api/cart/${productId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Succès",
        description: "Article retiré du panier",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/cart");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Succès",
        description: "Panier vidé",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du vidage du panier",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartMutation.mutate({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: number) => {
    removeFromCartMutation.mutate(productId);
  };

  const subtotal = cartItems.reduce((sum: number, item: CartItemWithProduct) => {
    return sum + (parseFloat(item.product?.price || "0") * (item.quantity || 0));
  }, 0);

  const shipping = subtotal > 50 ? 0 : 5;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux achats
            </Button>
          </Link>
          
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h1>
            <p className="text-gray-600 mb-6">Découvrez nos produits de karité authentiques</p>
            <Link href="/">
              <Button>
                Continuer vos achats
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuer vos achats
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Votre panier</h1>
            <Button
              variant="outline"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Vider le panier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: CartItemWithProduct) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.product?.images?.[0] || "/api/placeholder/100/100"}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {item.product?.description}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-lg font-bold text-gray-900">
                          {parseFloat(item.product?.price || "0").toFixed(2)}€
                        </span>
                        {item.product?.originalPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            {parseFloat(item.product.originalPrice).toFixed(2)}€
                          </span>
                        )}
                        {item.product?.stock === 0 && (
                          <Badge variant="destructive" className="ml-2">
                            Rupture de stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId!, (item.quantity || 1) - 1)}
                          disabled={updateCartMutation.isPending || (item.quantity || 0) <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="px-3 py-2 text-center min-w-[3rem]">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.productId!, (item.quantity || 1) + 1)}
                          disabled={updateCartMutation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.productId!)}
                        disabled={removeFromCartMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>
                      {shipping === 0 ? (
                        <Badge variant="secondary" className="text-xs">Gratuite</Badge>
                      ) : (
                        `${shipping.toFixed(2)}€`
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{total.toFixed(2)}€</span>
                    </div>
                    <p className="text-xs text-gray-600 text-right">
                      ≈ {Math.round(total * 655.957)} FCFA
                    </p>
                  </div>
                </div>

                {shipping > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 Ajoutez {(50 - subtotal).toFixed(2)}€ pour bénéficier de la livraison gratuite
                    </p>
                  </div>
                )}

                <Link href="/checkout">
                  <Button className="w-full py-6 text-lg font-semibold" size="lg">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Procéder au paiement
                  </Button>
                </Link>

                <p className="text-xs text-gray-600 text-center">
                  Paiement sécurisé avec Orange Money, MTN Mobile Money, Moov Money et cartes bancaires
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}