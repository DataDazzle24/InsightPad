import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { getDataConnect } from "firebase/data-connect";
import { Link } from "react-router-dom";
import {
  connectorConfig,
  ensureSalesDefaults,
  postSale,
  requestPosSaleApproval,
  posSaleApprovalStatus,
  saleDetails,
  salesWorkspace,
  searchPosProducts,
  searchPosCustomers,
  posProductBranches,
} from "@insightpad/dataconnect";
import { firebaseApp } from "../lib/firebase";
import { useAuth } from "../auth/useAuth";
import { useDialogAccessibility } from "../hooks/useDialogAccessibility";
import {
  AppLoading,
  AppToast,
  BarcodeScanner,
  type Notice,
} from "../components/SalesUi";
import { PosApprovalsModal } from "../components/PosApprovalsModal";
import { CashSessionModal, type PosPolicy } from "../components/CashSessionModal";
import {
  cents,
  lineTotal,
  money,
  quantity,
  saleTotals,
  upsertCart,
  validateCheckout,
  type CartItem,
  type PaymentInput,
} from "../utils/sales";
import {
  canRetryPendingSale,
  definitiveSaleFailure,
  retryPendingSale,
  type PendingSale,
  markPendingFailure,
  pendingSales,
  queueSale,
  removePendingSale,
  type OfflineOwner,
} from "../utils/salesOffline";
import { serverReceipt as confirmedReceipt } from "../utils/serverReceipt";
import { printSaleReceipt, type SaleReceipt } from "../utils/receipt";

const dc = getDataConnect(firebaseApp, connectorConfig);
type Branch = {
  id: string;
  name: string;
  internalCode?: string;
  postalCode?: string;
  stateCode?: string;
  city?: string;
  district?: string;
  street?: string;
  streetNumber?: string;
  addressComplement?: string;
  phone?: string;
};
type Customer = {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
};
type Method = {
  id: string;
  code: string;
  name: string;
  requiresChange: boolean;
};
type Product = {
  id: string;
  name: string;
  internalCode?: string;
  ean?: string;
  weightedProduct: boolean;
  bundleProduct: boolean;
  allowNegativeStock: boolean;
  listPriceCents: string;
  effectivePriceCents: string;
  costPriceCents: string;
  stock: number;
  stockByBranches: Array<{
    branchId: string;
    branchName: string;
    quantity: number;
  }>;
};
type Workspace = {
  tenant?: {
    legalName: string;
    tradeName?: string;
    document?: string;
    email?: string;
    phone?: string;
  };
  policy?: PosPolicy;
  branches: Branch[];
  customers: Customer[];
  paymentMethods: Method[];
  products: Product[];
  openSession?: {
    id: string;
    openedAt: string;
    openingAmountCents: string;
    expectedAmountCents: string;
    movementCount: number;
  } | null;
};
const empty: Workspace = {
  branches: [],
  customers: [],
  paymentMethods: [],
  products: [],
};

export function PointOfSalePage() {
  const { permissions, profile, firebaseUser } = useAuth(),
    permission = permissions.CAIXA,
    offlineOwner = useMemo<OfflineOwner>(
      () => ({
        uid: firebaseUser?.uid ?? "",
        tenantId: profile?.tenant.id ?? "",
      }),
      [firebaseUser?.uid, profile?.tenant.id],
    ),
    branchStorageKey = `insightpad.sale.branch:${profile?.tenant.id ?? "unknown"}:${firebaseUser?.uid ?? "unknown"}`;
  const [workspace, setWorkspace] = useState<Workspace>(empty),
    [loadedBranchId, setLoadedBranchId] = useState<string | null>(null),
    [branchId, setBranchId] = useState(
      () => localStorage.getItem(branchStorageKey) ?? "",
    ),
    [cart, setCart] = useState<CartItem[]>([]),
    [term, setTerm] = useState(""),
    [qty, setQty] = useState(1),
    [selectedId, setSelectedId] = useState(""),
    [busy, setBusy] = useState(true),
    [notice, setNotice] = useState(""),
    [checkout, setCheckout] = useState(false),
    [customerId, setCustomerId] = useState(""),
    [discount, setDiscount] = useState(""),
    [surcharge, setSurcharge] = useState(""),
    [payments, setPayments] = useState<PaymentInput[]>([
      { paymentMethodId: "", amountCents: 0, sequence: 1 },
    ]),
    [pendingRows, setPendingRows] = useState<PendingSale[]>([]),
    [queueOpen, setQueueOpen] = useState(false),
    [approvalsOpen, setApprovalsOpen] = useState(false),
    [syncing, setSyncing] = useState(false),
    [customerTerm, setCustomerTerm] = useState(""),
    [customerOffset, setCustomerOffset] = useState(0),
    [customerMore, setCustomerMore] = useState(false),
    [customerBusy, setCustomerBusy] = useState(false),
    [productOffset, setProductOffset] = useState(0),
    [productMore, setProductMore] = useState(false),
    [productBusy, setProductBusy] = useState(false),
    [loadedTerm, setLoadedTerm] = useState(""),
    [chosenProduct, setChosenProduct] = useState<Product | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [stockProduct, setStockProduct] = useState<Product | null>(null),
    [confirmClear, setConfirmClear] = useState(false),
    [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null),
    [receiptPrompt, setReceiptPrompt] = useState(false),
    [cashControl, setCashControl] = useState(false),
    [cashPromptedBranch, setCashPromptedBranch] = useState(""),
    [correctionId, setCorrectionId] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [scanner, setScanner] = useState(false),
    [clock, setClock] = useState(() => new Date());
  const searchRef = useRef<HTMLInputElement>(null),
    searchBoxRef = useRef<HTMLDivElement>(null),
    previousCheckoutTotal = useRef(0),
    productRequest = useRef(0),
    workspaceRequest = useRef(0),
    syncInFlight = useRef(false),
    finishInFlight = useRef(false),
    ownerRef = useRef(offlineOwner);
  useEffect(() => { ownerRef.current = offlineOwner }, [offlineOwner]);
  const pending = pendingRows.length;
  useDialogAccessibility(checkout, () => { if (!finishInFlight.current) setCheckout(false) });
  useDialogAccessibility(receiptPrompt, () => setReceiptPrompt(false));
  useDialogAccessibility(queueOpen, () => { if (!syncInFlight.current) setQueueOpen(false) });
  useDialogAccessibility(Boolean(stockProduct), () => setStockProduct(null));
  useDialogAccessibility(confirmClear, () => setConfirmClear(false));
  const load = useCallback(async () => {
    const request = ++workspaceRequest.current;
    setBusy(true);
    try {
      await ensureSalesDefaults(dc);
      const result = await salesWorkspace(dc, {
        branchId: branchId || null,
        requestKey: crypto.randomUUID(),
      });
      const data =
        ((result.data._select ?? [])[0] as { data?: Workspace } | undefined)
          ?.data ?? empty;
      if (request !== workspaceRequest.current) return;
      setWorkspace(current => ({...data, products: current.products}));
      setLoadedBranchId(branchId);
      if (branchId && !data.branches.some(branch => branch.id === branchId)) {
        setBranchId(""); setCart([]); setChosenProduct(null);
      }
      if (!branchId && data.branches.length === 1)
        setBranchId(data.branches[0].id);
    } catch (error) {
      if (request !== workspaceRequest.current) return;
      console.error(error);
      setNotice(
        "Não foi possível carregar o caixa. Verifique sua conexão e permissão.",
      );
    } finally {
      if (request === workspaceRequest.current) setBusy(false);
    }
  }, [branchId]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    localStorage.setItem(branchStorageKey, branchId);
  }, [branchId, branchStorageKey]);
  useEffect(() => {
    if (!busy && loadedBranchId === branchId && workspace.branches.some(branch => branch.id === branchId) && !workspace.openSession && cashPromptedBranch !== branchId) {
      const timer = window.setTimeout(() => {
        setCashPromptedBranch(branchId);
        setCashControl(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [branchId, loadedBranchId, busy, cashPromptedBranch, workspace.openSession, workspace.branches]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (offlineOwner.uid && offlineOwner.tenantId)
      void pendingSales(offlineOwner).then(setPendingRows).catch(() => setNotice("Não foi possível ler a fila local. As vendas não foram apagadas."));
  }, [offlineOwner]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!searchBoxRef.current?.contains(event.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const searchProducts = useCallback(async (search: string, offset = 0) => {
    if (!branchId || !navigator.onLine) return [] as Product[];
    const request = ++productRequest.current;
    setProductBusy(true);
    try {
      const result = await searchPosProducts(dc, { branchId, search: search.trim(), limit: 31, offset, requestKey: crypto.randomUUID() });
      const rows = (result.data._select ?? []) as Product[];
      if (request !== productRequest.current) return [] as Product[];
      const page = rows.slice(0, 30).map(product => ({ ...product, stockByBranches: [] }));
      setWorkspace(current => ({...current, products: offset ? [...current.products, ...page] : page}));
      setLoadedTerm(search); setProductMore(rows.length > 30); setProductOffset(offset);
      return page;
    } catch {
      if (request === productRequest.current) setNotice("Não foi possível buscar produtos. Verifique a conexão.");
      return [] as Product[];
    } finally { if (request === productRequest.current) setProductBusy(false) }
  }, [branchId]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void searchProducts(term) }, 250);
    return () => { window.clearTimeout(timer) };
  }, [term, searchProducts]);
  useEffect(() => {
    if (!checkout || !navigator.onLine) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      setCustomerBusy(true);
      try {
        const result = await searchPosCustomers(dc, { search: customerTerm.trim(), limit: 31, offset: customerOffset, requestKey: crypto.randomUUID() });
        if (!current) return;
        const rows = (result.data._select ?? []) as Customer[];
        setWorkspace(data => ({...data, customers: customerOffset ? [...data.customers, ...rows.slice(0,30)] : rows.slice(0,30)}));
        setCustomerMore(rows.length > 30);
      } catch { if(current) setNotice("Não foi possível buscar clientes.") }
      finally { if(current) setCustomerBusy(false) }
    }, 250);
    return () => { current = false; window.clearTimeout(timer) };
  }, [checkout, customerTerm, customerOffset]);
  const filtered = useMemo(() => {
    if (online && loadedTerm !== term) return [];
    const q = term.trim().toLocaleLowerCase("pt-BR");
    return workspace.products.filter(product => !q || [product.name, product.ean, product.internalCode].some(value => value?.toLocaleLowerCase("pt-BR").includes(q)));
  }, [term, loadedTerm, online, workspace.products]);
  useEffect(() => {
    if (busy || correctionId) return;
    const raw = sessionStorage.getItem("insightpad.sale.correction");
    if (!raw) return;
    sessionStorage.removeItem("insightpad.sale.correction");
    const saleId = String(
      (JSON.parse(raw) as { saleId?: string }).saleId ?? "",
    );
    if (!saleId) return;
    void saleDetails(dc, { saleId, requestKey: crypto.randomUUID() })
      .then((result) => {
        const box = (
          (result.data._select ?? [])[0] as {
            data?: {
              sale: Record<string, unknown>;
              items: Array<Record<string, unknown>>;
              payments: Array<Record<string, unknown>>;
            };
          }
        )?.data;
        if (!box || box.sale.status !== "COMPLETED" || box.sale.source === "IFOOD") throw new Error("Venda indisponível para correção.");
        setCorrectionId(saleId);
        setBranchId(String(box.sale.branch_id ?? ""));
        setCustomerId(String(box.sale.customer_id ?? ""));
        setDiscount(money(Number(box.sale.discount_cents ?? 0)));
        setSurcharge(money(Number(box.sale.surcharge_cents ?? 0)));
        setCart(box.items.map(item => ({
          productId: String(item.productId), name: String(item.productName), quantity: Number(item.quantity),
          unitPriceCents: Number(item.unitSalePriceCents), listPriceCents: Number(item.unitListPriceCents), costPriceCents: Number(item.unitCostCents),
          weightedProduct: item.weightedProduct === true, bundleProduct: item.bundleProduct === true,
          stock: Number(item.availableStock ?? item.quantity), allowNegativeStock: item.allowNegativeStock === true && item.bundleProduct !== true,
        })));
        setPayments(
          box.payments.map((p, index) => ({
            paymentMethodId: String(p.paymentMethodId),
            amountCents: Number(p.amountCents),
            sequence: index + 1,
            externalReference: String(p.externalReference ?? ""),
          })),
        );
        setNotice(
          "Venda carregada para correção. Ao concluir, a original será cancelada e o estoque recalculado.",
        );
      })
      .catch(() =>
        setNotice("Não foi possível carregar a venda para correção."),
      );
  }, [busy, correctionId]);
  const selected =
      chosenProduct ?? filtered.find(p => p.id === selectedId) ?? (searchOpen ? filtered[0] : undefined),
    totals = saleTotals(cart, cents(discount), cents(surcharge)),
    paid = payments.reduce((sum, p) => sum + p.amountCents, 0),
    change = Math.max(0, paid - totals.totalCents),
    remaining = Math.max(0, totals.totalCents - paid);
  function setPaymentAmount(index: number, amountCents: number) {
    setPayments((current) => {
      const next = current.map((payment, i) =>
        i === index ? { ...payment, amountCents } : payment,
      );
      if (next.length === 2) {
        const other = index === 0 ? 1 : 0;
        next[other] = {
          ...next[other],
          amountCents: Math.max(0, totals.totalCents - amountCents),
        };
      }
      return next;
    });
  }
  const toast: Notice | null = notice
    ? {
        text: notice,
        type: /sucesso|concluída|concluído|atualizado|sincronizad|salva com segurança/i.test(
          notice,
        )
          ? "success"
          : /não foi|insuficiente|inválid|rejeitad|erro|faltam|verifique/i.test(
                notice,
              )
            ? "error"
            : "info",
      }
    : null;
  function add(product = selected) {
    if (!branchId) {
      setNotice("Selecione a filial antes de iniciar a venda.");
      return;
    }
    if (!product) {
      setNotice("Localize e selecione um produto.");
      return;
    }
    const q = quantity(qty, product.weightedProduct);
    if (q <= 0) {
      setNotice("Informe uma quantidade maior que zero.");
      return;
    }
    if (
      (!product.allowNegativeStock || product.bundleProduct) &&
      product.stock < q
    ) {
      setNotice(
        `Saldo insuficiente: existem ${product.stock} unidade(s) nesta filial.`,
      );
      return;
    }
    setCart((current) =>
      upsertCart(current, {
        productId: product.id,
        name: product.name,
        quantity: q,
        unitPriceCents: Number(product.effectivePriceCents),
        listPriceCents: Number(product.listPriceCents),
        costPriceCents: Number(product.costPriceCents),
        weightedProduct: product.weightedProduct,
        bundleProduct: product.bundleProduct,
        stock: Number(product.stock),
        allowNegativeStock: product.allowNegativeStock && !product.bundleProduct,
      }),
    );
    setTerm("");
    setSelectedId("");
    setChosenProduct(null);
    setQty(1);
    requestAnimationFrame(() => searchRef.current?.focus());
  }
  function openCheckout() {
    if (busy || loadedBranchId !== branchId || finishInFlight.current || !permission?.canCreate) return;
    if (!cart.length) {
      setNotice("Adicione produtos antes de seguir para o pagamento.");
      return;
    }
    if (workspace.policy?.requireOpenSession !== false && !workspace.openSession) {
      setNotice("Abra seu caixa nesta filial antes de concluir a venda."); setCashControl(true); return;
    }
    const first = workspace.paymentMethods[0];
    setPayments([
      {
        paymentMethodId: first?.id ?? "",
        amountCents: totals.totalCents,
        sequence: 1,
      },
    ]);
    previousCheckoutTotal.current = totals.totalCents;
    setCheckout(true);
  }
  useEffect(() => {
    if (!checkout) return;
    const delta = totals.totalCents - previousCheckoutTotal.current;
    if (!delta) return;
    previousCheckoutTotal.current = totals.totalCents;
    setPayments((rows) => rows.map((row,index) => index === rows.length - 1 ? {...row,amountCents:Math.max(0,row.amountCents+delta)} : row));
  }, [checkout, totals.totalCents]);
  useEffect(() => {
    const shortcuts=(event:KeyboardEvent)=>{
      if (finishInFlight.current || checkout || cashControl || scanner || stockProduct || confirmClear || receiptPrompt || queueOpen || approvalsOpen) return;
      if(event.key==='F2'){event.preventDefault();searchRef.current?.focus();setSearchOpen(true)}
      else if(event.key==='F4'){event.preventDefault();openCheckout()}
      else if(event.key==='F6'){event.preventDefault();setScanner(true)}
      else if(event.key==='F8'){event.preventDefault();if(branchId)setCashControl(true)}
      else if(event.key==='Escape'){setSearchOpen(false)}
    };
    window.addEventListener('keydown',shortcuts);
    return()=>window.removeEventListener('keydown',shortcuts);
  });
  const sync = useCallback(async () => {
    if (!navigator.onLine || !offlineOwner.uid || !offlineOwner.tenantId || syncInFlight.current || finishInFlight.current) return;
    syncInFlight.current = true; setSyncing(true);
    try {
      const run = async () => {
        const rows = await pendingSales(offlineOwner);
        for (const row of rows.filter(canRetryPendingSale)) {
          if (ownerRef.current.uid !== offlineOwner.uid || ownerRef.current.tenantId !== offlineOwner.tenantId) return;
          try {
            if(row.approvalPending) {
              const result = await posSaleApprovalStatus(dc,{operationId:row.clientOperationId,requestKey:crypto.randomUUID()});
              const status = String(((result.data._select ?? [])[0] as {status?:string}|undefined)?.status ?? "PENDING");
              if(status === "PENDING") continue;
              if(status === "REJECTED" || status === "EXPIRED") throw new Error("POS_APPROVAL_DENIED");
            }
            const posted = await postSale(dc, { payload: row.payload });
            if (!posted.data._execute) throw new Error("POS_REJECTED");
            await removePendingSale(row.clientOperationId, offlineOwner);
          } catch (error) {
            await markPendingFailure(row, error instanceof Error ? error.message : "Falha de conexão", definitiveSaleFailure(error));
          }
        }
      };
      // One sender per identity across tabs; the server remains idempotent everywhere.
      if (navigator.locks) await navigator.locks.request(`insightpad-pos-sync:${offlineOwner.tenantId}:${offlineOwner.uid}`, {ifAvailable:true}, async lock => {if(lock) await run()});
      else await run();
      if (ownerRef.current.uid === offlineOwner.uid && ownerRef.current.tenantId === offlineOwner.tenantId) setPendingRows(await pendingSales(offlineOwner));
    } catch { setNotice("Falha ao acessar a fila local. As vendas foram preservadas.") }
    finally { syncInFlight.current = false; setSyncing(false) }
  }, [offlineOwner]);
  useEffect(() => {
    const status = () => { setOnline(navigator.onLine); if (navigator.onLine) void sync() };
    const timer = window.setInterval(() => { if (!document.hidden) void sync() }, 15000);
    const first = window.setTimeout(() => void sync(), 0);
    addEventListener("online", status); addEventListener("offline", status); document.addEventListener("visibilitychange", status);
    return () => { clearInterval(timer); clearTimeout(first); removeEventListener("online", status); removeEventListener("offline", status); document.removeEventListener("visibilitychange", status) };
  }, [sync]);
  async function finish(event: FormEvent) {
    event.preventDefault();
    if (finishInFlight.current || busy) return;
    const changeIds = new Set(
        workspace.paymentMethods
          .filter((m) => m.requiresChange)
          .map((m) => m.id),
      ),
      error = validateCheckout(
        cart,
        payments,
        cents(discount),
        cents(surcharge),
        changeIds,
      );
    if (error) {
      setNotice(error);
      return;
    }
    const needsApproval = !permission?.canManage && (totals.discountCents * 100 > totals.subtotalCents * (workspace.policy?.operatorDiscountPercent ?? 0) || totals.surchargeCents * 100 > totals.subtotalCents * (workspace.policy?.operatorSurchargePercent ?? 0));
    if (needsApproval && !online) { setNotice("Conecte-se para solicitar aprovação do desconto ou acréscimo."); return }
    if (!workspace.openSession && (workspace.policy?.requireOpenSession !== false || payments.some(payment => changeIds.has(payment.paymentMethodId)))) {
      setNotice("Abra seu caixa para receber dinheiro ou concluir esta venda."); return;
    }
    const clientOperationId = crypto.randomUUID(),
      payload = {
        clientOperationId,
        branchId,
        customerId: customerId || null,
        cashSessionId: workspace.openSession?.id ?? null,
        discountCents: cents(discount),
        surchargeCents: cents(surcharge),
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          requested_price: item.unitPriceCents,
        })),
        payments: payments.map((p, index) => ({
          payment_method_id: p.paymentMethodId,
          amount_cents: p.amountCents,
          sequence: index + 1,
          external_reference: p.externalReference ?? null,
        })),
      };
    finishInFlight.current = true;
    setBusy(true);
    let deferred = !online;
    let serverReceipt: SaleReceipt | null = null;
    try {
      const correctedPayload = {
        ...payload,
        replacesSaleId: correctionId || null,
      };
      if (needsApproval) await requestPosSaleApproval(dc, {payload:correctedPayload});
      await queueSale(correctedPayload, offlineOwner, needsApproval);
      if (online && !needsApproval) {
        try {
          const posted = await postSale(dc, { payload: correctedPayload });
          if (!posted.data._execute) throw new Error("POS_REJECTED");
          serverReceipt = confirmedReceipt(posted.data.result?.receipt);
          await removePendingSale(clientOperationId, offlineOwner);
        } catch (error) {
          const row = (await pendingSales(offlineOwner)).find(sale => sale.clientOperationId === clientOperationId);
          if (row) await markPendingFailure(row, error instanceof Error ? error.message : "Falha de conexão", definitiveSaleFailure(error));
          if (definitiveSaleFailure(error)) {
            await removePendingSale(clientOperationId, offlineOwner); // server explicitly rejected, no sale was committed
            throw new Error("Venda recusada. Confira estoque, pagamentos, limites, filial e caixa do operador.", {cause:error});
          }
          deferred = true;
        }
      }
      setPendingRows(await pendingSales(offlineOwner));
      const selectedBranch = workspace.branches.find((b) => b.id === branchId);
      setLastReceipt(needsApproval ? null : deferred ? {
        id: clientOperationId,
        branch: selectedBranch ?? { name: "Filial" },
        customer:
          workspace.customers.find((c) => c.id === customerId)?.name ??
          "Consumidor final",
        items: [...cart],
        payments: payments.map((p) => ({
          ...p,
          name:
            workspace.paymentMethods.find((m) => m.id === p.paymentMethodId)
              ?.name ?? "Pagamento",
        })),
        operator: profile?.name ?? "",
        tenant: workspace.tenant ?? {
          legalName: profile?.tenant.legalName ?? "Insight Pad",
          tradeName: profile?.tenant.tradeName ?? undefined,
        },
        offline: deferred,
        ...totals,
        changeCents: change,
        date: new Date().toISOString(),
      } : serverReceipt);
      setReceiptPrompt(!needsApproval && (deferred || Boolean(serverReceipt)));
      setCart([]);
      setCorrectionId("");
      setCheckout(false);
      setDiscount("");
      setSurcharge("");
      setCustomerId("");
      setNotice(
        needsApproval ? "Solicitação enviada ao gestor. A venda aguardará aprovação na fila deste usuário." : !deferred && !serverReceipt ? "Venda confirmada. Comprovante indisponível; consulte Gestão de Vendas para reimprimir." : !deferred
          ? "Venda concluída e estoque atualizado."
          : "Venda salva com segurança. Será sincronizada quando a conexão retornar.",
      );
      if (!deferred && !needsApproval) { await load(); await searchProducts("") }
    } catch (err) {
      console.error(err);
      setNotice(
        err instanceof Error
          ? err.message
          : "Venda não concluída. Confira estoque, pagamentos, caixa aberto e dados informados.",
      );
    } finally {
      finishInFlight.current = false;
      setBusy(false);
    }
  }
  function printReceipt() {
    if (!lastReceipt) {
      setNotice("Conclua a venda antes de imprimir o comprovante.");
      return;
    }
    try {
      printSaleReceipt(lastReceipt);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a impressão.",
      );
    }
  }
  return (
    <section className="sales-page pos-page">
      <header className="pos-topbar">
        <div className="pos-clock">
          <span>
            {clock.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
          <strong>{clock.toLocaleTimeString("pt-BR")}</strong>
        </div>
        <div className="sales-header-actions">
          <button onClick={() => setCashControl(true)} disabled={!branchId || busy || loadedBranchId !== branchId}>
            <span className="material-symbols-rounded">point_of_sale</span>
            {loadedBranchId !== branchId ? "Carregando caixa..." : workspace.openSession ? "Caixa aberto" : "Abrir caixa"}
          </button>
          <span className={`connection ${online ? "online" : "offline"}`}>
            <i />
            {online ? "Online" : "Offline"}
            {pending > 0 && ` · ${pending} pendente(s)`}
          </span>
          {pending > 0 && online && (
            <button disabled={syncing} onClick={() => void sync()}>{syncing ? "Sincronizando..." : "Sincronizar"}</button>
          )}
          {pending > 0 && <button onClick={() => setQueueOpen(true)}>Revisar fila ({pendingRows.filter(row => row.blocked).length} bloqueada(s))</button>}
          {permission?.canManage && <button onClick={() => setApprovalsOpen(true)}>Aprovações</button>}
          <Link className="catalog-back" to="/modulos/vendas">
            <span className="material-symbols-rounded">arrow_back</span>Voltar
          </Link>
        </div>
      </header>
      <AppToast notice={toast} onClose={() => setNotice("")} />
      <div className="pos-layout">
        <aside className="pos-entry">
          <label>
            Filial
            <select
              value={branchId}
              disabled={busy || Boolean(correctionId)}
              onChange={(e) => {
                if (cart.length) {
                  setNotice("Limpe o carrinho antes de trocar de filial.");
                  return;
                }
                setBranchId(e.target.value); setChosenProduct(null); setSelectedId(""); setTerm(""); setWorkspace(current => ({...current,products:[]}));
              }}
            >
              <option value="">Selecione</option>
              {workspace.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="pos-search" ref={searchBoxRef}>
            <label>
              Produto
              <div className="pos-search-input">
                <span className="material-symbols-rounded">search</span>
                <input
                  ref={searchRef}
                  value={term}
                  role="combobox" aria-autocomplete="list" aria-expanded={searchOpen} aria-controls="pos-product-results" aria-activedescendant={searchOpen && selected ? `pos-product-${selected.id}` : undefined}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setTerm(e.target.value); setSelectedId(""); setChosenProduct(null);
                    setSearchOpen(true);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault(); setSearchOpen(true);
                      const index = filtered.findIndex(product => product.id === selected?.id);
                      const next = filtered[(index + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length];
                      if(next) {setSelectedId(next.id); setChosenProduct(null)}
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (/^\d{8,14}$/.test(term.trim()) && navigator.onLine) {
                        const rows = await searchProducts(term.trim());
                        const exact = rows.find(product => product.ean === term.trim() || product.internalCode === term.trim());
                        if(exact) add(exact); else setNotice("Nenhum produto encontrado para esse código.");
                      } else if (!productBusy) add();
                      setSearchOpen(false);
                    }
                    if (e.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder="Código, EAN ou nome"
                />
                <button
                  type="button"
                  className="scan-button"
                  onClick={() => setScanner(true)}
                  aria-label="Escanear código de barras"
                >
                  <span className="material-symbols-rounded">
                    barcode_scanner
                  </span>
                </button>
              </div>
            </label>
            {searchOpen && (
              <div id="pos-product-results" role="listbox" aria-label="Produtos encontrados" className="product-results product-results--dropdown">
                {!filtered.length && <p role="status">{productBusy ? "Buscando produtos..." : "Nenhum produto encontrado."}</p>}
                {filtered.map((p) => (
                  <button
                    id={`pos-product-${p.id}`} role="option" aria-selected={selected?.id === p.id}
                    className={selected?.id === p.id ? "active" : ""}
                    key={p.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSelectedId(p.id); setChosenProduct(p);
                      setTerm(p.name);
                      setSearchOpen(false);
                    }}
                  >
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.internalCode || p.ean || "Sem código"} ·{" "}
                        {p.bundleProduct
                          ? "Combo"
                          : p.weightedProduct
                            ? "Pesável"
                            : "Unidade"}
                      </small>
                    </span>
                    <span>
                      <b>{money(p.effectivePriceCents)}</b>
                      <small>{p.allowNegativeStock && !p.bundleProduct ? "Estoque livre" : `Saldo ${p.stock} ${p.bundleProduct ? "combo(s)" : p.weightedProduct ? "kg/L" : "un."}`}</small>
                    </span>
                  </button>
                ))}
                {productMore && <button disabled={productBusy} onClick={() => void searchProducts(term, productOffset + 30)}>Carregar mais produtos</button>}
              </div>
            )}
          </div>
          {selected && (
            <div className="selected-product">
              <div>
                <strong>{selected.name}</strong>
                <button onClick={async () => {
                  try { const result = await posProductBranches(dc,{ productId: selected.id, requestKey: crypto.randomUUID() }); setStockProduct({...selected,stockByBranches:(result.data._select ?? []) as Product["stockByBranches"]}) }
                  catch { setNotice("Não foi possível consultar o estoque das filiais.") }
                }}>
                  Estoque por filial
                </button>
              </div>
              <label>
                Quantidade {selected.weightedProduct ? "(kg/L)" : selected.bundleProduct ? "(combos)" : "(un.)"}
                <input
                  type="number"
                  min={selected.weightedProduct ? 0.001 : 1}
                  step={selected.weightedProduct ? 0.001 : 1}
                  value={qty || ""}
                  onChange={(e) => setQty(e.target.value === "" ? 0 : Number(e.target.value))}
                  onBlur={() => {if(!qty)setQty(selected.weightedProduct ? .001 : 1)}}
                />
              </label>
              <button
                className="catalog-primary"
                onClick={() => {
                  add();
                  setSearchOpen(false);
                }}
              >
                <span className="material-symbols-rounded">
                  add_shopping_cart
                </span>
                Adicionar ao carrinho
              </button>
            </div>
          )}
        </aside>
        <main className="pos-cart">
          <div className="pos-cart-head">
            <div>
              <strong>Carrinho</strong>
              <small>{cart.length} produto(s)</small>
            </div>
            {cart.length > 0 && (
              <button
                className="pos-clear"
                onClick={() => setConfirmClear(true)}
              >
                <span className="material-symbols-rounded">delete_sweep</span>
                Limpar carrinho
              </button>
            )}
          </div>
          <div className="pos-cart-scroll">
            {!cart.length ? (
              <div className="empty-state">
                <span className="material-symbols-rounded">shopping_cart</span>
                <p>Leia um código ou pesquise um produto para começar.</p>
              </div>
            ) : (
              cart.map((item) => (
                <article key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.bundleProduct ? "COMBO · " : ""}
                      {money(item.unitPriceCents)} por unidade
                    </small>
                  </div>
                  <label>
                    <span>Qtd.</span>
                    <input
                      type="number"
                      min={item.weightedProduct ? 0.001 : 1}
                      step={item.weightedProduct ? 0.001 : 1}
                      value={item.quantity || ""}
                      onChange={(e) =>
                        setCart((rows) =>
                          rows.map((row) =>
                            row.productId === item.productId
                              ? {
                                  ...row,
                                  quantity: quantity(
                                    Number(e.target.value),
                                    row.weightedProduct,
                                  ),
                                }
                              : row,
                          ),
                        )
                      }
                    />
                  </label>
                  <b>{money(lineTotal(item))}</b>
                  <button
                    aria-label={`Remover ${item.name}`}
                    onClick={() =>
                      setCart((rows) =>
                        rows.filter((row) => row.productId !== item.productId),
                      )
                    }
                  >
                    ×
                  </button>
                </article>
              ))
            )}
          </div>
          <footer className="pos-total">
            <strong className="pos-grand-total">
              Total <b>{money(totals.totalCents)}</b>
            </strong>
            <button
              className="catalog-primary pos-pay"
              disabled={busy || !permission?.canCreate || !cart.length}
              onClick={openCheckout}
            >
              <span className="material-symbols-rounded">payments</span>Ir para
              pagamento
            </button>
          </footer>
        </main>
      </div>
      {checkout && (
        <div className="catalog-backdrop">
          <section
            className="catalog-modal sales-modal"
            role="dialog"
            aria-modal="true" aria-label="Pagamento da venda"
          >
            <header>
              <div>
                <span className="eyebrow">Finalização</span>
                <h2>Pagamento</h2>
              </div>
              <button disabled={busy} aria-label="Fechar pagamento" onClick={() => setCheckout(false)}>×</button>
            </header>
            <form onSubmit={finish}>
              <fieldset className="pos-checkout-body" disabled={busy}>
              <div className="checkout-grid">
                <label>
                  Buscar cliente
                  <input value={customerTerm} onChange={event => {setCustomerTerm(event.target.value); setCustomerOffset(0); setCustomerId("")}} placeholder="Nome ou CPF" />
                  {customerBusy && <small role="status">Buscando clientes...</small>}
                  {customerMore && <button type="button" disabled={customerBusy} onClick={() => setCustomerOffset(value => value + 30)}>Carregar mais clientes</button>}
                </label>
                <label>
                  Cliente (opcional)
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Consumidor final</option>
                    {workspace.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.cpf ? ` · ${c.cpf}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Desconto
                  <input
                    inputMode="numeric"
                    value={discount}
                    onChange={(e) => setDiscount(money(cents(e.target.value)))}
                  />
                </label>
                <label>
                  Acréscimo
                  <input
                    inputMode="numeric"
                    value={surcharge}
                    onChange={(e) => setSurcharge(money(cents(e.target.value)))}
                  />
                </label>
              </div>
              <div className="checkout-summary">
                <span>
                  Subtotal <b>{money(totals.subtotalCents)}</b>
                </span>
                <span>
                  Desconto <b>- {money(totals.discountCents)}</b>
                </span>
                <span>
                  Acréscimo <b>{money(totals.surchargeCents)}</b>
                </span>
                <strong>
                  Total <b>{money(totals.totalCents)}</b>
                </strong>
              </div>
              <section className="payments">
                <header>
                  <strong>Formas de pagamento</strong>
                  <button
                    type="button"
                    className="split-payment"
                    onClick={() =>
                      setPayments((rows) => [
                        ...rows,
                        {
                          paymentMethodId: "",
                          amountCents: remaining,
                          sequence: rows.length + 1,
                        },
                      ])
                    }
                  >
                    <span className="material-symbols-rounded">call_split</span>
                    Dividir pagamento
                  </button>
                </header>
                {payments.map((p, index) => (
                  <div className="payment-row" key={index}>
                    <select
                      aria-label={`Forma de pagamento ${index + 1}`}
                      value={p.paymentMethodId}
                      onChange={(e) =>
                        setPayments((rows) =>
                          rows.map((row, i) =>
                            i === index
                              ? { ...row, paymentMethodId: e.target.value }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="">Selecione</option>
                      {workspace.paymentMethods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      inputMode="numeric"
                      aria-label={`Valor do pagamento ${index + 1}`}
                      value={money(p.amountCents)}
                      onChange={(e) =>
                        setPaymentAmount(index, cents(e.target.value))
                      }
                    />
                    <input
                      aria-label={`Referência do pagamento ${index + 1}`}
                      placeholder="Referência (opcional)"
                      value={p.externalReference ?? ""}
                      onChange={(e) =>
                        setPayments((rows) =>
                          rows.map((row, i) =>
                            i === index
                              ? { ...row, externalReference: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    {payments.length > 1 && (
                      <button
                        type="button" aria-label={`Remover pagamento ${index + 1}`}
                        onClick={() =>
                          setPayments((rows) =>
                            rows.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </section>
              <div className="payment-balance">
                <span>
                  Pago <b>{money(paid)}</b>
                </span>
                <span>
                  Falta <b>{money(remaining)}</b>
                </span>
                <span>
                  Troco <b>{money(change)}</b>
                </span>
              </div>
              </fieldset>
              <footer>
                <button type="button" className="catalog-modal-cancel" disabled={busy} onClick={() => setCheckout(false)}>
                  Cancelar
                </button>
                <button className="catalog-primary" disabled={busy}>
                  <span className="material-symbols-rounded">check_circle</span>
                  Concluir venda
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {stockProduct && (
        <div className="catalog-backdrop">
          <section className="catalog-confirm stock-branches-modal" role="dialog" aria-modal="true" aria-label="Estoque por filial">
            <span className="material-symbols-rounded">inventory</span>
            <h2>{stockProduct.name}</h2>
            <div className="stock-branches-list">
              {(stockProduct.stockByBranches ?? []).map((item) => (
                <div key={item.branchId}>
                  <span>{item.branchName}</span>
                  <strong>{item.quantity}</strong>
                </div>
              ))}
            </div>
            <footer>
              <button
                className="catalog-primary"
                onClick={() => setStockProduct(null)}
              >
                Fechar
              </button>
            </footer>
          </section>
        </div>
      )}
      {receiptPrompt && lastReceipt && (
        <div className="catalog-backdrop">
          <section className="catalog-confirm receipt-prompt" role="dialog" aria-modal="true" aria-label="Imprimir comprovante">
            <span className="material-symbols-rounded">receipt_long</span>
            <h2>Venda concluída</h2>
            <p>Deseja enviar o comprovante para impressão agora?</p>
            <footer>
              <button onClick={() => setReceiptPrompt(false)}>
                Não imprimir
              </button>
              <button
                className="catalog-primary"
                onClick={() => {
                  printReceipt();
                  setReceiptPrompt(false);
                }}
              >
                <span className="material-symbols-rounded">print</span>Imprimir
              </button>
            </footer>
          </section>
        </div>
      )}
      {cashControl && loadedBranchId === branchId && (
        <CashSessionModal
          key={`${branchId}:${workspace.openSession?.id ?? "new"}`}
          dc={dc}
          branchId={branchId}
          branchName={
            workspace.branches.find((b) => b.id === branchId)?.name ?? "Filial"
          }
          session={workspace.openSession}
          canManage={permission?.canManage === true}
          policy={workspace.policy}
          pendingCount={pendingRows.filter(row => row.payload.cashSessionId === workspace.openSession?.id).length}
          onClose={() => setCashControl(false)}
          onChanged={load}
          onNotice={setNotice}
        />
      )}{" "}
      {confirmClear && (
        <div className="catalog-backdrop">
          <section className="catalog-confirm" role="alertdialog" aria-modal="true" aria-label="Limpar carrinho">
            <span className="material-symbols-rounded">delete_sweep</span>
            <h2>Limpar carrinho?</h2>
            <p>Todos os itens serão removidos.</p>
            <footer>
              <button onClick={() => setConfirmClear(false)}>Voltar</button>
              <button
                className="danger"
                onClick={() => {
                  setCart([]);
                  setConfirmClear(false);
                }}
              >
                Limpar
              </button>
            </footer>
          </section>
        </div>
      )}
      {scanner && (
        <BarcodeScanner
          onClose={() => setScanner(false)}
          onRead={async (code) => {
            setScanner(false); setChosenProduct(null); setSelectedId("");
            const rows = await searchProducts(code);
            const product = rows.find(item => item.ean === code || item.internalCode === code);
            if(product) add(product); else { setTerm(code); setSearchOpen(true); setNotice("Nenhum produto encontrado para o código lido.") }
          }}
        />
      )}
      {queueOpen && <div className="catalog-backdrop"><section className="catalog-modal sales-modal pos-queue" role="dialog" aria-modal="true" aria-label="Vendas pendentes">
        <header><h2>Vendas pendentes</h2><button aria-label="Fechar fila" disabled={syncing} onClick={() => setQueueOpen(false)}>×</button></header>
        <div className="pos-queue-body">{pendingRows.map(row => <article key={row.id}>
          <strong>{String(row.payload.clientOperationId).slice(0,8)} · {new Date(row.createdAt).toLocaleString("pt-BR")}</strong>
          <span>{row.blocked ? "Precisa de revisão" : row.approvalPending ? "Aguardando aprovação e sincronização" : "Aguardando sincronização"} · {row.attempts} tentativa(s)</span>
          {row.lastError && <p>{/POS_APPROVAL_DENIED/.test(row.lastError) ? "A aprovação foi recusada ou expirou. A operação foi preservada para revisão." : /POS_REJECTED|POS_BRANCH_DENIED/.test(row.lastError) ? "Confira filial, estoque, pagamentos, limites e o caixa original. A venda permanece guardada." : "O servidor não confirmou a venda. Confira sua conexão e o caixa original antes de tentar novamente."}</p>}
          {row.blocked && <button disabled={syncing || !online} onClick={async () => {await retryPendingSale(row, offlineOwner); await sync()}}>Tentar novamente com a mesma operação</button>}
        </article>)}</div>
        <footer><button className="catalog-modal-cancel" disabled={syncing} onClick={() => setQueueOpen(false)}>Fechar</button></footer>
      </section></div>}
      {approvalsOpen && <PosApprovalsModal dc={dc} onClose={() => setApprovalsOpen(false)} onNotice={setNotice} />}
      {busy && <AppLoading text="Processando operação..." />}
    </section>
  );
}
