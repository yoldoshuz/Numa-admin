"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Loader } from "@/components/states/Loader";
import { ErrorState } from "@/components/states/Error";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-sites";
import type {
  SiteColorPalette,
  SiteFooterColumn,
  SiteSettingsUpdate,
  SiteSocialLink,
  StoreSlug,
} from "@/lib/types";

interface SiteSettingsPageProps {
  basePath: string;
  store: StoreSlug;
}

export const SiteSettingsPage = ({ basePath, store }: SiteSettingsPageProps) => {
  const { data, isLoading, isError, error, refetch } = useSiteSettings(store);
  const update = useUpdateSiteSettings(store);

  const [form, setForm] = useState<{
    branding: { logoUrl: string; faviconUrl: string; siteNameRu: string; siteNameUz: string; siteNameEn: string };
    colors: SiteColorPalette;
    typography: { headingFont: string; bodyFont: string; baseFontSize: number };
    contact: { phone: string; email: string; addressRu: string; addressUz: string; addressEn: string; workingHours: string };
    socialLinks: SiteSocialLink[];
    footerColumns: SiteFooterColumn[];
    copyrightRu: string;
    copyrightUz: string;
    copyrightEn: string;
    customHeadCode: string;
  }>({
    branding: { logoUrl: "", faviconUrl: "", siteNameRu: "", siteNameUz: "", siteNameEn: "" },
    colors: {},
    typography: { headingFont: "", bodyFont: "", baseFontSize: 16 },
    contact: { phone: "", email: "", addressRu: "", addressUz: "", addressEn: "", workingHours: "" },
    socialLinks: [],
    footerColumns: [],
    copyrightRu: "",
    copyrightUz: "",
    copyrightEn: "",
    customHeadCode: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        branding: {
          logoUrl: data.branding?.logoUrl ?? "",
          faviconUrl: data.branding?.faviconUrl ?? "",
          siteNameRu: data.branding?.siteName?.ru ?? "",
          siteNameUz: data.branding?.siteName?.uz ?? "",
          siteNameEn: data.branding?.siteName?.en ?? "",
        },
        colors: data.colors ?? {},
        typography: {
          headingFont: data.typography?.headingFont ?? "",
          bodyFont: data.typography?.bodyFont ?? "",
          baseFontSize: data.typography?.baseFontSize ?? 16,
        },
        contact: {
          phone: data.contact?.phone ?? "",
          email: data.contact?.email ?? "",
          addressRu: data.contact?.address?.ru ?? "",
          addressUz: data.contact?.address?.uz ?? "",
          addressEn: data.contact?.address?.en ?? "",
          workingHours: data.contact?.workingHours ?? "",
        },
        socialLinks: data.socialLinks ?? [],
        footerColumns: data.footer?.columns ?? [],
        copyrightRu: data.footer?.copyright?.ru ?? "",
        copyrightUz: data.footer?.copyright?.uz ?? "",
        copyrightEn: data.footer?.copyright?.en ?? "",
        customHeadCode: data.customHeadCode ?? "",
      });
    }
  }, [data]);

  if (isLoading) return <Loader variant="form" rows={6} />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const submit = () => {
    const payload: SiteSettingsUpdate = {
      branding: {
        logoUrl: form.branding.logoUrl || undefined,
        faviconUrl: form.branding.faviconUrl || undefined,
        siteName: {
          ru: form.branding.siteNameRu,
          uz: form.branding.siteNameUz,
          en: form.branding.siteNameEn,
        },
      },
      colors: form.colors,
      typography: {
        headingFont: form.typography.headingFont || undefined,
        bodyFont: form.typography.bodyFont || undefined,
        baseFontSize: form.typography.baseFontSize,
      },
      contact: {
        phone: form.contact.phone || undefined,
        email: form.contact.email || undefined,
        address: {
          ru: form.contact.addressRu,
          uz: form.contact.addressUz,
          en: form.contact.addressEn,
        },
        workingHours: form.contact.workingHours || undefined,
      },
      socialLinks: form.socialLinks,
      footer: {
        columns: form.footerColumns,
        copyright: {
          ru: form.copyrightRu,
          uz: form.copyrightUz,
          en: form.copyrightEn,
        },
      },
      customHeadCode: form.customHeadCode || null,
    };
    update.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Настройки сайта · ${store}`}
        description="Брендинг, цвета, типографика, контакты, навигация, футер"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={update.isPending}>
              {update.isPending ? <Spinner className="size-4" /> : <Save className="size-4" />}
              Сохранить
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${basePath}/site`}>
                <ArrowLeft className="size-4" />
                Назад
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Брендинг</TabsTrigger>
          <TabsTrigger value="theme">Тема</TabsTrigger>
          <TabsTrigger value="contact">Контакты</TabsTrigger>
          <TabsTrigger value="social">Соц. сети</TabsTrigger>
          <TabsTrigger value="footer">Футер</TabsTrigger>
          <TabsTrigger value="advanced">Доп.</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Лого и название</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={form.branding.logoUrl} onChange={(e) => setForm({ ...form, branding: { ...form.branding, logoUrl: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input value={form.branding.faviconUrl} onChange={(e) => setForm({ ...form, branding: { ...form.branding, faviconUrl: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Название (RU)</Label>
                <Input value={form.branding.siteNameRu} onChange={(e) => setForm({ ...form, branding: { ...form.branding, siteNameRu: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Название (UZ)</Label>
                <Input value={form.branding.siteNameUz} onChange={(e) => setForm({ ...form, branding: { ...form.branding, siteNameUz: e.target.value } })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Название (EN)</Label>
                <Input value={form.branding.siteNameEn} onChange={(e) => setForm({ ...form, branding: { ...form.branding, siteNameEn: e.target.value } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Цвета</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(["primary", "secondary", "accent", "background", "text"] as const).map((k) => (
                <div key={k} className="space-y-2">
                  <Label className="capitalize">{k}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      className="h-10 w-14 cursor-pointer p-1"
                      value={form.colors[k] || "#000000"}
                      onChange={(e) => setForm({ ...form, colors: { ...form.colors, [k]: e.target.value } })}
                    />
                    <Input
                      value={form.colors[k] || ""}
                      onChange={(e) => setForm({ ...form, colors: { ...form.colors, [k]: e.target.value } })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Типографика</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Heading font</Label>
                <Input value={form.typography.headingFont} onChange={(e) => setForm({ ...form, typography: { ...form.typography, headingFont: e.target.value } })} placeholder="Inter" />
              </div>
              <div className="space-y-2">
                <Label>Body font</Label>
                <Input value={form.typography.bodyFont} onChange={(e) => setForm({ ...form, typography: { ...form.typography, bodyFont: e.target.value } })} placeholder="Inter" />
              </div>
              <div className="space-y-2">
                <Label>Base font size</Label>
                <Input
                  type="number"
                  value={form.typography.baseFontSize}
                  onChange={(e) => setForm({ ...form, typography: { ...form.typography, baseFontSize: parseInt(e.target.value) || 16 } })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Контакты</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.contact.email} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Часы работы</Label>
                <Input value={form.contact.workingHours} onChange={(e) => setForm({ ...form, contact: { ...form.contact, workingHours: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Адрес (RU)</Label>
                <Input value={form.contact.addressRu} onChange={(e) => setForm({ ...form, contact: { ...form.contact, addressRu: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Адрес (UZ)</Label>
                <Input value={form.contact.addressUz} onChange={(e) => setForm({ ...form, contact: { ...form.contact, addressUz: e.target.value } })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Адрес (EN)</Label>
                <Input value={form.contact.addressEn} onChange={(e) => setForm({ ...form, contact: { ...form.contact, addressEn: e.target.value } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Социальные сети</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setForm({ ...form, socialLinks: [...form.socialLinks, { platform: "", url: "" }] })}
              >
                <Plus className="size-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.socialLinks.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Нет социальных ссылок
                </p>
              ) : (
                form.socialLinks.map((link, idx) => (
                  <div key={idx} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[150px_1fr_120px_auto]">
                    <Input
                      placeholder="instagram"
                      value={link.platform}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[idx] = { ...next[idx], platform: e.target.value };
                        setForm({ ...form, socialLinks: next });
                      }}
                    />
                    <Input
                      placeholder="https://…"
                      value={link.url}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[idx] = { ...next[idx], url: e.target.value };
                        setForm({ ...form, socialLinks: next });
                      }}
                    />
                    <Input
                      placeholder="icon"
                      value={link.icon ?? ""}
                      onChange={(e) => {
                        const next = [...form.socialLinks];
                        next[idx] = { ...next[idx], icon: e.target.value };
                        setForm({ ...form, socialLinks: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setForm({ ...form, socialLinks: form.socialLinks.filter((_, i) => i !== idx) })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Копирайт</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>RU</Label>
                <Input value={form.copyrightRu} onChange={(e) => setForm({ ...form, copyrightRu: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>UZ</Label>
                <Input value={form.copyrightUz} onChange={(e) => setForm({ ...form, copyrightUz: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>EN</Label>
                <Input value={form.copyrightEn} onChange={(e) => setForm({ ...form, copyrightEn: e.target.value })} />
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Колонки футера и навигация поддерживают сложную структуру — для удобного редактирования
            сейчас доступен только базовый JSON через API.
          </p>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Custom &lt;head&gt; код</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                rows={10}
                value={form.customHeadCode}
                onChange={(e) => setForm({ ...form, customHeadCode: e.target.value })}
                className="font-mono text-xs"
                placeholder="<!-- pixels, analytics, fonts -->"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Будет вставлен в &lt;head&gt; всех страниц. Лимит 5000 символов.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
