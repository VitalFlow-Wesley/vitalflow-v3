import { useEffect, useRef } from "react";
import { toast } from "sonner";
import MeuRelatorio from "./MeuRelatorio";

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

export default function MeuRelatorioPremiumFixed() {
  const isExportingRef = useRef(false);

  useEffect(() => {
    let observer = null;
    let timer = null;

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

    observer = new MutationObserver(patchReportButton);
    observer.observe(document.body, { childList: true, subtree: true });
    timer = window.setInterval(patchReportButton, 700);

    return () => {
      observer?.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return <MeuRelatorio />;
}
