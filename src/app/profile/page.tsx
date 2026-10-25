import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { toProfile } from "@/lib/profile";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Company profile · ThePlatform" };

async function LoadedProfileForm() {
  const workspace = await getCurrentWorkspace();
  return <ProfileForm initial={toProfile(workspace)} />;
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Company profile</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Tell your AI team about your business. Every agent reads this before starting a task, so the more you
          share, the better their work. You can change it any time.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading your profile…</p>}>
        <LoadedProfileForm />
      </Suspense>
    </div>
  );
}
