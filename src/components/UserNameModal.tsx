import { useState, FormEvent, useEffect } from "react";
import { UserProfile, loginWithGoogle, saveUserProfile, logoutUser } from "../lib/firebase";
import { User } from "firebase/auth";
import { User as UserIcon, LogIn, LogOut, Check, Sparkles, X, AlertCircle, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  authUser: User | null;
  onNameSaved: (name: string) => void;
}

export default function UserNameModal({
  isOpen,
  onClose,
  currentProfile,
  authUser,
  onNameSaved
}: UserNameModalProps) {
  const [inputName, setInputName] = useState(currentProfile?.name || "Movie Foli");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentProfile?.name) {
      setInputName(currentProfile.name);
    }
  }, [currentProfile]);

  const handleManualSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const name = inputName.trim();
    const isOwner = name.toLowerCase().includes("movie") || name.toLowerCase().includes("foli") || currentProfile?.role === "Owner";
    await saveUserProfile(
      name, 
      authUser?.email || "madanbudhamagar79@gmail.com", 
      authUser?.uid || "", 
      authUser?.photoURL || "",
      isOwner ? "Owner" : "User"
    );
    onNameSaved(name);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    const result = await loginWithGoogle();
    setIsLoggingIn(false);

    if (result.success && result.name) {
      setInputName(result.name);
      onNameSaved(result.name);
      setIsSavedSuccess(true);
      setTimeout(() => {
        setIsSavedSuccess(false);
        onClose();
      }, 800);
    } else if (result.error) {
      if (result.error.includes("popup-closed-by-user")) {
        setAuthError("Sign-in popup was closed. Please try again or type your name.");
      } else if (result.error.includes("auth/popup-blocked")) {
        setAuthError("Popup blocked by browser. Enter your name directly below or open app in a new tab.");
      } else {
        setAuthError(`Login issue: ${result.error}. You can enter your name manually below!`);
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={currentProfile?.name ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button if profile already set */}
            {currentProfile?.name && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner text-amber-400">
                <Crown className="w-6 h-6 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5" /> App Owner: Movie Foli
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {currentProfile?.name ? "Owner & User Profile" : "Welcome, Movie Foli!"}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Priya recognizes Movie Foli as her owner and companion. She greets you by name every time!
              </p>
            </div>

            {/* Auth Status & Google Login Button */}
            <div className="space-y-4 mb-6">
              {authUser ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {authUser.photoURL ? (
                      <img
                        src={authUser.photoURL}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border border-emerald-400"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{authUser.displayName || "Google User"}</p>
                      <p className="text-[10px] text-slate-400">{authUser.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isLoggingIn ? "Signing in..." : "Continue with Google ID"}</span>
                </button>
              )}

              {/* Error Alert */}
              {authError && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <p>{authError}</p>
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
                Or enter name manually
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Quick Owner Preset Button */}
            <button
              type="button"
              onClick={() => setInputName("Movie Foli")}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Set as Owner: <strong>Movie Foli</strong></span>
            </button>

            {/* Manual Name Form */}
            <form onSubmit={handleManualSave} className="mt-3 space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/80 transition"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <button
                type="submit"
                disabled={!inputName.trim() || isSavedSuccess}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition cursor-pointer disabled:opacity-40"
              >
                {isSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved to Firebase!</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Save & Remember Me</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
