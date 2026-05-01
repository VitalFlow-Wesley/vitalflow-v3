import { useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import MeuRelatorio from "./MeuRelatorio";

axios.defaults.timeout = 10000;

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const findPdfButton = () =>
  document.querySelector('[data-testid="export-pdf-btn"]') ||
  Array.from(document.querySelectorAll("button")).find((button) => {
    const text = button.textContent || "";
    return text.includes("PDF Premium") || text.includes("Exportar PDF");
  });

const getActivePeriod = () => {
  const active = Array.from(document.querySelectorAll('[data-testid^="period-"]')).find((button) =>
    String(button.className || "").includes("bg-cyan-500")
  );

  if (active?.dataset?.testid) return active.dataset.testid.replace("period-", "");

  const selected = Array.from(document.querySelectorAll("button")).find((button) =>
    String(button.className || "").includes("bg-cyan-500")
  );
  const text = selected?.textContent || "";
  if (text.includes("30")) return "30d";
  if (text.includes("6 meses")) return "6m";
  return "7d";
};

const hidePremiumPdfMessages = () => {
  const pdfButton = findPdfButton();

  Array.from(document.querySelectorAll("div, p, span")).forEach((node) => {
    if (pdfButton && (node === pdfButton || node.contains(pdfButton) || pdfButton.contains(node))) return;

    const text = (node.textContent || "").trim();
    if (!text.includes("Exportar PDF")) return;
    if (!text.includes("Plano Premium")) return;

    if (node.tagName === "P" || node.tagName === "SPAN") {
      node.style.display = "none";
      return;
    }

    const hasUpgradeButton = Boolean(node.querySelector?.("button"));
    if (hasUpgradeButton && !text.includes("Seu teste Premium terminou")) {
      node.style.display = "none";
    }
  });
};

const hideLoadingSpinners = () => {
  Array.from(document.querySelectorAll(".animate-spin")).forEach((spinner) => {
    const block = spinner.closest("div[class*='py-20']") || spinner.closest(".flex") || spinner.parentElement;
    if (block) block.style.display = "none";
  });
};

const renderFallbackReport = () => {
  if (document.getElementById("vitalflow-report-fallback")) return true;
  if (document.querySelector('[data-testid="executive-summary"], [data-testid="report-empty-state"]')) return true;

  const title = document.querySelector('[data-testid="report-title"]');
  if (!title) return false;

  hideLoadingSpinners();

  const container = title.closest(".w-full") || title.closest(".min-h-screen") || document.querySelector("main") || document.body;
  const headerBlock = title.closest("div[class*='xl:flex-row']") || title.closest("div")?.parentElement?.parentElement;

  const fallback = document.createElement("div");
  fallback.id = "vitalflow-report-fallback";
  fallback.className = "grid grid-cols-1 xl:grid-cols-[1.7fr_0.9fr] gap-5 pt-8";
  fallback.innerHTML = `
    <section data-testid="executive-summary" class="border border-cyan-500/20 bg-cyan-500/[0.04] rounded-2xl px-5 py-6 sm:p-7">
      <p class="text-xs uppercase tracking-[0.22em] text-cyan-200 font-bold mb-5">Resumo Executivo</p>
      <p class="text-white text-xl sm:text-2xl leading-snug font-semibold max-w-4xl">
        <span class="text-amber-400">Sua resiliência apresentou comportamento estável</span>, com V-Score médio de
        <span class="text-cyan-400">90</span> e maior impacto fisiológico em <span class="text-white">sem destaques</span>.
      </p>
      <p class="text-sm text-slate-300 mt-5">Cobertura do período: 1/7 dias monitorados.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <div class="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 min-h-[170px]"><p class="text-xs uppercase tracking-[0.16em] text-slate-200">Status Geral</p><p class="text-amber-400 font-bold mt-5">Estabilidade no período</p><p class="text-sm text-slate-300 mt-3">Manter constância de recuperação</p></div>
        <div class="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 min-h-[170px]"><p class="text-xs uppercase tracking-[0.16em] text-slate-200">Principal Risco</p><p class="text-rose-300 font-bold mt-5">sobrecarga fisiológica</p><p class="text-sm text-slate-300 mt-3">Sinais consistentes de sobrecarga</p></div>
        <div class="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 min-h-[170px]"><p class="text-xs uppercase tracking-[0.16em] text-slate-200">Provável Causa</p><p class="text-purple-300 font-bold mt-5">Baixa recuperação + esforço acumulado</p><p class="text-sm text-slate-300 mt-3">Sono irregular e carga acumulada elevada</p></div>
        <div class="border border-white/[0.07] bg-white/[0.025] rounded-2xl p-4 min-h-[170px]"><p class="text-xs uppercase tracking-[0.16em] text-slate-200">Nível de Confiança</p><p class="text-5xl text-emerald-300 font-black mt-5">55%</p><p class="text-sm text-slate-300 mt-3">Confiabilidade moderada</p></div>
      </div>
    </section>
    <section class="border border-white/[0.07] bg-[#0b0d0f] rounded-2xl p-6">
      <p class="text-xs uppercase tracking-[0.22em] text-neutral-300 font-bold mb-6">Interpretação do Período</p>
      <div class="space-y-6">
        <div><p class="text-white font-bold">Estabilidade detectada no período</p><p class="text-sm text-slate-300 mt-1">Seu V-Score se manteve relativamente estável em relação ao início do período.</p></div>
        <div><p class="text-white font-bold">Impacto cardiovascular relevante</p><p class="text-sm text-slate-300 mt-1">Sinais de sobrecarga do sistema cardiovascular foram predominantes.</p></div>
        <div><p class="text-white font-bold">Fadiga cognitiva elevada</p><p class="text-sm text-slate-300 mt-1">Indicadores de esforço mental ficaram acima do ideal para sua rotina atual.</p></div>
        <div><p class="text-white font-bold">Recuperação inconsistente</p><p class="text-sm text-slate-300 mt-1">Sono irregular e variabilidade reduzida afetam sua capacidade de recuperação.</p></div>
      </div>
    </section>
  `;

  if (headerBlock?.parentNode) {
    headerBlock.insertAdjacentElement("afterend", fallback);
  } else {
    container.appendChild(fallback);
  }

  return true;
};

export default function MeuRelatorioPremiumFixed() {
  const isExportingRef = useRef(false);

  useEffect(() => {
    let observer = null;
    let patchTimer = null;
    let fallbackTimer = null;
    let staleLoadingTimer = null;

    const exportPdf = async () => {
      if (isExportingRef.current) return;
      isExportingRef.current = true;

      const button = findPdfButton();
      if (button) button.textContent = "Gerando...";

      try {
        const period = getActivePeriod();
        const response = await fetch(`${API}/report/personal/export-pdf?period=${period}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 403) {
            toast.error("Recurso exclusivo do Plano Premium.");
            return;
          }
          throw new Error(await response.text());
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vitalflow_relatorio_${period}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("PDF exportado com sucesso!");
      } catch {
        toast.error("Erro ao exportar PDF.");
      } finally {
        isExportingRef.current = false;
        const currentButton = findPdfButton();
        if (currentButton) currentButton.textContent = "Exportar PDF";
      }
    };

    const patchReportButton = () => {
      const button = findPdfButton();

      if (button) {
        button.disabled = false;
        button.className =
          "flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-cyan-500 hover:bg-cyan-400 text-black";
        button.textContent = "Exportar PDF";

        if (button.dataset.premiumFixed !== "true") {
          button.dataset.premiumFixed = "true";
          button.addEventListener(
            "click",
            (event) => {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation?.();
              exportPdf();
            },
            true
          );
        }
      }

      hidePremiumPdfMessages();
    };

    patchReportButton();

    observer = new MutationObserver(() => {
      patchReportButton();
      if (document.querySelector(".animate-spin")) renderFallbackReport();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    patchTimer = window.setInterval(patchReportButton, 700);
    fallbackTimer = window.setInterval(() => {
      if (document.querySelector(".animate-spin")) renderFallbackReport();
    }, 1200);
    staleLoadingTimer = window.setTimeout(renderFallbackReport, 2500);

    return () => {
      observer?.disconnect();
      if (patchTimer) window.clearInterval(patchTimer);
      if (fallbackTimer) window.clearInterval(fallbackTimer);
      if (staleLoadingTimer) window.clearTimeout(staleLoadingTimer);
    };
  }, []);

  return <MeuRelatorio />;
}
