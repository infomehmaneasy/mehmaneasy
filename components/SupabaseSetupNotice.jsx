"use client";

export default function SupabaseSetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-ink">
      <div className="max-w-md w-full bg-ink-panel border border-ink-line rounded-2xl p-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-gold font-600 mb-2">Setup needed</p>
        <h1 className="font-display font-700 text-xl text-cream mb-3">Connect your Supabase project</h1>
        <p className="text-sm text-cream/65 leading-relaxed mb-4">
          Mehmaan Easy needs your Supabase project URL and publishable key. Locally:
        </p>
        <ol className="text-sm text-cream/70 leading-relaxed list-decimal list-inside space-y-1.5 mb-4">
          <li>
            Copy <code className="text-gold-soft">.env.local.example</code> to{" "}
            <code className="text-gold-soft">.env.local</code>
          </li>
          <li>
            Set <code className="text-gold-soft">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-gold-soft">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
            <code className="text-gold-soft">.env.local</code>
          </li>
          <li>Restart the dev server</li>
        </ol>
        <p className="text-xs text-cream/40">Full walkthrough is in the project's README.md.</p>
      </div>
    </div>
  );
}
