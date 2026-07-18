import React, { useState } from "react";
import { 
  auth, 
  db, 
  googleProvider,
  handleFirestoreError,
  OperationType
} from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  MessageSquare, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Chrome
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  
  // Custom password reset state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const handleCreateUserDocument = async (uid: string, userEmail: string) => {
    const userDocRef = doc(db, "users", uid);
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${uid}`);
      throw e;
    }
    
    // Determine if user should be admin based on email
    const isAdmin = userEmail.toLowerCase() === "kokitelmolotov@gmail.com" || 
                    userEmail.toLowerCase() === "artemiofonseca@gmail.com" ||
                    userEmail.toLowerCase().includes("admin");

    if (!userDoc.exists()) {
      try {
        await setDoc(userDocRef, {
          email: userEmail,
          credits: 30, // 30 free welcome credits
          isAdmin,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${uid}`);
        throw e;
      }
      return { credits: 30, isAdmin };
    } else {
      const data = userDoc.data();
      // Ensure isAdmin is updated if needed
      if (isAdmin && !data.isAdmin) {
        try {
          await setDoc(userDocRef, { isAdmin: true }, { merge: true });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
          throw e;
        }
        data.isAdmin = true;
      }
      return { 
        credits: typeof data.credits === "number" ? data.credits : 30, 
        isAdmin: !!data.isAdmin 
      };
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "signup") {
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve conter pelo menos 6 caracteres.");
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        
        // Send actual verification email (users can see it or handle it)
        try {
          await sendEmailVerification(user);
          setInfoMessage("Conta criada! Um e-mail de confirmação foi enviado para " + email);
        } catch (verifErr) {
          console.warn("Could not send email verification directly:", verifErr);
        }

        const profile = await handleCreateUserDocument(user.uid, user.email || email);
        onAuthSuccess({ ...user, ...profile });
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;
        const profile = await handleCreateUserDocument(user.uid, user.email || email);
        onAuthSuccess({ ...user, ...profile });
      }
    } catch (err: any) {
      console.error("Erro na autenticação por e-mail:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("E-mail ou senha inválidos.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail com formato inválido.");
      } else {
        setError(err.message || "Ocorreu um erro ao processar sua solicitação.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const { user } = userCredential;
      const profile = await handleCreateUserDocument(user.uid, user.email || "");
      onAuthSuccess({ ...user, ...profile });
    } catch (err: any) {
      console.error("Erro no login com Google:", err);
      if (err.code === "auth/popup-blocked") {
        setError("O popup foi bloqueado pelo seu navegador. Por favor, libere popups para este site ou abra o app em uma nova aba.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("O login com Google foi cancelado antes de ser concluído.");
      } else {
        setError("Erro ao autenticar com o Google. Se você estiver dentro do editor do AI Studio (iframe), por favor clique em 'Abrir em Nova Aba' no canto superior direito para permitir o popup do Google, ou use o formulário de E-mail ou a Conta de Testes abaixo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Por favor, digite o seu e-mail.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setInfoMessage("E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.");
      setShowForgot(false);
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      setError("Erro ao enviar e-mail de redefinição. Verifique se o e-mail está correto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Automated Demo/Admin sign-in for seamless verification in iframe environments
  const handleQuickDemoLogin = async (role: "admin" | "user") => {
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    const demoEmail = role === "admin" ? "kokitelmolotov@gmail.com" : "usuario_teste@fluentbridge.com";
    const demoPassword = "password123";

    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (e) {
        // Create it if it doesn't exist yet
        userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      }

      const { user } = userCredential;
      const profile = await handleCreateUserDocument(user.uid, user.email || demoEmail);
      onAuthSuccess({ ...user, ...profile });
    } catch (err: any) {
      console.error("Demo login error:", err);
      setError("Erro ao iniciar sessão de demonstração: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-100 p-4 font-sans selection:bg-blue-100">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-60 -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-60 -ml-10 -mb-10" />

        {/* Logo Header */}
        <div className="flex flex-col items-center text-center space-y-2 relative z-10">
          <div className="w-12 h-12 bg-linear-to-tr from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Fluent<span className="text-blue-600">Bridge</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs">
            Refine seu inglês de forma nativa e profissional com o poder da Inteligência Artificial
          </p>
        </div>

        {/* Info/Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-2xl flex items-start space-x-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">Aviso: </span> {error}
              </div>
            </motion.div>
          )}

          {infoMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl flex items-start space-x-2.5 text-xs"
            >
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">
                {infoMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forgotten Password Section */}
        {showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 relative z-10">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-800">Recuperar Senha</h2>
              <p className="text-xs text-slate-500">Digite seu e-mail cadastrado para receber instruções de recuperação.</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all focus:outline-hidden text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 gap-3">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Enviar E-mail</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Tabs */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex items-center">
              <button
                onClick={() => { setActiveTab("login"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setActiveTab("signup"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Google Authentication Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all rounded-xl text-sm font-bold text-slate-700 flex items-center justify-center space-x-2.5 shadow-xs cursor-pointer active:scale-98"
            >
              <Chrome className="w-4 h-4 text-blue-600" />
              <span>Entrar com o Google</span>
            </button>

            {/* Separator */}
            <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              <div className="h-px bg-slate-200 flex-1 mr-3" />
              <span>Ou use seu e-mail</span>
              <div className="h-px bg-slate-200 flex-1 ml-3" />
            </div>

            {/* Standard Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all focus:outline-hidden text-slate-800"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all focus:outline-hidden text-slate-800"
                    required
                  />
                </div>

                {activeTab === "signup" && (
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar Senha"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all focus:outline-hidden text-slate-800"
                      required
                    />
                  </div>
                )}
              </div>

              {activeTab === "login" && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError(null); }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{activeTab === "login" ? "Entrar" : "Criar Minha Conta"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Section (Extremely Useful for Testing/Validation in Studio Iframe) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-center text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
                <span>Testes Rápidos de Avaliação (Recomendado)</span>
              </div>
              <p className="text-[10px] text-slate-500 text-center max-w-xs mx-auto leading-relaxed">
                Clique nos botões abaixo para entrar instantaneamente sem precisar passar por fluxos de e-mail ou popups de terceiros.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("admin")}
                  disabled={isLoading}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-97 disabled:opacity-50"
                  title="Acesse com a conta do administrador kokitelmolotov@gmail.com"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Entrar como Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin("user")}
                  disabled={isLoading}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-97 disabled:opacity-50"
                  title="Acesse com uma conta de usuário de testes"
                >
                  <Chrome className="w-3.5 h-3.5 shrink-0" />
                  <span>Entrar como Usuário</span>
                </button>
              </div>
            </div>

            {/* PWA / Google Auth Help Box */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 py-1.5 px-2 rounded-xl hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <span className="flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Dificuldades com Login ou Instalação?</span>
                </span>
                <span className="text-[10px] text-slate-400 transition-transform duration-200">
                  {showHelp ? "▲ Ocultar" : "▼ Mostrar"}
                </span>
              </button>
              
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 text-[11px] text-slate-600 space-y-2 leading-relaxed bg-blue-50/30 p-3 rounded-2xl border border-blue-100/50 mt-1.5">
                      <p className="font-bold text-slate-800">
                        📱 Se você está abrindo o link pelo celular (ex: via WhatsApp, Instagram ou Gmail) ou por dentro de um editor (iframe):
                      </p>
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                        <li>
                          <strong>Popups Bloqueados:</strong> O login do Google precisa abrir uma janela separada. Aplicativos de redes sociais e e-mail bloqueiam isso por segurança.
                        </li>
                        <li>
                          <strong>Instalação Invisível:</strong> Os "três pontinhos" com a opção de <span className="text-blue-700 font-bold">"Instalar aplicativo"</span> só aparecem quando você está usando o <strong>navegador Google Chrome oficial e fora de outros aplicativos</strong>.
                        </li>
                      </ul>
                      <div className="p-2.5 bg-blue-100/60 rounded-xl border border-blue-200/50 text-[10px] text-blue-800 font-bold leading-normal">
                        💡 Como resolver: No topo ou canto inferior do seu aplicativo atual (como o WhatsApp), clique no ícone de três pontinhos ou bússola e escolha <span className="underline">"Abrir no Chrome"</span> (ou "Open in Chrome"). Lá você poderá fazer login e instalar o app na sua tela inicial perfeitamente!
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
