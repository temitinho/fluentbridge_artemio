import React, { useState, useEffect } from "react";
import { Trash2, Download, Trash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SavedPhrase {
  id: string;
  original: string;
  refinementType: string;
  refinedText: string;
  timestamp: string;
}

export function History() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = () => {
    const saved = JSON.parse(localStorage.getItem("fluent_phrases") || "[]");
    setPhrases(saved);
  };

  const deletePhrase = (id: string) => {
    const updated = phrases.filter((p) => p.id !== id);
    localStorage.setItem("fluent_phrases", JSON.stringify(updated));
    setPhrases(updated);
  };

  const clearAll = () => {
    localStorage.setItem("fluent_phrases", "[]");
    setPhrases([]);
    setShowClearConfirm(false);
  };

  const exportPhrases = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(phrases, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "minhas_frases_fluent.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (phrases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p>Nenhuma frase salva ainda.</p>
        <p className="text-sm mt-2">Vá em Refinar Frase para salvar algumas!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Frases Salvas
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Seu arquivo pessoal de refinamentos e traduções de inglês.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {showClearConfirm ? (
            <div className="flex items-center space-x-1 bg-red-50 p-1 rounded-lg border border-red-200">
              <span className="text-xs text-red-600 px-2 font-medium">Tem certeza?</span>
              <button
                onClick={clearAll}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors"
              >
                Sim, Limpar
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg text-sm font-medium transition-all duration-200"
              title="Limpar todo o arquivo"
            >
              <Trash className="w-4 h-4" />
              <span>Limpar Tudo</span>
            </button>
          )}

          <button
            onClick={exportPhrases}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {phrases.map((phrase) => (
            <motion.div
              key={phrase.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex justify-between items-start group relative hover:border-red-200 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3 flex-1 pr-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Original
                  </span>
                  <p className="text-gray-600 italic">"{phrase.original}"</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {phrase.refinementType}
                  </span>
                  <p className="text-gray-900 font-medium text-lg">
                    {phrase.refinedText}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deletePhrase(phrase.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 md:opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-95 shrink-0"
                title="Excluir item"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
