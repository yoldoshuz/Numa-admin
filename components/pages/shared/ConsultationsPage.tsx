"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, Phone, Search, UserRound } from "lucide-react";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { Empty } from "@/components/states/Empty";
import { ConsultationStatusBadge } from "@/components/shared/StatusBadge";
import { StoreBadge } from "@/components/shared/StoreBadge";
import { DataPagination } from "@/components/shared/DataPagination";
import {
  useConsultations,
  useUpdateConsultation,
  type ConsultationsFilters,
} from "@/hooks/use-consultations";
import { useAuthStore } from "@/lib/auth-store";
import { CONSULTATION_STATUS_LABEL, STORES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Consultation, ConsultationStatus, StoreSlug } from "@/lib/types";

const STATUSES = Object.keys(CONSULTATION_STATUS_LABEL) as ConsultationStatus[];

interface ConsultationsPageProps {
  /** Only the super-admin sees requests from every site at once. */
  showStoreFilter?: boolean;
}

export const ConsultationsPage = ({ showStoreFilter = false }: ConsultationsPageProps) => {
  const [status, setStatus] = useState<ConsultationStatus | "all">("all");
  const [store, setStore] = useState<StoreSlug | "all">("all");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Consultation | null>(null);

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

  const filters: ConsultationsFilters = {
    page,
    limit: 20,
    status: status === "all" ? undefined : status,
    store: showStoreFilter && store !== "all" ? store : undefined,
    phone: phone || undefined,
  };

  const { data, isLoading, isError, error, refetch } = useConsultations(filters, canRead);

  if (!canRead) {
    return (
      <div className="space-y-5">
        <PageHeader title="Консультации" />
        <Empty
          icon={<MessageSquareText className="size-5" />}
          title="Нет доступа"
          description="Раздел доступен администраторам с правом users:read"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Консультации"
        description="Заявки на консультацию со всех сайтов — заявка автоматически уходит в Bitrix24"
      />

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
          {showStoreFilter && (
            <Select
              value={store}
              onValueChange={(v) => {
                setStore(v as StoreSlug | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Сайт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сайты</SelectItem>
                {STORES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader variant="table" rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data?.items?.length ? (
        <Empty
          icon={<MessageSquareText className="size-5" />}
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
                    <TableHead>Клиент</TableHead>
                    <TableHead>Телефон</TableHead>
                    {showStoreFilter && <TableHead>Сайт</TableHead>}
                    <TableHead>Проблема</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          {c.userId && (
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
                        <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                          <Phone className="size-3" />
                          {c.phone}
                        </span>
                      </TableCell>
                      {showStoreFilter && (
                        <TableCell>
                          <StoreBadge store={c.store} />
                        </TableCell>
                      )}
                      <TableCell className="max-w-sm">
                        <p className="truncate text-sm text-muted-foreground">{c.problem}</p>
                      </TableCell>
                      <TableCell>
                        <ConsultationStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(c.createdAt)}
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
        <ConsultationDialog
          key={selected.id}
          consultation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

const ConsultationDialog = ({
  consultation,
  onClose,
}: {
  consultation: Consultation;
  onClose: () => void;
}) => {
  // Subscribing to `admin` rather than calling `hasPermission()` keeps the
  // dialog in step with a session that finishes loading after the first render.
  const canWrite = useAuthStore(
    (s) =>
      s.admin?.role === "super_admin" ||
      (s.admin?.permissions.includes("users:write") ?? false),
  );
  const update = useUpdateConsultation();

  const [status, setStatus] = useState<ConsultationStatus>(consultation.status);
  const [comment, setComment] = useState(consultation.managerComment ?? "");

  const trimmed = comment.trim();
  const nextComment = trimmed === (consultation.managerComment ?? "") ? undefined : trimmed;
  const nextStatus = status === consultation.status ? undefined : status;
  const dirty = nextStatus !== undefined || nextComment !== undefined;

  const save = () => {
    update.mutate(
      {
        id: consultation.id,
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
          <DialogTitle className="flex items-center gap-2">
            {consultation.name}
            <StoreBadge store={consultation.store} />
          </DialogTitle>
          <DialogDescription>
            {consultation.phone} · {formatDate(consultation.createdAt)}
            {consultation.userId ? " · зарегистрированный клиент" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Описание проблемы</Label>
            <p className="max-h-56 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {consultation.problem}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="consultation-status" className="text-xs text-muted-foreground">
              Статус
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ConsultationStatus)}
              disabled={!canWrite}
            >
              <SelectTrigger id="consultation-status" className="w-full">
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
            <Label htmlFor="consultation-comment" className="text-xs text-muted-foreground">
              Комментарий менеджера
            </Label>
            <Textarea
              id="consultation-comment"
              rows={3}
              value={comment}
              disabled={!canWrite}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Созвонились, подобрали курс…"
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
