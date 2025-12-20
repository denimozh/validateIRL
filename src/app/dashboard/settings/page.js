import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <SettingsClient />
    </div>
  );
}