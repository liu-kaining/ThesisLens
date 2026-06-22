import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAuthConfigStatus } from "@/lib/auth/session";
import { getCurrentSession } from "@/lib/server/auth";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([getCurrentSession(), searchParams]);
  if (session) redirect("/");

  const authStatus = getAuthConfigStatus();
  const nextPath = safeNextPath(params.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-sm font-bold text-white">
            TL
          </span>
          <p className="mt-4 text-sm font-semibold text-steel">ThesisLens</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">私有美股研究台</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            使用管理员口令或有效期内的访问口令进入。访问口令到期后需要管理员重建。
          </p>
        </div>
        <LoginForm
          nextPath={nextPath}
          authConfigured={authStatus.authConfigured}
        />
      </div>
    </main>
  );
}

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/api/")) return "/";
  return value;
}
