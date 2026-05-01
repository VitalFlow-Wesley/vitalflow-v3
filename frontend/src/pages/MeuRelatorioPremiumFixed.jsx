import { useEffect, useRef } from "react";
import { toast } from "sonner";
import MeuRelatorio from "./MeuRelatorio";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://vitalflow.up.railway.app"}/api`;

const getActivePeriod = () => {
  const active = Array.from(document.querySelectorAll('[data-testid^="period-"]')).find((button) =>
    String(button.className || "").includes("bg-cyan-500")
  );

  return active?.dataset?.testid?.replace("period-", "") || "7d";
};

const hidePremiumPdfMessages = () => {
  Array.from(document.querySelectorAll("div, p, span")).forEach((node) => {
    if (node.closest('[data-testid="export-pdf-btn"]')) return;
    if (node.querySelector?.('[data-testid="export-pdf-btn"]')) return;

    const text = (node.textContent || "").trim();
    if (!text.includes("Exportar PDF")) return;
    if (!text.includes("Plano Premium")) return;

    if (node.tagName === "P" || node.tagName === "SPAN") {
      node.style.display = "none";
      return;
    }

    const hasUpgradeButton = Boolean(node.querySelector?.("button"));
    if (hasUpgradeButton) {
      node.style.display = "none";
    }
  });
};

export default function MeuRelatorioPremiumFixed() {
  const isExportingRef = useRef(false);

  useEffect(() => {
    let observer = null;
    let timer = null;

    const exportPdf = async () => {
      if (isExportingRef.current) return;
      isExportingRef.current = true;

      const button = document.querySelector('[data-testid="export-pdf-btn"]');
      const originalText = button?.textContent;
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
        if (button) button.textContent = originalText || "Exportar PDF";
      }
    };

    const patchReportButton = () => {
      hidePremiumPdfMessages();

      const button = document.querySelector('[data-testid="export-pdf-btn"]');
      if (!button || button.dataset.premiumFixed === "true") return;

      button.dataset.premiumFixed = "true";
      button.disabled = false;
      button.className =
        "flex items-center justify-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-cyan-500 hover:bg-cyan-400 text-black";
      button.textContent = "Exportar PDF";

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
    };

    patchReportButton();

    observer = new MutationObserver(patchReportButton);
    observer.observe(document.body, { childList: true, subtree: true });
    timer = window.setInterval(patchReportButton, 1000);

    return () => {
      observer?.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return <MeuRelatorio />;
}
