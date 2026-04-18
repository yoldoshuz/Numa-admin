"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, MoreHorizontal, KeyRound, Trash2, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import {
  useAdmins,
  useCreateAdmin,
  useDeleteAdmin,
  useActivateAdmin,
  useDeactivateAdmin,
  useUpdateAdminPermissions,
  useChangeAdminPassword,
  useAdminPermissions,
} from "@/hooks/use-admins";
import { formatDate } from "@/lib/format";
import { ALL_PERMISSIONS, MARKETPLACE_STORES } from "@/lib/constants";
import type { Admin, StoreSlug } from "@/lib/types";

export const AdminsPage = () => {
  const [storeFilter, setStoreFilter] = useState<StoreSlug | "all">("all");
  const { data, isLoading, isError, error, refetch } = useAdmins({
    store: storeFilter === "all" ? undefined : storeFilter,
  });
  const [creating, setCreating] = useState(false);
  const [permissionsOf, setPermissionsOf] = useState<Admin | null>(null);
  const [passwordOf, setPasswordOf] = useState<Admin | null>(null);
  const [toDelete, setToDelete] = useState<Admin | null>(null);
  const [toDeactivate, setToDeactivate] = useState<Admin | null>(null);
  const del = useDeleteAdmin();
  const deactivate = useDeactivateAdmin();
  const activate = useActivateAdmin();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Администраторы"
        description="Управление командой: права, магазины, доступ"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Новый администратор
          </Button>
        }
      />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v as StoreSlug | "all")}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Фильтр по магазину" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все магазины</SelectItem>
              {MARKETPLACE_STORES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" rows={5} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.length ? (
        <Empty
          icon={<UserCog className="size-5" />}
          title="Администраторы не найдены"
          action={<Button onClick={() => setCreating(true)}><Plus className="size-4" />Создать</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Администратор</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Магазин</TableHead>
                  <TableHead>Права</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((a) => {
                  const initials = a.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{a.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.role === "super_admin" ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Super Admin</Badge>
                        ) : (
                          <Badge variant="outline">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell><StoreBadge store={a.store} /></TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {a.role === "super_admin" ? "Все" : `${a.permissions.length} прав`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.isActive ? (
                          <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">Активен</Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">Отключён</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(a.lastLoginAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-auto space-y-1">
                            <DropdownMenuItem onClick={() => setPermissionsOf(a)}>
                              <Shield className="size-4" /> Права и магазин
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPasswordOf(a)}>
                              <KeyRound className="size-4" /> Сбросить пароль
                            </DropdownMenuItem>
                            {a.isActive ? (
                              <DropdownMenuItem onClick={() => setToDeactivate(a)}>
                                <ShieldOff className="size-4" /> Деактивировать
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => activate.mutate(a.id)}>
                                <Shield className="size-4" /> Активировать
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setToDelete(a)}
                            >
                              <Trash2 className="size-4" /> Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateAdminDialog open={creating} onClose={() => setCreating(false)} />
      <PermissionsDialog
        admin={permissionsOf}
        open={!!permissionsOf}
        onClose={() => setPermissionsOf(null)}
      />
      <ChangePasswordDialog
        admin={passwordOf}
        open={!!passwordOf}
        onClose={() => setPasswordOf(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Удалить администратора?"
        description={toDelete ? `${toDelete.name} (${toDelete.email}) будет удалён` : undefined}
        destructive
        loading={del.isPending}
        confirmText="Удалить"
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      />
      <ConfirmDialog
        open={!!toDeactivate}
        onOpenChange={(v) => !v && setToDeactivate(null)}
        title="Деактивировать аккаунт?"
        description={toDeactivate ? `${toDeactivate.name} потеряет доступ` : undefined}
        loading={deactivate.isPending}
        confirmText="Деактивировать"
        destructive
        onConfirm={() => {
          if (!toDeactivate) return;
          deactivate.mutate(toDeactivate.id, { onSuccess: () => setToDeactivate(null) });
        }}
      />
    </div>
  );
};

const CreateAdminDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const create = useCreateAdmin();
  const permsQuery = useAdminPermissions();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    storeSlug: "" as "" | StoreSlug,
    permissions: [] as string[],
  });

  useEffect(() => {
    if (!open) setForm({ name: "", email: "", password: "", storeSlug: "", permissions: [] });
  }, [open]);

  const permissionsList = permsQuery.data ?? ALL_PERMISSIONS;

  const togglePerm = (p: string) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый администратор</DialogTitle>
          <DialogDescription>Заполните данные и назначьте права</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Имя</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Пароль</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Магазин</Label>
            <Select
              value={form.storeSlug || "__none"}
              onValueChange={(v) => setForm({ ...form, storeSlug: v === "__none" ? "" : (v as StoreSlug) })}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Без магазина" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Глобально (без магазина)</SelectItem>
                {MARKETPLACE_STORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Разрешения</Label>
          <ScrollArea className="h-48 rounded-md border p-3">
            <div className="grid grid-cols-2 gap-2">
              {permissionsList.map((p) => (
                <label key={p} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 cursor-pointer">
                  <Checkbox checked={form.permissions.includes(p)} onCheckedChange={() => togglePerm(p)} />
                  <span className="text-xs font-mono">{p}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            onClick={() =>
              create.mutate(
                {
                  name: form.name,
                  email: form.email,
                  password: form.password,
                  storeSlug: form.storeSlug || null,
                  permissions: form.permissions,
                },
                { onSuccess: onClose }
              )
            }
            disabled={create.isPending}
          >
            {create.isPending && <Spinner className="size-4" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PermissionsDialog = ({
  admin,
  open,
  onClose,
}: {
  admin: Admin | null;
  open: boolean;
  onClose: () => void;
}) => {
  const update = useUpdateAdminPermissions();
  const permsQuery = useAdminPermissions();
  const [storeSlug, setStoreSlug] = useState<"" | StoreSlug>("");
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    if (admin) {
      setStoreSlug((admin.store as StoreSlug) ?? "");
      setPerms(admin.permissions);
    }
  }, [admin]);

  const list = permsQuery.data ?? ALL_PERMISSIONS;
  const toggle = (p: string) =>
    setPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Права: {admin.name}</DialogTitle>
          <DialogDescription>Настройка магазина и разрешений</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Магазин</Label>
            <Select value={storeSlug || "__none"} onValueChange={(v) => setStoreSlug(v === "__none" ? "" : (v as StoreSlug))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Глобально</SelectItem>
                {MARKETPLACE_STORES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Разрешения ({perms.length})</Label>
            <ScrollArea className="h-56 rounded-md border p-3">
              <div className="grid grid-cols-2 gap-2">
                {list.map((p) => (
                  <label key={p} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 cursor-pointer">
                    <Checkbox checked={perms.includes(p)} onCheckedChange={() => toggle(p)} />
                    <span className="text-xs font-mono">{p}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            onClick={() =>
              update.mutate(
                { id: admin.id, storeSlug: storeSlug || null, permissions: perms },
                { onSuccess: onClose }
              )
            }
            disabled={update.isPending}
          >
            {update.isPending && <Spinner className="size-4" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ChangePasswordDialog = ({ admin, open, onClose }: { admin: Admin | null; open: boolean; onClose: () => void }) => {
  const [pwd, setPwd] = useState("");
  const change = useChangeAdminPassword();
  useEffect(() => { if (!open) setPwd(""); }, [open]);

  if (!admin) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сбросить пароль: {admin.name}</DialogTitle>
          <DialogDescription>Новый пароль минимум 8 символов</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Новый пароль</Label>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            disabled={pwd.length < 8 || change.isPending}
            onClick={() => change.mutate({ id: admin.id, newPassword: pwd }, { onSuccess: onClose })}
          >
            {change.isPending && <Spinner className="size-4" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
