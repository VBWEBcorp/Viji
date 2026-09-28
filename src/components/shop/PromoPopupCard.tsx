"use client";

import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

export interface PromoPopupContent {
  image?: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonUrl?: string;
  mode?: "lien" | "code";
}

/**
 * Le contenu de la pop-up, utilisé à la fois par le site et par l'aperçu de
 * l'admin : ce que la commerçante voit dans l'aperçu est exactement ce que
 * voient ses clients.
 *
 * Mode « lien » : un bouton qui mène à une page.
 * Mode « code » : une case email ; le code promo part par email.
 */
export default function PromoPopupCard({
  popup,
  onClose,
  onSent,
  preview = false,
}: {
  popup: PromoPopupContent;
  onClose?: () => void;
  /** Le code est parti : la pop-up ne doit plus revenir chez ce visiteur. */
  onSent?: () => void;
  /** Aperçu admin : rien n'est envoyé, les boutons ne font rien. */
  preview?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modeCode = popup.mode === "code";

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (preview || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "L'envoi a échoué, réessayez.");
      } else {
        setSent(true);
        onSent?.();
      }
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition"
        >
          <X size={16} />
        </button>
      )}

      {popup.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={popup.image} alt={popup.title} className="w-full h-52 object-cover" />
      )}

      <div className="p-7 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {popup.title || "Titre de votre pop-up"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6 whitespace-pre-line">
          {popup.description || "Description de votre offre..."}
        </p>

        {modeCode ? (
          sent ? (
            <div className="border border-emerald-200 bg-emerald-50 rounded-xl px-4 py-4 text-left">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-emerald-800">
                <Check size={16} /> C&apos;est envoyé !
              </p>
              <p className="text-[13px] text-emerald-900/80 mt-1 leading-relaxed">
                Votre code vous attend dans votre boîte mail (pensez à regarder
                dans les indésirables). Saisissez-le dans la case « Code promo »
                au moment de payer.
              </p>
            </div>
          ) : (
            <form onSubmit={envoyer} className="space-y-3">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute -left-[9999px] w-px h-px"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-[15px] text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition"
              />
              {error && <p className="text-[13px] text-red-600 text-left">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                {popup.buttonText || "Recevoir mon code"}
              </button>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Vous recevrez aussi nos actualités. Désinscription en un clic.
              </p>
            </form>
          )
        ) : preview ? (
          <span className="block w-full bg-gray-900 text-white py-3.5 rounded-xl text-[15px] font-semibold text-center">
            {popup.buttonText || "En profiter"}
          </span>
        ) : (
          <a
            href={popup.buttonUrl || "/kits/decouverte"}
            onClick={onClose}
            className="block w-full bg-gray-900 text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-gray-800 transition-colors text-center"
          >
            {popup.buttonText || "En profiter"}
          </a>
        )}

        {onClose && !sent && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-[13px] text-gray-400 hover:text-gray-600 transition"
          >
            Non merci
          </button>
        )}
      </div>
    </div>
  );
}
