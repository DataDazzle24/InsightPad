import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AccessLog_Key {
  id: UUIDString;
  __typename?: 'AccessLog_Key';
}

export interface AccountPayable_Key {
  id: UUIDString;
  __typename?: 'AccountPayable_Key';
}

export interface AccountReceivable_Key {
  id: UUIDString;
  __typename?: 'AccountReceivable_Key';
}

export interface AcknowledgeSalesChannelOrderAlertData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface AcknowledgeSalesChannelOrderAlertVariables {
  id: UUIDString;
  version: number;
  alertKind: string;
  sessionToken?: string | null;
}

export interface AppPage_Key {
  id: UUIDString;
  __typename?: 'AppPage_Key';
}

export interface ApprovePosSaleData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ApprovePosSaleVariables {
  approvalId: UUIDString;
  approved: boolean;
  sessionToken?: string | null;
}

export interface ArchiveCategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ArchiveCategoryVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface ArchiveSalesChannelConnectionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ArchiveSalesChannelConnectionVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface ArchiveSalesChannelProductMappingData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ArchiveSalesChannelProductMappingVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface ArchiveSubcategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ArchiveSubcategoryVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface AuditLog_Key {
  id: UUIDString;
  __typename?: 'AuditLog_Key';
}

export interface BootstrapNavigationCatalogData {
  pageCaixa: AppPage_Key;
  pageGestaoVendas: AppPage_Key;
  pageEstoque: AppPage_Key;
  pageContasPagar: AppPage_Key;
  pageContasReceber: AppPage_Key;
  pageCategoria: AppPage_Key;
  pageSubcategoria: AppPage_Key;
  pageProduto: AppPage_Key;
  pageCliente: AppPage_Key;
  pageFornecedor: AppPage_Key;
  pageFilial: AppPage_Key;
  pageRelatorios: AppPage_Key;
  pageGestaoAcessos: AppPage_Key;
  pageCanaisVenda: AppPage_Key;
  permissionCaixa: RolePagePermission_Key;
  permissionGestaoVendas: RolePagePermission_Key;
  permissionEstoque: RolePagePermission_Key;
  permissionContasPagar: RolePagePermission_Key;
  permissionContasReceber: RolePagePermission_Key;
  permissionCategoria: RolePagePermission_Key;
  permissionSubcategoria: RolePagePermission_Key;
  permissionProduto: RolePagePermission_Key;
  permissionCliente: RolePagePermission_Key;
  permissionFornecedor: RolePagePermission_Key;
  permissionFilial: RolePagePermission_Key;
  permissionRelatorios: RolePagePermission_Key;
  permissionGestaoAcessos: RolePagePermission_Key;
  permissionCanaisVenda: RolePagePermission_Key;
}

export interface BootstrapNavigationCatalogVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}

export interface BootstrapSalesChannelsNavigationData {
  page: AppPage_Key;
  permission: RolePagePermission_Key;
}

export interface BootstrapSalesChannelsNavigationV2Data {
  _execute?: number | null;
}

export interface BootstrapSalesChannelsNavigationVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}

export interface Branch_Key {
  id: UUIDString;
  __typename?: 'Branch_Key';
}

export interface CancelSaleData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CancelSaleVariables {
  saleId: UUIDString;
  reason: string;
  sessionToken?: string | null;
}

export interface CashMovement_Key {
  id: UUIDString;
  __typename?: 'CashMovement_Key';
}

export interface CashSession_Key {
  id: UUIDString;
  __typename?: 'CashSession_Key';
}

export interface CategoryOptionsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface CategoryOptionsVariables {
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface ClaimDeviceSessionData {
  query?: {
    issued?: unknown | null;
  };
  _execute?: number | null;
}

export interface ClaimDeviceSessionVariables {
  deviceId: string;
  deviceName: string;
}

export interface CloseCashSessionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CloseCashSessionVariables {
  sessionId: UUIDString;
  countedAmountCents: Int64String;
  notes: string;
  operationId?: string | null;
  sessionToken?: string | null;
}

export interface ConnectSalesChannelMerchantData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ConnectSalesChannelMerchantVariables {
  connectionId: UUIDString;
  merchantId: string;
  requestKey: string;
  sessionToken?: string | null;
}

export interface CreateCategoriesBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateCategoriesBatchVariables {
  names: unknown;
  sessionToken?: string | null;
}

export interface CreateCategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateCategoryVariables {
  name: string;
  sessionToken?: string | null;
}

export interface CreatePlatformInvoiceData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreatePlatformInvoiceVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface CreatePlatformTenantData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreatePlatformTenantVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface CreateSalesChannelConnectionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateSalesChannelConnectionVariables {
  provider: string;
  branchId: UUIDString;
  displayName: string;
  externalStoreId: string;
  sessionToken?: string | null;
}

export interface CreateSalesChannelProductMappingData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateSalesChannelProductMappingVariables {
  connectionId: UUIDString;
  productId: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
  priceMode?: string;
  customPriceCents?: Int64String | null;
  remoteProductState?: string;
  sessionToken?: string | null;
}

export interface CreateSubcategoriesBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateSubcategoriesBatchVariables {
  items: unknown;
  sessionToken?: string | null;
}

export interface CreateSubcategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface CreateSubcategoryVariables {
  categoryId: UUIDString;
  name: string;
  sessionToken?: string | null;
}

export interface Customer_Key {
  id: UUIDString;
  __typename?: 'Customer_Key';
}

export interface DailyProfitDashboardData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface DailyProfitDashboardVariables {
  from: DateString;
  to: DateString;
  branchId?: UUIDString | null;
  requestKey: string;
  sessionToken?: string | null;
}

export interface EnsureSalesDefaultsData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface EnsureSalesDefaultsVariables {
  sessionToken?: string | null;
}

export interface ExportSalesChannelManagementData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ExportSalesChannelManagementVariables {
  section: string;
  term: string;
  provider: string;
  status: string;
  branchId?: UUIDString | null;
  connectionId?: UUIDString | null;
  requestKey: string;
  sessionToken?: string | null;
}

export interface FinancialAccount_Key {
  id: UUIDString;
  __typename?: 'FinancialAccount_Key';
}

export interface FinancialCategory_Key {
  id: UUIDString;
  __typename?: 'FinancialCategory_Key';
}

export interface FinancialIndicatorsDashboardData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface FinancialIndicatorsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
  sessionToken?: string | null;
}

export interface FiscalDocument_Key {
  id: UUIDString;
  __typename?: 'FiscalDocument_Key';
}

export interface GetCurrentUserAccessData {
  user?: {
    id: string;
    tenant: {
      id: UUIDString;
    } & Tenant_Key;
    role: {
      id: UUIDString;
      rolePagePermissions_on_role: ({
        canAccess: boolean;
        canCreate: boolean;
        canUpdate: boolean;
        canDelete: boolean;
        canExport: boolean;
        canManage: boolean;
        page: {
          id: UUIDString;
          pageKey: string;
          displayName: string;
          module: string;
          route: string;
          icon?: string | null;
          displayOrder: number;
          requiresLogin: boolean;
          active: boolean;
        } & AppPage_Key;
      })[];
    } & Role_Key;
    userPagePermissions_on_user: ({
      canAccess: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canExport: boolean;
      canManage: boolean;
      page: {
        id: UUIDString;
        pageKey: string;
        displayName: string;
        module: string;
        route: string;
        icon?: string | null;
        displayOrder: number;
        requiresLogin: boolean;
        active: boolean;
      } & AppPage_Key;
    })[];
  } & User_Key;
}

export interface GetCurrentUserData {
  user?: {
    id: string;
    name: string;
    email: string;
    active: boolean;
    onboardingPending: boolean;
    tenant: {
      id: UUIDString;
      legalName: string;
      tradeName?: string | null;
      active: boolean;
      timezone: string;
      currencyCode: string;
    } & Tenant_Key;
    role: {
      id: UUIDString;
      name: string;
      hierarchyLevel: number;
      systemRole: boolean;
      active: boolean;
    } & Role_Key;
  } & User_Key;
}

export interface LatestPendingSalesChannelOrderData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface LatestPendingSalesChannelOrderVariables {
  requestKey: string;
  sessionToken?: string | null;
}

export interface LinkPlatformUserData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface LinkPlatformUserVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface ListBranchesData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ListBranchesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface ListCategoriesData {
  session?: unknown | null;
  _select?: unknown[] | null;
  _selectFirst?: unknown | null;
}

export interface ListCategoriesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  filters?: unknown | null;
  sessionToken?: string | null;
}

export interface ListCustomersData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ListCustomersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface ListProductsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ListProductsVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface ListSalesData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ListSalesVariables {
  filters: unknown;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface ListSubcategoriesData {
  session?: unknown | null;
  _select?: unknown[] | null;
  _selectFirst?: unknown | null;
}

export interface ListSubcategoriesVariables {
  search: string;
  categoryId?: UUIDString | null;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  filters?: unknown | null;
  sessionToken?: string | null;
}

export interface ListSuppliersData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ListSuppliersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface MapSalesChannelOrderItemData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface MapSalesChannelOrderItemVariables {
  itemId: UUIDString;
  productId: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface OfflineOperation_Key {
  id: UUIDString;
  __typename?: 'OfflineOperation_Key';
}

export interface OpenCashSessionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface OpenCashSessionVariables {
  branchId: UUIDString;
  openingAmountCents: Int64String;
  notes: string;
  sessionToken?: string | null;
}

export interface OperationalAnalyticsDashboardData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface OperationalAnalyticsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PaymentMethod_Key {
  id: UUIDString;
  __typename?: 'PaymentMethod_Key';
}

export interface PendingPosApprovalsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PendingPosApprovalsVariables {
  requestKey: string;
  sessionToken?: string | null;
}

export interface PlatformAdminWorkspaceData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PlatformAdminWorkspaceVariables {
  requestKey: string;
  sessionToken?: string | null;
}

export interface PlatformBillingWorkspaceData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PlatformBillingWorkspaceV2Data {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PlatformBillingWorkspaceV2Variables {
  term: string;
  status: string;
  tenantId?: UUIDString | null;
  dueFrom?: DateString | null;
  dueTo?: DateString | null;
  sortKey: string;
  sortDirection: string;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PlatformBillingWorkspaceVariables {
  term: string;
  status: string;
  tenantId?: UUIDString | null;
  dueFrom?: DateString | null;
  dueTo?: DateString | null;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PosApproval_Key {
  id: UUIDString;
  __typename?: 'PosApproval_Key';
}

export interface PosCashApprovalStatusData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PosCashApprovalStatusVariables {
  operationId: string;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PosPolicy_Key {
  tenantId: UUIDString;
  __typename?: 'PosPolicy_Key';
}

export interface PosProductBranchesData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PosProductBranchesVariables {
  productId: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PosSaleApprovalStatusData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface PosSaleApprovalStatusVariables {
  operationId: string;
  requestKey: string;
  sessionToken?: string | null;
}

export interface PostSaleData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
  result?: {
    receipt?: unknown | null;
  };
}

export interface PostSaleVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface PostStockAdjustmentData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface PostStockAdjustmentVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface PostStockTransferData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface PostStockTransferVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface ProductComponent_Key {
  parentProductId: UUIDString;
  componentProductId: UUIDString;
  __typename?: 'ProductComponent_Key';
}

export interface ProductComponentsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ProductComponentsVariables {
  productId: UUIDString;
  sessionToken?: string | null;
}

export interface ProductPromotionsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface ProductPromotionsVariables {
  productId: UUIDString;
  sessionToken?: string | null;
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface Promotion_Key {
  id: UUIDString;
  __typename?: 'Promotion_Key';
}

export interface QueueSalesChannelOrderActionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface QueueSalesChannelOrderActionVariables {
  id: UUIDString;
  action: string;
  reason: string;
  expectedVersion: number;
  cancellationCode?: string | null;
  itemId?: UUIDString | null;
  ean?: string | null;
  quantity?: number | null;
  sessionToken?: string | null;
}

export interface RegisterCashMovementData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RegisterCashMovementVariables {
  sessionId: UUIDString;
  movementType: string;
  amountCents: Int64String;
  description: string;
  operationId?: string | null;
  sessionToken?: string | null;
}

export interface RegistrationOptionsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface RegistrationOptionsVariables {
  requestKey?: string | null;
  sessionToken?: string | null;
}

export interface ReleaseDeviceSessionData {
  _execute?: number | null;
}

export interface ReleaseDeviceSessionVariables {
  sessionToken: string;
}

export interface RequestPosCashApprovalData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RequestPosCashApprovalVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface RequestPosSaleApprovalData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RequestPosSaleApprovalVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface RequestSalesChannelAuthorizationData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RequestSalesChannelAuthorizationVariables {
  connectionId: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface RequestSalesChannelOrderReconciliationData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RequestSalesChannelOrderReconciliationVariables {
  id: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface RequestSalesChannelSyncData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RequestSalesChannelSyncVariables {
  connectionId: UUIDString;
  scope: string;
  requestKey: string;
  sessionToken?: string | null;
}

export interface RestoreCategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RestoreCategoryVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface RestoreSubcategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RestoreSubcategoryVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface RetrySalesChannelCommandData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RetrySalesChannelCommandVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface RetrySalesChannelDecommissioningData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface RetrySalesChannelDecommissioningVariables {
  id: UUIDString;
  sessionToken?: string | null;
}

export interface ReversePlatformPaymentData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ReversePlatformPaymentVariables {
  paymentId: UUIDString;
  reason: string;
  sessionToken?: string | null;
}

export interface ReverseStockOperationData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface ReverseStockOperationVariables {
  operationId: string;
  movementIds: unknown;
  reason: string;
  sessionToken?: string | null;
}

export interface RolePagePermission_Key {
  roleId: UUIDString;
  pageId: UUIDString;
  __typename?: 'RolePagePermission_Key';
}

export interface Role_Key {
  id: UUIDString;
  __typename?: 'Role_Key';
}

export interface SaleDetailsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SaleDetailsVariables {
  saleId: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SaleItem_Key {
  id: UUIDString;
  __typename?: 'SaleItem_Key';
}

export interface SalePayment_Key {
  id: UUIDString;
  __typename?: 'SalePayment_Key';
}

export interface Sale_Key {
  id: UUIDString;
  __typename?: 'Sale_Key';
}

export interface SalesChannelAnalyticsDashboardData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelAnalyticsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelCommand_Key {
  id: UUIDString;
  __typename?: 'SalesChannelCommand_Key';
}

export interface SalesChannelConnection_Key {
  id: UUIDString;
  __typename?: 'SalesChannelConnection_Key';
}

export interface SalesChannelConnectionsV2Data {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelConnectionsV2Variables {
  term: string;
  provider: string;
  status: string;
  branchId?: UUIDString | null;
  sortField: string;
  sortDirection: string;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelEventInbox_Key {
  id: UUIDString;
  __typename?: 'SalesChannelEventInbox_Key';
}

export interface SalesChannelFinancialEntry_Key {
  id: UUIDString;
  __typename?: 'SalesChannelFinancialEntry_Key';
}

export interface SalesChannelOperationsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelOperationsVariables {
  connectionId?: UUIDString | null;
  limit?: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelOptionsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelOptionsVariables {
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelOrderAdjustment_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrderAdjustment_Key';
}

export interface SalesChannelOrderAlertAcknowledgment_Key {
  orderId: UUIDString;
  userId: string;
  __typename?: 'SalesChannelOrderAlertAcknowledgment_Key';
}

export interface SalesChannelOrderDetailsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelOrderDetailsVariables {
  id: UUIDString;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelOrderItem_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrderItem_Key';
}

export interface SalesChannelOrderPayment_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrderPayment_Key';
}

export interface SalesChannelOrder_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrder_Key';
}

export interface SalesChannelOrdersData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelOrdersV2Data {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelOrdersV2Variables {
  filters: unknown;
  sortField: string;
  sortDirection: string;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelOrdersVariables {
  term: string;
  status: string;
  provider: string;
  branchId?: UUIDString | null;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelProductMapping_Key {
  id: UUIDString;
  __typename?: 'SalesChannelProductMapping_Key';
}

export interface SalesChannelProductMappingsV2Data {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelProductMappingsV2Variables {
  term: string;
  provider: string;
  connectionId?: UUIDString | null;
  status: string;
  sortField: string;
  sortDirection: string;
  limit: number;
  offset: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelProductOptionsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelProductOptionsVariables {
  term: string;
  connectionId?: UUIDString | null;
  productId?: UUIDString | null;
  limit: number;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesChannelStatusHistory_Key {
  id: UUIDString;
  __typename?: 'SalesChannelStatusHistory_Key';
}

export interface SalesChannelStockReservation_Key {
  orderId: UUIDString;
  productId: UUIDString;
  __typename?: 'SalesChannelStockReservation_Key';
}

export interface SalesChannelSyncJob_Key {
  id: UUIDString;
  __typename?: 'SalesChannelSyncJob_Key';
}

export interface SalesChannelWorkspaceData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesChannelWorkspaceVariables {
  requestKey: string;
  sessionToken?: string | null;
}

export interface SalesWorkspaceData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SalesWorkspaceVariables {
  branchId?: UUIDString | null;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SaveBranchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveBranchVariables {
  id?: UUIDString | null;
  payload: unknown;
  sessionToken?: string | null;
}

export interface SaveCustomerData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveCustomerVariables {
  id?: UUIDString | null;
  payload: unknown;
  sessionToken?: string | null;
}

export interface SaveProductComponentsData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveProductComponentsVariables {
  productId: UUIDString;
  components: unknown;
  sessionToken?: string | null;
}

export interface SaveProductData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveProductVariables {
  id?: UUIDString | null;
  payload: unknown;
  components?: unknown | null;
  sessionToken?: string | null;
}

export interface SavePromotionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SavePromotionVariables {
  id?: UUIDString | null;
  productId: UUIDString;
  promotionalPriceCents: Int64String;
  startsAt: TimestampString;
  endsAt: TimestampString;
  sessionToken?: string | null;
}

export interface SaveStockBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveStockBatchVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface SaveSupplierData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SaveSupplierVariables {
  id?: UUIDString | null;
  payload: unknown;
  sessionToken?: string | null;
}

export interface SearchPosCustomersData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SearchPosCustomersVariables {
  search?: string | null;
  limit?: number | null;
  offset?: number | null;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SearchPosProductsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface SearchPosProductsVariables {
  branchId: UUIDString;
  search?: string | null;
  limit?: number | null;
  offset?: number | null;
  requestKey: string;
  sessionToken?: string | null;
}

export interface SetBranchStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetBranchStatusVariables {
  id: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetBranchesStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetBranchesStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetCategoriesStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetCategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetCustomerStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetCustomerStatusVariables {
  id: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetCustomersStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetCustomersStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetPlatformRolePermissionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetPlatformRolePermissionVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface SetPlatformTenantStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetPlatformTenantStatusVariables {
  tenantId: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetPlatformUserStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetPlatformUserStatusVariables {
  userId: string;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetProductStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetProductStatusVariables {
  id: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetProductsStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetProductsStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetPromotionStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetPromotionStatusVariables {
  id: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetSubcategoriesStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetSubcategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetSupplierStatusData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetSupplierStatusVariables {
  id: UUIDString;
  active: boolean;
  sessionToken?: string | null;
}

export interface SetSuppliersStatusBatchData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SetSuppliersStatusBatchVariables {
  ids: unknown;
  active: boolean;
  sessionToken?: string | null;
}

export interface SettlePlatformInvoiceData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface SettlePlatformInvoiceVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface StockBalance_Key {
  branchId: UUIDString;
  productId: UUIDString;
  __typename?: 'StockBalance_Key';
}

export interface StockMovementType_Key {
  id: UUIDString;
  __typename?: 'StockMovementType_Key';
}

export interface StockMovement_Key {
  id: UUIDString;
  __typename?: 'StockMovement_Key';
}

export interface StockOperationDetailsData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface StockOperationDetailsVariables {
  operationId: string;
  requestKey: string;
  sessionToken?: string | null;
}

export interface StockTransferItem_Key {
  id: UUIDString;
  __typename?: 'StockTransferItem_Key';
}

export interface StockTransfer_Key {
  id: UUIDString;
  __typename?: 'StockTransfer_Key';
}

export interface StockWorkspaceData {
  session?: unknown | null;
  _select?: unknown[] | null;
}

export interface StockWorkspaceVariables {
  requestKey: string;
  filters?: unknown | null;
  limit?: number | null;
  offset?: number | null;
  sortField?: string | null;
  sortDirection?: string | null;
  sessionToken?: string | null;
}

export interface Subcategory_Key {
  id: UUIDString;
  __typename?: 'Subcategory_Key';
}

export interface Supplier_Key {
  id: UUIDString;
  __typename?: 'Supplier_Key';
}

export interface SystemApplySalesChannelOrderEventData {
  _execute?: number | null;
}

export interface SystemApplySalesChannelOrderEventVariables {
  connectionId: UUIDString;
  providerOrderId: string;
  payload: unknown;
}

export interface SystemClaimSalesChannelWorkData {
  _execute?: number | null;
}

export interface SystemClaimSalesChannelWorkVariables {
  provider: string;
  workerId: string;
  limit: number;
}

export interface SystemIfoodConnectionByMerchantData {
  _select?: unknown[] | null;
}

export interface SystemIfoodConnectionByMerchantVariables {
  merchantId: string;
  requestKey: string;
}

export interface SystemIfoodConnectionsByMerchantsData {
  _select?: unknown[] | null;
}

export interface SystemIfoodConnectionsByMerchantsVariables {
  merchantIds: unknown;
  requestKey: string;
}

export interface SystemIfoodConnectionsForPollingData {
  _select?: unknown[] | null;
}

export interface SystemIfoodConnectionsForPollingVariables {
  requestKey: string;
}

export interface SystemIngestSalesChannelOrderData {
  _execute?: number | null;
}

export interface SystemIngestSalesChannelOrderVariables {
  connectionId: UUIDString;
  payload: unknown;
}

export interface SystemMarkSalesChannelWebhookActiveData {
  _execute?: number | null;
}

export interface SystemMarkSalesChannelWebhookActiveVariables {
  connectionIds: unknown;
  requestId: string;
}

export interface SystemPurgeExpiredSalesChannelPayloadsData {
  _execute?: number | null;
}

export interface SystemPurgeExpiredSalesChannelPayloadsVariables {
  requestKey: string;
}

export interface SystemQueueDueSalesChannelSyncJobsData {
  _execute?: number | null;
}

export interface SystemQueueDueSalesChannelSyncJobsVariables {
  requestKey: string;
}

export interface SystemReconcileSalesChannelCommerceData {
  _execute?: number | null;
}

export interface SystemReconcileSalesChannelCommerceVariables {
  connectionId: UUIDString;
  providerOrderId: string;
  payload: unknown;
}

export interface SystemRecordSalesChannelCommandResultData {
  _execute?: number | null;
}

export interface SystemRecordSalesChannelCommandResultVariables {
  commandId: UUIDString;
  workerId: string;
  payload: unknown;
}

export interface SystemRecordSalesChannelEventResultData {
  _execute?: number | null;
}

export interface SystemRecordSalesChannelEventResultVariables {
  eventId: UUIDString;
  workerId: string;
  payload: unknown;
}

export interface SystemRecordSalesChannelMappingResultData {
  _execute?: number | null;
}

export interface SystemRecordSalesChannelMappingResultVariables {
  mappingId: UUIDString;
  payload: unknown;
}

export interface SystemRecordSalesChannelSyncResultData {
  _execute?: number | null;
}

export interface SystemRecordSalesChannelSyncResultVariables {
  jobId: UUIDString;
  workerId: string;
  payload: unknown;
}

export interface SystemRefreshSalesChannelOrderAfterPickingData {
  _execute?: number | null;
}

export interface SystemRefreshSalesChannelOrderAfterPickingVariables {
  commandId: UUIDString;
  payload: unknown;
}

export interface SystemRegisterSalesChannelEventData {
  _execute?: number | null;
}

export interface SystemRegisterSalesChannelEventVariables {
  connectionId: UUIDString;
  payload: unknown;
}

export interface SystemRegisterSalesChannelEventsData {
  _execute?: number | null;
}

export interface SystemRegisterSalesChannelEventsVariables {
  connectionId: UUIDString;
  payloads: unknown;
}

export interface SystemSalesChannelConnectionForActorData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelConnectionForActorVariables {
  userId: string;
  connectionId: UUIDString;
  sessionToken?: string | null;
}

export interface SystemSalesChannelHealthMetricsData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelHealthMetricsVariables {
  requestKey: string;
}

export interface SystemSalesChannelMappingsForSyncData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelMappingsForSyncVariables {
  jobId: UUIDString;
  workerId: string;
  requestKey: string;
}

export interface SystemSalesChannelOrderForActorData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelOrderForActorVariables {
  userId: string;
  orderId: UUIDString;
  sessionToken?: string | null;
}

export interface SystemSalesChannelWorkQueueData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelWorkQueueVariables {
  workerId: string;
  requestKey: string;
}

export interface SystemUpdateSalesChannelConnectionData {
  _execute?: number | null;
}

export interface SystemUpdateSalesChannelConnectionVariables {
  connectionId: UUIDString;
  payload: unknown;
}

export interface SystemUpsertSalesChannelFinancialEventsData {
  _execute?: number | null;
}

export interface SystemUpsertSalesChannelFinancialEventsVariables {
  connectionId: UUIDString;
  jobId: UUIDString;
  workerId: string;
  payloads: unknown;
}

export interface TenantBillingProfile_Key {
  tenantId: UUIDString;
  __typename?: 'TenantBillingProfile_Key';
}

export interface TenantInvoice_Key {
  id: UUIDString;
  __typename?: 'TenantInvoice_Key';
}

export interface TenantPayment_Key {
  id: UUIDString;
  __typename?: 'TenantPayment_Key';
}

export interface Tenant_Key {
  id: UUIDString;
  __typename?: 'Tenant_Key';
}

export interface TouchDeviceSessionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface TouchDeviceSessionVariables {
  sessionToken: string;
}

export interface UpdateCategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdateCategoryVariables {
  id: UUIDString;
  name: string;
  sessionToken?: string | null;
}

export interface UpdatePlatformInvoiceData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdatePlatformInvoiceVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface UpdatePlatformTenantData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdatePlatformTenantVariables {
  payload: unknown;
  sessionToken?: string | null;
}

export interface UpdatePosPolicyData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdatePosPolicyVariables {
  requireOpenSession: boolean;
  operatorDiscountPercent: number;
  operatorSurchargePercent: number;
  allowOperatorClose: boolean;
  operatorWithdrawalLimitCents?: Int64String | null;
  operatorCloseDifferenceLimitCents?: Int64String | null;
  sessionToken?: string | null;
}

export interface UpdateSalesChannelConnectionData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdateSalesChannelConnectionVariables {
  id: UUIDString;
  displayName: string;
  externalStoreId: string;
  enabled: boolean;
  sessionToken?: string | null;
}

export interface UpdateSalesChannelProductMappingData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdateSalesChannelProductMappingVariables {
  id: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
  enabled: boolean;
  priceMode?: string;
  customPriceCents?: Int64String | null;
  remoteProductState?: string;
  sessionToken?: string | null;
}

export interface UpdateSubcategoryData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface UpdateSubcategoryVariables {
  id: UUIDString;
  categoryId: UUIDString;
  name: string;
  sessionToken?: string | null;
}

export interface UserBranch_Key {
  userId: string;
  branchId: UUIDString;
  __typename?: 'UserBranch_Key';
}

export interface UserDeviceSession_Key {
  userId: string;
  __typename?: 'UserDeviceSession_Key';
}

export interface UserPagePermission_Key {
  userId: string;
  pageId: UUIDString;
  __typename?: 'UserPagePermission_Key';
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

export interface ValidateDeviceSessionData {
  _select?: unknown[] | null;
}

export interface ValidateDeviceSessionVariables {
  sessionToken: string;
  requestKey: string;
}

export interface VerifySalesChannelOrderConstraintsData {
  _select?: unknown[] | null;
}

export interface VoidPlatformInvoiceData {
  query?: {
    session?: unknown | null;
  };
  _execute?: number | null;
}

export interface VoidPlatformInvoiceVariables {
  invoiceId: UUIDString;
  reason: string;
  expectedVersion: Int64String;
  sessionToken?: string | null;
}

interface VerifySalesChannelOrderConstraintsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<VerifySalesChannelOrderConstraintsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<VerifySalesChannelOrderConstraintsData, undefined>;
  operationName: string;
}
export const verifySalesChannelOrderConstraintsRef: VerifySalesChannelOrderConstraintsRef;

export function verifySalesChannelOrderConstraints(options?: ExecuteQueryOptions): QueryPromise<VerifySalesChannelOrderConstraintsData, undefined>;
export function verifySalesChannelOrderConstraints(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<VerifySalesChannelOrderConstraintsData, undefined>;

interface BootstrapSalesChannelsNavigationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapSalesChannelsNavigationVariables): MutationRef<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BootstrapSalesChannelsNavigationVariables): MutationRef<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
  operationName: string;
}
export const bootstrapSalesChannelsNavigationRef: BootstrapSalesChannelsNavigationRef;

export function bootstrapSalesChannelsNavigation(vars: BootstrapSalesChannelsNavigationVariables): MutationPromise<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
export function bootstrapSalesChannelsNavigation(dc: DataConnect, vars: BootstrapSalesChannelsNavigationVariables): MutationPromise<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;

interface BootstrapSalesChannelsNavigationV2Ref {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<BootstrapSalesChannelsNavigationV2Data, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<BootstrapSalesChannelsNavigationV2Data, undefined>;
  operationName: string;
}
export const bootstrapSalesChannelsNavigationV2Ref: BootstrapSalesChannelsNavigationV2Ref;

export function bootstrapSalesChannelsNavigationV2(): MutationPromise<BootstrapSalesChannelsNavigationV2Data, undefined>;
export function bootstrapSalesChannelsNavigationV2(dc: DataConnect): MutationPromise<BootstrapSalesChannelsNavigationV2Data, undefined>;

interface BootstrapNavigationCatalogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapNavigationCatalogVariables): MutationRef<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BootstrapNavigationCatalogVariables): MutationRef<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
  operationName: string;
}
export const bootstrapNavigationCatalogRef: BootstrapNavigationCatalogRef;

export function bootstrapNavigationCatalog(vars: BootstrapNavigationCatalogVariables): MutationPromise<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
export function bootstrapNavigationCatalog(dc: DataConnect, vars: BootstrapNavigationCatalogVariables): MutationPromise<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;

interface CreateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
  operationName: string;
}
export const createCategoryRef: CreateCategoryRef;

export function createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;
export function createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface UpdateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
  operationName: string;
}
export const updateCategoryRef: UpdateCategoryRef;

export function updateCategory(vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;
export function updateCategory(dc: DataConnect, vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface ArchiveCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveCategoryVariables): MutationRef<ArchiveCategoryData, ArchiveCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ArchiveCategoryVariables): MutationRef<ArchiveCategoryData, ArchiveCategoryVariables>;
  operationName: string;
}
export const archiveCategoryRef: ArchiveCategoryRef;

export function archiveCategory(vars: ArchiveCategoryVariables): MutationPromise<ArchiveCategoryData, ArchiveCategoryVariables>;
export function archiveCategory(dc: DataConnect, vars: ArchiveCategoryVariables): MutationPromise<ArchiveCategoryData, ArchiveCategoryVariables>;

interface CreateSubcategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubcategoryVariables): MutationRef<CreateSubcategoryData, CreateSubcategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSubcategoryVariables): MutationRef<CreateSubcategoryData, CreateSubcategoryVariables>;
  operationName: string;
}
export const createSubcategoryRef: CreateSubcategoryRef;

export function createSubcategory(vars: CreateSubcategoryVariables): MutationPromise<CreateSubcategoryData, CreateSubcategoryVariables>;
export function createSubcategory(dc: DataConnect, vars: CreateSubcategoryVariables): MutationPromise<CreateSubcategoryData, CreateSubcategoryVariables>;

interface UpdateSubcategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubcategoryVariables): MutationRef<UpdateSubcategoryData, UpdateSubcategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSubcategoryVariables): MutationRef<UpdateSubcategoryData, UpdateSubcategoryVariables>;
  operationName: string;
}
export const updateSubcategoryRef: UpdateSubcategoryRef;

export function updateSubcategory(vars: UpdateSubcategoryVariables): MutationPromise<UpdateSubcategoryData, UpdateSubcategoryVariables>;
export function updateSubcategory(dc: DataConnect, vars: UpdateSubcategoryVariables): MutationPromise<UpdateSubcategoryData, UpdateSubcategoryVariables>;

interface ArchiveSubcategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSubcategoryVariables): MutationRef<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ArchiveSubcategoryVariables): MutationRef<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
  operationName: string;
}
export const archiveSubcategoryRef: ArchiveSubcategoryRef;

export function archiveSubcategory(vars: ArchiveSubcategoryVariables): MutationPromise<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
export function archiveSubcategory(dc: DataConnect, vars: ArchiveSubcategoryVariables): MutationPromise<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;

interface RestoreCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreCategoryVariables): MutationRef<RestoreCategoryData, RestoreCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RestoreCategoryVariables): MutationRef<RestoreCategoryData, RestoreCategoryVariables>;
  operationName: string;
}
export const restoreCategoryRef: RestoreCategoryRef;

export function restoreCategory(vars: RestoreCategoryVariables): MutationPromise<RestoreCategoryData, RestoreCategoryVariables>;
export function restoreCategory(dc: DataConnect, vars: RestoreCategoryVariables): MutationPromise<RestoreCategoryData, RestoreCategoryVariables>;

interface RestoreSubcategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreSubcategoryVariables): MutationRef<RestoreSubcategoryData, RestoreSubcategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RestoreSubcategoryVariables): MutationRef<RestoreSubcategoryData, RestoreSubcategoryVariables>;
  operationName: string;
}
export const restoreSubcategoryRef: RestoreSubcategoryRef;

export function restoreSubcategory(vars: RestoreSubcategoryVariables): MutationPromise<RestoreSubcategoryData, RestoreSubcategoryVariables>;
export function restoreSubcategory(dc: DataConnect, vars: RestoreSubcategoryVariables): MutationPromise<RestoreSubcategoryData, RestoreSubcategoryVariables>;

interface CreateCategoriesBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoriesBatchVariables): MutationRef<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCategoriesBatchVariables): MutationRef<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
  operationName: string;
}
export const createCategoriesBatchRef: CreateCategoriesBatchRef;

export function createCategoriesBatch(vars: CreateCategoriesBatchVariables): MutationPromise<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
export function createCategoriesBatch(dc: DataConnect, vars: CreateCategoriesBatchVariables): MutationPromise<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;

interface CreateSubcategoriesBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubcategoriesBatchVariables): MutationRef<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSubcategoriesBatchVariables): MutationRef<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
  operationName: string;
}
export const createSubcategoriesBatchRef: CreateSubcategoriesBatchRef;

export function createSubcategoriesBatch(vars: CreateSubcategoriesBatchVariables): MutationPromise<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
export function createSubcategoriesBatch(dc: DataConnect, vars: CreateSubcategoriesBatchVariables): MutationPromise<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;

interface SaveBranchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveBranchVariables): MutationRef<SaveBranchData, SaveBranchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveBranchVariables): MutationRef<SaveBranchData, SaveBranchVariables>;
  operationName: string;
}
export const saveBranchRef: SaveBranchRef;

export function saveBranch(vars: SaveBranchVariables): MutationPromise<SaveBranchData, SaveBranchVariables>;
export function saveBranch(dc: DataConnect, vars: SaveBranchVariables): MutationPromise<SaveBranchData, SaveBranchVariables>;

interface SetBranchStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetBranchStatusVariables): MutationRef<SetBranchStatusData, SetBranchStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetBranchStatusVariables): MutationRef<SetBranchStatusData, SetBranchStatusVariables>;
  operationName: string;
}
export const setBranchStatusRef: SetBranchStatusRef;

export function setBranchStatus(vars: SetBranchStatusVariables): MutationPromise<SetBranchStatusData, SetBranchStatusVariables>;
export function setBranchStatus(dc: DataConnect, vars: SetBranchStatusVariables): MutationPromise<SetBranchStatusData, SetBranchStatusVariables>;

interface SaveSupplierRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveSupplierVariables): MutationRef<SaveSupplierData, SaveSupplierVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveSupplierVariables): MutationRef<SaveSupplierData, SaveSupplierVariables>;
  operationName: string;
}
export const saveSupplierRef: SaveSupplierRef;

export function saveSupplier(vars: SaveSupplierVariables): MutationPromise<SaveSupplierData, SaveSupplierVariables>;
export function saveSupplier(dc: DataConnect, vars: SaveSupplierVariables): MutationPromise<SaveSupplierData, SaveSupplierVariables>;

interface SetSupplierStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSupplierStatusVariables): MutationRef<SetSupplierStatusData, SetSupplierStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetSupplierStatusVariables): MutationRef<SetSupplierStatusData, SetSupplierStatusVariables>;
  operationName: string;
}
export const setSupplierStatusRef: SetSupplierStatusRef;

export function setSupplierStatus(vars: SetSupplierStatusVariables): MutationPromise<SetSupplierStatusData, SetSupplierStatusVariables>;
export function setSupplierStatus(dc: DataConnect, vars: SetSupplierStatusVariables): MutationPromise<SetSupplierStatusData, SetSupplierStatusVariables>;

interface SaveCustomerRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCustomerVariables): MutationRef<SaveCustomerData, SaveCustomerVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveCustomerVariables): MutationRef<SaveCustomerData, SaveCustomerVariables>;
  operationName: string;
}
export const saveCustomerRef: SaveCustomerRef;

export function saveCustomer(vars: SaveCustomerVariables): MutationPromise<SaveCustomerData, SaveCustomerVariables>;
export function saveCustomer(dc: DataConnect, vars: SaveCustomerVariables): MutationPromise<SaveCustomerData, SaveCustomerVariables>;

interface SetCustomerStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCustomerStatusVariables): MutationRef<SetCustomerStatusData, SetCustomerStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetCustomerStatusVariables): MutationRef<SetCustomerStatusData, SetCustomerStatusVariables>;
  operationName: string;
}
export const setCustomerStatusRef: SetCustomerStatusRef;

export function setCustomerStatus(vars: SetCustomerStatusVariables): MutationPromise<SetCustomerStatusData, SetCustomerStatusVariables>;
export function setCustomerStatus(dc: DataConnect, vars: SetCustomerStatusVariables): MutationPromise<SetCustomerStatusData, SetCustomerStatusVariables>;

interface SaveProductRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveProductVariables): MutationRef<SaveProductData, SaveProductVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveProductVariables): MutationRef<SaveProductData, SaveProductVariables>;
  operationName: string;
}
export const saveProductRef: SaveProductRef;

export function saveProduct(vars: SaveProductVariables): MutationPromise<SaveProductData, SaveProductVariables>;
export function saveProduct(dc: DataConnect, vars: SaveProductVariables): MutationPromise<SaveProductData, SaveProductVariables>;

interface SetProductStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetProductStatusVariables): MutationRef<SetProductStatusData, SetProductStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetProductStatusVariables): MutationRef<SetProductStatusData, SetProductStatusVariables>;
  operationName: string;
}
export const setProductStatusRef: SetProductStatusRef;

export function setProductStatus(vars: SetProductStatusVariables): MutationPromise<SetProductStatusData, SetProductStatusVariables>;
export function setProductStatus(dc: DataConnect, vars: SetProductStatusVariables): MutationPromise<SetProductStatusData, SetProductStatusVariables>;

interface SaveProductComponentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveProductComponentsVariables): MutationRef<SaveProductComponentsData, SaveProductComponentsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveProductComponentsVariables): MutationRef<SaveProductComponentsData, SaveProductComponentsVariables>;
  operationName: string;
}
export const saveProductComponentsRef: SaveProductComponentsRef;

export function saveProductComponents(vars: SaveProductComponentsVariables): MutationPromise<SaveProductComponentsData, SaveProductComponentsVariables>;
export function saveProductComponents(dc: DataConnect, vars: SaveProductComponentsVariables): MutationPromise<SaveProductComponentsData, SaveProductComponentsVariables>;

interface SavePromotionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePromotionVariables): MutationRef<SavePromotionData, SavePromotionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SavePromotionVariables): MutationRef<SavePromotionData, SavePromotionVariables>;
  operationName: string;
}
export const savePromotionRef: SavePromotionRef;

export function savePromotion(vars: SavePromotionVariables): MutationPromise<SavePromotionData, SavePromotionVariables>;
export function savePromotion(dc: DataConnect, vars: SavePromotionVariables): MutationPromise<SavePromotionData, SavePromotionVariables>;

interface SetPromotionStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPromotionStatusVariables): MutationRef<SetPromotionStatusData, SetPromotionStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetPromotionStatusVariables): MutationRef<SetPromotionStatusData, SetPromotionStatusVariables>;
  operationName: string;
}
export const setPromotionStatusRef: SetPromotionStatusRef;

export function setPromotionStatus(vars: SetPromotionStatusVariables): MutationPromise<SetPromotionStatusData, SetPromotionStatusVariables>;
export function setPromotionStatus(dc: DataConnect, vars: SetPromotionStatusVariables): MutationPromise<SetPromotionStatusData, SetPromotionStatusVariables>;

interface SetCategoriesStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCategoriesStatusBatchVariables): MutationRef<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetCategoriesStatusBatchVariables): MutationRef<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
  operationName: string;
}
export const setCategoriesStatusBatchRef: SetCategoriesStatusBatchRef;

export function setCategoriesStatusBatch(vars: SetCategoriesStatusBatchVariables): MutationPromise<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
export function setCategoriesStatusBatch(dc: DataConnect, vars: SetCategoriesStatusBatchVariables): MutationPromise<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;

interface SetSubcategoriesStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSubcategoriesStatusBatchVariables): MutationRef<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetSubcategoriesStatusBatchVariables): MutationRef<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
  operationName: string;
}
export const setSubcategoriesStatusBatchRef: SetSubcategoriesStatusBatchRef;

export function setSubcategoriesStatusBatch(vars: SetSubcategoriesStatusBatchVariables): MutationPromise<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
export function setSubcategoriesStatusBatch(dc: DataConnect, vars: SetSubcategoriesStatusBatchVariables): MutationPromise<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;

interface SetBranchesStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetBranchesStatusBatchVariables): MutationRef<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetBranchesStatusBatchVariables): MutationRef<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
  operationName: string;
}
export const setBranchesStatusBatchRef: SetBranchesStatusBatchRef;

export function setBranchesStatusBatch(vars: SetBranchesStatusBatchVariables): MutationPromise<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
export function setBranchesStatusBatch(dc: DataConnect, vars: SetBranchesStatusBatchVariables): MutationPromise<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;

interface SetSuppliersStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSuppliersStatusBatchVariables): MutationRef<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetSuppliersStatusBatchVariables): MutationRef<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
  operationName: string;
}
export const setSuppliersStatusBatchRef: SetSuppliersStatusBatchRef;

export function setSuppliersStatusBatch(vars: SetSuppliersStatusBatchVariables): MutationPromise<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
export function setSuppliersStatusBatch(dc: DataConnect, vars: SetSuppliersStatusBatchVariables): MutationPromise<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;

interface SetCustomersStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCustomersStatusBatchVariables): MutationRef<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetCustomersStatusBatchVariables): MutationRef<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
  operationName: string;
}
export const setCustomersStatusBatchRef: SetCustomersStatusBatchRef;

export function setCustomersStatusBatch(vars: SetCustomersStatusBatchVariables): MutationPromise<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
export function setCustomersStatusBatch(dc: DataConnect, vars: SetCustomersStatusBatchVariables): MutationPromise<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;

interface SetProductsStatusBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetProductsStatusBatchVariables): MutationRef<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetProductsStatusBatchVariables): MutationRef<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
  operationName: string;
}
export const setProductsStatusBatchRef: SetProductsStatusBatchRef;

export function setProductsStatusBatch(vars: SetProductsStatusBatchVariables): MutationPromise<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
export function setProductsStatusBatch(dc: DataConnect, vars: SetProductsStatusBatchVariables): MutationPromise<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;

interface EnsureSalesDefaultsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: EnsureSalesDefaultsVariables): MutationRef<EnsureSalesDefaultsData, EnsureSalesDefaultsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: EnsureSalesDefaultsVariables): MutationRef<EnsureSalesDefaultsData, EnsureSalesDefaultsVariables>;
  operationName: string;
}
export const ensureSalesDefaultsRef: EnsureSalesDefaultsRef;

export function ensureSalesDefaults(vars?: EnsureSalesDefaultsVariables): MutationPromise<EnsureSalesDefaultsData, EnsureSalesDefaultsVariables>;
export function ensureSalesDefaults(dc: DataConnect, vars?: EnsureSalesDefaultsVariables): MutationPromise<EnsureSalesDefaultsData, EnsureSalesDefaultsVariables>;

interface PostSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostSaleVariables): MutationRef<PostSaleData, PostSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PostSaleVariables): MutationRef<PostSaleData, PostSaleVariables>;
  operationName: string;
}
export const postSaleRef: PostSaleRef;

export function postSale(vars: PostSaleVariables): MutationPromise<PostSaleData, PostSaleVariables>;
export function postSale(dc: DataConnect, vars: PostSaleVariables): MutationPromise<PostSaleData, PostSaleVariables>;

interface CancelSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelSaleVariables): MutationRef<CancelSaleData, CancelSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CancelSaleVariables): MutationRef<CancelSaleData, CancelSaleVariables>;
  operationName: string;
}
export const cancelSaleRef: CancelSaleRef;

export function cancelSale(vars: CancelSaleVariables): MutationPromise<CancelSaleData, CancelSaleVariables>;
export function cancelSale(dc: DataConnect, vars: CancelSaleVariables): MutationPromise<CancelSaleData, CancelSaleVariables>;

interface CreatePlatformTenantRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformTenantVariables): MutationRef<CreatePlatformTenantData, CreatePlatformTenantVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePlatformTenantVariables): MutationRef<CreatePlatformTenantData, CreatePlatformTenantVariables>;
  operationName: string;
}
export const createPlatformTenantRef: CreatePlatformTenantRef;

export function createPlatformTenant(vars: CreatePlatformTenantVariables): MutationPromise<CreatePlatformTenantData, CreatePlatformTenantVariables>;
export function createPlatformTenant(dc: DataConnect, vars: CreatePlatformTenantVariables): MutationPromise<CreatePlatformTenantData, CreatePlatformTenantVariables>;

interface UpdatePlatformTenantRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlatformTenantVariables): MutationRef<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePlatformTenantVariables): MutationRef<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;
  operationName: string;
}
export const updatePlatformTenantRef: UpdatePlatformTenantRef;

export function updatePlatformTenant(vars: UpdatePlatformTenantVariables): MutationPromise<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;
export function updatePlatformTenant(dc: DataConnect, vars: UpdatePlatformTenantVariables): MutationPromise<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;

interface SetPlatformTenantStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformTenantStatusVariables): MutationRef<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetPlatformTenantStatusVariables): MutationRef<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
  operationName: string;
}
export const setPlatformTenantStatusRef: SetPlatformTenantStatusRef;

export function setPlatformTenantStatus(vars: SetPlatformTenantStatusVariables): MutationPromise<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
export function setPlatformTenantStatus(dc: DataConnect, vars: SetPlatformTenantStatusVariables): MutationPromise<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;

interface LinkPlatformUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: LinkPlatformUserVariables): MutationRef<LinkPlatformUserData, LinkPlatformUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: LinkPlatformUserVariables): MutationRef<LinkPlatformUserData, LinkPlatformUserVariables>;
  operationName: string;
}
export const linkPlatformUserRef: LinkPlatformUserRef;

export function linkPlatformUser(vars: LinkPlatformUserVariables): MutationPromise<LinkPlatformUserData, LinkPlatformUserVariables>;
export function linkPlatformUser(dc: DataConnect, vars: LinkPlatformUserVariables): MutationPromise<LinkPlatformUserData, LinkPlatformUserVariables>;

interface SetPlatformUserStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformUserStatusVariables): MutationRef<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetPlatformUserStatusVariables): MutationRef<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
  operationName: string;
}
export const setPlatformUserStatusRef: SetPlatformUserStatusRef;

export function setPlatformUserStatus(vars: SetPlatformUserStatusVariables): MutationPromise<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
export function setPlatformUserStatus(dc: DataConnect, vars: SetPlatformUserStatusVariables): MutationPromise<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;

interface SetPlatformRolePermissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformRolePermissionVariables): MutationRef<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetPlatformRolePermissionVariables): MutationRef<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
  operationName: string;
}
export const setPlatformRolePermissionRef: SetPlatformRolePermissionRef;

export function setPlatformRolePermission(vars: SetPlatformRolePermissionVariables): MutationPromise<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
export function setPlatformRolePermission(dc: DataConnect, vars: SetPlatformRolePermissionVariables): MutationPromise<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;

interface CreatePlatformInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformInvoiceVariables): MutationRef<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePlatformInvoiceVariables): MutationRef<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;
  operationName: string;
}
export const createPlatformInvoiceRef: CreatePlatformInvoiceRef;

export function createPlatformInvoice(vars: CreatePlatformInvoiceVariables): MutationPromise<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;
export function createPlatformInvoice(dc: DataConnect, vars: CreatePlatformInvoiceVariables): MutationPromise<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;

interface UpdatePlatformInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlatformInvoiceVariables): MutationRef<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePlatformInvoiceVariables): MutationRef<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;
  operationName: string;
}
export const updatePlatformInvoiceRef: UpdatePlatformInvoiceRef;

export function updatePlatformInvoice(vars: UpdatePlatformInvoiceVariables): MutationPromise<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;
export function updatePlatformInvoice(dc: DataConnect, vars: UpdatePlatformInvoiceVariables): MutationPromise<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;

interface VoidPlatformInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: VoidPlatformInvoiceVariables): MutationRef<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: VoidPlatformInvoiceVariables): MutationRef<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;
  operationName: string;
}
export const voidPlatformInvoiceRef: VoidPlatformInvoiceRef;

export function voidPlatformInvoice(vars: VoidPlatformInvoiceVariables): MutationPromise<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;
export function voidPlatformInvoice(dc: DataConnect, vars: VoidPlatformInvoiceVariables): MutationPromise<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;

interface SettlePlatformInvoiceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SettlePlatformInvoiceVariables): MutationRef<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SettlePlatformInvoiceVariables): MutationRef<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;
  operationName: string;
}
export const settlePlatformInvoiceRef: SettlePlatformInvoiceRef;

export function settlePlatformInvoice(vars: SettlePlatformInvoiceVariables): MutationPromise<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;
export function settlePlatformInvoice(dc: DataConnect, vars: SettlePlatformInvoiceVariables): MutationPromise<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;

interface ReversePlatformPaymentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReversePlatformPaymentVariables): MutationRef<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReversePlatformPaymentVariables): MutationRef<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;
  operationName: string;
}
export const reversePlatformPaymentRef: ReversePlatformPaymentRef;

export function reversePlatformPayment(vars: ReversePlatformPaymentVariables): MutationPromise<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;
export function reversePlatformPayment(dc: DataConnect, vars: ReversePlatformPaymentVariables): MutationPromise<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;

interface PostStockAdjustmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostStockAdjustmentVariables): MutationRef<PostStockAdjustmentData, PostStockAdjustmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PostStockAdjustmentVariables): MutationRef<PostStockAdjustmentData, PostStockAdjustmentVariables>;
  operationName: string;
}
export const postStockAdjustmentRef: PostStockAdjustmentRef;

export function postStockAdjustment(vars: PostStockAdjustmentVariables): MutationPromise<PostStockAdjustmentData, PostStockAdjustmentVariables>;
export function postStockAdjustment(dc: DataConnect, vars: PostStockAdjustmentVariables): MutationPromise<PostStockAdjustmentData, PostStockAdjustmentVariables>;

interface PostStockTransferRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostStockTransferVariables): MutationRef<PostStockTransferData, PostStockTransferVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PostStockTransferVariables): MutationRef<PostStockTransferData, PostStockTransferVariables>;
  operationName: string;
}
export const postStockTransferRef: PostStockTransferRef;

export function postStockTransfer(vars: PostStockTransferVariables): MutationPromise<PostStockTransferData, PostStockTransferVariables>;
export function postStockTransfer(dc: DataConnect, vars: PostStockTransferVariables): MutationPromise<PostStockTransferData, PostStockTransferVariables>;

interface SaveStockBatchRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveStockBatchVariables): MutationRef<SaveStockBatchData, SaveStockBatchVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaveStockBatchVariables): MutationRef<SaveStockBatchData, SaveStockBatchVariables>;
  operationName: string;
}
export const saveStockBatchRef: SaveStockBatchRef;

export function saveStockBatch(vars: SaveStockBatchVariables): MutationPromise<SaveStockBatchData, SaveStockBatchVariables>;
export function saveStockBatch(dc: DataConnect, vars: SaveStockBatchVariables): MutationPromise<SaveStockBatchData, SaveStockBatchVariables>;

interface ReverseStockOperationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReverseStockOperationVariables): MutationRef<ReverseStockOperationData, ReverseStockOperationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReverseStockOperationVariables): MutationRef<ReverseStockOperationData, ReverseStockOperationVariables>;
  operationName: string;
}
export const reverseStockOperationRef: ReverseStockOperationRef;

export function reverseStockOperation(vars: ReverseStockOperationVariables): MutationPromise<ReverseStockOperationData, ReverseStockOperationVariables>;
export function reverseStockOperation(dc: DataConnect, vars: ReverseStockOperationVariables): MutationPromise<ReverseStockOperationData, ReverseStockOperationVariables>;

interface OpenCashSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: OpenCashSessionVariables): MutationRef<OpenCashSessionData, OpenCashSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: OpenCashSessionVariables): MutationRef<OpenCashSessionData, OpenCashSessionVariables>;
  operationName: string;
}
export const openCashSessionRef: OpenCashSessionRef;

export function openCashSession(vars: OpenCashSessionVariables): MutationPromise<OpenCashSessionData, OpenCashSessionVariables>;
export function openCashSession(dc: DataConnect, vars: OpenCashSessionVariables): MutationPromise<OpenCashSessionData, OpenCashSessionVariables>;

interface RegisterCashMovementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterCashMovementVariables): MutationRef<RegisterCashMovementData, RegisterCashMovementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegisterCashMovementVariables): MutationRef<RegisterCashMovementData, RegisterCashMovementVariables>;
  operationName: string;
}
export const registerCashMovementRef: RegisterCashMovementRef;

export function registerCashMovement(vars: RegisterCashMovementVariables): MutationPromise<RegisterCashMovementData, RegisterCashMovementVariables>;
export function registerCashMovement(dc: DataConnect, vars: RegisterCashMovementVariables): MutationPromise<RegisterCashMovementData, RegisterCashMovementVariables>;

interface ClaimDeviceSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClaimDeviceSessionVariables): MutationRef<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ClaimDeviceSessionVariables): MutationRef<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
  operationName: string;
}
export const claimDeviceSessionRef: ClaimDeviceSessionRef;

export function claimDeviceSession(vars: ClaimDeviceSessionVariables): MutationPromise<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
export function claimDeviceSession(dc: DataConnect, vars: ClaimDeviceSessionVariables): MutationPromise<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;

interface TouchDeviceSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TouchDeviceSessionVariables): MutationRef<TouchDeviceSessionData, TouchDeviceSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TouchDeviceSessionVariables): MutationRef<TouchDeviceSessionData, TouchDeviceSessionVariables>;
  operationName: string;
}
export const touchDeviceSessionRef: TouchDeviceSessionRef;

export function touchDeviceSession(vars: TouchDeviceSessionVariables): MutationPromise<TouchDeviceSessionData, TouchDeviceSessionVariables>;
export function touchDeviceSession(dc: DataConnect, vars: TouchDeviceSessionVariables): MutationPromise<TouchDeviceSessionData, TouchDeviceSessionVariables>;

interface ReleaseDeviceSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReleaseDeviceSessionVariables): MutationRef<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ReleaseDeviceSessionVariables): MutationRef<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
  operationName: string;
}
export const releaseDeviceSessionRef: ReleaseDeviceSessionRef;

export function releaseDeviceSession(vars: ReleaseDeviceSessionVariables): MutationPromise<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
export function releaseDeviceSession(dc: DataConnect, vars: ReleaseDeviceSessionVariables): MutationPromise<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;

interface CreateSalesChannelConnectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSalesChannelConnectionVariables): MutationRef<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSalesChannelConnectionVariables): MutationRef<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
  operationName: string;
}
export const createSalesChannelConnectionRef: CreateSalesChannelConnectionRef;

export function createSalesChannelConnection(vars: CreateSalesChannelConnectionVariables): MutationPromise<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
export function createSalesChannelConnection(dc: DataConnect, vars: CreateSalesChannelConnectionVariables): MutationPromise<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;

interface UpdateSalesChannelConnectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSalesChannelConnectionVariables): MutationRef<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSalesChannelConnectionVariables): MutationRef<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
  operationName: string;
}
export const updateSalesChannelConnectionRef: UpdateSalesChannelConnectionRef;

export function updateSalesChannelConnection(vars: UpdateSalesChannelConnectionVariables): MutationPromise<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
export function updateSalesChannelConnection(dc: DataConnect, vars: UpdateSalesChannelConnectionVariables): MutationPromise<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;

interface ConnectSalesChannelMerchantRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ConnectSalesChannelMerchantVariables): MutationRef<ConnectSalesChannelMerchantData, ConnectSalesChannelMerchantVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ConnectSalesChannelMerchantVariables): MutationRef<ConnectSalesChannelMerchantData, ConnectSalesChannelMerchantVariables>;
  operationName: string;
}
export const connectSalesChannelMerchantRef: ConnectSalesChannelMerchantRef;

export function connectSalesChannelMerchant(vars: ConnectSalesChannelMerchantVariables): MutationPromise<ConnectSalesChannelMerchantData, ConnectSalesChannelMerchantVariables>;
export function connectSalesChannelMerchant(dc: DataConnect, vars: ConnectSalesChannelMerchantVariables): MutationPromise<ConnectSalesChannelMerchantData, ConnectSalesChannelMerchantVariables>;

interface ArchiveSalesChannelConnectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSalesChannelConnectionVariables): MutationRef<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ArchiveSalesChannelConnectionVariables): MutationRef<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
  operationName: string;
}
export const archiveSalesChannelConnectionRef: ArchiveSalesChannelConnectionRef;

export function archiveSalesChannelConnection(vars: ArchiveSalesChannelConnectionVariables): MutationPromise<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
export function archiveSalesChannelConnection(dc: DataConnect, vars: ArchiveSalesChannelConnectionVariables): MutationPromise<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;

interface CreateSalesChannelProductMappingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSalesChannelProductMappingVariables): MutationRef<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSalesChannelProductMappingVariables): MutationRef<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;
  operationName: string;
}
export const createSalesChannelProductMappingRef: CreateSalesChannelProductMappingRef;

export function createSalesChannelProductMapping(vars: CreateSalesChannelProductMappingVariables): MutationPromise<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;
export function createSalesChannelProductMapping(dc: DataConnect, vars: CreateSalesChannelProductMappingVariables): MutationPromise<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;

interface UpdateSalesChannelProductMappingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSalesChannelProductMappingVariables): MutationRef<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSalesChannelProductMappingVariables): MutationRef<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;
  operationName: string;
}
export const updateSalesChannelProductMappingRef: UpdateSalesChannelProductMappingRef;

export function updateSalesChannelProductMapping(vars: UpdateSalesChannelProductMappingVariables): MutationPromise<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;
export function updateSalesChannelProductMapping(dc: DataConnect, vars: UpdateSalesChannelProductMappingVariables): MutationPromise<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;

interface ArchiveSalesChannelProductMappingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSalesChannelProductMappingVariables): MutationRef<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ArchiveSalesChannelProductMappingVariables): MutationRef<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;
  operationName: string;
}
export const archiveSalesChannelProductMappingRef: ArchiveSalesChannelProductMappingRef;

export function archiveSalesChannelProductMapping(vars: ArchiveSalesChannelProductMappingVariables): MutationPromise<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;
export function archiveSalesChannelProductMapping(dc: DataConnect, vars: ArchiveSalesChannelProductMappingVariables): MutationPromise<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;

interface QueueSalesChannelOrderActionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: QueueSalesChannelOrderActionVariables): MutationRef<QueueSalesChannelOrderActionData, QueueSalesChannelOrderActionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: QueueSalesChannelOrderActionVariables): MutationRef<QueueSalesChannelOrderActionData, QueueSalesChannelOrderActionVariables>;
  operationName: string;
}
export const queueSalesChannelOrderActionRef: QueueSalesChannelOrderActionRef;

export function queueSalesChannelOrderAction(vars: QueueSalesChannelOrderActionVariables): MutationPromise<QueueSalesChannelOrderActionData, QueueSalesChannelOrderActionVariables>;
export function queueSalesChannelOrderAction(dc: DataConnect, vars: QueueSalesChannelOrderActionVariables): MutationPromise<QueueSalesChannelOrderActionData, QueueSalesChannelOrderActionVariables>;

interface RetrySalesChannelCommandRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RetrySalesChannelCommandVariables): MutationRef<RetrySalesChannelCommandData, RetrySalesChannelCommandVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RetrySalesChannelCommandVariables): MutationRef<RetrySalesChannelCommandData, RetrySalesChannelCommandVariables>;
  operationName: string;
}
export const retrySalesChannelCommandRef: RetrySalesChannelCommandRef;

export function retrySalesChannelCommand(vars: RetrySalesChannelCommandVariables): MutationPromise<RetrySalesChannelCommandData, RetrySalesChannelCommandVariables>;
export function retrySalesChannelCommand(dc: DataConnect, vars: RetrySalesChannelCommandVariables): MutationPromise<RetrySalesChannelCommandData, RetrySalesChannelCommandVariables>;

interface RetrySalesChannelDecommissioningRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RetrySalesChannelDecommissioningVariables): MutationRef<RetrySalesChannelDecommissioningData, RetrySalesChannelDecommissioningVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RetrySalesChannelDecommissioningVariables): MutationRef<RetrySalesChannelDecommissioningData, RetrySalesChannelDecommissioningVariables>;
  operationName: string;
}
export const retrySalesChannelDecommissioningRef: RetrySalesChannelDecommissioningRef;

export function retrySalesChannelDecommissioning(vars: RetrySalesChannelDecommissioningVariables): MutationPromise<RetrySalesChannelDecommissioningData, RetrySalesChannelDecommissioningVariables>;
export function retrySalesChannelDecommissioning(dc: DataConnect, vars: RetrySalesChannelDecommissioningVariables): MutationPromise<RetrySalesChannelDecommissioningData, RetrySalesChannelDecommissioningVariables>;

interface RequestSalesChannelOrderReconciliationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestSalesChannelOrderReconciliationVariables): MutationRef<RequestSalesChannelOrderReconciliationData, RequestSalesChannelOrderReconciliationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestSalesChannelOrderReconciliationVariables): MutationRef<RequestSalesChannelOrderReconciliationData, RequestSalesChannelOrderReconciliationVariables>;
  operationName: string;
}
export const requestSalesChannelOrderReconciliationRef: RequestSalesChannelOrderReconciliationRef;

export function requestSalesChannelOrderReconciliation(vars: RequestSalesChannelOrderReconciliationVariables): MutationPromise<RequestSalesChannelOrderReconciliationData, RequestSalesChannelOrderReconciliationVariables>;
export function requestSalesChannelOrderReconciliation(dc: DataConnect, vars: RequestSalesChannelOrderReconciliationVariables): MutationPromise<RequestSalesChannelOrderReconciliationData, RequestSalesChannelOrderReconciliationVariables>;

interface AcknowledgeSalesChannelOrderAlertRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AcknowledgeSalesChannelOrderAlertVariables): MutationRef<AcknowledgeSalesChannelOrderAlertData, AcknowledgeSalesChannelOrderAlertVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AcknowledgeSalesChannelOrderAlertVariables): MutationRef<AcknowledgeSalesChannelOrderAlertData, AcknowledgeSalesChannelOrderAlertVariables>;
  operationName: string;
}
export const acknowledgeSalesChannelOrderAlertRef: AcknowledgeSalesChannelOrderAlertRef;

export function acknowledgeSalesChannelOrderAlert(vars: AcknowledgeSalesChannelOrderAlertVariables): MutationPromise<AcknowledgeSalesChannelOrderAlertData, AcknowledgeSalesChannelOrderAlertVariables>;
export function acknowledgeSalesChannelOrderAlert(dc: DataConnect, vars: AcknowledgeSalesChannelOrderAlertVariables): MutationPromise<AcknowledgeSalesChannelOrderAlertData, AcknowledgeSalesChannelOrderAlertVariables>;

interface MapSalesChannelOrderItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MapSalesChannelOrderItemVariables): MutationRef<MapSalesChannelOrderItemData, MapSalesChannelOrderItemVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MapSalesChannelOrderItemVariables): MutationRef<MapSalesChannelOrderItemData, MapSalesChannelOrderItemVariables>;
  operationName: string;
}
export const mapSalesChannelOrderItemRef: MapSalesChannelOrderItemRef;

export function mapSalesChannelOrderItem(vars: MapSalesChannelOrderItemVariables): MutationPromise<MapSalesChannelOrderItemData, MapSalesChannelOrderItemVariables>;
export function mapSalesChannelOrderItem(dc: DataConnect, vars: MapSalesChannelOrderItemVariables): MutationPromise<MapSalesChannelOrderItemData, MapSalesChannelOrderItemVariables>;

interface RequestSalesChannelSyncRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestSalesChannelSyncVariables): MutationRef<RequestSalesChannelSyncData, RequestSalesChannelSyncVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestSalesChannelSyncVariables): MutationRef<RequestSalesChannelSyncData, RequestSalesChannelSyncVariables>;
  operationName: string;
}
export const requestSalesChannelSyncRef: RequestSalesChannelSyncRef;

export function requestSalesChannelSync(vars: RequestSalesChannelSyncVariables): MutationPromise<RequestSalesChannelSyncData, RequestSalesChannelSyncVariables>;
export function requestSalesChannelSync(dc: DataConnect, vars: RequestSalesChannelSyncVariables): MutationPromise<RequestSalesChannelSyncData, RequestSalesChannelSyncVariables>;

interface RequestSalesChannelAuthorizationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestSalesChannelAuthorizationVariables): MutationRef<RequestSalesChannelAuthorizationData, RequestSalesChannelAuthorizationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestSalesChannelAuthorizationVariables): MutationRef<RequestSalesChannelAuthorizationData, RequestSalesChannelAuthorizationVariables>;
  operationName: string;
}
export const requestSalesChannelAuthorizationRef: RequestSalesChannelAuthorizationRef;

export function requestSalesChannelAuthorization(vars: RequestSalesChannelAuthorizationVariables): MutationPromise<RequestSalesChannelAuthorizationData, RequestSalesChannelAuthorizationVariables>;
export function requestSalesChannelAuthorization(dc: DataConnect, vars: RequestSalesChannelAuthorizationVariables): MutationPromise<RequestSalesChannelAuthorizationData, RequestSalesChannelAuthorizationVariables>;

interface SystemClaimSalesChannelWorkRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemClaimSalesChannelWorkVariables): MutationRef<SystemClaimSalesChannelWorkData, SystemClaimSalesChannelWorkVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemClaimSalesChannelWorkVariables): MutationRef<SystemClaimSalesChannelWorkData, SystemClaimSalesChannelWorkVariables>;
  operationName: string;
}
export const systemClaimSalesChannelWorkRef: SystemClaimSalesChannelWorkRef;

export function systemClaimSalesChannelWork(vars: SystemClaimSalesChannelWorkVariables): MutationPromise<SystemClaimSalesChannelWorkData, SystemClaimSalesChannelWorkVariables>;
export function systemClaimSalesChannelWork(dc: DataConnect, vars: SystemClaimSalesChannelWorkVariables): MutationPromise<SystemClaimSalesChannelWorkData, SystemClaimSalesChannelWorkVariables>;

interface SystemUpdateSalesChannelConnectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemUpdateSalesChannelConnectionVariables): MutationRef<SystemUpdateSalesChannelConnectionData, SystemUpdateSalesChannelConnectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemUpdateSalesChannelConnectionVariables): MutationRef<SystemUpdateSalesChannelConnectionData, SystemUpdateSalesChannelConnectionVariables>;
  operationName: string;
}
export const systemUpdateSalesChannelConnectionRef: SystemUpdateSalesChannelConnectionRef;

export function systemUpdateSalesChannelConnection(vars: SystemUpdateSalesChannelConnectionVariables): MutationPromise<SystemUpdateSalesChannelConnectionData, SystemUpdateSalesChannelConnectionVariables>;
export function systemUpdateSalesChannelConnection(dc: DataConnect, vars: SystemUpdateSalesChannelConnectionVariables): MutationPromise<SystemUpdateSalesChannelConnectionData, SystemUpdateSalesChannelConnectionVariables>;

interface SystemRegisterSalesChannelEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRegisterSalesChannelEventVariables): MutationRef<SystemRegisterSalesChannelEventData, SystemRegisterSalesChannelEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRegisterSalesChannelEventVariables): MutationRef<SystemRegisterSalesChannelEventData, SystemRegisterSalesChannelEventVariables>;
  operationName: string;
}
export const systemRegisterSalesChannelEventRef: SystemRegisterSalesChannelEventRef;

export function systemRegisterSalesChannelEvent(vars: SystemRegisterSalesChannelEventVariables): MutationPromise<SystemRegisterSalesChannelEventData, SystemRegisterSalesChannelEventVariables>;
export function systemRegisterSalesChannelEvent(dc: DataConnect, vars: SystemRegisterSalesChannelEventVariables): MutationPromise<SystemRegisterSalesChannelEventData, SystemRegisterSalesChannelEventVariables>;

interface SystemRegisterSalesChannelEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRegisterSalesChannelEventsVariables): MutationRef<SystemRegisterSalesChannelEventsData, SystemRegisterSalesChannelEventsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRegisterSalesChannelEventsVariables): MutationRef<SystemRegisterSalesChannelEventsData, SystemRegisterSalesChannelEventsVariables>;
  operationName: string;
}
export const systemRegisterSalesChannelEventsRef: SystemRegisterSalesChannelEventsRef;

export function systemRegisterSalesChannelEvents(vars: SystemRegisterSalesChannelEventsVariables): MutationPromise<SystemRegisterSalesChannelEventsData, SystemRegisterSalesChannelEventsVariables>;
export function systemRegisterSalesChannelEvents(dc: DataConnect, vars: SystemRegisterSalesChannelEventsVariables): MutationPromise<SystemRegisterSalesChannelEventsData, SystemRegisterSalesChannelEventsVariables>;

interface SystemMarkSalesChannelWebhookActiveRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemMarkSalesChannelWebhookActiveVariables): MutationRef<SystemMarkSalesChannelWebhookActiveData, SystemMarkSalesChannelWebhookActiveVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemMarkSalesChannelWebhookActiveVariables): MutationRef<SystemMarkSalesChannelWebhookActiveData, SystemMarkSalesChannelWebhookActiveVariables>;
  operationName: string;
}
export const systemMarkSalesChannelWebhookActiveRef: SystemMarkSalesChannelWebhookActiveRef;

export function systemMarkSalesChannelWebhookActive(vars: SystemMarkSalesChannelWebhookActiveVariables): MutationPromise<SystemMarkSalesChannelWebhookActiveData, SystemMarkSalesChannelWebhookActiveVariables>;
export function systemMarkSalesChannelWebhookActive(dc: DataConnect, vars: SystemMarkSalesChannelWebhookActiveVariables): MutationPromise<SystemMarkSalesChannelWebhookActiveData, SystemMarkSalesChannelWebhookActiveVariables>;

interface SystemRecordSalesChannelEventResultRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRecordSalesChannelEventResultVariables): MutationRef<SystemRecordSalesChannelEventResultData, SystemRecordSalesChannelEventResultVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRecordSalesChannelEventResultVariables): MutationRef<SystemRecordSalesChannelEventResultData, SystemRecordSalesChannelEventResultVariables>;
  operationName: string;
}
export const systemRecordSalesChannelEventResultRef: SystemRecordSalesChannelEventResultRef;

export function systemRecordSalesChannelEventResult(vars: SystemRecordSalesChannelEventResultVariables): MutationPromise<SystemRecordSalesChannelEventResultData, SystemRecordSalesChannelEventResultVariables>;
export function systemRecordSalesChannelEventResult(dc: DataConnect, vars: SystemRecordSalesChannelEventResultVariables): MutationPromise<SystemRecordSalesChannelEventResultData, SystemRecordSalesChannelEventResultVariables>;

interface SystemIngestSalesChannelOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemIngestSalesChannelOrderVariables): MutationRef<SystemIngestSalesChannelOrderData, SystemIngestSalesChannelOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemIngestSalesChannelOrderVariables): MutationRef<SystemIngestSalesChannelOrderData, SystemIngestSalesChannelOrderVariables>;
  operationName: string;
}
export const systemIngestSalesChannelOrderRef: SystemIngestSalesChannelOrderRef;

export function systemIngestSalesChannelOrder(vars: SystemIngestSalesChannelOrderVariables): MutationPromise<SystemIngestSalesChannelOrderData, SystemIngestSalesChannelOrderVariables>;
export function systemIngestSalesChannelOrder(dc: DataConnect, vars: SystemIngestSalesChannelOrderVariables): MutationPromise<SystemIngestSalesChannelOrderData, SystemIngestSalesChannelOrderVariables>;

interface SystemApplySalesChannelOrderEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemApplySalesChannelOrderEventVariables): MutationRef<SystemApplySalesChannelOrderEventData, SystemApplySalesChannelOrderEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemApplySalesChannelOrderEventVariables): MutationRef<SystemApplySalesChannelOrderEventData, SystemApplySalesChannelOrderEventVariables>;
  operationName: string;
}
export const systemApplySalesChannelOrderEventRef: SystemApplySalesChannelOrderEventRef;

export function systemApplySalesChannelOrderEvent(vars: SystemApplySalesChannelOrderEventVariables): MutationPromise<SystemApplySalesChannelOrderEventData, SystemApplySalesChannelOrderEventVariables>;
export function systemApplySalesChannelOrderEvent(dc: DataConnect, vars: SystemApplySalesChannelOrderEventVariables): MutationPromise<SystemApplySalesChannelOrderEventData, SystemApplySalesChannelOrderEventVariables>;

interface SystemReconcileSalesChannelCommerceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemReconcileSalesChannelCommerceVariables): MutationRef<SystemReconcileSalesChannelCommerceData, SystemReconcileSalesChannelCommerceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemReconcileSalesChannelCommerceVariables): MutationRef<SystemReconcileSalesChannelCommerceData, SystemReconcileSalesChannelCommerceVariables>;
  operationName: string;
}
export const systemReconcileSalesChannelCommerceRef: SystemReconcileSalesChannelCommerceRef;

export function systemReconcileSalesChannelCommerce(vars: SystemReconcileSalesChannelCommerceVariables): MutationPromise<SystemReconcileSalesChannelCommerceData, SystemReconcileSalesChannelCommerceVariables>;
export function systemReconcileSalesChannelCommerce(dc: DataConnect, vars: SystemReconcileSalesChannelCommerceVariables): MutationPromise<SystemReconcileSalesChannelCommerceData, SystemReconcileSalesChannelCommerceVariables>;

interface SystemUpsertSalesChannelFinancialEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemUpsertSalesChannelFinancialEventsVariables): MutationRef<SystemUpsertSalesChannelFinancialEventsData, SystemUpsertSalesChannelFinancialEventsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemUpsertSalesChannelFinancialEventsVariables): MutationRef<SystemUpsertSalesChannelFinancialEventsData, SystemUpsertSalesChannelFinancialEventsVariables>;
  operationName: string;
}
export const systemUpsertSalesChannelFinancialEventsRef: SystemUpsertSalesChannelFinancialEventsRef;

export function systemUpsertSalesChannelFinancialEvents(vars: SystemUpsertSalesChannelFinancialEventsVariables): MutationPromise<SystemUpsertSalesChannelFinancialEventsData, SystemUpsertSalesChannelFinancialEventsVariables>;
export function systemUpsertSalesChannelFinancialEvents(dc: DataConnect, vars: SystemUpsertSalesChannelFinancialEventsVariables): MutationPromise<SystemUpsertSalesChannelFinancialEventsData, SystemUpsertSalesChannelFinancialEventsVariables>;

interface SystemQueueDueSalesChannelSyncJobsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemQueueDueSalesChannelSyncJobsVariables): MutationRef<SystemQueueDueSalesChannelSyncJobsData, SystemQueueDueSalesChannelSyncJobsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemQueueDueSalesChannelSyncJobsVariables): MutationRef<SystemQueueDueSalesChannelSyncJobsData, SystemQueueDueSalesChannelSyncJobsVariables>;
  operationName: string;
}
export const systemQueueDueSalesChannelSyncJobsRef: SystemQueueDueSalesChannelSyncJobsRef;

export function systemQueueDueSalesChannelSyncJobs(vars: SystemQueueDueSalesChannelSyncJobsVariables): MutationPromise<SystemQueueDueSalesChannelSyncJobsData, SystemQueueDueSalesChannelSyncJobsVariables>;
export function systemQueueDueSalesChannelSyncJobs(dc: DataConnect, vars: SystemQueueDueSalesChannelSyncJobsVariables): MutationPromise<SystemQueueDueSalesChannelSyncJobsData, SystemQueueDueSalesChannelSyncJobsVariables>;

interface SystemPurgeExpiredSalesChannelPayloadsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemPurgeExpiredSalesChannelPayloadsVariables): MutationRef<SystemPurgeExpiredSalesChannelPayloadsData, SystemPurgeExpiredSalesChannelPayloadsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemPurgeExpiredSalesChannelPayloadsVariables): MutationRef<SystemPurgeExpiredSalesChannelPayloadsData, SystemPurgeExpiredSalesChannelPayloadsVariables>;
  operationName: string;
}
export const systemPurgeExpiredSalesChannelPayloadsRef: SystemPurgeExpiredSalesChannelPayloadsRef;

export function systemPurgeExpiredSalesChannelPayloads(vars: SystemPurgeExpiredSalesChannelPayloadsVariables): MutationPromise<SystemPurgeExpiredSalesChannelPayloadsData, SystemPurgeExpiredSalesChannelPayloadsVariables>;
export function systemPurgeExpiredSalesChannelPayloads(dc: DataConnect, vars: SystemPurgeExpiredSalesChannelPayloadsVariables): MutationPromise<SystemPurgeExpiredSalesChannelPayloadsData, SystemPurgeExpiredSalesChannelPayloadsVariables>;

interface SystemRecordSalesChannelCommandResultRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRecordSalesChannelCommandResultVariables): MutationRef<SystemRecordSalesChannelCommandResultData, SystemRecordSalesChannelCommandResultVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRecordSalesChannelCommandResultVariables): MutationRef<SystemRecordSalesChannelCommandResultData, SystemRecordSalesChannelCommandResultVariables>;
  operationName: string;
}
export const systemRecordSalesChannelCommandResultRef: SystemRecordSalesChannelCommandResultRef;

export function systemRecordSalesChannelCommandResult(vars: SystemRecordSalesChannelCommandResultVariables): MutationPromise<SystemRecordSalesChannelCommandResultData, SystemRecordSalesChannelCommandResultVariables>;
export function systemRecordSalesChannelCommandResult(dc: DataConnect, vars: SystemRecordSalesChannelCommandResultVariables): MutationPromise<SystemRecordSalesChannelCommandResultData, SystemRecordSalesChannelCommandResultVariables>;

interface SystemRefreshSalesChannelOrderAfterPickingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRefreshSalesChannelOrderAfterPickingVariables): MutationRef<SystemRefreshSalesChannelOrderAfterPickingData, SystemRefreshSalesChannelOrderAfterPickingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRefreshSalesChannelOrderAfterPickingVariables): MutationRef<SystemRefreshSalesChannelOrderAfterPickingData, SystemRefreshSalesChannelOrderAfterPickingVariables>;
  operationName: string;
}
export const systemRefreshSalesChannelOrderAfterPickingRef: SystemRefreshSalesChannelOrderAfterPickingRef;

export function systemRefreshSalesChannelOrderAfterPicking(vars: SystemRefreshSalesChannelOrderAfterPickingVariables): MutationPromise<SystemRefreshSalesChannelOrderAfterPickingData, SystemRefreshSalesChannelOrderAfterPickingVariables>;
export function systemRefreshSalesChannelOrderAfterPicking(dc: DataConnect, vars: SystemRefreshSalesChannelOrderAfterPickingVariables): MutationPromise<SystemRefreshSalesChannelOrderAfterPickingData, SystemRefreshSalesChannelOrderAfterPickingVariables>;

interface SystemRecordSalesChannelSyncResultRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRecordSalesChannelSyncResultVariables): MutationRef<SystemRecordSalesChannelSyncResultData, SystemRecordSalesChannelSyncResultVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRecordSalesChannelSyncResultVariables): MutationRef<SystemRecordSalesChannelSyncResultData, SystemRecordSalesChannelSyncResultVariables>;
  operationName: string;
}
export const systemRecordSalesChannelSyncResultRef: SystemRecordSalesChannelSyncResultRef;

export function systemRecordSalesChannelSyncResult(vars: SystemRecordSalesChannelSyncResultVariables): MutationPromise<SystemRecordSalesChannelSyncResultData, SystemRecordSalesChannelSyncResultVariables>;
export function systemRecordSalesChannelSyncResult(dc: DataConnect, vars: SystemRecordSalesChannelSyncResultVariables): MutationPromise<SystemRecordSalesChannelSyncResultData, SystemRecordSalesChannelSyncResultVariables>;

interface SystemRecordSalesChannelMappingResultRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemRecordSalesChannelMappingResultVariables): MutationRef<SystemRecordSalesChannelMappingResultData, SystemRecordSalesChannelMappingResultVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemRecordSalesChannelMappingResultVariables): MutationRef<SystemRecordSalesChannelMappingResultData, SystemRecordSalesChannelMappingResultVariables>;
  operationName: string;
}
export const systemRecordSalesChannelMappingResultRef: SystemRecordSalesChannelMappingResultRef;

export function systemRecordSalesChannelMappingResult(vars: SystemRecordSalesChannelMappingResultVariables): MutationPromise<SystemRecordSalesChannelMappingResultData, SystemRecordSalesChannelMappingResultVariables>;
export function systemRecordSalesChannelMappingResult(dc: DataConnect, vars: SystemRecordSalesChannelMappingResultVariables): MutationPromise<SystemRecordSalesChannelMappingResultData, SystemRecordSalesChannelMappingResultVariables>;

interface CloseCashSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CloseCashSessionVariables): MutationRef<CloseCashSessionData, CloseCashSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CloseCashSessionVariables): MutationRef<CloseCashSessionData, CloseCashSessionVariables>;
  operationName: string;
}
export const closeCashSessionRef: CloseCashSessionRef;

export function closeCashSession(vars: CloseCashSessionVariables): MutationPromise<CloseCashSessionData, CloseCashSessionVariables>;
export function closeCashSession(dc: DataConnect, vars: CloseCashSessionVariables): MutationPromise<CloseCashSessionData, CloseCashSessionVariables>;

interface UpdatePosPolicyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePosPolicyVariables): MutationRef<UpdatePosPolicyData, UpdatePosPolicyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePosPolicyVariables): MutationRef<UpdatePosPolicyData, UpdatePosPolicyVariables>;
  operationName: string;
}
export const updatePosPolicyRef: UpdatePosPolicyRef;

export function updatePosPolicy(vars: UpdatePosPolicyVariables): MutationPromise<UpdatePosPolicyData, UpdatePosPolicyVariables>;
export function updatePosPolicy(dc: DataConnect, vars: UpdatePosPolicyVariables): MutationPromise<UpdatePosPolicyData, UpdatePosPolicyVariables>;

interface RequestPosSaleApprovalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestPosSaleApprovalVariables): MutationRef<RequestPosSaleApprovalData, RequestPosSaleApprovalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestPosSaleApprovalVariables): MutationRef<RequestPosSaleApprovalData, RequestPosSaleApprovalVariables>;
  operationName: string;
}
export const requestPosSaleApprovalRef: RequestPosSaleApprovalRef;

export function requestPosSaleApproval(vars: RequestPosSaleApprovalVariables): MutationPromise<RequestPosSaleApprovalData, RequestPosSaleApprovalVariables>;
export function requestPosSaleApproval(dc: DataConnect, vars: RequestPosSaleApprovalVariables): MutationPromise<RequestPosSaleApprovalData, RequestPosSaleApprovalVariables>;

interface ApprovePosSaleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApprovePosSaleVariables): MutationRef<ApprovePosSaleData, ApprovePosSaleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ApprovePosSaleVariables): MutationRef<ApprovePosSaleData, ApprovePosSaleVariables>;
  operationName: string;
}
export const approvePosSaleRef: ApprovePosSaleRef;

export function approvePosSale(vars: ApprovePosSaleVariables): MutationPromise<ApprovePosSaleData, ApprovePosSaleVariables>;
export function approvePosSale(dc: DataConnect, vars: ApprovePosSaleVariables): MutationPromise<ApprovePosSaleData, ApprovePosSaleVariables>;

interface RequestPosCashApprovalRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestPosCashApprovalVariables): MutationRef<RequestPosCashApprovalData, RequestPosCashApprovalVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestPosCashApprovalVariables): MutationRef<RequestPosCashApprovalData, RequestPosCashApprovalVariables>;
  operationName: string;
}
export const requestPosCashApprovalRef: RequestPosCashApprovalRef;

export function requestPosCashApproval(vars: RequestPosCashApprovalVariables): MutationPromise<RequestPosCashApprovalData, RequestPosCashApprovalVariables>;
export function requestPosCashApproval(dc: DataConnect, vars: RequestPosCashApprovalVariables): MutationPromise<RequestPosCashApprovalData, RequestPosCashApprovalVariables>;

interface GetCurrentUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
  operationName: string;
}
export const getCurrentUserRef: GetCurrentUserRef;

export function getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;
export function getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface GetCurrentUserAccessRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserAccessData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCurrentUserAccessData, undefined>;
  operationName: string;
}
export const getCurrentUserAccessRef: GetCurrentUserAccessRef;

export function getCurrentUserAccess(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAccessData, undefined>;
export function getCurrentUserAccess(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAccessData, undefined>;

interface ValidateDeviceSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ValidateDeviceSessionVariables): QueryRef<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ValidateDeviceSessionVariables): QueryRef<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
  operationName: string;
}
export const validateDeviceSessionRef: ValidateDeviceSessionRef;

export function validateDeviceSession(vars: ValidateDeviceSessionVariables, options?: ExecuteQueryOptions): QueryPromise<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
export function validateDeviceSession(dc: DataConnect, vars: ValidateDeviceSessionVariables, options?: ExecuteQueryOptions): QueryPromise<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;

interface SalesChannelOptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOptionsVariables): QueryRef<SalesChannelOptionsData, SalesChannelOptionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelOptionsVariables): QueryRef<SalesChannelOptionsData, SalesChannelOptionsVariables>;
  operationName: string;
}
export const salesChannelOptionsRef: SalesChannelOptionsRef;

export function salesChannelOptions(vars: SalesChannelOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOptionsData, SalesChannelOptionsVariables>;
export function salesChannelOptions(dc: DataConnect, vars: SalesChannelOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOptionsData, SalesChannelOptionsVariables>;

interface SalesChannelConnectionsV2Ref {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelConnectionsV2Variables): QueryRef<SalesChannelConnectionsV2Data, SalesChannelConnectionsV2Variables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelConnectionsV2Variables): QueryRef<SalesChannelConnectionsV2Data, SalesChannelConnectionsV2Variables>;
  operationName: string;
}
export const salesChannelConnectionsV2Ref: SalesChannelConnectionsV2Ref;

export function salesChannelConnectionsV2(vars: SalesChannelConnectionsV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelConnectionsV2Data, SalesChannelConnectionsV2Variables>;
export function salesChannelConnectionsV2(dc: DataConnect, vars: SalesChannelConnectionsV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelConnectionsV2Data, SalesChannelConnectionsV2Variables>;

interface SalesChannelProductMappingsV2Ref {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelProductMappingsV2Variables): QueryRef<SalesChannelProductMappingsV2Data, SalesChannelProductMappingsV2Variables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelProductMappingsV2Variables): QueryRef<SalesChannelProductMappingsV2Data, SalesChannelProductMappingsV2Variables>;
  operationName: string;
}
export const salesChannelProductMappingsV2Ref: SalesChannelProductMappingsV2Ref;

export function salesChannelProductMappingsV2(vars: SalesChannelProductMappingsV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelProductMappingsV2Data, SalesChannelProductMappingsV2Variables>;
export function salesChannelProductMappingsV2(dc: DataConnect, vars: SalesChannelProductMappingsV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelProductMappingsV2Data, SalesChannelProductMappingsV2Variables>;

interface ExportSalesChannelManagementRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ExportSalesChannelManagementVariables): QueryRef<ExportSalesChannelManagementData, ExportSalesChannelManagementVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ExportSalesChannelManagementVariables): QueryRef<ExportSalesChannelManagementData, ExportSalesChannelManagementVariables>;
  operationName: string;
}
export const exportSalesChannelManagementRef: ExportSalesChannelManagementRef;

export function exportSalesChannelManagement(vars: ExportSalesChannelManagementVariables, options?: ExecuteQueryOptions): QueryPromise<ExportSalesChannelManagementData, ExportSalesChannelManagementVariables>;
export function exportSalesChannelManagement(dc: DataConnect, vars: ExportSalesChannelManagementVariables, options?: ExecuteQueryOptions): QueryPromise<ExportSalesChannelManagementData, ExportSalesChannelManagementVariables>;

interface SalesChannelProductOptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelProductOptionsVariables): QueryRef<SalesChannelProductOptionsData, SalesChannelProductOptionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelProductOptionsVariables): QueryRef<SalesChannelProductOptionsData, SalesChannelProductOptionsVariables>;
  operationName: string;
}
export const salesChannelProductOptionsRef: SalesChannelProductOptionsRef;

export function salesChannelProductOptions(vars: SalesChannelProductOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelProductOptionsData, SalesChannelProductOptionsVariables>;
export function salesChannelProductOptions(dc: DataConnect, vars: SalesChannelProductOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelProductOptionsData, SalesChannelProductOptionsVariables>;

interface SalesChannelOperationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOperationsVariables): QueryRef<SalesChannelOperationsData, SalesChannelOperationsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelOperationsVariables): QueryRef<SalesChannelOperationsData, SalesChannelOperationsVariables>;
  operationName: string;
}
export const salesChannelOperationsRef: SalesChannelOperationsRef;

export function salesChannelOperations(vars: SalesChannelOperationsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOperationsData, SalesChannelOperationsVariables>;
export function salesChannelOperations(dc: DataConnect, vars: SalesChannelOperationsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOperationsData, SalesChannelOperationsVariables>;

interface SystemSalesChannelWorkQueueRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemSalesChannelWorkQueueVariables): QueryRef<SystemSalesChannelWorkQueueData, SystemSalesChannelWorkQueueVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemSalesChannelWorkQueueVariables): QueryRef<SystemSalesChannelWorkQueueData, SystemSalesChannelWorkQueueVariables>;
  operationName: string;
}
export const systemSalesChannelWorkQueueRef: SystemSalesChannelWorkQueueRef;

export function systemSalesChannelWorkQueue(vars: SystemSalesChannelWorkQueueVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelWorkQueueData, SystemSalesChannelWorkQueueVariables>;
export function systemSalesChannelWorkQueue(dc: DataConnect, vars: SystemSalesChannelWorkQueueVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelWorkQueueData, SystemSalesChannelWorkQueueVariables>;

interface SystemIfoodConnectionsForPollingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemIfoodConnectionsForPollingVariables): QueryRef<SystemIfoodConnectionsForPollingData, SystemIfoodConnectionsForPollingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemIfoodConnectionsForPollingVariables): QueryRef<SystemIfoodConnectionsForPollingData, SystemIfoodConnectionsForPollingVariables>;
  operationName: string;
}
export const systemIfoodConnectionsForPollingRef: SystemIfoodConnectionsForPollingRef;

export function systemIfoodConnectionsForPolling(vars: SystemIfoodConnectionsForPollingVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionsForPollingData, SystemIfoodConnectionsForPollingVariables>;
export function systemIfoodConnectionsForPolling(dc: DataConnect, vars: SystemIfoodConnectionsForPollingVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionsForPollingData, SystemIfoodConnectionsForPollingVariables>;

interface SystemSalesChannelHealthMetricsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemSalesChannelHealthMetricsVariables): QueryRef<SystemSalesChannelHealthMetricsData, SystemSalesChannelHealthMetricsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemSalesChannelHealthMetricsVariables): QueryRef<SystemSalesChannelHealthMetricsData, SystemSalesChannelHealthMetricsVariables>;
  operationName: string;
}
export const systemSalesChannelHealthMetricsRef: SystemSalesChannelHealthMetricsRef;

export function systemSalesChannelHealthMetrics(vars: SystemSalesChannelHealthMetricsVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelHealthMetricsData, SystemSalesChannelHealthMetricsVariables>;
export function systemSalesChannelHealthMetrics(dc: DataConnect, vars: SystemSalesChannelHealthMetricsVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelHealthMetricsData, SystemSalesChannelHealthMetricsVariables>;

interface SystemIfoodConnectionByMerchantRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemIfoodConnectionByMerchantVariables): QueryRef<SystemIfoodConnectionByMerchantData, SystemIfoodConnectionByMerchantVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemIfoodConnectionByMerchantVariables): QueryRef<SystemIfoodConnectionByMerchantData, SystemIfoodConnectionByMerchantVariables>;
  operationName: string;
}
export const systemIfoodConnectionByMerchantRef: SystemIfoodConnectionByMerchantRef;

export function systemIfoodConnectionByMerchant(vars: SystemIfoodConnectionByMerchantVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionByMerchantData, SystemIfoodConnectionByMerchantVariables>;
export function systemIfoodConnectionByMerchant(dc: DataConnect, vars: SystemIfoodConnectionByMerchantVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionByMerchantData, SystemIfoodConnectionByMerchantVariables>;

interface SystemIfoodConnectionsByMerchantsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemIfoodConnectionsByMerchantsVariables): QueryRef<SystemIfoodConnectionsByMerchantsData, SystemIfoodConnectionsByMerchantsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemIfoodConnectionsByMerchantsVariables): QueryRef<SystemIfoodConnectionsByMerchantsData, SystemIfoodConnectionsByMerchantsVariables>;
  operationName: string;
}
export const systemIfoodConnectionsByMerchantsRef: SystemIfoodConnectionsByMerchantsRef;

export function systemIfoodConnectionsByMerchants(vars: SystemIfoodConnectionsByMerchantsVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionsByMerchantsData, SystemIfoodConnectionsByMerchantsVariables>;
export function systemIfoodConnectionsByMerchants(dc: DataConnect, vars: SystemIfoodConnectionsByMerchantsVariables, options?: ExecuteQueryOptions): QueryPromise<SystemIfoodConnectionsByMerchantsData, SystemIfoodConnectionsByMerchantsVariables>;

interface SystemSalesChannelMappingsForSyncRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemSalesChannelMappingsForSyncVariables): QueryRef<SystemSalesChannelMappingsForSyncData, SystemSalesChannelMappingsForSyncVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemSalesChannelMappingsForSyncVariables): QueryRef<SystemSalesChannelMappingsForSyncData, SystemSalesChannelMappingsForSyncVariables>;
  operationName: string;
}
export const systemSalesChannelMappingsForSyncRef: SystemSalesChannelMappingsForSyncRef;

export function systemSalesChannelMappingsForSync(vars: SystemSalesChannelMappingsForSyncVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelMappingsForSyncData, SystemSalesChannelMappingsForSyncVariables>;
export function systemSalesChannelMappingsForSync(dc: DataConnect, vars: SystemSalesChannelMappingsForSyncVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelMappingsForSyncData, SystemSalesChannelMappingsForSyncVariables>;

interface SalesChannelOrdersV2Ref {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOrdersV2Variables): QueryRef<SalesChannelOrdersV2Data, SalesChannelOrdersV2Variables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelOrdersV2Variables): QueryRef<SalesChannelOrdersV2Data, SalesChannelOrdersV2Variables>;
  operationName: string;
}
export const salesChannelOrdersV2Ref: SalesChannelOrdersV2Ref;

export function salesChannelOrdersV2(vars: SalesChannelOrdersV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersV2Data, SalesChannelOrdersV2Variables>;
export function salesChannelOrdersV2(dc: DataConnect, vars: SalesChannelOrdersV2Variables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersV2Data, SalesChannelOrdersV2Variables>;

interface SalesChannelOrderDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOrderDetailsVariables): QueryRef<SalesChannelOrderDetailsData, SalesChannelOrderDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelOrderDetailsVariables): QueryRef<SalesChannelOrderDetailsData, SalesChannelOrderDetailsVariables>;
  operationName: string;
}
export const salesChannelOrderDetailsRef: SalesChannelOrderDetailsRef;

export function salesChannelOrderDetails(vars: SalesChannelOrderDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrderDetailsData, SalesChannelOrderDetailsVariables>;
export function salesChannelOrderDetails(dc: DataConnect, vars: SalesChannelOrderDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrderDetailsData, SalesChannelOrderDetailsVariables>;

interface SalesChannelWorkspaceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelWorkspaceVariables): QueryRef<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelWorkspaceVariables): QueryRef<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
  operationName: string;
}
export const salesChannelWorkspaceRef: SalesChannelWorkspaceRef;

export function salesChannelWorkspace(vars: SalesChannelWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
export function salesChannelWorkspace(dc: DataConnect, vars: SalesChannelWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;

interface SalesChannelOrdersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOrdersVariables): QueryRef<SalesChannelOrdersData, SalesChannelOrdersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelOrdersVariables): QueryRef<SalesChannelOrdersData, SalesChannelOrdersVariables>;
  operationName: string;
}
export const salesChannelOrdersRef: SalesChannelOrdersRef;

export function salesChannelOrders(vars: SalesChannelOrdersVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersData, SalesChannelOrdersVariables>;
export function salesChannelOrders(dc: DataConnect, vars: SalesChannelOrdersVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersData, SalesChannelOrdersVariables>;

interface LatestPendingSalesChannelOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: LatestPendingSalesChannelOrderVariables): QueryRef<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: LatestPendingSalesChannelOrderVariables): QueryRef<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;
  operationName: string;
}
export const latestPendingSalesChannelOrderRef: LatestPendingSalesChannelOrderRef;

export function latestPendingSalesChannelOrder(vars: LatestPendingSalesChannelOrderVariables, options?: ExecuteQueryOptions): QueryPromise<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;
export function latestPendingSalesChannelOrder(dc: DataConnect, vars: LatestPendingSalesChannelOrderVariables, options?: ExecuteQueryOptions): QueryPromise<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;

interface SalesWorkspaceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesWorkspaceVariables): QueryRef<SalesWorkspaceData, SalesWorkspaceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesWorkspaceVariables): QueryRef<SalesWorkspaceData, SalesWorkspaceVariables>;
  operationName: string;
}
export const salesWorkspaceRef: SalesWorkspaceRef;

export function salesWorkspace(vars: SalesWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesWorkspaceData, SalesWorkspaceVariables>;
export function salesWorkspace(dc: DataConnect, vars: SalesWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesWorkspaceData, SalesWorkspaceVariables>;

interface ListSalesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSalesVariables): QueryRef<ListSalesData, ListSalesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListSalesVariables): QueryRef<ListSalesData, ListSalesVariables>;
  operationName: string;
}
export const listSalesRef: ListSalesRef;

export function listSales(vars: ListSalesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSalesData, ListSalesVariables>;
export function listSales(dc: DataConnect, vars: ListSalesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSalesData, ListSalesVariables>;

interface SaleDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaleDetailsVariables): QueryRef<SaleDetailsData, SaleDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SaleDetailsVariables): QueryRef<SaleDetailsData, SaleDetailsVariables>;
  operationName: string;
}
export const saleDetailsRef: SaleDetailsRef;

export function saleDetails(vars: SaleDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SaleDetailsData, SaleDetailsVariables>;
export function saleDetails(dc: DataConnect, vars: SaleDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SaleDetailsData, SaleDetailsVariables>;

interface ListCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
  operationName: string;
}
export const listCategoriesRef: ListCategoriesRef;

export function listCategories(vars: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;
export function listCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListSubcategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSubcategoriesVariables): QueryRef<ListSubcategoriesData, ListSubcategoriesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListSubcategoriesVariables): QueryRef<ListSubcategoriesData, ListSubcategoriesVariables>;
  operationName: string;
}
export const listSubcategoriesRef: ListSubcategoriesRef;

export function listSubcategories(vars: ListSubcategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSubcategoriesData, ListSubcategoriesVariables>;
export function listSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSubcategoriesData, ListSubcategoriesVariables>;

interface CategoryOptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: CategoryOptionsVariables): QueryRef<CategoryOptionsData, CategoryOptionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: CategoryOptionsVariables): QueryRef<CategoryOptionsData, CategoryOptionsVariables>;
  operationName: string;
}
export const categoryOptionsRef: CategoryOptionsRef;

export function categoryOptions(vars?: CategoryOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, CategoryOptionsVariables>;
export function categoryOptions(dc: DataConnect, vars?: CategoryOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, CategoryOptionsVariables>;

interface ListBranchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListBranchesVariables): QueryRef<ListBranchesData, ListBranchesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListBranchesVariables): QueryRef<ListBranchesData, ListBranchesVariables>;
  operationName: string;
}
export const listBranchesRef: ListBranchesRef;

export function listBranches(vars: ListBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<ListBranchesData, ListBranchesVariables>;
export function listBranches(dc: DataConnect, vars: ListBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<ListBranchesData, ListBranchesVariables>;

interface ListSuppliersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSuppliersVariables): QueryRef<ListSuppliersData, ListSuppliersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListSuppliersVariables): QueryRef<ListSuppliersData, ListSuppliersVariables>;
  operationName: string;
}
export const listSuppliersRef: ListSuppliersRef;

export function listSuppliers(vars: ListSuppliersVariables, options?: ExecuteQueryOptions): QueryPromise<ListSuppliersData, ListSuppliersVariables>;
export function listSuppliers(dc: DataConnect, vars: ListSuppliersVariables, options?: ExecuteQueryOptions): QueryPromise<ListSuppliersData, ListSuppliersVariables>;

interface ListCustomersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCustomersVariables): QueryRef<ListCustomersData, ListCustomersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListCustomersVariables): QueryRef<ListCustomersData, ListCustomersVariables>;
  operationName: string;
}
export const listCustomersRef: ListCustomersRef;

export function listCustomers(vars: ListCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<ListCustomersData, ListCustomersVariables>;
export function listCustomers(dc: DataConnect, vars: ListCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<ListCustomersData, ListCustomersVariables>;

interface ListProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
  operationName: string;
}
export const listProductsRef: ListProductsRef;

export function listProducts(vars: ListProductsVariables, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, ListProductsVariables>;
export function listProducts(dc: DataConnect, vars: ListProductsVariables, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, ListProductsVariables>;

interface RegistrationOptionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: RegistrationOptionsVariables): QueryRef<RegistrationOptionsData, RegistrationOptionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: RegistrationOptionsVariables): QueryRef<RegistrationOptionsData, RegistrationOptionsVariables>;
  operationName: string;
}
export const registrationOptionsRef: RegistrationOptionsRef;

export function registrationOptions(vars?: RegistrationOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, RegistrationOptionsVariables>;
export function registrationOptions(dc: DataConnect, vars?: RegistrationOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, RegistrationOptionsVariables>;

interface ProductComponentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductComponentsVariables): QueryRef<ProductComponentsData, ProductComponentsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductComponentsVariables): QueryRef<ProductComponentsData, ProductComponentsVariables>;
  operationName: string;
}
export const productComponentsRef: ProductComponentsRef;

export function productComponents(vars: ProductComponentsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductComponentsData, ProductComponentsVariables>;
export function productComponents(dc: DataConnect, vars: ProductComponentsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductComponentsData, ProductComponentsVariables>;

interface ProductPromotionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductPromotionsVariables): QueryRef<ProductPromotionsData, ProductPromotionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ProductPromotionsVariables): QueryRef<ProductPromotionsData, ProductPromotionsVariables>;
  operationName: string;
}
export const productPromotionsRef: ProductPromotionsRef;

export function productPromotions(vars: ProductPromotionsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductPromotionsData, ProductPromotionsVariables>;
export function productPromotions(dc: DataConnect, vars: ProductPromotionsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductPromotionsData, ProductPromotionsVariables>;

interface PlatformAdminWorkspaceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformAdminWorkspaceVariables): QueryRef<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlatformAdminWorkspaceVariables): QueryRef<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
  operationName: string;
}
export const platformAdminWorkspaceRef: PlatformAdminWorkspaceRef;

export function platformAdminWorkspace(vars: PlatformAdminWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
export function platformAdminWorkspace(dc: DataConnect, vars: PlatformAdminWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;

interface PlatformBillingWorkspaceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformBillingWorkspaceVariables): QueryRef<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlatformBillingWorkspaceVariables): QueryRef<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;
  operationName: string;
}
export const platformBillingWorkspaceRef: PlatformBillingWorkspaceRef;

export function platformBillingWorkspace(vars: PlatformBillingWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;
export function platformBillingWorkspace(dc: DataConnect, vars: PlatformBillingWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;

interface PlatformBillingWorkspaceV2Ref {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformBillingWorkspaceV2Variables): QueryRef<PlatformBillingWorkspaceV2Data, PlatformBillingWorkspaceV2Variables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PlatformBillingWorkspaceV2Variables): QueryRef<PlatformBillingWorkspaceV2Data, PlatformBillingWorkspaceV2Variables>;
  operationName: string;
}
export const platformBillingWorkspaceV2Ref: PlatformBillingWorkspaceV2Ref;

export function platformBillingWorkspaceV2(vars: PlatformBillingWorkspaceV2Variables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceV2Data, PlatformBillingWorkspaceV2Variables>;
export function platformBillingWorkspaceV2(dc: DataConnect, vars: PlatformBillingWorkspaceV2Variables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceV2Data, PlatformBillingWorkspaceV2Variables>;

interface StockWorkspaceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: StockWorkspaceVariables): QueryRef<StockWorkspaceData, StockWorkspaceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: StockWorkspaceVariables): QueryRef<StockWorkspaceData, StockWorkspaceVariables>;
  operationName: string;
}
export const stockWorkspaceRef: StockWorkspaceRef;

export function stockWorkspace(vars: StockWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<StockWorkspaceData, StockWorkspaceVariables>;
export function stockWorkspace(dc: DataConnect, vars: StockWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<StockWorkspaceData, StockWorkspaceVariables>;

interface DailyProfitDashboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DailyProfitDashboardVariables): QueryRef<DailyProfitDashboardData, DailyProfitDashboardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DailyProfitDashboardVariables): QueryRef<DailyProfitDashboardData, DailyProfitDashboardVariables>;
  operationName: string;
}
export const dailyProfitDashboardRef: DailyProfitDashboardRef;

export function dailyProfitDashboard(vars: DailyProfitDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<DailyProfitDashboardData, DailyProfitDashboardVariables>;
export function dailyProfitDashboard(dc: DataConnect, vars: DailyProfitDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<DailyProfitDashboardData, DailyProfitDashboardVariables>;

interface StockOperationDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: StockOperationDetailsVariables): QueryRef<StockOperationDetailsData, StockOperationDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: StockOperationDetailsVariables): QueryRef<StockOperationDetailsData, StockOperationDetailsVariables>;
  operationName: string;
}
export const stockOperationDetailsRef: StockOperationDetailsRef;

export function stockOperationDetails(vars: StockOperationDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<StockOperationDetailsData, StockOperationDetailsVariables>;
export function stockOperationDetails(dc: DataConnect, vars: StockOperationDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<StockOperationDetailsData, StockOperationDetailsVariables>;

interface FinancialIndicatorsDashboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: FinancialIndicatorsDashboardVariables): QueryRef<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: FinancialIndicatorsDashboardVariables): QueryRef<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
  operationName: string;
}
export const financialIndicatorsDashboardRef: FinancialIndicatorsDashboardRef;

export function financialIndicatorsDashboard(vars: FinancialIndicatorsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
export function financialIndicatorsDashboard(dc: DataConnect, vars: FinancialIndicatorsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;

interface SalesChannelAnalyticsDashboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelAnalyticsDashboardVariables): QueryRef<SalesChannelAnalyticsDashboardData, SalesChannelAnalyticsDashboardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SalesChannelAnalyticsDashboardVariables): QueryRef<SalesChannelAnalyticsDashboardData, SalesChannelAnalyticsDashboardVariables>;
  operationName: string;
}
export const salesChannelAnalyticsDashboardRef: SalesChannelAnalyticsDashboardRef;

export function salesChannelAnalyticsDashboard(vars: SalesChannelAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelAnalyticsDashboardData, SalesChannelAnalyticsDashboardVariables>;
export function salesChannelAnalyticsDashboard(dc: DataConnect, vars: SalesChannelAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelAnalyticsDashboardData, SalesChannelAnalyticsDashboardVariables>;

interface OperationalAnalyticsDashboardRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: OperationalAnalyticsDashboardVariables): QueryRef<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: OperationalAnalyticsDashboardVariables): QueryRef<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
  operationName: string;
}
export const operationalAnalyticsDashboardRef: OperationalAnalyticsDashboardRef;

export function operationalAnalyticsDashboard(vars: OperationalAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
export function operationalAnalyticsDashboard(dc: DataConnect, vars: OperationalAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;

interface SystemSalesChannelOrderForActorRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemSalesChannelOrderForActorVariables): QueryRef<SystemSalesChannelOrderForActorData, SystemSalesChannelOrderForActorVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemSalesChannelOrderForActorVariables): QueryRef<SystemSalesChannelOrderForActorData, SystemSalesChannelOrderForActorVariables>;
  operationName: string;
}
export const systemSalesChannelOrderForActorRef: SystemSalesChannelOrderForActorRef;

export function systemSalesChannelOrderForActor(vars: SystemSalesChannelOrderForActorVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelOrderForActorData, SystemSalesChannelOrderForActorVariables>;
export function systemSalesChannelOrderForActor(dc: DataConnect, vars: SystemSalesChannelOrderForActorVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelOrderForActorData, SystemSalesChannelOrderForActorVariables>;

interface SystemSalesChannelConnectionForActorRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SystemSalesChannelConnectionForActorVariables): QueryRef<SystemSalesChannelConnectionForActorData, SystemSalesChannelConnectionForActorVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SystemSalesChannelConnectionForActorVariables): QueryRef<SystemSalesChannelConnectionForActorData, SystemSalesChannelConnectionForActorVariables>;
  operationName: string;
}
export const systemSalesChannelConnectionForActorRef: SystemSalesChannelConnectionForActorRef;

export function systemSalesChannelConnectionForActor(vars: SystemSalesChannelConnectionForActorVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelConnectionForActorData, SystemSalesChannelConnectionForActorVariables>;
export function systemSalesChannelConnectionForActor(dc: DataConnect, vars: SystemSalesChannelConnectionForActorVariables, options?: ExecuteQueryOptions): QueryPromise<SystemSalesChannelConnectionForActorData, SystemSalesChannelConnectionForActorVariables>;

interface SearchPosProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchPosProductsVariables): QueryRef<SearchPosProductsData, SearchPosProductsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchPosProductsVariables): QueryRef<SearchPosProductsData, SearchPosProductsVariables>;
  operationName: string;
}
export const searchPosProductsRef: SearchPosProductsRef;

export function searchPosProducts(vars: SearchPosProductsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPosProductsData, SearchPosProductsVariables>;
export function searchPosProducts(dc: DataConnect, vars: SearchPosProductsVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPosProductsData, SearchPosProductsVariables>;

interface SearchPosCustomersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchPosCustomersVariables): QueryRef<SearchPosCustomersData, SearchPosCustomersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchPosCustomersVariables): QueryRef<SearchPosCustomersData, SearchPosCustomersVariables>;
  operationName: string;
}
export const searchPosCustomersRef: SearchPosCustomersRef;

export function searchPosCustomers(vars: SearchPosCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPosCustomersData, SearchPosCustomersVariables>;
export function searchPosCustomers(dc: DataConnect, vars: SearchPosCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<SearchPosCustomersData, SearchPosCustomersVariables>;

interface PosProductBranchesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PosProductBranchesVariables): QueryRef<PosProductBranchesData, PosProductBranchesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PosProductBranchesVariables): QueryRef<PosProductBranchesData, PosProductBranchesVariables>;
  operationName: string;
}
export const posProductBranchesRef: PosProductBranchesRef;

export function posProductBranches(vars: PosProductBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<PosProductBranchesData, PosProductBranchesVariables>;
export function posProductBranches(dc: DataConnect, vars: PosProductBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<PosProductBranchesData, PosProductBranchesVariables>;

interface PendingPosApprovalsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PendingPosApprovalsVariables): QueryRef<PendingPosApprovalsData, PendingPosApprovalsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PendingPosApprovalsVariables): QueryRef<PendingPosApprovalsData, PendingPosApprovalsVariables>;
  operationName: string;
}
export const pendingPosApprovalsRef: PendingPosApprovalsRef;

export function pendingPosApprovals(vars: PendingPosApprovalsVariables, options?: ExecuteQueryOptions): QueryPromise<PendingPosApprovalsData, PendingPosApprovalsVariables>;
export function pendingPosApprovals(dc: DataConnect, vars: PendingPosApprovalsVariables, options?: ExecuteQueryOptions): QueryPromise<PendingPosApprovalsData, PendingPosApprovalsVariables>;

interface PosSaleApprovalStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PosSaleApprovalStatusVariables): QueryRef<PosSaleApprovalStatusData, PosSaleApprovalStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PosSaleApprovalStatusVariables): QueryRef<PosSaleApprovalStatusData, PosSaleApprovalStatusVariables>;
  operationName: string;
}
export const posSaleApprovalStatusRef: PosSaleApprovalStatusRef;

export function posSaleApprovalStatus(vars: PosSaleApprovalStatusVariables, options?: ExecuteQueryOptions): QueryPromise<PosSaleApprovalStatusData, PosSaleApprovalStatusVariables>;
export function posSaleApprovalStatus(dc: DataConnect, vars: PosSaleApprovalStatusVariables, options?: ExecuteQueryOptions): QueryPromise<PosSaleApprovalStatusData, PosSaleApprovalStatusVariables>;

interface PosCashApprovalStatusRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: PosCashApprovalStatusVariables): QueryRef<PosCashApprovalStatusData, PosCashApprovalStatusVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: PosCashApprovalStatusVariables): QueryRef<PosCashApprovalStatusData, PosCashApprovalStatusVariables>;
  operationName: string;
}
export const posCashApprovalStatusRef: PosCashApprovalStatusRef;

export function posCashApprovalStatus(vars: PosCashApprovalStatusVariables, options?: ExecuteQueryOptions): QueryPromise<PosCashApprovalStatusData, PosCashApprovalStatusVariables>;
export function posCashApprovalStatus(dc: DataConnect, vars: PosCashApprovalStatusVariables, options?: ExecuteQueryOptions): QueryPromise<PosCashApprovalStatusData, PosCashApprovalStatusVariables>;

