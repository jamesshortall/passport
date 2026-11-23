import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import UpdatePasswordForm from "@/components/UpdatePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const status = profile.approval_status;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy">Your account</h1>
        <SignOutButton />
      </div>
      <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

      {status === "pending" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">
            ⏳ Your account is awaiting admin approval
          </p>
          <p className="mt-2 text-sm text-amber-800">
            Thanks for signing up! An admin needs to approve your account before
            you can save countries or get update alerts. We'll email you when
            it's reviewed. You can still browse every country in the meantime.
          </p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-brand-navy px-4 py-1.5 text-sm text-white"
          >
            Browse countries
          </Link>
        </div>
      )}

      {status === "rejected" && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">Account not approved</p>
          <p className="mt-2 text-sm text-red-700">
            Your account request wasn't approved. If you think this is a mistake,
            reach out via{" "}
            <a href="https://www.traveltechnician.info" className="underline">
              The Travel Technician
            </a>
            .
          </p>
        </div>
      )}

      {status === "approved" && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">✅ You're all set</p>
          <p className="mt-2 text-sm text-green-700">
            Your account is approved. Save countries from any country page and
            they'll show up here.
          </p>
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="mt-3 inline-block rounded-full bg-brand-navy px-4 py-1.5 text-sm text-white"
            >
              Open admin panel
            </Link>
          )}
        </div>
      )}

      {/* Change password */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-brand-navy">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set a new password for signing in.
        </p>
        <div className="mt-4">
          <UpdatePasswordForm submitLabel="Update password" />
        </div>
      </div>
    </div>
  );
}
