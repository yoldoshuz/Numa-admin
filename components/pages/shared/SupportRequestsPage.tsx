"use client";

import { useEffect, useState } from "react";
import { MapPin, PhoneCall, Search, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { ConsultationStatusBadge } from "@/components/shared/StatusBadge";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { DataPagination } from "@/components/shared/DataPagination";
import {
  useSupportRequests,
  useUpdateSupportRequest,
  type SupportRequestsFilters,
} from "@/hooks/use-support-requests";
import { useAuthStore } from "@/lib/auth-store";
import { CONSULTATION_STATUS_LABEL, STORES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ConsultationStatus, StoreSlug, SupportRequest } from "@/lib/types";

const STATUSES = Object.keys(CONSULTATION_STATUS_LABEL) as ConsultationStatus[];

interface SupportRequestsPageProps {
  /** Only the super-admin sees numbers from every site at once. */
  showStoreFilter?: boolean;
}

export const SupportRequestsPage = ({
  showStoreFilter = false,
}: SupportRequestsPageProps) => {
  const [status, setStatus] = useState<ConsultationStatus | "all">("all");
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SupportRequest | null>(null);

  // The sidebar already hides the link, but a typed-in URL would otherwise
  // render a table that can only ever answer 403.
  const canRead = useAuthStore(
    (s) =>
      s.admin?.role === "super_admin" ||
      (s.admin?.permissions.includes("users:read") ?? false),
  );

  // The phone filter is applied by the backend, so it waits for a pause in
  // typing rather than firing a request per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setPhone(phoneInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(id);
  }, [phoneInput]);

  const filters: SupportRequestsFilters = {
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    store: showStoreFilter && store !== "all" ? store : undefined,
    phone: phone || undefined,
  };

  const { data, isLoading, isError, error, refetch } = useSupportRequests(filters, canRead);

  if (!canRead) {
    return (
      <div className="space-y-5">
        <PageHeader title="Обратный звонок" />
        <Empty
          icon={<PhoneCall className="size-5" />}
          title="Нет доступа"
          description="Раздел доступен администраторам с правом users:read"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Обратный звонок"
        description="Номера, оставленные под кнопкой «BOG'LANISH» — без описания проблемы, звоним и знакомимся"
      />

      {/*
        Stores are tabs for the same reason as in the catalogue: one form
        stands on four storefronts, and "с какого сайта пришёл номер" is the
        first thing the manager needs before dialling.
      */}
      {showStoreFilter && (
        <Tabs
          value={store}
          onValueChange={(v) => {
            setStore(v as StoreSlug | "all");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">Все сайты</TabsTrigger>
            {STORES.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру телефона…"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as ConsultationStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONSULTATION_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.items?.length ? (
        <Empty
          icon={<PhoneCall className="size-5" />}
          title="Заявок не найдено"
          description="Попробуйте снять фильтры или изменить поиск"
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    {showStoreFilter && <TableHead>Сайт</TableHead>}
                    <TableHead>Телефон</TableHead>
                    <TableHead>Город</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Комментарий менеджера</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </TableCell>
                      {showStoreFilter && (
                        <TableCell>
                          <StoreBadge store={r.store} />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{r.phone}</span>
                          {r.userId && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-0 bg-primary/10 text-[10px] font-normal text-primary"
                            >
                              <UserRound className="size-3" />
                              клиент
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Guessed from the IP, so it reads as a hint. */}
                        {r.city ? (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {r.city}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ConsultationStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {r.managerComment ? (
                          <p className="truncate text-sm text-muted-foreground">
                            {r.managerComment}
                          </p>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <DataPagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onChange={setPage}
          />
        </>
      )}

      {/* Keyed by id so reopening on another request starts from its own
          values instead of the previous one's half-finished edits. */}
      {selected && (
        <SupportRequestDialog
          key={selected.id}
          request={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

const SupportRequestDialog = ({
  request,
  onClose,
}: {
  request: SupportRequest;
  onClose: () => void;
}) => {
  // Subscribing to `admin` rather than calling `hasPermission()` keeps the
  // dialog in step with a session that finishes loading after the first render.
  const canWrite = useAuthStore(
    (s) =>
      s.admin?.role === "super_admin" ||
      (s.admin?.permissions.includes("users:write") ?? false),
  );
  const update = useUpdateSupportRequest();

  const [status, setStatus] = useState<ConsultationStatus>(request.status);
  const [comment, setComment] = useState(request.managerComment ?? "");

  const trimmed = comment.trim();
  const nextComment = trimmed === (request.managerComment ?? "") ? undefined : trimmed;
  const nextStatus = status === request.status ? undefined : status;
  const dirty = nextStatus !== undefined || nextComment !== undefined;

  const save = () => {
    update.mutate(
      {
        id: request.id,
        status: nextStatus,
        // An emptied field is a deliberate reset, and `null` is how the API
        // takes it — an empty string would fail validation.
        ...(nextComment !== undefined
          ? { managerComment: nextComment === "" ? null : nextComment }
          : {}),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            {request.phone}
            <StoreBadge store={request.store} />
          </DialogTitle>
          <DialogDescription>
            {formatDate(request.createdAt)}
            {/* Determined from the IP — accurate on a wired connection, and
                always "Ташкент" for a mobile subscriber wherever they are. */}
            {request.city ? ` · ${request.city}` : ""}
            {request.userId ? " · зарегистрированный клиент" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="support-status" className="text-xs text-muted-foreground">
              Статус
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ConsultationStatus)}
              disabled={!canWrite}
            >
              <SelectTrigger id="support-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CONSULTATION_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="support-comment" className="text-xs text-muted-foreground">
              Комментарий менеджера
            </Label>
            <Textarea
              id="support-comment"
              rows={3}
              value={comment}
              maxLength={4000}
              disabled={!canWrite}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дозвонились, консультацию провели…"
            />
          </div>

          {!canWrite && (
            <p className="text-xs text-muted-foreground">
              Для изменения статуса нужно право <code>users:write</code>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button onClick={save} disabled={!canWrite || !dirty || update.isPending}>
            {update.isPending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
