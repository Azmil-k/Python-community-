import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex-col" style={{ flex: 1, width: "100%" }}>
      <Navbar user={user} />
      <div className="container animate-fade-in" style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "1.5rem" }}>Account Settings</h1>
        <div className="glass-panel">
          <h2 style={{ marginBottom: "1rem" }}>Change Password</h2>
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
