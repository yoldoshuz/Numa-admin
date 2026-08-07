"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useLogin } from "@/hooks/use-auth";
import { Loader } from "@/components/states/Loader";
import { useAuthHydrated } from "@/hooks/use-hydrated";
import { useAuthStore } from "@/lib/auth-store";

const schema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

export const LoginPage = () => {
  const [showPwd, setShowPwd] = useState(false);
  const router = useRouter();
  const admin = useAuthStore((s) => s.admin);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthHydrated();
  const login = useLogin();

  useEffect(() => {
    if (!hydrated) return;
    if (token && admin) {
      router.replace(admin.role === "super_admin" ? "/super-admin" : "/admin");
    }
  }, [token, admin, hydrated, router]);

  // Rendering the form over a session that is about to redirect is the flash
  // the guard above exists to prevent.
  if (!hydrated || (token && admin)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader label="Загрузка…" />
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: FormValues) => login.mutate(values);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-24 size-[420px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[420px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold">Вход в систему</h2>
            <p className="text-sm text-muted-foreground">
              Используйте свои учётные данные администратора
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@numa.uz"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="mt-2 h-11 w-full" disabled={login.isPending}>
              {login.isPending && <Spinner className="size-4" />}
              Войти в систему
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Numa · Admin Panel · CRM · Только для авторизованных лиц
          </p>
        </div>
      </div>
    </div>
  );
};
