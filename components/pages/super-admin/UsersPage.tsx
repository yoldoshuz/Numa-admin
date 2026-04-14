"use client";

import { useState } from "react";
import { Users, MoreHorizontal, Shield, ShieldOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { DataPagination } from "@/components/shared/DataPagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useUsers, useActivateUser, useDeactivateUser } from "@/hooks/use-users";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";

export const UsersPage = () => {
  const [isActive, setIsActive] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useUsers({
    page,
    limit: 20,
    isActive: isActive === "all" ? undefined : isActive === "true",
  });

  const activate = useActivateUser();
  const deactivate = useDeactivateUser();
  const [toDeactivate, setToDeactivate] = useState<User | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Клиенты" description="Зарегистрированные покупатели по всем магазинам" />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Select value={isActive} onValueChange={(v) => { setIsActive(v as typeof isActive); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="true">Активные</SelectItem>
              <SelectItem value="false">Отключённые</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.users?.length ? (
        <Empty icon={<Users className="size-5" />} title="Клиенты не найдены" />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Регистрация</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => {
                    const initials = `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium">
                              {u.firstName} {u.lastName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{u.phone}</TableCell>
                        <TableCell>
                          {u.isActive ?? true ? (
                            <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300">Активен</Badge>
                          ) : (
                            <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">Отключён</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.isActive === false ? (
                                <DropdownMenuItem onClick={() => activate.mutate(u.id)}>
                                  <Shield className="size-4" />
                                  Активировать
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setToDeactivate(u)}>
                                  <ShieldOff className="size-4" />
                                  Деактивировать
                                </DropdownMenuItem>
                              )}
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
          <DataPagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!toDeactivate}
        onOpenChange={(v) => !v && setToDeactivate(null)}
        title="Деактивировать клиента?"
        description={toDeactivate ? `${toDeactivate.firstName} ${toDeactivate.lastName} потеряет доступ` : undefined}
        loading={deactivate.isPending}
        destructive
        confirmText="Деактивировать"
        onConfirm={() => {
          if (!toDeactivate) return;
          deactivate.mutate(toDeactivate.id, { onSuccess: () => setToDeactivate(null) });
        }}
      />
    </div>
  );
};
