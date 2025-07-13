import { useState } from "react";
import { ShoppingBag, Shield, Lock, CheckCircle } from "lucide-react";
import AuthTabs from "@/components/auth/AuthTabs";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-white opacity-10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white opacity-5 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Auth Header */}
          <div className="text-center animate-fade-in">
            <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
              <ShoppingBag className="w-8 h-8 text-[hsl(249,83%,58%)]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue</h1>
            <p className="text-white/80">Connectez-vous à votre espace e-commerce</p>
          </div>

          {/* Auth Card */}
          <div className="glass-card rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <AuthTabs onTabChange={setActiveTab} activeTab={activeTab} />
            
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center items-center space-x-6 text-white/60 text-xs animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Sécurisé SSL</span>
            </div>
            <div className="flex items-center space-x-1">
              <Lock className="w-4 h-4" />
              <span>Données protégées</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Conformité RGPD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
