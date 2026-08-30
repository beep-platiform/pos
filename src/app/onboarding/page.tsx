"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { Store, ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [checkingSession, setCheckingSession] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedDemo, setSeedDemo] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // One atomic, server-side call: creates the business, makes this user its
      // owner, ensures a profile row, and (optionally) seeds starter categories
      // and empty tables (no fake menu items — real products only). Doing this
      // client-side as separate inserts hits a chicken-and-egg RLS problem —
      // you can't be granted visibility into a business until you're a member
      // of it, but you can't become a member until it exists. The RPC runs as
      // the database owner to cut through that.
      const { error: rpcError } = await supabase.rpc("onboard_business", {
        p_name: name,
        p_phone: phone || null,
        p_address: address || null,
        p_currency: currency,
        p_full_name: name ? `${name} Owner` : null,
        p_seed_demo: seedDemo,
      });
      if (rpcError) throw rpcError;

      router.push("/pos");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to complete this action. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-sm border border-border p-8">
        {checkingSession ? (
          <p className="text-sm text-muted text-center py-10">Loading…</p>
        ) : (
          <>
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
            <Store size={20} />
          </div>
          <div>
            <p className="font-semibold">Set up your restaurant</p>
            <p className="text-xs text-muted">Step {step} of 2</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80">Restaurant name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Chili Kitchen"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="+250 7xx xxx xxx"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="KG 7 Ave, Kigali"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80">Currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              type="button"
              disabled={!name}
              onClick={() => setStep(2)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm bg-background rounded-lg px-3 py-3 border border-border">
              <input type="checkbox" checked={seedDemo} onChange={(e) => setSeedDemo(e.target.checked)} />
              Add starter categories (Meals, Drinks, Fast Food…) and 6 tables so I have somewhere to start
            </label>
            <p className="text-xs text-muted">No fake products — add your real menu items afterward from the Menu page.</p>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-border py-2.5 rounded-lg text-sm font-medium"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {loading ? "Setting up…" : "Start selling"}
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
