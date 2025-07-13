import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, CreditCard, Smartphone, Banknote, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export default function Checkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+225',
    address: '',
    city: '',
    country: 'CI'
  });

  // Fetch cart items with product details
  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: CartItemWithProduct) => {
    return sum + (parseFloat(item.product?.price || "0") * (item.quantity || 0));
  }, 0);
  
  const shipping = subtotal > 50 ? 0 : 5; // Free shipping over 50€
  const total = subtotal + shipping;

  // Payment initiation mutation
  const initiatePaymentMutation = useMutation({
    mutationFn: async (paymentData: { amount: number; currency: string; description: string }) => {
      const response = await apiRequest("POST", "/api/payment/initiate", paymentData);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.payment_url) {
        // Redirect to CinetPay payment page
        window.location.href = data.payment_url;
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de l'initialisation du paiement",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du paiement",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Panier vide",
        description: "Ajoutez des articles à votre panier avant de procéder au paiement",
        variant: "destructive",
      });
      return;
    }

    initiatePaymentMutation.mutate({
      amount: Math.round(total * 100), // Convert to cents for CinetPay
      currency: 'XOF',
      description: `Commande de ${cartItems.length} article(s) de karité`
    });
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h1>
            <p className="text-gray-600 mb-6">Découvrez nos produits de karité authentiques</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
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
              Retour aux achats
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser votre commande</h1>
          <p className="text-gray-600 mt-2">
            Paiement sécurisé avec Orange Money, MTN Mobile Money, Moov Money et plus
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Informations de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      placeholder="Abidjan, Ouagadougou..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse de livraison *</Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="Votre adresse complète"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Méthodes de paiement disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Orange Money</span>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">MTN MoMo</span>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Moov Money</span>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Carte bancaire</span>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">Portefeuilles</span>
                  </div>
                  <div className="flex items-center p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">+</span>
                    </div>
                    <span className="text-sm font-medium">Autres</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Paiement 100% sécurisé avec CinetPay. Plus de 64 méthodes de paiement disponibles.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Récapitulatif de commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item: CartItemWithProduct) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.product?.images?.[0] || "/api/placeholder/60/60"}
                        alt={item.product?.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {item.product?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {(parseFloat(item.product?.price || "0") * (item.quantity || 0)).toFixed(2)}€
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
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
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    ≈ {Math.round(total * 655.957)} FCFA
                  </p>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={initiatePaymentMutation.isPending}
                  className="w-full py-6 text-lg font-semibold"
                  size="lg"
                >
                  {initiatePaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Initialisation...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Procéder au paiement
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-600 text-center mt-4">
                  En cliquant sur "Procéder au paiement", vous acceptez nos conditions d'utilisation
                  et notre politique de confidentialité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}