"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { useUpdateMe, useChangeMyPassword } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
const pwdSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, "Минимум 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const ProfilePage = () => {
  const admin = useAuthStore((s) => s.admin);
  const update = useUpdateMe();
  const changePwd = useChangeMyPassword();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });
  const pwdForm = useForm<z.infer<typeof pwdSchema>>({
    resolver: zodResolver(pwdSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (admin) profileForm.reset({ name: admin.name, email: admin.email });
  }, [admin, profileForm]);

  if (!admin) return null;
  const initials = admin.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-5">
      <PageHeader title="Профиль" description="Управление личными данными и безопасностью" />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-6">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{admin.name}</h2>
              {admin.role === "super_admin" ? (
                <Badge className="bg-primary text-primary-foreground">Super Admin</Badge>
              ) : (
                <Badge variant="outline">Admin</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StoreBadge store={admin.store} />
              <span className="text-xs text-muted-foreground">
                Последний вход: {formatDate(admin.lastLoginAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Личные данные</CardTitle>
            <CardDescription>Имя и email, отображаемые в системе</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={profileForm.handleSubmit((v) => update.mutate(v))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input {...profileForm.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...profileForm.register("email")} />
              </div>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Spinner className="size-4" />}
                <Save className="size-4" />
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Смена пароля</CardTitle>
            <CardDescription>Минимум 8 символов</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={pwdForm.handleSubmit((v) =>
                changePwd.mutate(
                  { currentPassword: v.currentPassword, newPassword: v.newPassword },
                  { onSuccess: () => pwdForm.reset() }
                )
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Текущий пароль</Label>
                <Input type="password" {...pwdForm.register("currentPassword")} />
              </div>
              <div className="space-y-2">
                <Label>Новый пароль</Label>
                <Input type="password" {...pwdForm.register("newPassword")} />
                {pwdForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{pwdForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Подтверждение</Label>
                <Input type="password" {...pwdForm.register("confirmPassword")} />
                {pwdForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{pwdForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={changePwd.isPending}>
                {changePwd.isPending && <Spinner className="size-4" />}
                <KeyRound className="size-4" />
                Сменить пароль
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {admin.permissions.length > 0 && admin.role !== "super_admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ваши разрешения</CardTitle>
            <CardDescription>Набор доступных действий</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {admin.permissions.map((p) => (
                <Badge key={p} variant="outline" className="font-mono text-xs">
                  {p}
                </Badge>
              ))}
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Для изменения прав обратитесь к Super Admin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
