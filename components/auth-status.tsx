"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function AuthStatus() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  if (!session?.user) return <Button size="sm" render={<a href="/auth/sign-in" />}>登录</Button>;
  return <div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:inline">{session.user.name}</span><Button size="sm" variant="outline" onClick={async () => { await authClient.signOut(); router.refresh(); }}>退出</Button></div>;
}
