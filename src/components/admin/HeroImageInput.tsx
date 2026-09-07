"use client";

import { useRef, useState, useTransition } from "react";
import { setCountryHeroImage } from "@/app/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const BUCKET = "country-heroes";

/** Inline hero-image editor for a country row in /admin: paste a URL, or
 *  upload a photo file (stored in Supabase Storage). */
export default function HeroImageInput({
  countryId,
  initial,
}: {
  countryId: string;
  initial: string | null;
}) {
  const [url, setUrl] = useState(initial ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function save(nextUrl: string) {
    startTransition(async () => {
      const res = await setCountryHeroImage(countryId, nextUrl);
      setNote(res.message ?? (res.ok ? "Saved" : "Failed"));
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNote(null);
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${countryId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (error) {
        setNote(error.message);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
      save(data.publicUrl); // persist to the country row
    } catch (err: any) {
      setNote(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Hero image URL (https://…)"
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <button
        onClick={() => save(url)}
        disabled={pending || uploading}
        className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "…" : "Save URL"}
      </button>

      <span className="text-xs text-slate-300">or</span>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading || pending}
        className="shrink-0 rounded-md border border-brand-teal/40 bg-brand-teal/10 px-2 py-1 text-xs font-medium text-brand-tealdark hover:bg-brand-teal/20 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "⬆ Upload photo"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFile}
        className="hidden"
      />

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-8 w-12 shrink-0 rounded object-cover ring-1 ring-slate-200" />
      )}
      {note && <span className="w-full text-xs text-slate-400">{note}</span>}
    </div>
  );
}
