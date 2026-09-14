import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { getFunctions, httpsCallable } from "firebase/functions";
import { connectorConfig } from "@insightpad/dataconnect";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { salesChannelProviderLabel, type SalesChannelProvider } from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
const SOUND_PREFERENCE_KEY = "insightpad:channel-order-sound";
const SOUND_LEASE_PREFIX = "insightpad:channel-order-sound:";
type CancellationReason = { code: string; label: string };
const fetchCancellationReasons = httpsCallable<{ orderId: string }, { reasons: CancellationReason[] }>(getFunctions(firebaseApp, "southamerica-east1"), "ifoodCancellationReasons");
type PendingItem = { name: string; quantity: number; observation?: string | null; productId?: string | null; productName?: string | null; productUsable?: boolean; allowNegativeStock?: boolean; availableStock?: string | number };
type PendingOrder = { id: string; displayCode: string; provider: SalesChannelProvider; catalogProfile: "UNVERIFIED" | "RESTAURANT" | "GROCERY"; authorizationStatus: string; branchName: string; customerName?: string | null; totalCents: string; receivedAt: string; version: number; items: PendingItem[] };
const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100);
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
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(SOUND_PREFERENCE_KEY) !== "off");
  const audio = useRef<AudioContext | null>(null);
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
      const lastPlayed = Number(localStorage.getItem(leaseKey) ?? 0);
      if (Date.now() - lastPlayed < 8_000) return;
      localStorage.setItem(leaseKey, String(Date.now()));
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

  const close = useCallback(() => {
    if (order) sessionStorage.setItem(`channel-order-seen:${order.id}`, String(order.version));
    setOrder(null);
    setRejecting(false);
    setReason("");
    setReasonCode("");
    setReasons([]);
    setLoadingReasons(false);
    setError("");
  }, [order]);

  useDialogAccessibility(Boolean(order), close);

  const check = useCallback(async () => {
    if (!permission?.canUpdate) return;
    try {
      const result = await executeQuery(queryRef(dc, "LatestPendingSalesChannelOrder", { requestKey: crypto.randomUUID() }));
      const pending = (((result.data as { _select?: { data?: { orders?: PendingOrder[] } }[] })._select ?? [])[0]?.data?.orders) ?? [];
      const next = pending.find((item) => sessionStorage.getItem(`channel-order-seen:${item.id}`) !== String(item.version));
      setOrder((current) => current ?? next ?? null);
    } catch (caught) {
      console.error("Falha ao verificar novos pedidos", caught);
    }
  }, [permission?.canUpdate]);

  useEffect(() => {
    localStorage.setItem(SOUND_PREFERENCE_KEY, soundEnabled ? "on" : "off");
  }, [soundEnabled]);

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
    if (!order || !soundEnabled) return;
    void playAlert(order.id);
    const timer = window.setInterval(() => void playAlert(order.id), 25_000);
    return () => window.clearInterval(timer);
  }, [order, playAlert, soundEnabled]);

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
      close();
    } catch (caught) {
      console.error(caught);
      setError("A solicitação não foi enviada. Abra a lista para conferir o pedido, os vínculos de produto e a conexão.");
      void check();
    } finally {
      setBusy(false);
    }
  }

  if (!order) return null;
  const validRejection = reason.trim().length >= 5 && (order.provider !== "IFOOD" || reasons.some((item) => item.code === reasonCode));
  const acceptanceIssue = pendingAcceptanceIssue(order);

  return <div className="catalog-backdrop channel-order-notification-backdrop"><section className="channel-order-notification" role="alertdialog" aria-modal="true" aria-label="Novo pedido recebido">
    <header><span className="material-symbols-rounded">notifications_active</span><div><small>Novo pedido · {salesChannelProviderLabel(order.provider)}</small><h2>Pedido #{order.displayCode}</h2><p>{order.branchName}{order.customerName ? ` · ${order.customerName}` : ""}</p></div><strong>{money(order.totalCents)}</strong></header>
    <button className={`channel-notification-sound ${soundEnabled ? "active" : ""}`} type="button" onClick={() => void toggleSound()} aria-pressed={soundEnabled} title={soundEnabled ? "Desativar o alerta sonoro" : "Ativar e testar o alerta sonoro"}><span className="material-symbols-rounded">{soundEnabled ? "volume_up" : "volume_off"}</span>{soundEnabled ? "Som ativado" : "Ativar som"}</button>
    <div className="channel-order-notification__items"><h3>Itens</h3>{order.items.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.quantity}×</strong><span>{item.name}{item.observation && <small>{item.observation}</small>}</span></article>)}</div>
    {acceptanceIssue && !error && <p className="channel-notification-error" role="alert">{acceptanceIssue}</p>}
    {error && <p className="channel-notification-error" role="alert">{error}</p>}
    {rejecting && <label className="channel-order-notification__reason"><span>Motivo da recusa</span>{order.provider === "IFOOD" && <select value={reasonCode} disabled={loadingReasons || busy} onChange={(event) => { setReasonCode(event.target.value); setReason(reasons.find((item) => item.code === event.target.value)?.label ?? ""); }}><option value="">{loadingReasons ? "Consultando iFood..." : "Selecione o motivo"}</option>{reasons.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select>}<textarea autoFocus={order.provider !== "IFOOD"} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Informe pelo menos 5 caracteres" /></label>}
    <footer><Link to="/integracoes/canais/pedidos" onClick={close}>{order.catalogProfile === "GROCERY" ? "Abrir separação" : "Ver detalhes"}</Link><button onClick={() => { if (rejecting) void act("REJECT"); else void beginReject(); }} disabled={busy || loadingReasons || (rejecting && !validRejection)} className="catalog-action catalog-action--danger">{rejecting ? "Confirmar recusa" : "Recusar"}</button>{!rejecting && order.catalogProfile !== "GROCERY" && <button className="catalog-action catalog-action--success" onClick={() => void act("ACCEPT")} disabled={busy || Boolean(acceptanceIssue)} title={acceptanceIssue ?? undefined}>{busy ? "Enviando..." : "Aceitar pedido"}</button>}<button className="channel-notification-later" onClick={close} disabled={busy}>Dispensar alerta</button></footer>
    <small className="channel-order-notification__security"><span className="material-symbols-rounded">sync_lock</span>O alerta sonoro continua enquanto este aviso estiver aberto. O status muda somente após confirmação do parceiro.</small>
  </section></div>;
}
