import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  query, 
  orderBy,
  Timestamp
} from "firebase/firestore";
import { 
  Users, 
  Search, 
  Coins, 
  UserCheck, 
  ShieldAlert, 
  Loader2, 
  Save, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle,
  TrendingUp,
  X,
  Mail,
  Calendar,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  createdAt?: Timestamp | Date | any;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen to users collection in real time
    const q = query(collection(db, "users"), orderBy("email", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersData.push({
          id: docSnap.id,
          email: data.email || "",
          credits: typeof data.credits === "number" ? data.credits : 0,
          isAdmin: !!data.isAdmin,
          createdAt: data.createdAt
        });
      });
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "users");
      setError("Permissão negada. Apenas administradores oficiais podem acessar o banco de dados de usuários.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNewCredits(user.credits);
    setSaveSuccess(false);
    setError(null);
  };

  const handleQuickAdjust = (amount: number) => {
    setNewCredits(prev => Math.max(0, prev + amount));
  };

  const handleSaveCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
 
    try {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        credits: newCredits
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setEditingUser(null);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.id}`);
      setError("Falha ao salvar. Verifique se você possui permissões de administrador.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Stats
  const totalUsers = users.length;
  const totalCredits = users.reduce((acc, curr) => acc + curr.credits, 0);
  const averageCredits = totalUsers > 0 ? Math.round(totalCredits / totalUsers) : 0;
  const totalAdmins = users.filter(user => user.isAdmin).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Carregando painel do administrador...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header section with Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-2xl text-white shadow-md shadow-indigo-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sessão do Administrador</h2>
              <p className="text-slate-500 text-xs sm:text-sm">Controle de usuários, auditoria de créditos ativos e monitoramento SaaS</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Usuários</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900">{totalUsers}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Créditos</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900">{totalCredits}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Média Créditos</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900">{averageCredits}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admins</span>
              <span className="text-lg sm:text-2xl font-black text-slate-900">{totalAdmins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main List & Edit Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* User list */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          {/* List Search & Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
              <span>Usuários Ativos</span>
              <span className="px-2 py-0.5 text-xs bg-slate-150 text-slate-600 rounded-full font-bold">
                {filteredUsers.length}
              </span>
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário por e-mail..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs transition-all focus:outline-hidden text-slate-800"
              />
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">
                Nenhum usuário encontrado com esses termos.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className={`p-4 sm:p-5 flex items-center justify-between transition-all hover:bg-slate-50/50 ${
                    editingUser?.id === user.id ? "bg-indigo-50/30 border-l-4 border-indigo-600" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                      user.isAdmin 
                        ? "bg-indigo-100 text-indigo-700 font-extrabold" 
                        : "bg-slate-100 text-slate-600 font-medium"
                    }`}>
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate block max-w-[150px] sm:max-w-xs" title={user.email}>
                          {user.email}
                        </span>
                        {user.isAdmin && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wide">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {user.createdAt 
                            ? new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString("pt-BR")
                            : "Recém Criado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center space-x-1 justify-end text-amber-600 font-extrabold text-xs sm:text-sm">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{user.credits}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">CRÉDITOS</span>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit user panel */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {editingUser ? (
              <motion.form 
                key="edit-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSaveCredits} 
                className="space-y-5"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Ajustar Créditos</span>
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuário Selecionado</span>
                  <p className="text-xs font-bold text-slate-700 truncate" title={editingUser.email}>
                    {editingUser.email}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl flex items-start space-x-2 text-xs border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Credits input & display */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo de Créditos</span>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(-50)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg text-slate-700 transition-all cursor-pointer"
                      title="Subtrair 50 créditos"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <input
                      type="number"
                      value={newCredits}
                      onChange={(e) => setNewCredits(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(50)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg text-slate-700 transition-all cursor-pointer"
                      title="Somar 50 créditos"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preset Quick Actions */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[10, 50, 100, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAdjust(val)}
                        className="py-1 px-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-150 rounded-lg text-[10px] font-bold text-slate-500 transition-all cursor-pointer"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer active:scale-97"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Alterações</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="no-edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-3"
              >
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
                  <Mail className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700 text-xs sm:text-sm">Selecione um Usuário</h4>
                  <p className="text-[11px] max-w-[200px] leading-relaxed">
                    Clique no botão "Editar" ao lado de qualquer usuário da lista para ajustar seu saldo de créditos em tempo real.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
