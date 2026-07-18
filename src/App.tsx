import React, { useState, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { RefinePhrase } from "./components/RefinePhrase";
import { LiveConversation } from "./components/LiveConversation";
import { History } from "./components/History";
import { UserManual } from "./components/UserManual";
import { AuthScreen } from "./components/AuthScreen";
import { AdminPanel } from "./components/AdminPanel";
import { 
  MessageSquare, 
  Mic, 
  BookMarked, 
  Coins, 
  Smartphone, 
  Check, 
  Copy, 
  QrCode, 
  Sparkles, 
  HelpCircle, 
  CreditCard,
  X,
  BookOpen,
  LogOut,
  ShieldAlert,
  Loader2,
  Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"refine" | "live" | "history" | "admin">(
    "refine",
  );
  
  const [isManualOpen, setIsManualOpen] = useState(false);
  
  // Authentication & Synced States
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [credits, setCredits] = useState<number>(30);
  const [isAdmin, setIsAdmin] = useState(false);

  // Billing states
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; credits: number; price: string } | null>(null);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Listen to Auth State and sync Firestore user profile in real-time
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If we returned from MercadoPago with success, add the credits!
        const initialParams = new URLSearchParams(window.location.search);
        const initialStatus = initialParams.get('status');
        const initialCredits = initialParams.get('credits');
        if (initialStatus === 'success' && initialCredits) {
          const amount = parseInt(initialCredits, 10);
          if (!isNaN(amount)) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            // We just let the snapshot listener pick up the new value after we update it.
            // But we need the current value first, so we do it in a transaction or just read it.
            // Actually, we'll let `addCredits` do it when the snapshot loads, or we can just 
            // wait for the snapshot and then update.
          }
        }

        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCredits(typeof data.credits === "number" ? data.credits : 30);
            setIsAdmin(!!data.isAdmin);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              ...data
            });
            
            // Process MercadoPago return AFTER we have the current credits
            const currentParams = new URLSearchParams(window.location.search);
            const currentStatus = currentParams.get('status');
            const currentCredits = currentParams.get('credits');
            
            if (currentStatus === 'success' && currentCredits) {
              const amount = parseInt(currentCredits, 10);
              if (!isNaN(amount) && typeof data.credits === "number") {
                // Clear URL FIRST to prevent infinite loops from snapshot updates
                window.history.replaceState({}, document.title, window.location.pathname);
                
                const nextCredits = data.credits + amount;
                updateDoc(userDocRef, { credits: nextCredits }).then(() => {
                   setPaymentSuccess(true);
                   setIsBillingOpen(true);
                   setTimeout(() => { setPaymentSuccess(false); }, 5000);
                });
              }
            }
          } else {
            // New user signed up, fallback or wait for AuthScreen setDoc
            const isEmailAdmin = firebaseUser.email?.toLowerCase() === "kokitelmolotov@gmail.com" || 
                                 firebaseUser.email?.toLowerCase() === "artemiofonseca@gmail.com" ||
                                 firebaseUser.email?.toLowerCase().includes("admin");
            setCredits(30);
            setIsAdmin(isEmailAdmin);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "",
              credits: 30,
              isAdmin: isEmailAdmin
            });
          }
          setUserLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          setUserLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setCredits(30);
        setIsAdmin(false);
        setUserLoading(false);
        setActiveTab("refine"); // Reset tab
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const deductCredits = (amount: number): boolean => {
    if (isAdmin) return true;
    if (credits >= amount) {
      setCredits(prev => {
        const nextCredits = prev - amount;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          updateDoc(userDocRef, { credits: nextCredits })
            .catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
        }
        return nextCredits;
      });
      return true;
    }
    return false;
  };

  const addCredits = (amount: number) => {
    setCredits(prev => {
      const nextCredits = prev + amount;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        updateDoc(userDocRef, { credits: nextCredits })
          .catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`));
      }
      return nextCredits;
    });
  };

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(
      "00020101021126580014br.gov.bcb.pix0136e4f8d55a-8b8d-4a11-b01d-31835728a4525204000053039865404" + 
      (selectedPlan?.price.replace("R$ ", "").replace(",", ".") || "9.90") + 
      "5802BR5912FluentBridge6009Sao Paulo62070503***6304"
    );
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGeneratePix = async (plan: { id: string; name: string; credits: number; price: string }) => {
    setSelectedPlan(plan);
    setIsSimulatingPayment(true);
    
    try {
      const response = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          price: plan.price,
          credits: plan.credits,
          userEmail: user?.email || 'test@example.com',
          userId: user?.uid || 'anonymous'
        })
      });
      
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        console.error("Error creating preference", data);
        alert("Ocorreu um erro ao gerar o pagamento. Tente novamente.");
        setIsSimulatingPayment(false);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Ocorreu um erro de conexão.");
      setIsSimulatingPayment(false);
    }
  };

  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      setIsSimulatingPayment(false);
      setPaymentSuccess(true);
      if (selectedPlan) {
        addCredits(selectedPlan.credits);
      }
      setTimeout(() => {
        setPixGenerated(false);
        setSelectedPlan(null);
        setPaymentSuccess(false);
      }, 3000);
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const plans = [
    { id: "bronze", name: "Bronze", credits: 50, price: "R$ 4,90" },
    { id: "silver", name: "Prata (Popular)", credits: 150, price: "R$ 9,90" },
    { id: "gold", name: "Ouro (Melhor Custo)", credits: 500, price: "R$ 24,90" },
  ];

  // Full screen loading indicator
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-bold text-slate-600">Sincronizando com o FluentBridge...</p>
      </div>
    );
  }

  // Not authenticated? Show Auth Screen
  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100">
      
      {/* Header with Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-3 sm:h-18 gap-3">
            
            {/* Logo and Greeting */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">
                    FluentBridge
                  </h1>
                  <span className="text-[10px] text-gray-500 font-mono">Parceiro de Inglês com IA</span>
                </div>
              </div>
              
              {/* Show email greeting on mobile inside header */}
              <div className="sm:hidden flex items-center space-x-2 bg-slate-100 py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-700 ml-3">
                {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                <span className="max-w-[100px] truncate">{user.email}</span>
              </div>
            </div>

            {/* Navigation buttons and utilities */}
            <nav className="flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <button
                  onClick={() => setActiveTab("refine")}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === "refine"
                      ? "bg-blue-50 text-blue-700 shadow-3xs"
                      : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Refinar</span>
                </button>

                <button
                  onClick={() => setActiveTab("live")}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === "live"
                      ? "bg-blue-50 text-blue-700 shadow-3xs"
                      : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Conversação com IA</span>
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === "history"
                      ? "bg-blue-50 text-blue-700 shadow-3xs"
                      : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Arquivo</span>
                </button>

                {/* Admin Tab if authorized */}
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      activeTab === "admin"
                        ? "bg-indigo-50 text-indigo-700 shadow-3xs"
                        : "text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-800"
                    }`}
                    title="Acesse o Painel do Administrador"
                  >
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  onClick={() => setIsManualOpen(true)}
                  className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Manual de Instruções"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden md:inline font-bold">Manual</span>
                </button>
              </div>

              {/* User Account / Credits / Sign Out Group */}
              <div className="flex items-center space-x-2 shrink-0 border-l border-slate-200 pl-2 ml-1">
                {/* Greeting (desktop) */}
                <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-700">
                  {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                  <span className="max-w-[120px] truncate" title={user.email}>{user.email}</span>
                </div>

                {/* Credits Badge */}
                <button
                  onClick={() => setIsBillingOpen(true)}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Seu saldo de créditos. Clique para recarregar."
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{isAdmin ? 'Ilimitado' : credits} 🪙</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-lg transition-all cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "refine" && (
              <RefinePhrase 
                credits={isAdmin ? 999999 : credits} 
                deductCredits={deductCredits} 
                onRequestRecharge={() => setIsBillingOpen(true)} 
              />
            )}
            {activeTab === "live" && (
              <LiveConversation 
                credits={isAdmin ? 999999 : credits} 
                deductCredits={deductCredits} 
                onRequestRecharge={() => setIsBillingOpen(true)} 
              />
            )}
            {activeTab === "history" && <History />}
            {activeTab === "admin" && isAdmin && <AdminPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* PIX Billing Modal */}
      <AnimatePresence>
        {isBillingOpen && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => {
                  setIsBillingOpen(false);
                  setPixGenerated(false);
                  setSelectedPlan(null);
                }} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full w-fit text-sm font-bold border border-amber-100 mb-2">
                    <Coins className="w-4 h-4" />
                    <span>Seu Saldo Atual: {isAdmin ? 'Ilimitado' : credits} créditos</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Central de Cobrança PIX & Tokens
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Como adquirir pacotes de crédito de forma rápida para continuar utilizando os serviços.
                  </p>
                </div>

                {!pixGenerated ? (
                  <div className="space-y-6">
                    {/* Choose a package */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Adquirir Pacotes de Crédito
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                          <div 
                            key={plan.id}
                            className={`border rounded-xl p-4 flex flex-col justify-between transition-all relative ${
                              plan.id === "silver" 
                                ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/30 font-medium" 
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            } ${isSimulatingPayment ? 'opacity-50 pointer-events-none' : 'cursor-pointer active:scale-98'}`}
                            onClick={() => handleGeneratePix(plan)}
                          >
                            {isSimulatingPayment && selectedPlan?.id === plan.id && (
                              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                              </div>
                            )}
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-gray-900">{plan.name}</span>
                                {plan.id === "silver" && (
                                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">Pagamento Seguro via Mercado Pago</p>
                            </div>
                            <div className="mt-4 pt-2 border-t border-gray-100">
                              <span className="block text-2xl font-extrabold text-gray-900">{plan.credits} 🪙</span>
                              <span className="text-sm font-bold text-blue-600 block mt-1">{plan.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

              <div className="text-xs text-gray-400 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                ℹ️ <strong>Custo do App:</strong> A Transcrição consome <strong>1 crédito</strong>. Cada refinamento específico consome <strong>1 crédito</strong>. A Conversação com IA consome <strong>5 créditos</strong> por conexão.
              </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-5 sm:p-6 border border-gray-100 space-y-5">
                    {/* Payment Success state is now handled instantly when returning from Mercado Pago */}
                    <div className="border-t border-gray-200 pt-5 space-y-4">
                      {paymentSuccess ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2 animate-in fade-in zoom-in-95">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <h5 className="font-bold text-green-900">Pagamento Confirmado!</h5>
                          <p className="text-green-700 text-xs sm:text-sm">
                            Parabéns! Foram adicionados <strong>{selectedPlan?.credits} créditos</strong> à sua carteira FluentBridge.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
                            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                            <span>Redirecionando para o Mercado Pago...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Manual Modal */}
      <AnimatePresence>
        {isManualOpen && (
          <div id="printable-manual-root" className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl my-8 print:my-0"
            >
              <UserManual onClose={() => setIsManualOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
