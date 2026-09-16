// app/(auth)/login/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, redirect directly to /schedule (§45)
  if (session?.user?.role) {
    redirect("/schedule");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white font-black text-xl shadow-lg shadow-slate-900/10">
            AP
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Amusement Park System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Portail de gestion des plannings et présences des employés (§10)
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Connexion</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accédez à votre espace selon votre rôle et vos habilitations.
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Informative Footer */}
        <p className="text-center text-xs text-slate-400">
          Amusement Park Workforce Scheduling &amp; Attendance Management System
        </p>
      </div>
    </div>
  );
}
