import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from "lucide-react";
import { registerSchema, type RegisterData } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const { register: registerUser, isRegisterPending } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedPassword = watch("password");
  const watchedPasswordConfirm = watch("password_confirmation");

  const onSubmit = async (data: RegisterData) => {
    try {
      setError("");
      const result = await registerUser(data);
      if (!result.success) {
        setError(result.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'inscription");
    }
  };

  return (
    <div className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Name Field */}
        <div className="relative">
          <input
            {...register("name")}
            type="text"
            id="registerName"
            className="custom-input w-full px-4 pt-6 pb-2 text-gray-900 bg-transparent border-2 border-gray-200 rounded-lg focus:border-[hsl(249,83%,58%)] focus:outline-none transition-colors duration-200 peer"
            placeholder=" "
          />
          <label
            htmlFor="registerName"
            className={`floating-label absolute left-4 top-4 text-gray-500 pointer-events-none ${
              watchedName ? "active" : ""
            }`}
          >
            Nom complet
          </label>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="relative">
          <input
            {...register("email")}
            type="email"
            id="registerEmail"
            className="custom-input w-full px-4 pt-6 pb-2 text-gray-900 bg-transparent border-2 border-gray-200 rounded-lg focus:border-[hsl(249,83%,58%)] focus:outline-none transition-colors duration-200 peer"
            placeholder=" "
          />
          <label
            htmlFor="registerEmail"
            className={`floating-label absolute left-4 top-4 text-gray-500 pointer-events-none ${
              watchedEmail ? "active" : ""
            }`}
          >
            Adresse email
          </label>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            id="registerPassword"
            className="custom-input w-full px-4 pt-6 pb-2 text-gray-900 bg-transparent border-2 border-gray-200 rounded-lg focus:border-[hsl(249,83%,58%)] focus:outline-none transition-colors duration-200 peer"
            placeholder=" "
          />
          <label
            htmlFor="registerPassword"
            className={`floating-label absolute left-4 top-4 text-gray-500 pointer-events-none ${
              watchedPassword ? "active" : ""
            }`}
          >
            Mot de passe
          </label>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Password Confirmation Field */}
        <div className="relative">
          <input
            {...register("password_confirmation")}
            type={showPasswordConfirm ? "text" : "password"}
            id="registerPasswordConfirm"
            className="custom-input w-full px-4 pt-6 pb-2 text-gray-900 bg-transparent border-2 border-gray-200 rounded-lg focus:border-[hsl(249,83%,58%)] focus:outline-none transition-colors duration-200 peer"
            placeholder=" "
          />
          <label
            htmlFor="registerPasswordConfirm"
            className={`floating-label absolute left-4 top-4 text-gray-500 pointer-events-none ${
              watchedPasswordConfirm ? "active" : ""
            }`}
          >
            Confirmer le mot de passe
          </label>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 text-[hsl(249,83%,58%)] border-gray-300 rounded focus:ring-[hsl(249,83%,52%)] mt-1"
            required
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            J'accepte les{" "}
            <a href="#" className="text-[hsl(249,83%,58%)] hover:text-[hsl(249,83%,52%)] font-medium">
              conditions d'utilisation
            </a>{" "}
            et la{" "}
            <a href="#" className="text-[hsl(249,83%,58%)] hover:text-[hsl(249,83%,52%)] font-medium">
              politique de confidentialité
            </a>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isRegisterPending}
          className="ripple w-full bg-gradient-to-r from-[hsl(258,90%,60%)] to-[hsl(249,83%,58%)] text-white py-3 px-4 rounded-lg font-medium hover:from-[hsl(258,90%,54%)] hover:to-[hsl(249,83%,52%)] focus:outline-none focus:ring-2 focus:ring-[hsl(258,90%,52%)] focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center">
            {isRegisterPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer mon compte
              </>
            )}
          </span>
        </button>
      </form>

      {/* Social Registration */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou inscrivez-vous avec</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="ml-2">Google</span>
          </button>
          <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="ml-2">Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
