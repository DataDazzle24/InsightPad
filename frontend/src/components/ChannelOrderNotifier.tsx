import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { getFunctions, httpsCallable } from "firebase/functions";
import { connectorConfig } from "@insightpad/dataconnect";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { selectCurrentChannelAlert } from "../utils/channelAlerts";
import { salesChannelProviderLabel, type SalesChannelProvider } from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
const SOUND_PREFERENCE_KEY = "insightpad:channel-order-sound";
const NOTIFICATION_PREFERENCE_KEY = "insightpad:channel-order-browser-notification";
const SOUND_LEASE_PREFIX = "insightpad:channel-order-sound:";
const POLL_LEASE_KEY = "insightpad:channel-order-poll-lease";
const storageGet = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Private mode may disable storage. */ } };
function cleanupExpiredSoundLeases() {
  try {
    const cutoff = Date.now() - 7 * 86_400_000;
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(SOUND_LEASE_PREFIX) && Number(localStorage.getItem(key) ?? 0) < cutoff) localStorage.removeItem(key);
    }
  } catch { /* Storage can be unavailable in private mode. */ }
}
type CancellationReason = { code: string; label: string };
const fetchCancellationReasons = httpsCallable<{ orderId: string }, { reasons: CancellationReason[] }>(getFunctions(firebaseApp, "southamerica-east1"), "ifoodCancellationReasons");
type PendingItem = { name: string; quantity: number; observation?: string | null; productId?: string | null; productName?: string | null; productUsable?: boolean; allowNegativeStock?: boolean; availableStock?: string | number };
type PendingOrder = { id: string; alertKind: "RECEPTION" | "PREPARATION"; displayCode: string; provider: SalesChannelProvider; catalogProfile: "UNVERIFIED" | "RESTAURANT" | "GROCERY"; authorizationStatus: string; branchName: string; customerName?: string | null; totalCents: string; receivedAt: string; scheduledAt?: string | null; preparationStartAt?: string | null; version: number; items: PendingItem[] };
const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100);
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "";
function pendingAcceptanceIssue(order: PendingOrder): string | null {
  if (order.catalogProfile === "UNVERIFIED") return "O tipo da loja ainda não foi validado. Abra a conexão antes de operar o pedido.";
  if (order.items.some((item) => !item.productId)) return "Existem itens sem vínculo com o estoque. Abra os detalhes antes de aceitar.";
  if (order.items.some((item) => !item.productUsable)) return "Há produto vinculado inativo ou indisponível. Corrija o cadastro antes de aceitar.";
  const required = new Map<string,{ quantity: number; available: number; allowNegative: boolean }>();
  order.items.forEach((item) => {
    if (!item.productId) return;
    const current = required.get(item.productId) ?? { quantity: 0, available: Number(item.availableStock ?? 0), allowNegative: Boolean(item.allowNegativeStock) };
    current.quantity += Number(item.quantity);
    required.set(item.productId,current);
  });
  return [...required.values()].some((item) => !item.allowNegative && item.available < item.quantity)
    ? "Estoque disponível insuficiente. Abra os detalhes para conferir."
    : null;
}
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);

export function ChannelOrderNotifier() {
  const permission = useAuth().permissions.CANAIS_VENDA;
  const navigate = useNavigate();
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => storageGet(SOUND_PREFERENCE_KEY) !== "off");
  const [browserNotifications, setBrowserNotifications] = useState(() => storageGet(NOTIFICATION_PREFERENCE_KEY) === "on");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const tabId = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [error, setError] = useState("");

  const ensureAudio = useCallback(async () => {
    if (!soundEnabled) return null;
    const context = audio.current ?? new AudioContext();
    audio.current = context;
    if (context.state === "suspended") await context.resume();
    return context;
  }, [soundEnabled]);

  const playAlert = useCallback(async (orderId?: string) => {
    if (!soundEnabled) return;
    if (orderId) {
      const leaseKey = `${SOUND_LEASE_PREFIX}${orderId}`;
      const lastPlayed = Number(storageGet(leaseKey) ?? 0);
      if (Date.now() - lastPlayed < 8_000) return;
      storageSet(leaseKey, String(Date.now()));
    }
    try {
      const context = await ensureAudio();
      if (!context) return;
      [880, 1174.66, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.24;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.21);
      });
    } catch (caught) {
      console.info("O navegador aguardará uma interação do usuário para liberar o som de pedidos.", caught);
    }
  }, [ensureAudio, soundEnabled]);

  const resetAlertState = useCallback(() => {
    setRejecting(false);
    setReason("");
    setReasonCode("");
    setReasons([]);
    setLoadingReasons(false);
    setError("");
  }, []);

  const dismissAlert = useCallback(async () => {
    if (!order || busy) return false;
    setBusy(true);
    setError("");
    try {
      const result = await executeMutation(mutationRef(dc, "AcknowledgeSalesChannelOrderAlert", { id: order.id, version: order.version, alertKind: order.alertKind }));
      if (!mutationApplied(result)) throw new Error("Alerta não confirmado");
      setOrder(null);
      resetAlertState();
      return true;
    } catch (caught) {
      console.error(caught);
      setError("Não foi possível confirmar a leitura deste alerta. Verifique sua conexão e tente novamente.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [busy, order, resetAlertState]);

  const closeActiveDialog = useCallback(() => {
    if (busy) return;
    if (order) void dismissAlert();
    else setSettingsOpen(false);
  }, [busy, dismissAlert, order]);

  useDialogAccessibility(Boolean(order) || settingsOpen, closeActiveDialog);

  const check = useCallback(async () => {
    if (!permission?.canUpdate) return;
    const now = Date.now();
    const [leaseOwner, leaseTime] = (storageGet(POLL_LEASE_KEY) ?? "").split(":");
    if (leaseOwner && leaseOwner !== tabId.current && now - Number(leaseTime || 0) < 20_000) return;
    storageSet(POLL_LEASE_KEY, `${tabId.current}:${now}`);
    try {
      const result = await executeQuery(queryRef(dc, "LatestPendingSalesChannelOrder", { requestKey: crypto.randomUUID() }));
      const pending = (((result.data as { _select?: { data?: { orders?: PendingOrder[] } }[] })._select ?? [])[0]?.data?.orders) ?? [];
      setOrder((current) => selectCurrentChannelAlert(current, pending));
    } catch (caught) {
      console.error("Falha ao verificar novos pedidos", caught);
    }
  }, [permission?.canUpdate]);

  useEffect(() => {
    storageSet(SOUND_PREFERENCE_KEY, soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  useEffect(() => {
    storageSet(NOTIFICATION_PREFERENCE_KEY, browserNotifications ? "on" : "off");
  }, [browserNotifications]);

  useEffect(() => { cleanupExpiredSoundLeases(); }, []);

  useEffect(() => {
    if (!soundEnabled) return;
    const prime = () => { void ensureAudio(); };
    document.addEventListener("pointerdown", prime, { passive: true });
    document.addEventListener("keydown", prime);
    return () => {
      document.removeEventListener("pointerdown", prime);
      document.removeEventListener("keydown", prime);
    };
  }, [ensureAudio, soundEnabled]);

  useEffect(() => () => { void audio.current?.close(); }, []);

  useEffect(() => {
    let stopped = false;
    let timer = 0;
    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        await check();
        if (!stopped) schedule(document.visibilityState === "visible" ? 15_000 : 60_000);
      }, delay);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule(0);
    };
    schedule(0);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  useEffect(() => {
    if (!order) return;
    if (soundEnabled) void playAlert(`${order.id}:${order.version}:${order.alertKind}`);
    if (browserNotifications && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
      const notification = new Notification(order.alertKind === "PREPARATION" ? `Hora de preparar #${order.displayCode}` : `Novo pedido #${order.displayCode}`, { body: `${order.branchName} · ${money(order.totalCents)} · ${order.scheduledAt ? dateTime(order.scheduledAt) : "preparo imediato"}`, tag: `ifood-order-${order.id}-${order.alertKind}` });
      notification.onclick = () => { window.focus(); notification.close(); };
    }
    if (!soundEnabled) return;
    const timer = window.setInterval(() => void playAlert(`${order.id}:${order.version}:${order.alertKind}`), 25_000);
    return () => window.clearInterval(timer);
  }, [browserNotifications, order, playAlert, soundEnabled]);

  async function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }
    try {
      const context = audio.current ?? new AudioContext();
      audio.current = context;
      if (context.state === "suspended") await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 1046.5;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
      setSoundEnabled(true);
    } catch (caught) {
      console.error("O navegador não liberou o teste de som.", caught);
      setError("O navegador bloqueou o som. Clique novamente em “Ativar som” depois de interagir com a página.");
    }
  }

  async function toggleBrowserNotifications() {
    if (browserNotifications) {
      setBrowserNotifications(false);
      return;
    }
    if (!("Notification" in window)) {
      setError("Este navegador não oferece notificações do sistema. O alerta visual e o som continuarão disponíveis.");
      return;
    }
    const permissionState = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permissionState !== "granted") {
      setBrowserNotifications(false);
      setError("As notificações estão bloqueadas no navegador. Libere o Insight Pad nas configurações do site e tente novamente.");
      return;
    }
    setBrowserNotifications(true);
    new Notification("Alertas do Insight Pad ativados", { body: "Este computador está pronto para avisar sobre pedidos enquanto o sistema estiver aberto.", tag: "insightpad-alert-test" });
  }

  async function beginReject() {
    if (!order) return;
    setRejecting(true);
    setError("");
    if (order.provider !== "IFOOD") return;
    setLoadingReasons(true);
    try {
      const result = await fetchCancellationReasons({ orderId: order.id });
      setReasons(result.data.reasons);
      if (!result.data.reasons.length) setError("O iFood não permite recusar este pedido no momento.");
    } catch (caught) {
      console.error(caught);
      setError("Não foi possível consultar os motivos disponíveis no iFood. Abra os detalhes e tente novamente.");
    } finally {
      setLoadingReasons(false);
    }
  }

  async function act(action: "ACCEPT" | "REJECT") {
    if (!order) return;
    if (action === "ACCEPT" && order.catalogProfile === "GROCERY") {
      setError("Pedidos Mercado exigem o módulo oficial de separação. Abra os detalhes para acompanhar o pedido.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await executeMutation(mutationRef(dc, "QueueSalesChannelOrderAction", { id: order.id, action, reason: action === "REJECT" ? reason.trim() : "", cancellationCode: action === "REJECT" ? reasonCode : "", expectedVersion: order.version }));
      if (!mutationApplied(result)) throw new Error("Pedido indisponível");
      setOrder(null);
      resetAlertState();
    } catch (caught) {
      console.error(caught);
      setError("A solicitação não foi enviada. Abra a lista para conferir o pedido, os vínculos de produto e a conexão.");
      void check();
    } finally {
      setBusy(false);
    }
  }

  if (!permission?.canUpdate) return null;
  if (!order && !settingsOpen) return <button className="channel-alert-readiness" type="button" onClick={() => { setError(""); setSettingsOpen(true); }} aria-label="Configurar e testar alertas de pedidos"><span className="material-symbols-rounded">notifications_active</span><span>Alertas de pedidos</span><i className={soundEnabled ? "is-ready" : ""} aria-hidden="true" /></button>;
  if (!order) return <div className="catalog-backdrop channel-order-notification-backdrop"><section className="channel-alert-settings" role="dialog" aria-modal="true" aria-labelledby="channel-alert-settings-title">
    <header><div><small>Pedidos integrados</small><h2 id="channel-alert-settings-title">Testar alertas</h2></div><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações"><span className="material-symbols-rounded">close</span></button></header>
    <p>Mantenha o Insight Pad aberto neste computador durante a operação. O alerta visual funciona na tela; som e notificação dependem da permissão deste navegador.</p>
    <div className="channel-alert-settings__option"><span className="material-symbols-rounded">volume_up</span><div><strong>Som de novo pedido</strong><small>{soundEnabled ? "Ativo e pronto neste navegador" : "Desativado neste navegador"}</small></div><button type="button" onClick={() => void toggleSound()}>{soundEnabled ? "Desativar" : "Ativar e testar"}</button></div>
    <div className="channel-alert-settings__option"><span className="material-symbols-rounded">desktop_windows</span><div><strong>Notificação do computador</strong><small>{browserNotifications && "Notification" in window && Notification.permission === "granted" ? "Ativa enquanto o sistema estiver aberto" : "Opcional; útil quando outra aba estiver em uso"}</small></div><button type="button" onClick={() => void toggleBrowserNotifications()}>{browserNotifications ? "Desativar" : "Ativar e testar"}</button></div>
    {error && <p className="channel-notification-error" role="alert">{error}</p>}
    <footer><button type="button" onClick={() => void check()}>Verificar pedidos agora</button><button className="catalog-action catalog-action--primary" type="button" onClick={() => setSettingsOpen(false)}>Concluir</button></footer>
  </section></div>;
  const validRejection = reason.trim().length >= 5 && (order.provider !== "IFOOD" || reasons.some((item) => item.code === reasonCode));
  const preparationReminder = order.alertKind === "PREPARATION";
  const acceptanceIssue = preparationReminder ? null : pendingAcceptanceIssue(order);
  const scheduledLabel = order.scheduledAt ? `Agendado para ${dateTime(order.scheduledAt)}` : "Pedido para preparo imediato";

  return <div className="catalog-backdrop channel-order-notification-backdrop"><section className="channel-order-notification" role="alertdialog" aria-modal="true" aria-label={preparationReminder ? "Lembrete de preparo do pedido" : "Novo pedido recebido"}>
    <header><span className="material-symbols-rounded">{preparationReminder ? "skillet" : "notifications_active"}</span><div><small>{preparationReminder ? "Hora de iniciar o preparo" : "Novo pedido"} · {salesChannelProviderLabel(order.provider)}</small><h2>Pedido #{order.displayCode}</h2><p>{order.branchName}{order.customerName ? ` · ${order.customerName}` : ""}</p><p><strong>{scheduledLabel}</strong>{order.preparationStartAt ? ` · iniciar preparo em ${dateTime(order.preparationStartAt)}` : ""}</p></div><strong>{money(order.totalCents)}</strong></header>
    <button className={`channel-notification-sound ${soundEnabled ? "active" : ""}`} type="button" onClick={() => void toggleSound()} aria-pressed={soundEnabled} title={soundEnabled ? "Desativar o alerta sonoro" : "Ativar e testar o alerta sonoro"}><span className="material-symbols-rounded">{soundEnabled ? "volume_up" : "volume_off"}</span>{soundEnabled ? "Som ativado" : "Ativar som"}</button>
    <div className="channel-order-notification__items"><h3>Itens</h3>{order.items.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.quantity}×</strong><span>{item.name}{item.observation && <small>{item.observation}</small>}</span></article>)}</div>
    {acceptanceIssue && !error && <p className="channel-notification-error" role="alert">{acceptanceIssue}</p>}
    {error && <p className="channel-notification-error" role="alert">{error}</p>}
    {rejecting && <label className="channel-order-notification__reason"><span>Motivo da recusa</span>{order.provider === "IFOOD" && <select value={reasonCode} disabled={loadingReasons || busy} onChange={(event) => { setReasonCode(event.target.value); setReason(reasons.find((item) => item.code === event.target.value)?.label ?? ""); }}><option value="">{loadingReasons ? "Consultando iFood..." : "Selecione o motivo"}</option>{reasons.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select>}<textarea autoFocus={order.provider !== "IFOOD"} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Informe pelo menos 5 caracteres" /></label>}
    <footer><button type="button" className="channel-notification-details" onClick={async () => { if (await dismissAlert()) navigate("/integracoes/canais/pedidos"); }}>{order.catalogProfile === "GROCERY" ? "Abrir separação" : "Ver detalhes"}</button>{!preparationReminder && <><button onClick={() => { if (rejecting) void act("REJECT"); else void beginReject(); }} disabled={busy || loadingReasons || (rejecting && !validRejection)} className="catalog-action catalog-action--danger">{rejecting ? "Confirmar recusa" : "Recusar"}</button>{!rejecting && order.catalogProfile !== "GROCERY" && <button className="catalog-action catalog-action--success" onClick={() => void act("ACCEPT")} disabled={busy || Boolean(acceptanceIssue)} title={acceptanceIssue ?? undefined}>{busy ? "Enviando..." : "Aceitar pedido"}</button>}</>}<button className="channel-notification-later" onClick={() => void dismissAlert()} disabled={busy}>{preparationReminder ? "Confirmar lembrete" : "Dispensar alerta"}</button></footer>
    <small className="channel-order-notification__security"><span className="material-symbols-rounded">sync_lock</span>{preparationReminder ? "Este lembrete não altera o status do pedido." : "O alerta sonoro continua enquanto este aviso estiver aberto. O status muda somente após confirmação do parceiro."}</small>
  </section></div>;
}
