import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  MessageSquare, 
  Mic, 
  BookMarked, 
  Coins, 
  Smartphone, 
  Sparkles, 
  CreditCard, 
  ChevronRight, 
  BookOpen,
  ArrowRight,
  Info,
  Check,
  Loader2
} from "lucide-react";
import { jsPDF } from "jspdf";

interface UserManualProps {
  onClose: () => void;
}

export function UserManual({ onClose }: UserManualProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (margin * 2);
        let y = 25;

        const checkPageOverflow = (neededHeight: number) => {
          if (y + neededHeight > 275) {
            doc.addPage();
            // Draw page header on new page
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("FluentBridge — Manual de Instruções & Guia de Validação", margin, 12);
            doc.setDrawColor(220, 225, 230);
            doc.line(margin, 14, pageWidth - margin, 14);
            y = 22;
          }
        };

        const addParagraph = (text: string, fontSize = 9.5, fontStyle = "normal", color = [70, 75, 85]) => {
          doc.setFont("helvetica", fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
          const lines = doc.splitTextToSize(text, contentWidth);
          const height = lines.length * (fontSize * 0.45) + 2.5;
          checkPageOverflow(height);
          doc.text(lines, margin, y);
          y += height;
        };

        const addHeading = (text: string, level = 2) => {
          const fontSize = level === 1 ? 16 : level === 2 ? 12 : 10;
          const fontStyle = "bold";
          const color = level === 1 ? [15, 23, 42] : level === 2 ? [30, 58, 138] : [51, 65, 85];
          const height = fontSize * 0.6 + 4;
          checkPageOverflow(height + 4);
          y += 3; // top spacing
          doc.setFont("helvetica", fontStyle);
          doc.setFontSize(fontSize);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(text, margin, y);
          y += height;
        };

        const addDivider = () => {
          checkPageOverflow(8);
          y += 2;
          doc.setDrawColor(230, 235, 240);
          doc.line(margin, y, pageWidth - margin, y);
          y += 5;
        };

        // Highly robust line-wrapping example block writer that never bleeds out of boundaries
        const addExampleBlock = (title: string, input: string, options: { label: string; text: string }[]) => {
          const inputLines = doc.splitTextToSize(`Entrada: "${input}"`, contentWidth - 8);
          let tempY = 0;
          tempY += inputLines.length * 4.5 + 4; // Title and input spacing
          
          const wrappedOptions = options.map(opt => {
            const lines = doc.splitTextToSize(`• ${opt.label}: ${opt.text}`, contentWidth - 10);
            return { label: opt.label, lines };
          });
          
          const totalOptionsHeight = wrappedOptions.reduce((acc, curr) => acc + curr.lines.length * 4 + 2, 0);
          const blockHeight = tempY + totalOptionsHeight + 6;
          
          checkPageOverflow(blockHeight);
          
          // Draw left vertical accent line
          doc.setDrawColor(219, 234, 254);
          doc.setLineWidth(1);
          doc.line(margin, y, margin, y + blockHeight - 4);
          
          // Draw Block Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(30, 58, 138); // Dark Blue
          doc.text(title, margin + 4, y + 3.5);
          y += 5.5;
          
          // Draw Input
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 110, 120);
          doc.text(inputLines, margin + 4, y);
          y += inputLines.length * 4.5 + 2.5;
          
          // Draw each option
          wrappedOptions.forEach(opt => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(70, 80, 90);
            
            doc.text(opt.lines, margin + 6, y);
            y += opt.lines.length * 4 + 2;
          });
          
          y += 3; // spacing at bottom of block
        };

        // --- PAGE 1: TITLE & INTRODUCTION ---
        // Header Banner / Logo Placeholder
        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(37, 99, 235); // Blue 600
        doc.rect(margin, y, contentWidth, 18, "F");
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("FLUENTBRIDGE APP — MANUAL DO USUÁRIO", margin + 6, y + 11);
        y += 26;

        addHeading("1. O que é o FluentBridge?", 1);
        addParagraph(
          "O FluentBridge é uma ferramenta revolucionária de aprendizado e refinamento de inglês, projetada para estudantes e profissionais que buscam alcançar fluência natural e sofisticação linguística. Ao contrário de tradutores convencionais que fazem conversões literais e engessadas, o FluentBridge atua como uma ponte de comunicação inteligente. Ele interpreta o que você expressa de forma livre em português (ou seu inglês em desenvolvimento) e cria automaticamente variações grametricamente perfeitas e contextualmente adequadas para diferentes interações sociais e profissionais do seu dia a dia.",
          9.5
        );

        addDivider();

        addHeading("2. Recursos Principais & Guia de Uso Passo a Passo", 1);
        addHeading("Módulo A: Refinar Frase", 2);
        addParagraph(
          "O coração do aplicativo para redação de mensagens, e-mails, apresentações e postagens. Este módulo oferece 5 modos de inteligência artificial com comportamento personalizado. Ao enviar uma frase (seja digitando ou gravando por áudio de alta fidelidade), você recebe instantaneamente as seguintes alternativas:",
          9.5
        );
        addParagraph("• Casual: Linguagem descontraída e calorosa para amigos, redes sociais e bate-papo informal.");
        addParagraph("• Polished (Polido): Linguagem respeitosa, perfeita para correspondências gerais e atendimento educado.");
        addParagraph("• Business (Corporativo): Linguagem profissional e de negócios, ideal para e-mails executivos, propostas e reuniões corporativas.");

        addHeading("Recurso Exclusivo: Ilustração Automática com Emojis (Botão 'Emojis')", 3);
        addParagraph(
          "Desenvolvemos um sistema que permite 'pintar' o texto gerado com emojis contextuais sem alterar uma única palavra do vocabulário original. Clique no botão de Sparkles ('Emojis') ao lado do título para que o modelo processe a intenção do texto e o decore com emojis ideais, facilitando a memorização visual das frases de forma dinâmica.",
          9
        );

        addDivider();

        // --- PAGE 2: THE 5 REFINEMENT OPTIONS WITH PRACTICAL EXAMPLES ---
        addHeading("3. Exemplos Reais das 5 Opções de Refinamento", 1);
        addParagraph(
          "Abaixo estão os exemplos práticos de como o motor de Inteligência Artificial do FluentBridge altera profundamente e de forma útil as estruturas inseridas:",
          9.5
        );

        // Option 1 Example
        addHeading("Opção 1: Transcribe PT-BR (Transcrever PT-BR)", 3);
        addParagraph("Focado na transcrição limpa do áudio em português. Remove hesitações e corrige vícios de fala espontânea.");
        addExampleBlock(
          "Exemplo Prático — Transcrição Limpa de Voz",
          "eh... tipo... eu queria saber se vocês tem o... o relatório pronto pra hoje, saca?",
          [
            { label: "Casual", text: "Queria ver se vocês têm o relatório pronto para hoje." },
            { label: "Polido", text: "Gostaria de saber se o relatório está pronto para hoje." },
            { label: "Business", text: "Gostaria de solicitar a confirmação se o relatório está concluído para envio hoje." }
          ]
        );

        // Option 2 Example (UPDATED WITH USER EXAMPLES)
        addHeading("Opção 2: Refine PT-BR (Refinar PT-BR)", 3);
        addParagraph("Sofistica o seu português original, substituindo gírias e desorganizações orais por um português culto.");
        addExampleBlock(
          "Exemplo Prático — Sofisticação em Português",
          "Ei, bicho, me ajuda aí a enviar esse arquivo para o meu chefe. Não tenho tempo de fazer, estou todo enrolado.",
          [
            { label: "Português Correto / Formal", text: "Por favor, auxilie-me no envio deste arquivo ao meu superior. Não disponho de tempo para realizar a tarefa, pois estou com excesso de demandas." },
            { label: "Português Arcaico / Clássico", text: "Rogo-vos que me presteis auxílio no envio deste documento ao meu senhor. Careço do tempo necessário para tal mister, pois vejo-me deveras emaranhado em lides outras." },
            { label: "Português Científico", text: "Solicita-se assistência para o encaminhamento do arquivo digital ao respectivo gestor. A execução da tarefa é inviabilizada pela escassez de tempo decorrente da elevada densidade de demandas concomitantes." },
            { label: "Português Não Coloquial / Elaborado", text: "Solicito o seu préstimo para o encaminhamento deste arquivo ao meu superior hierárquico. Afigura-se-me impossível a execução tempestiva de tal tarefa, dada a profusão de incumbências que me assoberbam no momento." }
          ]
        );

        // Option 3 Example
        addHeading("Opção 3: Translate PT-BR (Traduzir PT-BR)", 3);
        addParagraph("Traduz do português para o inglês nativo de forma inteligente e idiomática, sem traduções ao pé da letra.");
        addExampleBlock(
          "Exemplo Prático — Tradução Contextual",
          "Quero marcar uma reunião com você para acertar os últimos detalhes do projeto.",
          [
            { label: "Casual", text: "Hey! Let's meet up to sort out the final details of the project." },
            { label: "Polished", text: "I would like to schedule a meeting with you to finalize the last details of the project." },
            { label: "Business", text: "Let's arrange a brief sync to align on the remaining project deliverables and sign-off." }
          ]
        );

        // --- PAGE 3: OPTIONS 4 & 5 + OTHER MODULES ---
        addHeading("Opção 4: Instruct in PT-BR (Instruir em PT-BR)", 3);
        addParagraph("Gera conteúdos em inglês sob comando direto. Ideal para quando você sabe o objetivo, mas não as palavras.");
        addExampleBlock(
          "Exemplo Prático — Execução de Comandos por Voz",
          "Pede pro cliente um desconto de 10 por cento porque a entrega vai atrasar 2 dias",
          [
            { label: "Casual", text: "Hey, we are delaying delivery by 2 days, so we are giving you a 10% discount." },
            { label: "Polished", text: "Please accept our apologies as delivery will be delayed by 2 days. To make up for it, we're offering a 10% discount." },
            { label: "Business", text: "Due to scheduling adjustments, our dispatch will be deferred by 48 hours. We are applying a 10% concession to your invoice." }
          ]
        );

        // Option 5 Example
        addHeading("Opção 5: Refine English (Refinar Inglês)", 3);
        addParagraph("Elimina erros comuns de tradução mental direta (Braziliantisms) e corrige preposições ou concordância.");
        addExampleBlock(
          "Exemplo Prático — Correção de Vícios de Linguagem",
          "I have many doubts about this. Can you explain me again please? I am wait your reply.",
          [
            { label: "Casual", text: "I'm still a bit confused about this. Can you run through it again?" },
            { label: "Polished", text: "I have a few questions regarding this matter. Could you please clarify this for me?" },
            { label: "Business", text: "We require clarification on several points. Kindly provide further explanation. I await your response." }
          ]
        );

        addDivider();

        addHeading("Módulo B: Conversação com IA", 2);
        addParagraph(
          "Permite praticar conversação de forma dinâmica e natural. Ao clicar em 'Começar a Falar', uma chamada de áudio de baixíssima latência é iniciada diretamente com o modelo de voz do FluentBridge. O estudante pode falar livremente em inglês e ouvir a resposta em tempo real. Essencial para destravar a fala (speaking) e treinar a escuta (listening) de forma confortável.",
          9
        );

        addHeading("Módulo C: Frases Salvas (Arquivo)", 2);
        addParagraph(
          "Permite salvar qualquer frase polida ou gerada para revisão futura. Ao clicar no ícone de disquete, o conteúdo fica salvo localmente no seu dispositivo na aba 'Arquivo', permitindo criar seu próprio caderno de estudos personalizado.",
          9
        );

        addDivider();

        // --- PAGE 4: COMMERCIAL MODEL & SURVEY ---
        addHeading("4. Modelo Comercial de Créditos & Recarga via PIX", 1);
        addParagraph(
          "O FluentBridge utiliza o inovador sistema de monetização baseado no consumo de Inteligência Artificial generativa. Este modelo é infinitamente mais atraente e justo que assinaturas fixas mensais caras:",
          9.5
        );
        addParagraph("• Justo e Proporcional: O usuário só paga se utilizar os recursos.");
        addParagraph("• Proteção Financeira: Garante que os custos dos servidores de IA fiquem sempre cobertos pelas recargas.");
        addParagraph("• Cobrança Clara: Cada ação possui um valor transparente em Créditos:");
        addParagraph("  - Refinar Frase: Consome 2 créditos por processamento.");
        addParagraph("  - Adicionar Emojis automáticos: Consome 0 créditos (cortesia!).");
        addParagraph("  - Conversação com IA: Consome 5 créditos por sessão iniciada.");

        addHeading("Integração de Pagamento via PIX Dinâmico (Mercado Pago)", 3);
        addParagraph(
          "A recarga é integrada ao gateway do Mercado Pago, gerando instantaneamente um QR Code ou a chave 'Copia e Cola' do PIX. O processamento é realizado por Webhooks automatizados, creditando o saldo em menos de 10 segundos diretamente na conta do usuário no aplicativo de forma fluida e instantânea.",
          9
        );

        addHeading("5. Como instalar no celular (Acesso Instantâneo PWA)", 1);
        addParagraph(
          "Por ser um Progressive Web App (PWA), o FluentBridge não exige instalação de lojas tradicionais como Google Play ou App Store. Acesse pelo navegador e selecione 'Adicionar à tela de início' ou 'Instalar aplicativo' no menu de opções. Ele rodará em tela cheia de forma idêntica a um app nativo.",
          9
        );

        addHeading("6. Pesquisa de Aceitação do Aplicativo (Estudo SaaS)", 1);
        addParagraph(
          "Utilize o roteiro abaixo para entrevistar seus testadores e validar a aceitação do mercado comercialmente:",
          9.5
        );
        addParagraph("1. A clareza das 3 alternativas (Casual, Polida, Business) atendeu à sua necessidade de comunicação real em inglês?");
        addParagraph("2. Você prefere realizar pequenas recargas por PIX conforme usa ou preferiria uma assinatura mensal tradicional?");
        addParagraph("3. O recurso de adicionar emojis automáticos facilitou a assimilação visual da frase?");

        // Generate robust downloadable blob to circumvent sandboxed iframe constraints
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Manual_FluentBridge_Oficial.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

      } catch (error) {
        console.error("FALHA AO GERAR PDF VIA JSPDF:", error);
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-4xl w-full mx-auto overflow-hidden print:shadow-none print:border-none print:max-w-none print:rounded-none print:overflow-visible">
      {/* Interactive UI Header - Hidden in Print */}
      <div className="print:hidden bg-linear-to-r from-blue-600 to-indigo-700 p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-100" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Manual de Instruções & Pesquisa</h2>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">Visualize o manual profissional e salve-o como PDF oficial</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar PDF Manual</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shrink-0 cursor-pointer"
          >
            Voltar ao App
          </button>
        </div>
      </div>

      {/* Manual Content Container */}
      <div className="p-6 sm:p-10 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
        
        {/* Printable Document (Styled for beautiful printing & screen viewing) */}
        <div id="printable-manual" className="space-y-10 text-gray-800 print:text-black">
          
          {/* Cover Page / Header */}
          <div className="text-center pb-8 border-b border-gray-200 space-y-4">
            <div className="inline-flex items-center space-x-2.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 font-bold text-xs uppercase tracking-widest print:border-none print:bg-transparent">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>FluentBridge — Guia de Validação SaaS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              FluentBridge <span className="text-blue-600 font-medium">App</span>
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Manual de Uso Oficial, Metodologia de Ensino Baseada em Inteligência Artificial e Modelo Comercial Integrado via PIX Dinâmico.
            </p>
            <div className="flex justify-center items-center space-x-4 text-xs text-gray-400 font-mono">
              <span>Versão: 1.0.0</span>
              <span>•</span>
              <span>Lançamento: Julho de 2026</span>
            </div>
          </div>

          {/* Section 1: O que é o FluentBridge */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">1</span>
              <span>O que é o FluentBridge?</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              O <strong>FluentBridge</strong> é uma ferramenta revolucionária de aprendizado e refinamento de inglês, projetada especialmente para estudantes e profissionais que buscam alcançar a fluência natural e a sofisticação linguística. 
              Ao contrário dos métodos tradicionais de tradução literal, o FluentBridge atua como uma <strong>ponte de comunicação inteligente</strong>, interpretando o que você deseja expressar em português e gerando variações naturais otimizadas para diferentes contextos sociais e profissionais.
            </p>
          </div>

          {/* Section 2: Funcionalidades Principais */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">2</span>
              <span>Recursos & Como Utilizar Cada Opção</span>
            </h2>

            {/* Feature A */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4 print:bg-transparent print:border-gray-200">
              <div className="flex items-center space-x-2 text-blue-700">
                <MessageSquare className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-gray-900">Módulo 1: Refinar Frase</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Este módulo ajuda você a transformar ideias cruas, gírias ou frases simples em expressões impecáveis em inglês. Você pode digitar sua frase ou usar o microfone para gravá-la. Ele disponibiliza <strong>5 opções de refinamento (modos de inteligência artificial)</strong>, cada uma desenhada para um propósito específico:
              </p>

              {/* Detailed Breakdown of All Refinement Options */}
              <div className="space-y-4 pl-4 border-l-2 border-blue-500 text-xs sm:text-sm text-gray-600">
                
                {/* Option 1 */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 print:p-0 print:border-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs mb-1">
                    1. Transcribe PT-BR (Transcrever PT-BR)
                  </span>
                  <p className="leading-relaxed">
                    <strong>🎯 O que esperar:</strong> Uma transcrição por voz impecável de qualquer áudio falado em português brasileiro nativo. A IA identifica sotaques, pontua de forma automática e filtra ruídos.
                  </p>
                  <p className="leading-relaxed text-[11px] text-gray-500">
                    <strong>👉 Como usar:</strong> Selecione esta opção, clique no botão redondo do microfone, fale o que você deseja em português e clique no botão de parar. O texto transcrito aparecerá instantaneamente no bloco "Generated Content".
                  </p>
                  <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-xs space-y-1">
                    <p className="font-semibold text-blue-900">💡 Exemplo Prático de Transformação:</p>
                    <p className="text-gray-500 font-mono">Entrada: "eh... tipo... eu queria saber se vocês tem o... o relatório pronto pra hoje, saca?"</p>
                    <p className="text-blue-800 font-semibold">Resultado da IA: "Eu queria saber se vocês têm o relatório pronto para hoje."</p>
                  </div>
                </div>

                {/* Option 2 (UPDATED WITH SPECIFIC USER EXAMPLES AND VISUAL FEEDBACK FROM SCREENSHOT) */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 print:p-0 print:border-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs mb-1">
                    2. Refine PT-BR (Refinar PT-BR)
                  </span>
                  <p className="leading-relaxed">
                    <strong>🎯 O que esperar:</strong> Este modo não faz apenas uma transcrição literal, mas <em>eleva a sofisticação do seu português</em>. Ele corrige gírias excessivas, desorganizações orais e repetições de vocabulário, transformando sua fala em variações cultas, clássicas, acadêmicas ou extremamente elaboradas.
                  </p>
                  <p className="leading-relaxed text-[11px] text-gray-500">
                    <strong>👉 Como usar:</strong> Ideal para polir e planejar comunicações sofisticadas em português. Fale suas ideias de maneira espontânea ou coloquial. A IA organizará os pensamentos gerando quatro versões excelentes.
                  </p>
                  <div className="bg-indigo-50/55 p-3 sm:p-4 rounded-xl border border-indigo-150 text-xs space-y-3.5">
                    <p className="font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>Exemplo Prático Real de Refinamento (4 Opções Aplicadas):</span>
                    </p>
                    
                    <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100 font-mono">
                      <span className="font-bold text-gray-500 text-[10px] block uppercase mb-0.5">Frase de Entrada:</span>
                      "Ei, bicho, me ajuda aí a enviar esse arquivo para o meu chefe. Não tenho tempo de fazer, estou todo enrolado."
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/90 p-2.5 rounded-lg border border-gray-100 space-y-1 shadow-2xs">
                        <span className="font-bold text-blue-700 text-[10px] uppercase block">PORTUGUÊS CORRETO / FORMAL</span>
                        <p className="text-gray-700 leading-relaxed text-[11px]">
                          "Por favor, auxilie-me no envio deste arquivo ao meu superior. Não disponho de tempo para realizar a tarefa, pois estou com excesso de demandas."
                        </p>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-gray-100 space-y-1 shadow-2xs">
                        <span className="font-bold text-indigo-700 text-[10px] uppercase block">PORTUGUÊS ARCAICO / CLÁSSICO</span>
                        <p className="text-gray-700 leading-relaxed text-[11px]">
                          "Rogo-vos que me presteis auxílio no envio deste documento ao meu senhor. Careço do tempo necessário para tal mister, pois vejo-me deveras emaranhado em lides outras."
                        </p>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-gray-100 space-y-1 shadow-2xs">
                        <span className="font-bold text-emerald-700 text-[10px] uppercase block">PORTUGUÊS CIENTÍFICO</span>
                        <p className="text-gray-700 leading-relaxed text-[11px]">
                          "Solicita-se assistência para o encaminhamento do arquivo digital ao respectivo gestor. A execução da tarefa é inviabilizada pela escassez de tempo decorrente da elevada densidade de demandas concomitantes."
                        </p>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-lg border border-gray-100 space-y-1 shadow-2xs">
                        <span className="font-bold text-purple-700 text-[10px] uppercase block">PORTUGUÊS NÃO COLOQUIAL / ELABORADO</span>
                        <p className="text-gray-700 leading-relaxed text-[11px]">
                          "Solicito o seu préstimo para o encaminhamento deste arquivo ao meu superior hierárquico. Afigura-se-me impossível a execução tempestiva de tal tarefa, dada a profusão de incumbências que me assoberbam no momento."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 3 */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 print:p-0 print:border-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs mb-1">
                    3. Translate PT-BR (Traduzir PT-BR)
                  </span>
                  <p className="leading-relaxed">
                    <strong>🎯 O que esperar:</strong> Tradução altamente inteligente e não-literal de português para inglês. A IA não traduz "palavra por palavra" (o que costuma gerar frases artificiais); ela compreende a sua intenção real e traduz o significado exato de forma nativa e idiomática em inglês.
                  </p>
                  <p className="leading-relaxed text-[11px] text-gray-500">
                    <strong>👉 Como usar:</strong> Fale ou digite sua frase em português. A IA processará e exibirá a tradução principal dividida em três alternativas funcionais automáticas: <strong>Casual</strong>, <strong>Polished</strong> e <strong>Business</strong>.
                  </p>
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-xs space-y-1">
                    <p className="font-semibold text-emerald-900">💡 Exemplo Prático de Transformação:</p>
                    <p className="text-gray-500 font-mono">Entrada: "Quero marcar uma reunião com você para acertar os últimos detalhes do projeto."</p>
                    <p className="text-emerald-800 font-semibold">Resultados da IA:</p>
                    <p className="pl-2">• <strong>Casual:</strong> "Hey! Let's meet up to sort out the final details of the project."</p>
                    <p className="pl-2">• <strong>Polished:</strong> "I would like to schedule a meeting with you to finalize the last details of the project."</p>
                    <p className="pl-2">• <strong>Business:</strong> "Let's arrange a brief sync to align on the remaining project deliverables."</p>
                  </div>
                </div>

                {/* Option 4 */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 print:p-0 print:border-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-xs mb-1">
                    4. Instruct in PT-BR (Instruir em PT-BR)
                  </span>
                  <p className="leading-relaxed">
                    <strong>🎯 O que esperar:</strong> Um gerador ativo de conteúdo baseado em comandos de voz. Você não precisa falar o texto exato que deseja traduzir; você pode simplesmente dar uma <em>instrução ou ordem</em> de como quer que o seu texto seja redigido em inglês.
                  </p>
                  <p className="leading-relaxed text-[11px] text-gray-500">
                    <strong>👉 Como usar:</strong> Fale algo como <em>"Peça desculpas pelo atraso do relatório e diga que o enviarei até amanhã de manhã"</em>. A IA interpretará seu comando e gerará o texto final completo em inglês nos três estilos prontinho para uso.
                  </p>
                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-xs space-y-1">
                    <p className="font-semibold text-amber-900">💡 Exemplo Prático de Transformação:</p>
                    <p className="text-gray-500 font-mono">Entrada: "Pede pro cliente um desconto de 10 por cento porque a entrega vai atrasar 2 dias"</p>
                    <p className="text-amber-800 font-semibold">Resultados da IA:</p>
                    <p className="pl-2">• <strong>Casual:</strong> "Hey, we are delaying delivery by 2 days, so we are giving you a 10% discount."</p>
                    <p className="pl-2">• <strong>Polished:</strong> "Please accept our apologies as delivery will be delayed by 2 days. To make up for it, we're offering a 10% discount."</p>
                    <p className="pl-2">• <strong>Business:</strong> "Due to scheduling adjustments, our dispatch will be deferred by 48 hours. We are applying a 10% concession to your invoice."</p>
                  </div>
                </div>

                {/* Option 5 */}
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-150 print:p-0 print:border-none">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-xs mb-1">
                    5. Refine English (Refinar Inglês)
                  </span>
                  <p className="leading-relaxed">
                    <strong>🎯 O que esperar:</strong> A ferramenta definitiva para quem já tem algum conhecimento de inglês mas quer eliminar vícios de linguagem comuns de estrangeiros (<em>"Braziliantisms"</em>) e erros sutis de preposição, concordância ou pronúncia.
                  </p>
                  <p className="leading-relaxed text-[11px] text-gray-500">
                    <strong>👉 Como usar:</strong> Fale ou digite sua frase diretamente em inglês (mesmo se estiver incompleta ou com erros). O FluentBridge transcreverá seu inglês original e trará refinamentos nativos nos estilos Casual, Polished e Business.
                  </p>
                  <div className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 text-xs space-y-1">
                    <p className="font-semibold text-purple-900">💡 Exemplo Prático de Transformação:</p>
                    <p className="text-gray-500 font-mono">Entrada: "I have many doubts about this. Can you explain me again please? I am wait your reply."</p>
                    <p className="text-purple-800 font-semibold">Resultados da IA:</p>
                    <p className="pl-2">• <strong>Casual:</strong> "I'm still a bit confused about this. Can you run through it again?"</p>
                    <p className="pl-2">• <strong>Polished:</strong> "I have a few questions regarding this matter. Could you please clarify this for me?"</p>
                    <p className="pl-2">• <strong>Business:</strong> "We require clarification on several points. Kindly provide further explanation. I await your response."</p>
                  </div>
                </div>

                {/* New Feature Info */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-start space-x-2 text-amber-800 bg-amber-50/50 p-3 rounded-lg">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs leading-relaxed">
                    <strong>✨ Recurso "Add Emojis" (Ilustração com Emojis):</strong> Em qualquer modo que gere textos, você verá o botão <strong>"Add Emojis"</strong> ou <strong>"Emojis"</strong>. Ao clicar, a IA faz uma varredura semântica inteligente no texto e adiciona emojis contextuais que ajudam a memorizar e ilustrar visualmente o significado das frases, mantendo a estrutura original impecável!
                  </p>
                </div>

              </div>
            </div>

            {/* Feature B */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3 print:bg-transparent print:border-gray-200">
              <div className="flex items-center space-x-2 text-blue-700">
                <Mic className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-gray-900">Módulo 2: Conversação com IA</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Uma experiência de imersão total por voz. O FluentBridge se conecta diretamente com a Inteligência Artificial através de áudio de baixíssima latência.
              </p>
              <div className="pl-4 border-l-2 border-blue-500 space-y-2 text-xs sm:text-sm text-gray-600">
                <p><strong>⚡ Como Iniciar:</strong> Clique em "Iniciar Conversação" (ou "Começar a Falar"). Dê permissão ao microfone quando solicitado. O indicador visual começará a pulsar.</p>
                <p><strong>🗣️ Fale Naturalmente:</strong> O assistente de voz do FluentBridge ouve sua voz e responde de volta em inglês falado de forma imediata.</p>
                <p><strong>🎯 Benefício:</strong> Melhora drasticamente a fala (<em>speaking</em>) e a escuta (<em>listening</em>) de forma privada, sem julgamentos, e no seu próprio ritmo.</p>
              </div>
            </div>

            {/* Feature C */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3 print:bg-transparent print:border-gray-200">
              <div className="flex items-center space-x-2 text-blue-700">
                <BookMarked className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-gray-900">Módulo 3: Frases Salvas (Arquivo)</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Sua biblioteca de termos personalizados criados durante o uso do app.
              </p>
              <div className="pl-4 border-l-2 border-blue-500 space-y-2 text-xs sm:text-sm text-gray-600">
                <p><strong>💾 Como Salvar:</strong> No módulo de Refinar Frase, clique no ícone "Salvar" ao lado da alternativa desejada.</p>
                <p><strong>📚 Como Estudar:</strong> Acesse a aba "Arquivo" para ver sua coleção. Você pode copiar o conteúdo, revisar a tradução e explicações gramaticais ou excluir termos antigos que já memorizou.</p>
              </div>
            </div>
          </div>

          {/* Section 3: Modelo de Cobrança e Monetização */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">3</span>
              <span>Por que a cobrança por Tokens/Créditos é ideal?</span>
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              O consumo de Inteligência Artificial generativa de alto nível (como o Gemini Pro/Flash) possui custos variáveis por requisição, calculados com base no volume de dados de entrada e saída (conhecidos tecnicamente como <strong>Tokens</strong>). 
              A cobrança por créditos/tokens protege a viabilidade financeira do seu aplicativo, garantindo que usuários que usem recursos de forma intensiva paguem de forma justa e proporcional ao que consomem, evitando prejuízos comuns em modelos de assinatura fixa ilimitada.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 space-y-2 print:bg-transparent">
                <h4 className="font-bold text-amber-900 text-sm flex items-center space-x-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Tabela de Custos do App</span>
                </h4>
                <ul className="text-xs sm:text-sm text-amber-800 list-disc list-inside space-y-1">
                  <li><strong>Refinar Frase:</strong> Consome 2 créditos por envio.</li>
                  <li><strong>Adicionar Emojis:</strong> Consome 0 créditos extras (bônus!).</li>
                  <li><strong>Conversa de Voz:</strong> Consome 5 créditos por conexão.</li>
                </ul>
              </div>
              <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-2 print:bg-transparent">
                <h4 className="font-bold text-blue-900 text-sm flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Integração de Pagamento via PIX</span>
                </h4>
                <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                  Os pacotes de créditos são adquiridos instantaneamente via PIX Copia e Cola ou QR Code do Mercado Pago. O processamento é imediato, adicionando os créditos em menos de 10 segundos ao saldo do usuário de forma automática após a confirmação bancária.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Como instalar no celular (PWA) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">4</span>
              <span>Como instalar o aplicativo no celular (PWA)</span>
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              O FluentBridge é desenvolvido com tecnologia de <strong>Progressive Web App (PWA)</strong>. Isso significa que ele pode ser instalado em qualquer dispositivo móvel sem precisar passar pelas burocracias das lojas Apple App Store ou Google Play Store. Ele se comportará exatamente como um aplicativo nativo instalado, funcionando em tela cheia com ícone na gaveta de apps.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Passo a Passo: Android (Chrome)</span>
                </h4>
                <ol className="text-xs sm:text-sm text-gray-600 list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Abra o link do aplicativo no navegador <strong>Google Chrome</strong>.</li>
                  <li>Toque no ícone de three dots no canto superior direito.</li>
                  <li>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                  <li>Confirme a instalação. O ícone do FluentBridge surgirá nos seus aplicativos.</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Passo a Passo: iOS / iPhone (Safari)</span>
                </h4>
                <ol className="text-xs sm:text-sm text-gray-600 list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Abra o link do aplicativo no navegador padrão <strong>Safari</strong>.</li>
                  <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com uma seta para cima na barra inferior).</li>
                  <li>Role a página para baixo e clique em <strong>"Adicionar à Tela de Início"</strong>.</li>
                  <li>Clique em <strong>"Adicionar"</strong> no canto superior direito para finalizar.</li>
                </ol>
              </div>
            </div>
          </div>



          {/* Footer Logo */}
          <div className="pt-8 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
            <p className="font-bold text-gray-700">FluentBridge App — AI-Powered English Learning</p>
            <p>© 2026 Todos os direitos reservados. Protótipo estruturado para validação de produto SaaS.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
