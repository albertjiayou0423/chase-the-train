"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isSignUp = mode === "sign-up";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(form.get("name") ?? "").trim() })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) { setError(result.error.message ?? "操作失败，请重试"); return; }
    router.push("/");
    router.refresh();
  }

  return <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4"><Card className="w-full"><CardHeader><CardTitle>{isSignUp ? "创建账户" : "登录账户"}</CardTitle><CardDescription>保存你的乘车、拍车与收藏记录。</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">{isSignUp && <div className="space-y-2"><Label htmlFor="name">昵称</Label><Input id="name" name="name" required maxLength={40} /></div>}<div className="space-y-2"><Label htmlFor="email">邮箱</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">密码</Label><Input id="password" name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /></div>{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}<Button className="w-full" disabled={busy}>{busy ? "处理中…" : isSignUp ? "注册" : "登录"}</Button><p className="text-center text-sm text-muted-foreground">{isSignUp ? "已有账户？" : "还没有账户？"}<a className="ml-1 text-primary hover:underline" href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "去登录" : "去注册"}</a></p></form></CardContent></Card></main>;
}
