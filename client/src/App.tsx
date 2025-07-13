import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";

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
          <Route path="/" component={() => (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Bienvenue dans votre espace e-commerce!
                </h1>
                <p className="text-gray-600 mb-8">
                  Vous êtes maintenant connecté avec succès.
                </p>
                <button 
                  onClick={() => {
                    const { logout } = useAuth();
                    logout();
                  }}
                  className="bg-[hsl(249,83%,58%)] text-white px-6 py-2 rounded-lg hover:bg-[hsl(249,83%,52%)] transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          )} />
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
