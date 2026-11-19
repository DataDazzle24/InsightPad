export type Kind = "ENCOMENDA" | "COMANDA";
export type Cents = string;
export type Document = {
  id: string;
  kind: Kind;
  code: string;
  branch_id: string;
  branch_name?: string;
  operator_name?: string;
  customer_id: string | null;
  customer_name?: string;
  identification: string;
  status: string;
  fulfillment_mode: "PICKUP" | "DELIVERY" | null;
  due_at: string | null;
  timezone_snapshot: string;
  delivery_address: Record<string, string> | null;
  delivery_fee_cents: Cents;
  notes: string;
  reservation_state: string;
  total_cents: Cents;
  subtotal_cents: Cents;
  received_net_cents: Cents;
  version: string;
  sale_id: string | null;
  merged_into_id: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  opened_by_uid: string;
};
export type Item = {
  actions?: Record<string, { allowed: boolean; reason: string | null }>;
  id: string;
  document_id: string;
  original_document_id: string;
  source_item_id: string | null;
  product_id: string;
  product_name: string;
  unit: string;
  quantity: string;
  unit_price_cents: Cents;
  line_total_cents: Cents;
  specifications: string;
  preparation_state: string;
  participant_id: string | null;
  status: string;
};
export type Receipt = {
  id: string;
  document_id: string;
  original_document_id: string;
  amount_cents: Cents;
  returned_cents: Cents;
  change_cents: Cents;
  payment_method_id: string;
  reference: string;
  method_name?: string;
  operator_name?: string;
  cash_session_id: string | null;
  operator_uid: string;
  received_at: string;
};
export type Share = {
  id: string;
  share_index: number;
  amount_cents: Cents;
  paid_cents: Cents;
  participant_id: string | null;
};
export type Plan = {
  id: string;
  mode: string;
  item_id: string | null;
  status: string;
  total_cents: Cents;
  shares: Share[];
};
export type Detail = {
  refundApprovals: {
    id: string;
    status: string;
    amountCents: string;
    expiresAt: string;
    approvedByUid: string | null;
  }[];
  actions: Record<string, { allowed: boolean; reason: string | null }>;
  document: Document;
  customerName: string | null;
  branchName: string;
  operatorName?: string;
  serverNow: string;
  timezone: string;
  items: Item[];
  participants: { id: string; name: string }[];
  allocations: {
    receipt_id: string;
    item_id: string | null;
    amount_cents: Cents;
    share_id: string | null;
  }[];
  plans: Plan[];
  refundPendingCents: Cents;
  allowedActions: Record<
    "create" | "update" | "delete" | "manage" | "cash",
    boolean
  >;
  reservationValid: boolean;
  terminal: boolean;
};
export type ListResult = {
  rows: Document[];
  total: number;
  offset: number;
  pageSize: number;
  serverNow: string;
  timezone: string;
  counts: {
    all: number;
    late: number;
    ready: number;
    paid: number;
    balanceCents: Cents;
  };
  tables: string[];
  codes: { id: string; code: string; name: string }[];
};
export type Lookup = {
  cashPolicy?: { canManage: boolean; withdrawalLimitCents: string };
  branches: { id: string; name: string }[];
  customers: {
    id: string;
    name: string;
    street?: string;
    street_number?: string;
    city?: string;
    district?: string;
    state_code?: string;
    postal_code?: string;
  }[];
  products: {
    id: string;
    name: string;
    weighted_product: boolean;
    bundle_product: boolean;
    effective_price_cents: Cents;
    sale_price_cents: Cents;
  }[];
  paymentMethods: { id: string; name: string; requires_change: boolean }[];
  cashSessions: { id: string; branch_id: string; opened_at: string }[];
  timezone: string;
  serverNow: string;
  catalogPageSize: number;
};
export type Command = {
  operationId: string;
  kind: Kind;
  action: string;
  documentId?: string;
  expectedVersion?: string;
  secondaryDocumentId?: string;
  secondaryExpectedVersion?: string;
  payload: Record<string, unknown>;
};
export type Owner = { uid: string; tenantId: string };
export type OperationResult = {
  status: "COMMITTED" | "REJECTED" | "UNKNOWN";
  operationId?: string;
  kind?: Kind;
  documentId?: string;
  version?: string;
  saleId?: string;
  receiptId?: string;
  effects?: Record<string, unknown>;
  error?: {
    code: string;
    details?: {
      shortages?: {
        productId: string;
        productName?: string;
        required: string;
        available: string;
        missing: string;
      }[];
      currentVersion?: string;
    };
  };
};
export type Pending = { owner: Owner; command: Command; createdAt: string };
export type Page<T> = {
  rows: T[];
  total: number;
  offset: number;
  pageSize: number;
};
export type Event = {
  actor_name?: string;
  id: string;
  event_type: string;
  actor_uid: string;
  occurred_at: string;
  details: Record<string, unknown>;
  related_document_id: string | null;
};
export const labels: Record<string, string> = {
  CREATE_ORDER: "Encomenda criada",
  OPEN_COMMAND: "Comanda aberta",
  EDIT_ORDER: "Encomenda editada",
  RESCHEDULE: "Prazo remarcado",
  RESERVE: "Estoque reservado",
  START_PREPARATION: "Preparação iniciada",
  MARK_READY: "Marcada como pronta",
  ADD_ITEM: "Item adicionado",
  ASSIGN_ITEM: "Pessoa atribuída",
  PREPARE_ITEM: "Preparo atualizado",
  RECEIVE: "Pagamento recebido",
  COMPLETE: "Registro concluído",
  RECEIVE_AND_COMPLETE: "Pagamento e conclusão",
  MOVE_TABLE: "Mesa / nome alterado",
  ALLOCATE_RECEIPT: "Recebimento conciliado",
  CREATE_SPLIT: "Divisão confirmada",
  REMOVE_ITEM: "Item retirado",
  TRANSFER_ITEMS: "Itens transferidos",
  MERGE: "Comandas juntadas",
  CANCEL: "Registro cancelado",
  CANCEL_SALE: "Venda vinculada cancelada",
  REFUND: "Devolução registrada",
  REQUEST_REFUND_APPROVAL: "Aprovação de devolução solicitada",
  PENDING: "Pendente",
  PREPARING: "Em preparação",
  READY: "Pronta",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  OPEN: "Aberta",
  CLOSED: "Fechada",
  INCORPORATED: "Incorporada",
  NONE: "Sem reserva",
  WAITING: "Aguardando",
  RESERVED: "Reservado",
  CONSUMED: "Baixado",
  RELEASED: "Liberado",
  NOTED: "Anotado",
  PREPARED: "Preparado",
  SERVED: "Servido",
  ACTIVE: "Ativo",
  REMOVED: "Retirado",
  TRANSFERRED: "Transferido",
};
