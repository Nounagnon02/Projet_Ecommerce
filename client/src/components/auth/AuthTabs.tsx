import { useState } from "react";

interface AuthTabsProps {
  onTabChange: (tab: 'login' | 'register') => void;
  activeTab: 'login' | 'register';
}

export default function AuthTabs({ onTabChange, activeTab }: AuthTabsProps) {
  return (
    <div className="flex bg-gray-50 rounded-t-2xl">
      <button
        onClick={() => onTabChange('login')}
        className={`auth-tab flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 rounded-tl-2xl ${
          activeTab === 'login' ? 'active' : ''
        }`}
      >
        Connexion
      </button>
      <button
        onClick={() => onTabChange('register')}
        className={`auth-tab flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 rounded-tr-2xl ${
          activeTab === 'register' ? 'active' : ''
        }`}
      >
        Inscription
      </button>
    </div>
  );
}
