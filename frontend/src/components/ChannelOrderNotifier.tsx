import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { executeMutation, executeQuery, getDataConnect, mutationRef, queryRef } from "firebase/data-connect";
import { connectorConfig } from "@insightpad/dataconnect";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import { firebaseApp } from "../lib/firebase";
import { salesChannelProviderLabel, type SalesChannelProvider } from "../utils/salesChannels";

const dc = getDataConnect(firebaseApp, connectorConfig);
type PendingOrder = { id: string; displayCode: string; provider: SalesChannelProvider; authorizationStatus: string; branchName: string; customerName?: string | null; totalCents: string; receivedAt: string; version: number; items: { name: string; quantity: number; observation?: string | null }[] };
const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100);
const mutationApplied = (result: unknown) => Boolean((result as { data?: { _execute?: unknown } })?.data?._execute);

export function ChannelOrderNotifier() {
  const permission = useAuth().permissions.CANAIS_VENDA;
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const close = useCallback(() => { if (order) sessionStorage.setItem(`channel-order-seen:${order.id}`, String(order.version)); setOrder(null); setRejecting(false); setReason(""); setError(""); }, [order]);
  useDialogAccessibility(Boolean(order), close);
  const check = useCallback(async () => {
    if (!permission?.canAccess || document.visibilityState === "hidden") return;
    try {
      const result = await executeQuery(queryRef(dc, "LatestPendingSalesChannelOrder", { requestKey: crypto.randomUUID() }));
      const next = (((result.data as { _select?: { data?: PendingOrder }[] })._select ?? [])[0]?.data) ?? null;
      if (next && sessionStorage.getItem(`channel-order-seen:${next.id}`) !== String(next.version)) setOrder(next);
    } catch (caught) { console.error("Falha ao verificar novos pedidos", caught); }
  }, [permission?.canAccess]);
  useEffect(() => {
    const initial = window.setTimeout(() => void check(), 0);
    const timer = window.setInterval(() => void check(), 30_000);
    const onVisible = () => { if (document.visibilityState === "visible") void check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [check]);
  async function act(action: "ACCEPT" | "REJECT") {
    if (!order) return;
    setBusy(true); setError("");
    try {
      const result = await executeMutation(mutationRef(dc, "QueueSalesChannelOrderAction", { id: order.id, action, reason: action === "REJECT" ? reason.trim() : "", expectedVersion: order.version }));
      if (!mutationApplied(result)) throw new Error("Pedido indisponível");
      close();
    } catch (caught) { console.error(caught); setError("A solicitação não foi enviada. Abra a lista para conferir o pedido e a conexão."); void check(); }
    finally { setBusy(false); }
  }
  if (!order) return null;
  return <div className="catalog-backdrop channel-order-notification-backdrop"><section className="channel-order-notification" role="alertdialog" aria-modal="true" aria-label="Novo pedido recebido"><header><span className="material-symbols-rounded">notifications_active</span><div><small>Novo pedido · {salesChannelProviderLabel(order.provider)}</small><h2>Pedido #{order.displayCode}</h2><p>{order.branchName}{order.customerName ? ` · ${order.customerName}` : ""}</p></div><strong>{money(order.totalCents)}</strong></header><div className="channel-order-notification__items"><h3>Itens</h3>{order.items.map((item, index) => <article key={`${item.name}-${index}`}><strong>{item.quantity}×</strong><span>{item.name}{item.observation && <small>{item.observation}</small>}</span></article>)}</div>{error && <p className="channel-notification-error" role="alert">{error}</p>}{rejecting && <label className="channel-order-notification__reason"><span>Motivo da recusa</span><textarea autoFocus maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Informe pelo menos 5 caracteres" /></label>}<footer><Link to="/integracoes/canais/pedidos" onClick={close}>Ver detalhes</Link><button onClick={() => { if (rejecting) void act("REJECT"); else setRejecting(true); }} disabled={busy || (rejecting && reason.trim().length < 5)} className="catalog-action catalog-action--danger">{rejecting ? "Confirmar recusa" : "Recusar"}</button>{!rejecting && <button className="catalog-action catalog-action--success" onClick={() => void act("ACCEPT")} disabled={busy}>{busy ? "Enviando..." : "Solicitar aceite"}</button>}<button className="channel-notification-later" onClick={close} disabled={busy}>Agora não</button></footer><small className="channel-order-notification__security"><span className="material-symbols-rounded">sync_lock</span>O status mudará somente após confirmação do parceiro.</small></section></div>;
}
