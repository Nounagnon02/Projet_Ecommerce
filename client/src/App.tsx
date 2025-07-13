import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(249,83%,58%)]"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Auth} />
          <Route path="/auth" component={Auth} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/payment/success" component={PaymentSuccess} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/auth" component={() => {
            window.location.href = "/";
            return null;
          }} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
