import React, { useState, useEffect } from "react";
import { Mic, Square, Loader2, Check, Save, Copy, AlertCircle, HelpCircle, X, Coins, Sparkles } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { blobToBase64 } from "../lib/utils";
import { ai } from "../lib/gemini";
import { Type } from "@google/genai";

interface Refinements {
  literal?: string;
  colloquial?: string;
  professional?: string;
  classic?: string;
  correto?: string;
  arcaico?: string;
  cientifico?: string;
  elaborado?: string;
}

type InputMode = "refine_pt" | "translate" | "instruct" | "refine";

function PermissionHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Ajuda com o Microfone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <section>
            <h4 className="font-bold text-gray-900 mb-1">1. Verifique as Permissões do Navegador</h4>
            <p>Procure por um <strong>ícone de microfone</strong> na barra de endereço do seu navegador (geralmente à esquerda ou à direita). Clique nele e certifique-se de selecionar "Permitir" para este site.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-gray-900 mb-1">2. Configurações do Sistema</h4>
            <p>Certifique-se de que as configurações do sistema de seu computador ou celular permitem que o navegador acesse o microfone.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-gray-900 mb-1">3. Atualize a Página</h4>
            <p>Depois de alterar as permissões, você <strong>deve atualizar a página</strong> para que as alterações tenham efeito.</p>
          </section>
          
          <section>
            <h4 className="font-bold text-gray-900 mb-1">4. Restrições do Iframe</h4>
            <p>Se você estiver usando em uma janela de visualização do editor, tente abrir o aplicativo em uma <strong>nova aba</strong> usando o botão no canto superior direito do editor.</p>
          </section>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export function RefinePhrase({ 
  credits, 
  deductCredits, 
  onRequestRecharge 
}: { 
  credits: number; 
  deductCredits: (amount: number) => boolean; 
  onRequestRecharge: () => void; 
}) {
  const { isRecording, error: recordingError, recordingTime, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    if (isRecording && recordingTime >= 30) {
      handleRecordToggle();
    }
  }, [isRecording, recordingTime]);

  const [inputMode, setInputMode] = useState<InputMode>("refine_pt");
  const [sourceTranscription, setSourceTranscription] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [refinements, setRefinements] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefining, setIsRefining] = useState<Record<string, boolean>>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hasMic, setHasMic] = useState<boolean | null>(null);

  const REFINEMENT_OPTIONS_EN = [
    { id: 'literal', label: 'Correção Literal', desc: 'Corrige gramática mantendo o tom original.' },
    { id: 'colloquial', label: 'Coloquial / Natural', desc: 'Tom casual, gírias ou phrasal verbs.' },
    { id: 'professional', label: 'Profissional / Elegante', desc: 'Versão formal para negócios ou academia.' },
    { id: 'classic', label: 'Clássico / Literário', desc: 'Versão sofisticada e altamente articulada.' }
  ];

  const REFINEMENT_OPTIONS_PT = [
    { id: 'correto', label: 'Português Correto / Formal', desc: 'Correção gramatical impecável no padrão culto atual.' },
    { id: 'arcaico', label: 'Português Arcaico', desc: 'Linguagem de épocas passadas, clássico ou arcaico literário.' },
    { id: 'cientifico', label: 'Português Científico', desc: 'Linguagem técnica, objetiva, formal e acadêmica.' },
    { id: 'elaborado', label: 'Português Elaborado', desc: 'Altamente elegante, rico em vocabulário culto/erudito.' }
  ];

  useEffect(() => {
    async function checkDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const micExists = devices.some(device => device.kind === 'audioinput');
        setHasMic(micExists);
      } catch (e) {
        setHasMic(false);
      }
    }
    checkDevices();
  }, []);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const [emojiLoading, setEmojiLoading] = useState<{ [key: string]: boolean }>({});

  const handleAddEmojis = async (textToEnrich: string, targetKey: 'main' | keyof Refinements) => {
    const targetId = targetKey === 'main' ? 'main' : `refine-${targetKey}`;
    setEmojiLoading(prev => ({ ...prev, [targetId]: true }));
    try {
      const prompt = `Pegue a seguinte frase em português ou inglês e adicione emojis contextuais e descritivos adequados no meio ou no final das frases para ilustrar visualmente o seu significado, deixando o texto original exatamente intacto. Não altere as palavras originais, apenas insira emojis apropriados naturalmente para dar cor e vida ao texto.
      
      Frase: "${textToEnrich}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt],
      });

      const enrichedText = response.text?.trim() || textToEnrich;
      
      if (targetKey === 'main') {
        setTranscription(enrichedText);
      } else {
        setRefinements(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [targetKey]: enrichedText
          };
        });
      }
    } catch (error) {
      console.error("Failed to add emojis", error);
    } finally {
      setEmojiLoading(prev => ({ ...prev, [targetId]: false }));
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        processAudio(result.blob, result.mimeType);
      }
    } else {
      if (credits < 1) {
        onRequestRecharge();
        return;
      }
      setSourceTranscription("");
      setTranscription("");
      setRefinements({});
      setSavedMessage("");
      await startRecording();
    }
  };

  const getLabel = (type: string) => {
    const labels: Record<string, string> = {
      literal: "Correção Literal",
      colloquial: "Coloquial / Natural",
      professional: "Profissional / Elegante",
      classic: "Clássico / Literário",
      correto: "Português Correto / Formal",
      arcaico: "Português Arcaico / Clássico",
      cientifico: "Português Científico",
      elaborado: "Português Não Coloquial / Elaborado",
    };
    return labels[type] || type;
  };

  const generateRefinement = async (type: string) => {
    if (credits < 1) {
      onRequestRecharge();
      return;
    }
    
    setIsRefining(prev => ({ ...prev, [type]: true }));
    
    try {
      let prompt = "";
      
      if (inputMode === "refine_pt") {
        if (type === "correto") {
          prompt = `Gere uma versão da frase em "Português Correto/Formal": Correção gramatical impecável no padrão culto atual, sem termos rebuscados em excesso, apenas formal e correto. Retorne APENAS a frase refinada, sem nenhum texto adicional, explicações ou aspas. Frase: "${transcription}"`;
        } else if (type === "arcaico") {
          prompt = `Gere uma versão da frase em "Português Arcaico/Clássico": Uma versão que remete ao português de épocas passadas, clássico ou arcaico literário, usando mesóclises, vocabulário antigo e construções históricas sofisticadas. Retorne APENAS a frase refinada, sem nenhum texto adicional, explicações ou aspas. Frase: "${transcription}"`;
        } else if (type === "cientifico") {
          prompt = `Gere uma versão da frase em "Português Científico": Linguagem técnica, objetiva, formal e acadêmica, apropriada para contextos científicos ou de pesquisa. Retorne APENAS a frase refinada, sem nenhum texto adicional, explicações ou aspas. Frase: "${transcription}"`;
        } else if (type === "elaborado") {
          prompt = `Gere uma versão da frase em "Português Não Coloquial/Elaborado": Linguagem altamente elegante, rica em vocabulário culto/erudito, expressando a ideia de forma sofisticada e elaborada, evitando qualquer tom coloquial. Retorne APENAS a frase refinada, sem nenhum texto adicional, explicações ou aspas. Frase: "${transcription}"`;
        }
      } else {
        if (type === "literal") {
          prompt = `Generate a "Literal Correction" of this phrase: Fixing grammar while keeping the user's original tone. Return ONLY the refined phrase, without any additional text, explanations or quotes. Phrase: "${transcription}"`;
        } else if (type === "colloquial") {
          prompt = `Generate a "Colloquial/Natural" version of this phrase: How a native speaker would say it in a casual setting (slang, phrasal verbs). Return ONLY the refined phrase, without any additional text, explanations or quotes. Phrase: "${transcription}"`;
        } else if (type === "professional") {
          prompt = `Generate a "Professional/Elegant" version of this phrase: A formal version suitable for business or academic environments. Return ONLY the refined phrase, without any additional text, explanations or quotes. Phrase: "${transcription}"`;
        } else if (type === "classic") {
          prompt = `Generate a "Classic/Literary" version of this phrase: A sophisticated, highly articulate version. Return ONLY the refined phrase, without any additional text, explanations or quotes. Phrase: "${transcription}"`;
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const refinedText = response.text?.trim() || "";
      
      if (refinedText) {
        setRefinements(prev => ({ ...prev, [type]: refinedText }));
        deductCredits(1);
      }
    } catch (error: any) {
      console.error("Error generating refinement:", error);
      const errMsg = error?.message || "";
      if (errMsg.toLowerCase().includes("prepayment") || errMsg.toLowerCase().includes("credits") || errMsg.toLowerCase().includes("429") || errMsg.toLowerCase().includes("billing")) {
        setRefinements(prev => ({
          ...prev,
          [type]: "Erro: Os créditos de pré-pagamento da API do Gemini se esgotaram no projeto associado ao site. Acesse o painel do Google AI Studio para recarregar."
        }));
      } else {
        setRefinements(prev => ({
          ...prev,
          [type]: "Erro ao gerar refinamento. Por favor, tente novamente."
        }));
      }
    } finally {
      setIsRefining(prev => ({ ...prev, [type]: false }));
    }
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    try {
      const base64Data = await blobToBase64(blob);

      let cleanMimeType = mimeType.split(";")[0].trim().toLowerCase();
      
      if (cleanMimeType.includes("quicktime")) {
        cleanMimeType = "audio/mp4";
      } else if (cleanMimeType === "audio/x-m4a" || cleanMimeType === "audio/m4a") {
        cleanMimeType = "audio/mp4";
      } else if (cleanMimeType === "audio/x-wav") {
        cleanMimeType = "audio/wav";
      } else if (cleanMimeType === "audio/x-webm" || cleanMimeType === "video/webm") {
        cleanMimeType = "audio/webm";
      }

      let prompt = "";
      let isJson = false;

      if (inputMode === "refine") {
        prompt =
          "Transcribe the following audio exactly as spoken in English. Do not correct grammar or add anything else. Just output the raw transcription.";
      } else if (inputMode === "refine_pt") {
        prompt =
          "Transcribe the following audio exactly as spoken in Brazilian Portuguese. Do not correct grammar or add anything else. Just output the raw transcription.";
      } else if (inputMode === "translate") {
        prompt =
          "Listen to the following Brazilian Portuguese audio. Return a JSON object with two fields: 'sourceTranscription' (the exact transcription of the Brazilian Portuguese audio) and 'englishResult' (the direct English translation).";
        isJson = true;
      } else if (inputMode === "instruct") {
        prompt =
          "Listen to the following instructions in Brazilian Portuguese. Return a JSON object with two fields: 'sourceTranscription' (the exact transcription of the Brazilian Portuguese audio) and 'englishResult' (the generated English content fulfilling the instructions).";
        isJson = true;
      }

      const transcribeResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: cleanMimeType,
              data: base64Data,
            },
          },
          prompt,
        ],
        config: isJson
          ? {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sourceTranscription: { type: Type.STRING },
                  englishResult: { type: Type.STRING },
                },
                required: ["sourceTranscription", "englishResult"],
              },
            }
          : undefined,
      });

      let rawText = "";
      if (isJson) {
        try {
          const parsed = JSON.parse(transcribeResponse.text?.trim() || "{}");
          setSourceTranscription(parsed.sourceTranscription || "");
          rawText = parsed.englishResult || "";
        } catch (e) {
          console.error("Failed to parse JSON response", e);
        }
      } else {
        rawText = transcribeResponse.text?.trim() || "";
      }
      setTranscription(rawText);
      
      deductCredits(1);
    } catch (error: any) {
      console.error("Error processing audio:", error);
      const errMsg = error?.message || "";
      if (errMsg.toLowerCase().includes("prepayment") || errMsg.toLowerCase().includes("credits") || errMsg.toLowerCase().includes("429") || errMsg.toLowerCase().includes("billing")) {
        setTranscription("Erro: Os créditos de pré-pagamento da API do Gemini se esgotaram na conta do Google AI Studio associada a este site. Por favor, acesse o painel do Google AI Studio (https://ai.studio/projects) para gerenciar o faturamento do projeto e recarregar os créditos.");
      } else {
        setTranscription("Erro ao processar áudio. Por favor, tente novamente.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const savePhrase = (type: string, text: string, originalText?: string) => {
    const entry = {
      id: Date.now().toString(),
      original: originalText || transcription || "N/A",
      refinementType: type,
      refinedText: text,
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("fluent_phrases") || "[]");
    localStorage.setItem(
      "fluent_phrases",
      JSON.stringify([entry, ...existing]),
    );

    setSavedMessage(`Versão ${type} salva!`);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Refinar Frase
        </h2>
        <p className="text-gray-500">
          {inputMode === "refine_pt" && "Fale em português brasileiro para obter versões formais, acadêmicas, clássicas ou avançadas do português."}
          {inputMode === "translate" && "Fale em português brasileiro para traduzir e refinar em inglês."}
          {inputMode === "instruct" && "Dê instruções em português brasileiro para gerar e refinar conteúdo em inglês."}
          {inputMode === "refine" && "Fale uma frase em inglês para obter refinamentos instantâneos."}
        </p>
      </div>

      {credits < 2 && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 text-sm">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Você precisa de no mínimo <strong>2 créditos</strong> para refinar uma frase. Seu saldo atual é de {credits} créditos.</span>
          </div>
          <button 
            onClick={onRequestRecharge}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-xs sm:text-sm shadow-xs active:scale-95 shrink-0"
          >
            Recarregar via PIX
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg justify-center sm:flex-nowrap">
        <button
          onClick={() => setInputMode("refine_pt")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === "refine_pt"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Transcrever PT, Refinar PT
        </button>
        <button
          onClick={() => setInputMode("translate")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === "translate"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Transcrever PT, Traduzir EN, Refinar EN
        </button>
        <button
          onClick={() => setInputMode("instruct")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === "instruct"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Instruir PT, Refinar EN
        </button>
        <button
          onClick={() => setInputMode("refine")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === "refine"
              ? "bg-white shadow-sm text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Transcrever EN, Refinar EN
        </button>
      </div>

      <button
        onClick={handleRecordToggle}
        className={`relative flex items-center justify-center w-28 h-28 rounded-full transition-all duration-300 ${
          isRecording
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
        }`}
      >
        {isRecording && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle 
              cx="56" 
              cy="56" 
              r="52" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              className="text-red-200" 
            />
            <circle 
              cx="56" 
              cy="56" 
              r="52" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(recordingTime, 30) / 30)}
              className="text-red-600 transition-all duration-1000 ease-linear" 
            />
          </svg>
        )}
        {isRecording ? (
          <div className="flex flex-col items-center justify-center">
            <Square className="w-8 h-8 mb-1 text-red-600" />
            <span className="text-[10px] font-bold font-mono tracking-tighter text-red-600">{Math.max(0, 30 - recordingTime)}s</span>
          </div>
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </button>

      {isRecording && (
        <p className="text-red-500 font-medium animate-pulse">Gravando... (Máx 30s)</p>
      )}

      {recordingError && (
        <div className="text-center space-y-3 bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <p className="font-bold">Erro de Microfone</p>
          </div>
          <p className="text-red-700 text-sm">
            {recordingError}
          </p>
          <button 
            onClick={() => setShowHelp(true)}
            className="flex items-center space-x-1 mx-auto text-sm font-semibold text-red-600 hover:text-red-800 underline decoration-red-300"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Como corrigir isso?</span>
          </button>
        </div>
      )}

      {hasMic === false && (
        <div className="text-center space-y-2 bg-amber-50 p-4 rounded-xl border border-amber-100 max-w-md">
          <p className="text-amber-800 text-sm font-medium">
            Nenhum microfone detectado. Por favor, conecte um para usar esta função.
          </p>
        </div>
      )}

      {showHelp && <PermissionHelp onClose={() => setShowHelp(false)} />}

      {isProcessing && !transcription && (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processando áudio...</span>
        </div>
      )}

      {sourceTranscription && (
        <div className="w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Transcrição de Origem (PT-BR)
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => savePhrase("Transcrição em Português", sourceTranscription, "Entrada de Áudio")}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Salvar no arquivo"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopy(sourceTranscription, 'source')}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Copiar para a área de transferência"
              >
                {copiedId === 'source' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-800 font-medium">{sourceTranscription}</p>
        </div>
      )}

      {transcription && (
        <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {inputMode === "refine"
                ? "Transcrição Original"
                : inputMode === "translate"
                ? "Tradução para o Inglês"
                : inputMode === "transcribe_pt" || inputMode === "refine_pt"
                ? "Transcrição em Português"
                : "Conteúdo Gerado"}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAddEmojis(transcription, 'main')}
                disabled={emojiLoading['main']}
                className="text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-all flex items-center space-x-1 text-xs font-semibold bg-white border border-gray-200 shadow-xs hover:border-gray-300 px-2 py-1 rounded-md"
                title="Ilustrar com Emojis"
              >
                {emojiLoading['main'] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>Add Emojis</span>
              </button>
              {(inputMode === "transcribe_pt" || inputMode === "refine_pt") && (
                <button
                  onClick={() => savePhrase("Transcrição em Português", transcription, "Entrada de Áudio")}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Salvar no arquivo"
                >
                  <Save className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleCopy(transcription, 'main')}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="Copiar para a área de transferência"
              >
                {copiedId === 'main' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-900 font-medium">{transcription}</p>
        </div>
      )}

      {transcription && (inputMode === "refine" || inputMode === "refine_pt" || inputMode === "translate") && (
        <div className="w-full space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Opções de Refinamento
          </h3>

          <div className="space-y-6">
            {(inputMode === "refine_pt" ? REFINEMENT_OPTIONS_PT : REFINEMENT_OPTIONS_EN).map((option) => (
              <div key={option.id} className="flex flex-col">
                <div className="mb-2">
                  <h4 className="text-sm font-bold text-gray-900">{option.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{option.desc}</p>
                </div>
                
                <div className={`border rounded-xl transition-all ${
                  refinements[option.id] 
                    ? "border-green-300 shadow-sm bg-white" 
                    : "border-gray-200 bg-gray-50"
                }`}>
                  {refinements[option.id] ? (
                    <div className="flex flex-col p-4">
                      <p className="text-gray-800 text-sm mb-4">{refinements[option.id]}</p>
                      <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => savePhrase(option.label, refinements[option.id])}
                          className="flex items-center space-x-1 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar no arquivo</span>
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAddEmojis(refinements[option.id], option.id as keyof Refinements)}
                            disabled={emojiLoading[`refine-${option.id}`]}
                            className="text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-all flex items-center space-x-1 text-[10px] font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded-md shadow-xs"
                            title="Ilustrar com Emojis"
                          >
                            {emojiLoading[`refine-${option.id}`] ? (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                            ) : (
                              <Sparkles className="w-3 h-3 text-amber-500" />
                            )}
                            <span>Emojis</span>
                          </button>
                          <button
                            onClick={() => handleCopy(refinements[option.id], `refine-${option.id}`)}
                            className="text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded-md shadow-xs flex items-center justify-center"
                            title="Copiar"
                          >
                            {copiedId === `refine-${option.id}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-center justify-center">
                      <button
                        onClick={() => generateRefinement(option.id)}
                        disabled={isRefining[option.id]}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white hover:bg-blue-50 text-blue-700 font-semibold py-2 px-6 rounded-lg transition-colors border border-blue-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        {isRefining[option.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Gerando...</span>
                          </>
                        ) : (
                          <>
                            <Coins className="w-4 h-4" />
                            <span>Gerar (1 Crédito)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedMessage && (
        <div className="fixed bottom-6 right-6 bg-green-50 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 border border-green-200 animate-in slide-in-from-bottom-5">
          <Check className="w-5 h-5" />
          <span className="font-medium">{savedMessage}</span>
        </div>
      )}
    </div>
  );
}
