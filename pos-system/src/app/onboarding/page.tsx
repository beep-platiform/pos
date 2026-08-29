"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { Store, ArrowRight } from "lucide-react";

const DEFAULT_CATEGORIES = ["Meals", "Drinks", "Fast Food", "Snacks", "Desserts"];

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
    supabase.auth.getUser().then(({ data: { user } }) => {
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

      // 1. Create the business
      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .insert({ name, phone, address, currency })
        .select("id")
        .single();
      if (bizErr) throw bizErr;

      // 2. Make this user the owner
      const { error: memberErr } = await supabase.from("business_users").insert({
        business_id: business.id,
        user_id: user.id,
        role: "owner",
      });
      if (memberErr) throw memberErr;

      // 3. Ensure a profile row exists
      await supabase.from("profiles").upsert({ id: user.id, full_name: name ? `${name} Owner` : null });

      // 4. Seed demo categories + items if requested
      if (seedDemo) {
        const { data: cats, error: catErr } = await supabase
          .from("menu_categories")
          .insert(
            DEFAULT_CATEGORIES.map((n, i) => ({
              business_id: business.id,
              name: n,
              sort_order: i,
            }))
          )
          .select("id, name");
        if (catErr) throw catErr;

        const findId = (n: string) => cats?.find((c) => c.name === n)?.id ?? null;

        await supabase.from("menu_items").insert([
          { business_id: business.id, category_id: findId("Fast Food"), name: "Chicken Burger", price: 3500, cost_price: 1800, prep_time_minutes: 10 },
          { business_id: business.id, category_id: findId("Fast Food"), name: "Beef Burger", price: 3800, cost_price: 2000, prep_time_minutes: 10 },
          { business_id: business.id, category_id: findId("Snacks"), name: "French Fries", price: 1500, cost_price: 600, prep_time_minutes: 6 },
          { business_id: business.id, category_id: findId("Meals"), name: "Grilled Chicken", price: 5000, cost_price: 2800, prep_time_minutes: 15 },
          { business_id: business.id, category_id: findId("Drinks"), name: "Coke", price: 1000, cost_price: 400, prep_time_minutes: 1 },
          { business_id: business.id, category_id: findId("Drinks"), name: "Water", price: 500, cost_price: 150, prep_time_minutes: 1 },
          { business_id: business.id, category_id: findId("Drinks"), name: "Fresh Juice", price: 2000, cost_price: 900, prep_time_minutes: 3 },
        ]);
      }

      // 5. Seed a couple of tables
      await supabase.from("restaurant_tables").insert(
        Array.from({ length: 6 }).map((_, i) => ({
          business_id: business.id,
          table_number: `T${i + 1}`,
          seats: 4,
        }))
      );

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
              Add demo categories &amp; menu items (Meals, Drinks, Fast Food…) so I can start selling right away
            </label>
            <p className="text-xs text-muted">You can edit or remove these anytime from Menu Management. Marked clearly as demo data.</p>

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
