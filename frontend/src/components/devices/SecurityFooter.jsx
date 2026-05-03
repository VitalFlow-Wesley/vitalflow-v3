import { ShieldCheck } from "lucide-react";

export default function SecurityFooter() {
  return (
    <section className="rounded-2xl border border-emerald-500/10 bg-[#08140f] px-5 py-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-emerald-400" size={20} />
        <div>
          <p className="text-sm font-medium text-emerald-300">Seus dados estão protegidos</p>
          <p className="text-xs text-zinc-400">
            Utilizamos criptografia de ponta a ponta e seguimos os mais altos padrões de segurança e privacidade.
          </p>
        </div>
      </div>
    </section>
  );
}
