"use client";

import { useState } from "react";

export default function SettingsClient() {
  const [loading, setLoading] = useState(false);

  const openBillingPortal = async () => {
    setLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    window.location.href = data.url;
  };

  const deleteAccount = async () => {
    const confirmed = confirm(
      "This will permanently delete your account and all data. This cannot be undone."
    );
    if (!confirmed) return;

    setLoading(true);
    await fetch("/api/account/delete", { method: "DELETE" });
    window.location.href = "/";
  };

  return (
    <div className="space-y-10">

      {/* Billing */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-lg font-medium mb-2">Billing</h2>
        <p className="text-sm text-neutral-400 mb-4">
          Manage your subscription and payment details.
        </p>

        <button
          onClick={openBillingPortal}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-black font-medium"
        >
          Manage Subscription
        </button>
      </section>

      {/* Danger Zone */}
      <section className="bg-neutral-900 border border-red-900/40 rounded-xl p-6">
        <h2 className="text-lg font-medium text-red-500 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-neutral-400 mb-4">
          Deleting your account is permanent and cannot be undone.
        </p>

        <button
          onClick={deleteAccount}
          disabled={loading}
          className="px-4 py-2 rounded-md border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition"
        >
          Delete Account
        </button>
      </section>
    </div>
  );
}
