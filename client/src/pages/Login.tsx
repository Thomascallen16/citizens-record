import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

async function authRequest(path: string, body: Record<string, string>) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Authentication failed.");
  return data;
}

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await authRequest(mode === "login" ? "/api/auth/login" : "/api/auth/register", mode === "login" ? { email, password } : { name, email, password });
      toast.success(mode === "login" ? "Signed in." : "Account created.");
      navigate("/");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#f7f6f1] px-6 py-10 text-stone-900"><div className="mx-auto flex min-h-[85vh] max-w-md items-center"><Card className="w-full border-stone-200 bg-white shadow-xl"><CardHeader className="space-y-4"><div className="flex items-center gap-3 text-emerald-800"><ShieldCheck className="h-7 w-7" /><span className="text-sm font-bold uppercase tracking-[.17em]">The Citizens Record</span></div><CardTitle className="font-serif text-3xl">{mode === "login" ? "Enter your workspace" : "Create your workspace"}</CardTitle><CardDescription>{mode === "login" ? "Sign in with the email and password you created here." : "Create a private account. Your password is hashed on the server and is never stored as plaintext."}</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">{mode === "register" && <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" required /></div>}<div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={12} required /></div><Button className="w-full bg-emerald-800 hover:bg-emerald-900" size="lg" disabled={busy}>{busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}</Button></form><div className="mt-5 text-center text-sm text-stone-500"><button className="font-medium text-emerald-800 hover:underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div><div className="mt-4 text-center"><Link href="/" className="text-xs text-stone-500 hover:underline">Back to public page</Link></div></CardContent></Card></div></main>;
}
