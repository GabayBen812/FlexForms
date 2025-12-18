import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, GraduationCap, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Login() {

  
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const auth = useContext(AuthContext);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");
  const { isLoginLoading, login } = auth;

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setDebugInfo([]);
    const formData = new FormData(event.currentTarget);
    const { password, mail } = Object.fromEntries(formData);

    addDebug(`🔐 Starting login for: ${String(mail).trim().toLowerCase()}`);
    addDebug(`🌐 API Base URL: ${import.meta.env.VITE_API_BASE_URL || 'default'}`);
    addDebug(`📍 Origin: ${window.location.origin}`);

    const response = await login({
      email: String(mail).trim().toLowerCase(),
      password: String(password),
    });

    addDebug(`📡 Login response status: ${response?.status}`);
    addDebug(`📦 Response data: ${JSON.stringify(response?.data || {}).substring(0, 200)}`);
    
    // Check if backend returned user data (new format)
    if (response?.data) {
      const data = response.data as any;
      addDebug(`🔍 Has accessToken: ${!!data.accessToken}`);
      addDebug(`🔍 Has user: ${!!data.user}`);
      addDebug(`🔍 Has debug: ${!!data.debug}`);
      if (data.debug) {
        addDebug(`🔍 Backend debug - isProd: ${data.debug.isProd}, origin: ${data.debug.origin}`);
      }
      
      // FALLBACK: Save token to localStorage if it exists
      if (data.accessToken) {
        addDebug(`💾 Saving accessToken to localStorage as fallback`);
        localStorage.setItem("auth_token", data.accessToken);
      }
    }
    
    addDebug(`🍪 Document cookie IMMEDIATELY after login: ${document.cookie || 'EMPTY!'}`);

    addDebug(`✅ Login API call successful, waiting 1000ms for cookie...`);
    
    // Check cookies multiple times
    let hasToken = !!localStorage.getItem("auth_token");
    let hasJWTCookie = false;
    
    for (let i = 0; i < 5; i++) {
      await new Promise((res) => setTimeout(res, 200));
      const cookies = document.cookie;
      hasJWTCookie = cookies.includes('jwt=');
      hasToken = !!localStorage.getItem("auth_token");
      addDebug(`🍪 [${(i+1)*200}ms] Cookie: ${cookies || 'EMPTY'} | Has JWT: ${hasJWTCookie} | Has LocalToken: ${hasToken}`);
      if (hasJWTCookie) break;
    }
    
    const finalCookies = document.cookie;
    hasJWTCookie = finalCookies.includes('jwt=');
    hasToken = !!localStorage.getItem("auth_token");
    
    addDebug(`🔍 Final check: JWT Cookie: ${hasJWTCookie ? '✅' : '❌'}, Local Token: ${hasToken ? '✅' : '❌'}`);
    
    if (!hasJWTCookie && !hasToken) {
      addDebug(`⚠️ NEITHER COOKIE NOR TOKEN SET!`);
      setErrorMessage("Authentication failed - no token received");
      return;
    }
    
    addDebug(`🔄 Auth successful (Cookie or Token)! Proceeding...`);
    addDebug(`🔄 Invalidating user queries...`);
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    
    addDebug(`🔄 Refetching user data from /auth/user...`);
    try {
      await queryClient.refetchQueries({ queryKey: ["user"] });
      addDebug(`📊 Refetch completed`);
      
      // Check if user data was actually fetched
      const userData = queryClient.getQueryData(["user"]);
      addDebug(`👤 User data: ${userData ? JSON.stringify(userData).substring(0, 80) : 'NULL - FETCH FAILED'}`);
      
      if (!userData) {
        // If we have an access token but fetch failed, we might need to manually set it in cache from login response
        if (response?.data && (response.data as any).user) {
           addDebug(`⚠️ Fetch failed but we have user data from login response! Using that.`);
           queryClient.setQueryData(["user"], (response.data as any).user);
           navigate("/home");
           return;
        }

        addDebug(`❌ User fetch failed even with cookie/token present!`);
        setErrorMessage("User fetch failed - check backend logs");
        return;
      }
      
      addDebug(`✅ User data fetched successfully!`);
      addDebug(`🚀 Navigating to /home...`);
      
      // Only navigate after confirming user is logged in
      navigate("/home");
    } catch (err: any) {
      addDebug(`❌ Refetch error: ${err.message}`);
      addDebug(`❌ Full error: ${JSON.stringify(err, null, 2).substring(0, 200)}`);
      setErrorMessage("Failed to fetch user data after login - check debug log");
    }
  };

  const logoSrc = "/paradize-logo.svg";
  
  // Get API info for debugging
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.MODE === "development" ? "http://localhost:3101" : "VITE_API_BASE_URL not set");

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-peach-200/40 via-peach-300/30 to-transparent blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-[-120px] left-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-eduGreen-200/40 via-eduBlue-200/30 to-transparent blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-eduBlue-200/30 via-peach-200/20 to-eduGreen-200/30 blur-3xl"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 pt-8 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white/80 px-6 py-3 text-gray-900 shadow-md backdrop-blur-xl transition hover:bg-white hover:shadow-lg"
          >
            <img
              src={logoSrc}
              alt="Paradize"
              className="h-10 w-10 rounded-full ring-1 ring-gray-200"
            />
            <span className="text-lg font-semibold">Paradize</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full grow items-center justify-center px-4 pb-16 pt-12 sm:px-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Educational Icon */}
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-peach-400 via-eduGreen-400 to-eduBlue-400 shadow-lg"
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <GraduationCap className="h-10 w-10 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Sparkles className="h-6 w-6 text-peach-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Login Card */}
          <div className="rounded-3xl border-2 border-gray-200 bg-white/80 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
            <div className="mb-8 text-center">
              <motion.div
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-peach-200 bg-peach-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-peach-600"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Sparkles className="h-3 w-3 text-peach-500" />
                {t("landing.login.badge")}
              </motion.div>
              <h1 className="mt-4 text-3xl font-black leading-tight text-gray-900 md:text-4xl">
                <span className="bg-gradient-to-r from-peach-500 via-eduGreen-500 to-eduBlue-500 bg-clip-text text-transparent">
                  {t("landing.login.title")}
                </span>
              </h1>
              <p className="mt-3 text-sm text-gray-600 md:text-base">
                {t("landing.login.subtitle")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Input
                  name="mail"
                  placeholder={t("landing.login.emailPlaceholder")}
                  icon={<Mail className="text-gray-400" />}
                  className="h-12 w-full rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-peach-400 focus-visible:border-peach-400"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Input
                  name="password"
                  placeholder={t("landing.login.passwordPlaceholder")}
                  type="password"
                  icon={<Lock className="text-gray-400" />}
                  className="h-12 w-full rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-peach-400 focus-visible:border-peach-400"
                />
              </motion.div>
              {errorMessage && (
                <motion.p
                  className="text-right text-sm font-medium text-red-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errorMessage}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button
                  type="submit"
                  loading={isLoginLoading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-peach-400 via-eduGreen-400 to-eduBlue-400 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-peach-200/50 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-peach-300/50"
                >
                  {t("landing.login.submit")}
                </Button>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              {t("landing.login.support")}
            </p>

            {/* API Configuration Info */}
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <h6 className="text-xs font-bold text-blue-700">API Configuration:</h6>
                <button
                  type="button"
                  onClick={() => {
                    const info = `URL: ${apiBaseUrl}\nMode: ${import.meta.env.MODE}\nOrigin: ${window.location.origin}\nCookies: ${navigator.cookieEnabled}\nCurrent Cookie: ${document.cookie}`;
                    navigator.clipboard.writeText(info);
                    alert('Config copied to clipboard!');
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
              <h6 className="text-xs font-mono text-blue-600">
                URL: {apiBaseUrl}
              </h6>
              <h6 className="text-xs font-mono text-blue-600">
                Mode: {import.meta.env.MODE}
              </h6>
              <h6 className="text-xs font-mono text-blue-600">
                Origin: {window.location.origin}
              </h6>
              <h6 className="text-xs font-mono text-blue-600">
                Cookies Enabled: {navigator.cookieEnabled ? 'Yes' : 'No'}
              </h6>
              <h6 className="text-xs font-mono text-blue-600 break-all">
                Current Cookie: {document.cookie || 'empty'}
              </h6>
            </div>

            {/* Debug Info */}
            {debugInfo.length > 0 && (
              <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border-2 border-red-400 bg-red-50 p-4 text-left shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="text-sm font-bold text-red-700 uppercase">🔍 Debug Log:</h6>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(debugInfo.join('\n'));
                      alert('Debug log copied to clipboard!');
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Copy All
                  </button>
                </div>
                {debugInfo.map((info, idx) => {
                  const isError = info.includes('❌') || info.includes('EMPTY') || info.includes('PROBLEM') || info.includes('NULL');
                  const isSuccess = info.includes('✅');
                  const isCookie = info.includes('🍪');
                  return (
                    <h6 
                      key={idx} 
                      className={`mb-1.5 text-xs font-mono break-all ${
                        isError ? 'text-red-700 font-bold' : 
                        isSuccess ? 'text-green-700 font-semibold' : 
                        isCookie ? 'text-blue-700 font-semibold' :
                        'text-gray-700'
                      }`}
                    >
                      {info}
                    </h6>
                  );
                })}
              </div>
            )}
          </div>

          {/* Back to Home Link */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-peach-600"
            >
              {t("landing.login.backToHome")}
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
