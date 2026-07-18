import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Loader2, Volume2, AlertCircle, HelpCircle, X, Coins } from "lucide-react";
import { ai } from "../lib/gemini";
import { AudioStreamer, AudioPlayer } from "../lib/audio";
import { LiveServerMessage, Modality } from "@google/genai";

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
            <p>Procure por um <strong>ícone de microfone</strong> na barra de endereço do seu navegador. Clique nele e certifique-se de selecionar "Permitir" para este site.</p>
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

export function LiveConversation({ 
  credits, 
  deductCredits, 
  onRequestRecharge 
}: { 
  credits: number; 
  deductCredits: (amount: number) => boolean; 
  onRequestRecharge: () => void; 
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hasMic, setHasMic] = useState<boolean | null>(null);

  const streamerRef = useRef<AudioStreamer | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

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

    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    if (credits < 5) {
      onRequestRecharge();
      return;
    }
    setIsConnecting(true);
    setError(null);

    try {
      playerRef.current = new AudioPlayer();
      playerRef.current.init();

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);

      sessionRef.current = ws;

      ws.onopen = async () => {
        try {
          streamerRef.current = new AudioStreamer();
          // Start streamer immediately after socket connection is open
          await streamerRef.current.start((base64Data) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: base64Data }));
            }
          });

          setIsConnected(true);
          setIsConnecting(false);
          deductCredits(5);
        } catch (streamerErr: any) {
          console.error("Streamer Error on start:", streamerErr);
          setError(streamerErr.message || "Erro ao iniciar captura do microfone.");
          disconnect();
        }
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === "connected") {
            // Handled when open
          } else if (data.audio) {
            playerRef.current?.play(data.audio);
          } else if (data.interrupted) {
            playerRef.current?.stop();
            playerRef.current?.init();
          } else if (data.error) {
            setError(data.error);
            disconnect();
          }
        } catch (e) {
          console.error("Error processing message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setError("Ocorreu um erro de conexão com o servidor.");
        disconnect();
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        disconnect();
      };

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Falha ao se conectar com a API Live.");
      setIsConnecting(false);
      disconnect();
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 space-y-8 min-h-[60vh]">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Conversa em Tempo Real
        </h2>
        <p className="text-gray-500">
          Pratique seu inglês em tempo real com um tutor de IA.
        </p>
      </div>

      {credits < 5 && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 text-sm">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Você precisa de no mínimo <strong>5 créditos</strong> para iniciar uma conversação com IA. Seu saldo atual é de {credits} créditos.</span>
          </div>
          <button 
            onClick={onRequestRecharge}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-xs sm:text-sm shadow-xs active:scale-95 shrink-0"
          >
            Recarregar via PIX
          </button>
        </div>
      )}

      <div className="flex flex-col items-center space-y-6">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            isConnected
              ? "bg-blue-100 shadow-[0_0_40px_rgba(59,130,246,0.5)]"
              : "bg-gray-100"
          }`}
        >
          {isConnected ? (
            <Volume2 className="w-12 h-12 text-blue-600 animate-pulse" />
          ) : (
            <Mic className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {error && (
          <div className="text-center space-y-3 bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p className="font-bold">
                {error.toLowerCase().includes("prepayment") || error.toLowerCase().includes("credits") || error.toLowerCase().includes("429") || error.toLowerCase().includes("billing")
                  ? "Créditos da API Gemini Esgotados"
                  : "Erro na Conversa"}
              </p>
            </div>
            <p className="text-red-700 text-sm leading-relaxed">
              {error.toLowerCase().includes("prepayment") || error.toLowerCase().includes("credits") || error.toLowerCase().includes("429") || error.toLowerCase().includes("billing")
                ? "Os créditos de pré-pagamento da API do Gemini se esgotaram na conta do Google AI Studio associada a este site. Por favor, acesse o painel do Google AI Studio (https://ai.studio/projects) para gerenciar o faturamento do projeto e recarregar os créditos."
                : error}
            </p>
            {!(error.toLowerCase().includes("prepayment") || error.toLowerCase().includes("credits") || error.toLowerCase().includes("429") || error.toLowerCase().includes("billing")) && (
              <button 
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-1 mx-auto text-sm font-semibold text-red-600 hover:text-red-800 underline decoration-red-300"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Como corrigir isso?</span>
              </button>
            )}
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

        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className={`px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center space-x-2 ${
            isConnected
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Conectando...</span>
            </>
          ) : isConnected ? (
            <>
              <Square className="w-5 h-5" />
              <span>Encerrar Conversa</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Começar a Falar</span>
            </>
          )}
        </button>

        {isConnected && (
          <p className="text-sm text-gray-500 animate-pulse">
            Ouvindo e falando...
          </p>
        )}
      </div>
    </div>
  );
}
