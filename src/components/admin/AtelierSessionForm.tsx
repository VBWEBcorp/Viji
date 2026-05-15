"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";

export type ProgramBlock = { title: string; body: string };

export type Occurrence = {
  date: string;
  dateISO?: string;
  schedule: string;
  location: string;
};

export type SessionPayload = {
  slug: string;
  shortTitle: string;
  title: string;
  image: string;
  /** Une ou plusieurs occurrences (date + lieu). */
  occurrences: Occurrence[];
  /** Prix en euros (affichage UI). On convertit en centimes au submit. */
  priceEUR: number;
  intro: string;
  menu: string;
  program: ProgramBlock[];
  notes: ProgramBlock[];
  isActive: boolean;
  order: number;
};

interface Props {
  /** Slug actuel (pour PUT). Si absent → mode création. */
  initialSlug?: string;
  initial: SessionPayload;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AtelierSessionForm({ initialSlug, initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initialSlug);
  const [data, setData] = useState<SessionPayload>(initial);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof SessionPayload>(key: K, value: SessionPayload[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateProgram(i: number, field: keyof ProgramBlock, value: string) {
    setData((d) => ({
      ...d,
      program: d.program.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    }));
  }
  function addProgram() {
    setData((d) => ({ ...d, program: [...d.program, { title: "", body: "" }] }));
  }
  function removeProgram(i: number) {
    setData((d) => ({ ...d, program: d.program.filter((_, idx) => idx !== i) }));
  }

  function updateOccurrence(i: number, field: keyof Occurrence, value: string) {
    setData((d) => ({
      ...d,
      occurrences: d.occurrences.map((o, idx) =>
        idx === i ? { ...o, [field]: value } : o
      ),
    }));
  }
  function addOccurrence() {
    setData((d) => ({
      ...d,
      occurrences: [
        ...d.occurrences,
        { date: "", dateISO: "", schedule: "10h – 12h30", location: "" },
      ],
    }));
  }
  function removeOccurrence(i: number) {
    setData((d) => ({
      ...d,
      occurrences: d.occurrences.filter((_, idx) => idx !== i),
    }));
  }

  function updateNote(i: number, field: keyof ProgramBlock, value: string) {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n, idx) => (idx === i ? { ...n, [field]: value } : n)),
    }));
  }
  function addNote() {
    setData((d) => ({ ...d, notes: [...d.notes, { title: "", body: "" }] }));
  }
  function removeNote(i: number) {
    setData((d) => ({ ...d, notes: d.notes.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const occurrences = data.occurrences
      .filter((o) => o.date && o.schedule && o.location)
      .map((o) => ({
        date: o.date,
        dateISO: o.dateISO || undefined,
        schedule: o.schedule,
        location: o.location,
      }));

    if (occurrences.length === 0) {
      setSubmitting(false);
      toast.error("Ajoutez au moins une date / un lieu.");
      return;
    }

    const payload = {
      slug: data.slug || slugify(data.shortTitle),
      shortTitle: data.shortTitle,
      title: data.title,
      image: data.image,
      occurrences,
      price: Math.round(data.priceEUR * 100),
      intro: data.intro,
      menu: data.menu,
      program: data.program.filter((p) => p.title && p.body),
      notes: data.notes.filter((n) => n.title && n.body),
      isActive: data.isActive,
      order: data.order,
    };

    const url = isEdit
      ? `/api/ateliers/sessions/${initialSlug}`
      : "/api/ateliers/sessions";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error || "Erreur");
      return;
    }
    toast.success(isEdit ? "Session mise à jour" : "Session créée");
    router.push("/admin/ateliers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Bloc 1 — identité */}
      <Card title="Identité">
        <Row>
          <Field
            label="Titre court (carte)"
            value={data.shortTitle}
            onChange={(v) => update("shortTitle", v)}
            required
            placeholder="Poulet & riz au citron"
          />
          <Field
            label="Slug URL"
            value={data.slug}
            onChange={(v) => update("slug", slugify(v))}
            placeholder="(généré depuis le titre)"
          />
        </Row>
        <Field
          label="Titre complet (page détail)"
          value={data.title}
          onChange={(v) => update("title", v)}
          required
          placeholder="Poulet aux pommes de terre & riz au citron"
        />
        <Field
          label="Photo (URL)"
          value={data.image}
          onChange={(v) => update("image", v)}
          required
          placeholder="https://i.ibb.co/..."
        />
      </Card>

      {/* Bloc 2 — tarif */}
      <Card title="Tarif">
        <Field
          label="Prix par personne (€)"
          type="number"
          value={String(data.priceEUR)}
          onChange={(v) => update("priceEUR", parseFloat(v) || 0)}
          required
          placeholder="60"
        />
      </Card>

      {/* Bloc 2bis — dates & lieux (occurrences) */}
      <Card
        title="Dates et lieux"
        action={
          <button
            type="button"
            onClick={addOccurrence}
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 transition"
          >
            <Plus size={14} /> Ajouter une date
          </button>
        }
      >
        <p className="text-[12px] text-gray-500 italic mb-4">
          Ajoutez chaque créneau auquel cet atelier est proposé. Le client choisira dans un menu déroulant.
        </p>
        {data.occurrences.length === 0 && (
          <p className="text-[13px] text-gray-400 italic">Aucune date pour le moment. Cliquez sur « Ajouter une date » ci-dessus.</p>
        )}
        <div className="space-y-3">
          {data.occurrences.map((o, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/40 relative"
            >
              <button
                type="button"
                onClick={() => removeOccurrence(i)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                title="Supprimer cette date"
              >
                <Trash2 size={15} />
              </button>
              <Row>
                <Field
                  label="Date affichée"
                  value={o.date}
                  onChange={(v) => updateOccurrence(i, "date", v)}
                  required
                  placeholder="Samedi 13 juin 2026"
                />
                <Field
                  label="Date ISO (tri)"
                  type="date"
                  value={o.dateISO || ""}
                  onChange={(v) => updateOccurrence(i, "dateISO", v)}
                  placeholder="2026-06-13"
                />
              </Row>
              <Row>
                <Field
                  label="Horaires"
                  value={o.schedule}
                  onChange={(v) => updateOccurrence(i, "schedule", v)}
                  required
                  placeholder="10h – 12h30"
                />
                <Field
                  label="Lieu"
                  value={o.location}
                  onChange={(v) => updateOccurrence(i, "location", v)}
                  required
                  placeholder="Association Rennes"
                />
              </Row>
            </div>
          ))}
        </div>
      </Card>

      {/* Bloc 3 — contenu pédagogique */}
      <Card title="Contenu de la session">
        <Textarea
          label="Introduction (sous le titre détail)"
          rows={3}
          value={data.intro}
          onChange={(v) => update("intro", v)}
          required
        />
        <Textarea
          label="Menu de la session"
          rows={2}
          value={data.menu}
          onChange={(v) => update("menu", v)}
          required
          placeholder="Plat principal + accompagnements"
        />
      </Card>

      {/* Bloc 4 — programme */}
      <Card
        title="Programme"
        action={
          <button
            type="button"
            onClick={addProgram}
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 transition"
          >
            <Plus size={14} /> Ajouter
          </button>
        }
      >
        {data.program.length === 0 && (
          <p className="text-[13px] text-gray-400 italic">Aucun bloc. Ajoutez « Au programme », « Moment convivial », etc.</p>
        )}
        {data.program.map((p, i) => (
          <BlockEditor
            key={i}
            block={p}
            onChange={(field, value) => updateProgram(i, field, value)}
            onRemove={() => removeProgram(i)}
          />
        ))}
      </Card>

      {/* Bloc 5 — notes (enfants, allergies…) */}
      <Card
        title="Notes complémentaires"
        action={
          <button
            type="button"
            onClick={addNote}
            className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-900 transition"
          >
            <Plus size={14} /> Ajouter
          </button>
        }
      >
        {data.notes.length === 0 && (
          <p className="text-[13px] text-gray-400 italic">Aucune note. Ajoutez « Participation des enfants », « Option emporter », « Adaptations alimentaires »…</p>
        )}
        {data.notes.map((n, i) => (
          <BlockEditor
            key={i}
            block={n}
            onChange={(field, value) => updateNote(i, field, value)}
            onRemove={() => removeNote(i)}
          />
        ))}
      </Card>

      {/* Bloc 6 — visibilité */}
      <Card title="Visibilité">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => update("isActive", e.target.checked)}
            className="w-4 h-4 accent-gray-900"
          />
          <span className="text-[14px] text-gray-700">Session visible sur le site public</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field
            label="Ordre d'affichage"
            type="number"
            value={String(data.order)}
            onChange={(v) => update("order", parseInt(v, 10) || 0)}
          />
        </div>
      </Card>

      {/* Bouton submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin/ateliers")}
          className="px-5 py-2.5 text-[13px] text-gray-600 hover:text-gray-900 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 text-[13px] font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-60"
        >
          <Save size={15} />
          {submitting ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer la session"}
        </button>
      </div>
    </form>
  );
}

/* ───────── Helpers UI ───────── */

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 focus:bg-white outline-none transition-all placeholder:text-gray-300 leading-relaxed"
      />
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: ProgramBlock;
  onChange: (field: keyof ProgramBlock, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/40 relative">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
        title="Supprimer"
      >
        <Trash2 size={15} />
      </button>
      <Field
        label="Titre"
        value={block.title}
        onChange={(v) => onChange("title", v)}
        placeholder="Au programme"
      />
      <Textarea
        label="Contenu"
        value={block.body}
        onChange={(v) => onChange("body", v)}
        rows={3}
      />
    </div>
  );
}
