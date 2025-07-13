import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, Loader2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Extract transaction ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const txnId = urlParams.get('transaction_id') || urlParams.get('cpm_trans_id');
    setTransactionId(txnId);
  }, []);

  // Check payment status if transaction ID is available
  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ["/api/payment/status", transactionId],
    enabled: !!transactionId,
    refetchInterval: 3000, // Check every 3 seconds
    refetchIntervalInBackground: false,
  });

  const renderContent = () => {
    if (isLoading || !transactionId) {
      return (
        <div className="text-center py-16">
          <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Vérification du paiement en cours...
          </h1>
          <p className="text-gray-600">
            Nous vérifions le statut de votre transaction. Veuillez patienter.
          </p>
        </div>
      );
    }

    if (paymentStatus?.success && paymentStatus?.status === 'ACCEPTED') {
      return (
        <div className="text-center py-16">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Votre commande a été confirmée et sera traitée dans les plus brefs délais. 
            Un email de confirmation vous sera envoyé.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h3 className="font-semibold text-green-800 mb-2">Détails de la transaction</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Transaction ID:</span> {transactionId}</p>
              <p><span className="font-medium">Montant:</span> {paymentStatus.amount} {paymentStatus.currency}</p>
              <p><span className="font-medium">Statut:</span> <span className="text-green-600 font-semibold">Confirmé</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <Button asChild size="lg">
              <Link href="/">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continuer vos achats
              </Link>
            </Button>
            <div>
              <Button variant="outline" asChild>
                <Link href="/orders">
                  Voir mes commandes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus?.success === false || paymentStatus?.status === 'REFUSED') {
      return (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Paiement échoué
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Votre paiement n'a pas pu être traité. Veuillez réessayer ou contacter notre support client.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
            <h3 className="font-semibold text-red-800 mb-2">Détails de la transaction</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Transaction ID:</span> {transactionId}</p>
              <p><span className="font-medium">Statut:</span> <span className="text-red-600 font-semibold">Échec</span></p>
              {paymentStatus?.message && (
                <p><span className="font-medium">Raison:</span> {paymentStatus.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Button asChild size="lg">
              <Link href="/checkout">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Réessayer le paiement
              </Link>
            </Button>
            <div>
              <Button variant="outline" asChild>
                <Link href="/">
                  Retour à l'accueil
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Default pending state
    return (
      <div className="text-center py-16">
        <Loader2 className="w-16 h-16 mx-auto text-yellow-500 animate-spin mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement en cours de traitement
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Votre paiement est en cours de vérification. Cela peut prendre quelques minutes.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <h3 className="font-semibold text-yellow-800 mb-2">Statut actuel</h3>
          <p className="text-sm text-yellow-700">En attente de confirmation...</p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/">
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}