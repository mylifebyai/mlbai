"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExperimentContract, SPBlock, OutputMetric, RelapseRule, TokenRules } from "@/lib/productivityTypes";
import { useAuth } from "../providers/AuthProvider";

function createDefaultContract(): ExperimentContract {
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 1,
    startDate: today,
    spPlan: [
      { id: crypto.randomUUID(), label: "YouTube Work", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "09:00", endTime: "15:00", weeklyTargetHours: 30, notes: "Filming, editing, scripting, thumbnails, research" },
      { id: crypto.randomUUID(), label: "App Development", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "15:00", endTime: "17:00", weeklyTargetHours: 10, notes: "Building MLBAI features" },
      { id: crypto.randomUUID(), label: "Physical Training", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "17:00", endTime: "19:00", weeklyTargetHours: 10, notes: "Walks, movement, recovery" },
    ],
    outputs: [
      { id: crypto.randomUUID(), label: "YouTube videos", target: 1, period: "week", unit: "videos" },
      { id: crypto.randomUUID(), label: "App features", target: 1, period: "week", unit: "features" },
      { id: crypto.randomUUID(), label: "Walking distance", target: 25, period: "week", unit: "km" },
    ],
    relapseRules: [
      { id: crypto.randomUUID(), name: "Time-block violation", description: "Wrong task or skipped block", category: "time_block" },
      { id: crypto.randomUUID(), name: "Diet outside plan", description: "Eating outside the diet plan", category: "system" },
      { id: crypto.randomUUID(), name: "Unapproved spend", description: "Spending money without AI approval", category: "system" },
    ],
    punishment: { description: "Third relapse → phone to Jack for a week", triggerRelapses: 3 },
    tokens: { enabled: false, tokensPerSP: 1, tokenValue: 10, monthlyBudget: 500 },
    trackFallingApart: true,
    retroactiveCheckinCostsRelapse: true,
  };
}

function daysToString(days?: string[]) {
  return days?.join(", ") ?? "";
}

function stringToDays(value: string) {
  return value
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean) as any;
}

function cloneBlock(block?: SPBlock): SPBlock {
  return { ...block, id: block?.id ?? crypto.randomUUID(), days: block?.days ? [...block.days] : [] };
}

export function ProductivityClient() {
  const { session, loading: authLoading } = useAuth();
  const [contract, setContract] = useState<ExperimentContract>(createDefaultContract);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const tokenEnabled = useMemo(() => contract.tokens?.enabled ?? false, [contract.tokens?.enabled]);

  const loadContract = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/productivity/contract", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to load contract");
      }
      const body = (await res.json()) as { contract?: ExperimentContract | null; updated_at?: string | null };
      if (body.contract) {
        setContract(body.contract);
      }
      setSavedAt(body.updated_at ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contract");
    } finally {
      setLoading(false);
    }
  };

  const saveContract = async () => {
    if (!session?.access_token) {
      setError("Sign in to save your contract.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/productivity/contract", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contract }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save contract");
      }
      setSavedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contract");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      loadContract();
    }
  }, [session?.access_token]);

  const updateBlockField = (id: string, field: keyof SPBlock, value: any) => {
    setContract((prev) => ({
      ...prev,
      spPlan: prev.spPlan.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
  };

  const addBlock = () => {
    setContract((prev) => ({
      ...prev,
      spPlan: [
        ...prev.spPlan,
        { id: crypto.randomUUID(), label: "New block", days: ["Mon"], startTime: "09:00", endTime: "10:00", weeklyTargetHours: 1 },
      ],
    }));
  };

  const removeBlock = (id: string) => {
    setContract((prev) => ({ ...prev, spPlan: prev.spPlan.filter((b) => b.id !== id) }));
  };

  const updateOutputField = (id: string, field: keyof OutputMetric, value: any) => {
    setContract((prev) => ({
      ...prev,
      outputs: prev.outputs.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    }));
  };

  const addOutput = () => {
    setContract((prev) => ({
      ...prev,
      outputs: [...prev.outputs, { id: crypto.randomUUID(), label: "New output", target: 1, period: "week", unit: "" }],
    }));
  };

  const removeOutput = (id: string) => {
    setContract((prev) => ({ ...prev, outputs: prev.outputs.filter((o) => o.id !== id) }));
  };

  const updateRelapseField = (id: string, field: keyof RelapseRule, value: any) => {
    setContract((prev) => ({
      ...prev,
      relapseRules: prev.relapseRules.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
  };

  const addRelapse = () => {
    setContract((prev) => ({
      ...prev,
      relapseRules: [
        ...prev.relapseRules,
        { id: crypto.randomUUID(), name: "New rule", description: "Describe the rule", category: "system" },
      ],
    }));
  };

  const removeRelapse = (id: string) => {
    setContract((prev) => ({ ...prev, relapseRules: prev.relapseRules.filter((r) => r.id !== id) }));
  };

  const updateTokens = (value: Partial<TokenRules>) => {
    setContract((prev) => ({
      ...prev,
      tokens: { ...prev.tokens, ...value, enabled: value.enabled ?? prev.tokens?.enabled ?? false },
    }));
  };

  const resetContract = () => setContract(createDefaultContract());

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Experiment contract</h2>
          <p className="text-sm text-gray-600">
            Define your SP plan, outputs, relapse rules, punishment, and tokens. Save to persist.
          </p>
          {savedAt && <p className="text-xs text-gray-500">Last saved: {new Date(savedAt).toLocaleString()}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!session && <p className="text-sm text-red-600">Sign in to load and save your contract.</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetContract}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
            disabled={saving}
          >
            Reset to template
          </button>
          <button
            type="button"
            onClick={saveContract}
            className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow"
            disabled={saving || authLoading}
          >
            {saving ? "Saving..." : "Save contract"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-3 rounded border border-gray-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">SP plan</h3>
            <button
              type="button"
              onClick={addBlock}
              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700"
              disabled={saving}
            >
              Add block
            </button>
          </div>
          <div className="grid gap-3">
            {contract.spPlan.map((block) => (
              <div key={block.id} className="grid gap-2 rounded border border-gray-100 p-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm sm:w-1/2"
                    value={block.label}
                    onChange={(e) => updateBlockField(block.id, "label", e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm sm:w-1/2"
                    value={daysToString(block.days as string[])}
                    onChange={(e) => updateBlockField(block.id, "days", stringToDays(e.target.value))}
                    placeholder="Days (Mon, Tue...)"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={block.startTime ?? ""}
                    onChange={(e) => updateBlockField(block.id, "startTime", e.target.value)}
                    placeholder="Start (09:00)"
                  />
                  <input
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={block.endTime ?? ""}
                    onChange={(e) => updateBlockField(block.id, "endTime", e.target.value)}
                    placeholder="End (15:00)"
                  />
                  <input
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    type="number"
                    value={block.weeklyTargetHours ?? 0}
                    onChange={(e) => updateBlockField(block.id, "weeklyTargetHours", Number(e.target.value))}
                    placeholder="Weekly target hours"
                  />
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    value={block.notes ?? ""}
                    onChange={(e) => updateBlockField(block.id, "notes", e.target.value)}
                    placeholder="Notes"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="text-sm text-red-600"
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded border border-gray-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Outputs</h3>
            <button
              type="button"
              onClick={addOutput}
              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700"
              disabled={saving}
            >
              Add output
            </button>
          </div>
          <div className="grid gap-3">
            {contract.outputs.map((output) => (
              <div key={output.id} className="grid gap-2 rounded border border-gray-100 p-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm sm:w-1/2"
                    value={output.label}
                    onChange={(e) => updateOutputField(output.id, "label", e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    type="number"
                    value={output.target}
                    onChange={(e) => updateOutputField(output.id, "target", Number(e.target.value))}
                    placeholder="Target"
                  />
                  <select
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={output.period}
                    onChange={(e) => updateOutputField(output.id, "period", e.target.value as OutputMetric["period"])}
                  >
                    <option value="week">Per week</option>
                    <option value="month">Per month</option>
                  </select>
                  <input
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={output.unit ?? ""}
                    onChange={(e) => updateOutputField(output.id, "unit", e.target.value)}
                    placeholder="Unit (videos, km...)"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeOutput(output.id)}
                    className="text-sm text-red-600"
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded border border-gray-200 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Relapse rules</h3>
            <button
              type="button"
              onClick={addRelapse}
              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700"
              disabled={saving}
            >
              Add rule
            </button>
          </div>
          <div className="grid gap-3">
            {contract.relapseRules.map((rule) => (
              <div key={rule.id} className="grid gap-2 rounded border border-gray-100 p-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm sm:w-1/2"
                    value={rule.name}
                    onChange={(e) => updateRelapseField(rule.id, "name", e.target.value)}
                    placeholder="Rule name"
                  />
                  <select
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    value={rule.category}
                    onChange={(e) =>
                      updateRelapseField(rule.id, "category", e.target.value as RelapseRule["category"])
                    }
                  >
                    <option value="time_block">Time-block</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <textarea
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  rows={2}
                  value={rule.description}
                  onChange={(e) => updateRelapseField(rule.id, "description", e.target.value)}
                  placeholder="Describe the violation"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRelapse(rule.id)}
                    className="text-sm text-red-600"
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded border border-gray-200 p-3">
          <h3 className="text-lg font-semibold">Punishment & options</h3>
          <div className="grid gap-2">
            <input
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
              value={contract.punishment.description}
              onChange={(e) => setContract((prev) => ({ ...prev, punishment: { ...prev.punishment, description: e.target.value } }))}
              placeholder="Punishment description"
            />
            <input
              className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
              type="number"
              value={contract.punishment.triggerRelapses}
              onChange={(e) =>
                setContract((prev) => ({
                  ...prev,
                  punishment: { ...prev.punishment, triggerRelapses: Number(e.target.value) },
                }))
              }
              placeholder="Relapses to trigger"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={contract.trackFallingApart}
                onChange={(e) => setContract((prev) => ({ ...prev, trackFallingApart: e.target.checked }))}
              />
              Track “Life Is Falling Apart” list
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={contract.retroactiveCheckinCostsRelapse}
                onChange={(e) => setContract((prev) => ({ ...prev, retroactiveCheckinCostsRelapse: e.target.checked }))}
              />
              Retroactive check-ins cost a relapse
            </label>
          </div>
        </div>

        <div className="grid gap-3 rounded border border-gray-200 p-3">
          <h3 className="text-lg font-semibold">Tokens (optional)</h3>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={tokenEnabled}
              onChange={(e) => updateTokens({ enabled: e.target.checked })}
            />
            Enable tokens
          </label>
          {tokenEnabled && (
            <div className="flex flex-wrap gap-2">
              <input
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                type="number"
                value={contract.tokens?.tokensPerSP ?? 0}
                onChange={(e) => updateTokens({ tokensPerSP: Number(e.target.value) })}
                placeholder="Tokens per SP"
              />
              <input
                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                type="number"
                value={contract.tokens?.tokenValue ?? 0}
                onChange={(e) => updateTokens({ tokenValue: Number(e.target.value) })}
                placeholder="Token value"
              />
              <input
                className="w-40 rounded border border-gray-300 px-2 py-1 text-sm"
                type="number"
                value={contract.tokens?.monthlyBudget ?? 0}
                onChange={(e) => updateTokens({ monthlyBudget: Number(e.target.value) })}
                placeholder="Monthly budget"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
