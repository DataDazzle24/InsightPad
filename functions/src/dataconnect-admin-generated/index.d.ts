import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

export interface AppPage_Key {
  id: UUIDString;
  __typename?: 'AppPage_Key';
}

export interface ArchiveCategoryData {
  _execute?: number | null;
}

export interface ArchiveCategoryVariables {
  id: UUIDString;
}

export interface ArchiveSalesChannelConnectionData {
  _execute?: number | null;
}

export interface ArchiveSalesChannelConnectionVariables {
  id: UUIDString;
}

export interface ArchiveSalesChannelProductMappingData {
  _execute?: number | null;
}

export interface ArchiveSalesChannelProductMappingVariables {
  id: UUIDString;
}

export interface ArchiveSubcategoryData {
  _execute?: number | null;
}

export interface ArchiveSubcategoryVariables {
  id: UUIDString;
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
  _execute?: number | null;
}

export interface CancelSaleVariables {
  saleId: UUIDString;
  reason: string;
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
  _select?: unknown[] | null;
}

export interface CategoryOptionsVariables {
  requestKey?: string | null;
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface ClaimDeviceSessionData {
  _execute?: number | null;
}

export interface ClaimDeviceSessionVariables {
  sessionToken: string;
  deviceId: string;
  deviceName: string;
}

export interface CloseCashSessionData {
  _execute?: number | null;
}

export interface CloseCashSessionVariables {
  sessionId: UUIDString;
  countedAmountCents: Int64String;
  notes: string;
}

export interface CreateCategoriesBatchData {
  _execute?: number | null;
}

export interface CreateCategoriesBatchVariables {
  names: unknown;
}

export interface CreateCategoryData {
  _execute?: number | null;
}

export interface CreateCategoryVariables {
  name: string;
}

export interface CreatePlatformInvoiceData {
  _execute?: number | null;
}

export interface CreatePlatformInvoiceVariables {
  payload: unknown;
}

export interface CreatePlatformTenantData {
  _execute?: number | null;
}

export interface CreatePlatformTenantVariables {
  payload: unknown;
}

export interface CreateSalesChannelConnectionData {
  _execute?: number | null;
}

export interface CreateSalesChannelConnectionVariables {
  provider: string;
  branchId: UUIDString;
  displayName: string;
  externalStoreId: string;
}

export interface CreateSalesChannelProductMappingData {
  _execute?: number | null;
}

export interface CreateSalesChannelProductMappingVariables {
  connectionId: UUIDString;
  productId: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
}

export interface CreateSubcategoriesBatchData {
  _execute?: number | null;
}

export interface CreateSubcategoriesBatchVariables {
  items: unknown;
}

export interface CreateSubcategoryData {
  _execute?: number | null;
}

export interface CreateSubcategoryVariables {
  categoryId: UUIDString;
  name: string;
}

export interface Customer_Key {
  id: UUIDString;
  __typename?: 'Customer_Key';
}

export interface DailyProfitDashboardData {
  _select?: unknown[] | null;
}

export interface DailyProfitDashboardVariables {
  from: DateString;
  to: DateString;
  branchId?: UUIDString | null;
  requestKey: string;
}

export interface EnsureSalesDefaultsData {
  _execute?: number | null;
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
  _select?: unknown[] | null;
}

export interface FinancialIndicatorsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
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
  _select?: unknown[] | null;
}

export interface LatestPendingSalesChannelOrderVariables {
  requestKey: string;
}

export interface LinkPlatformUserData {
  _execute?: number | null;
}

export interface LinkPlatformUserVariables {
  payload: unknown;
}

export interface ListBranchesData {
  _select?: unknown[] | null;
}

export interface ListBranchesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface ListCategoriesData {
  _select?: unknown[] | null;
}

export interface ListCategoriesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface ListCustomersData {
  _select?: unknown[] | null;
}

export interface ListCustomersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface ListProductsData {
  _select?: unknown[] | null;
}

export interface ListProductsVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface ListSalesData {
  _select?: unknown[] | null;
}

export interface ListSalesVariables {
  filters: unknown;
  limit: number;
  offset: number;
  requestKey: string;
}

export interface ListSubcategoriesData {
  _select?: unknown[] | null;
}

export interface ListSubcategoriesVariables {
  search: string;
  categoryId?: UUIDString | null;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface ListSuppliersData {
  _select?: unknown[] | null;
}

export interface ListSuppliersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}

export interface OfflineOperation_Key {
  id: UUIDString;
  __typename?: 'OfflineOperation_Key';
}

export interface OpenCashSessionData {
  _execute?: number | null;
}

export interface OpenCashSessionVariables {
  branchId: UUIDString;
  openingAmountCents: Int64String;
  notes: string;
}

export interface OperationalAnalyticsDashboardData {
  _select?: unknown[] | null;
}

export interface OperationalAnalyticsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
}

export interface PaymentMethod_Key {
  id: UUIDString;
  __typename?: 'PaymentMethod_Key';
}

export interface PlatformAdminWorkspaceData {
  _select?: unknown[] | null;
}

export interface PlatformAdminWorkspaceVariables {
  requestKey: string;
}

export interface PlatformBillingWorkspaceData {
  _select?: unknown[] | null;
}

export interface PlatformBillingWorkspaceV2Data {
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
}

export interface PostSaleData {
  _execute?: number | null;
}

export interface PostSaleVariables {
  payload: unknown;
}

export interface PostStockAdjustmentData {
  _execute?: number | null;
}

export interface PostStockAdjustmentVariables {
  payload: unknown;
}

export interface PostStockTransferData {
  _execute?: number | null;
}

export interface PostStockTransferVariables {
  payload: unknown;
}

export interface ProductComponent_Key {
  parentProductId: UUIDString;
  componentProductId: UUIDString;
  __typename?: 'ProductComponent_Key';
}

export interface ProductComponentsData {
  _select?: unknown[] | null;
}

export interface ProductComponentsVariables {
  productId: UUIDString;
}

export interface ProductPromotionsData {
  _select?: unknown[] | null;
}

export interface ProductPromotionsVariables {
  productId: UUIDString;
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
  _execute?: number | null;
}

export interface QueueSalesChannelOrderActionVariables {
  id: UUIDString;
  action: string;
  reason: string;
  expectedVersion: number;
}

export interface RegisterCashMovementData {
  _execute?: number | null;
}

export interface RegisterCashMovementVariables {
  sessionId: UUIDString;
  movementType: string;
  amountCents: Int64String;
  description: string;
}

export interface RegistrationOptionsData {
  _select?: unknown[] | null;
}

export interface RegistrationOptionsVariables {
  requestKey?: string | null;
}

export interface ReleaseDeviceSessionData {
  _execute?: number | null;
}

export interface ReleaseDeviceSessionVariables {
  sessionToken: string;
}

export interface RequestSalesChannelAuthorizationData {
  _execute?: number | null;
}

export interface RequestSalesChannelAuthorizationVariables {
  connectionId: UUIDString;
  requestKey: string;
}

export interface RequestSalesChannelSyncData {
  _execute?: number | null;
}

export interface RequestSalesChannelSyncVariables {
  connectionId: UUIDString;
  scope: string;
  requestKey: string;
}

export interface RestoreCategoryData {
  _execute?: number | null;
}

export interface RestoreCategoryVariables {
  id: UUIDString;
}

export interface RestoreSubcategoryData {
  _execute?: number | null;
}

export interface RestoreSubcategoryVariables {
  id: UUIDString;
}

export interface RetrySalesChannelCommandData {
  _execute?: number | null;
}

export interface RetrySalesChannelCommandVariables {
  id: UUIDString;
}

export interface ReversePlatformPaymentData {
  _execute?: number | null;
}

export interface ReversePlatformPaymentVariables {
  paymentId: UUIDString;
  reason: string;
}

export interface ReverseStockOperationData {
  _execute?: number | null;
}

export interface ReverseStockOperationVariables {
  operationId: string;
  movementIds: unknown;
  reason: string;
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
  _select?: unknown[] | null;
}

export interface SaleDetailsVariables {
  saleId: UUIDString;
  requestKey: string;
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

export interface SalesChannelCommand_Key {
  id: UUIDString;
  __typename?: 'SalesChannelCommand_Key';
}

export interface SalesChannelConnection_Key {
  id: UUIDString;
  __typename?: 'SalesChannelConnection_Key';
}

export interface SalesChannelConnectionsV2Data {
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
}

export interface SalesChannelEventInbox_Key {
  id: UUIDString;
  __typename?: 'SalesChannelEventInbox_Key';
}

export interface SalesChannelOperationsData {
  _select?: unknown[] | null;
}

export interface SalesChannelOperationsVariables {
  connectionId?: UUIDString | null;
  requestKey: string;
}

export interface SalesChannelOptionsData {
  _select?: unknown[] | null;
}

export interface SalesChannelOptionsVariables {
  requestKey: string;
}

export interface SalesChannelOrderItem_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrderItem_Key';
}

export interface SalesChannelOrder_Key {
  id: UUIDString;
  __typename?: 'SalesChannelOrder_Key';
}

export interface SalesChannelOrdersData {
  _select?: unknown[] | null;
}

export interface SalesChannelOrdersV2Data {
  _select?: unknown[] | null;
}

export interface SalesChannelOrdersV2Variables {
  filters: unknown;
  sortField: string;
  sortDirection: string;
  limit: number;
  offset: number;
  requestKey: string;
}

export interface SalesChannelOrdersVariables {
  term: string;
  status: string;
  provider: string;
  branchId?: UUIDString | null;
  limit: number;
  offset: number;
  requestKey: string;
}

export interface SalesChannelProductMapping_Key {
  id: UUIDString;
  __typename?: 'SalesChannelProductMapping_Key';
}

export interface SalesChannelProductMappingsV2Data {
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
}

export interface SalesChannelProductOptionsData {
  _select?: unknown[] | null;
}

export interface SalesChannelProductOptionsVariables {
  term: string;
  limit: number;
  requestKey: string;
}

export interface SalesChannelStatusHistory_Key {
  id: UUIDString;
  __typename?: 'SalesChannelStatusHistory_Key';
}

export interface SalesChannelSyncJob_Key {
  id: UUIDString;
  __typename?: 'SalesChannelSyncJob_Key';
}

export interface SalesChannelWorkspaceData {
  _select?: unknown[] | null;
}

export interface SalesChannelWorkspaceVariables {
  requestKey: string;
}

export interface SalesWorkspaceData {
  _select?: unknown[] | null;
}

export interface SalesWorkspaceVariables {
  branchId?: UUIDString | null;
  requestKey: string;
}

export interface SaveBranchData {
  _execute?: number | null;
}

export interface SaveBranchVariables {
  id?: UUIDString | null;
  payload: unknown;
}

export interface SaveCustomerData {
  _execute?: number | null;
}

export interface SaveCustomerVariables {
  id?: UUIDString | null;
  payload: unknown;
}

export interface SaveProductComponentsData {
  _execute?: number | null;
}

export interface SaveProductComponentsVariables {
  productId: UUIDString;
  components: unknown;
}

export interface SaveProductData {
  _execute?: number | null;
}

export interface SaveProductVariables {
  id?: UUIDString | null;
  payload: unknown;
  components?: unknown | null;
}

export interface SavePromotionData {
  _execute?: number | null;
}

export interface SavePromotionVariables {
  id?: UUIDString | null;
  productId: UUIDString;
  promotionalPriceCents: Int64String;
  startsAt: TimestampString;
  endsAt: TimestampString;
}

export interface SaveStockBatchData {
  _execute?: number | null;
}

export interface SaveStockBatchVariables {
  payload: unknown;
}

export interface SaveSupplierData {
  _execute?: number | null;
}

export interface SaveSupplierVariables {
  id?: UUIDString | null;
  payload: unknown;
}

export interface SetBranchStatusData {
  _execute?: number | null;
}

export interface SetBranchStatusVariables {
  id: UUIDString;
  active: boolean;
}

export interface SetBranchesStatusBatchData {
  _execute?: number | null;
}

export interface SetBranchesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SetCategoriesStatusBatchData {
  _execute?: number | null;
}

export interface SetCategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SetCustomerStatusData {
  _execute?: number | null;
}

export interface SetCustomerStatusVariables {
  id: UUIDString;
  active: boolean;
}

export interface SetCustomersStatusBatchData {
  _execute?: number | null;
}

export interface SetCustomersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SetPlatformRolePermissionData {
  _execute?: number | null;
}

export interface SetPlatformRolePermissionVariables {
  payload: unknown;
}

export interface SetPlatformTenantStatusData {
  _execute?: number | null;
}

export interface SetPlatformTenantStatusVariables {
  tenantId: UUIDString;
  active: boolean;
}

export interface SetPlatformUserStatusData {
  _execute?: number | null;
}

export interface SetPlatformUserStatusVariables {
  userId: string;
  active: boolean;
}

export interface SetProductStatusData {
  _execute?: number | null;
}

export interface SetProductStatusVariables {
  id: UUIDString;
  active: boolean;
}

export interface SetProductsStatusBatchData {
  _execute?: number | null;
}

export interface SetProductsStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SetPromotionStatusData {
  _execute?: number | null;
}

export interface SetPromotionStatusVariables {
  id: UUIDString;
  active: boolean;
}

export interface SetSubcategoriesStatusBatchData {
  _execute?: number | null;
}

export interface SetSubcategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SetSupplierStatusData {
  _execute?: number | null;
}

export interface SetSupplierStatusVariables {
  id: UUIDString;
  active: boolean;
}

export interface SetSuppliersStatusBatchData {
  _execute?: number | null;
}

export interface SetSuppliersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}

export interface SettlePlatformInvoiceData {
  _execute?: number | null;
}

export interface SettlePlatformInvoiceVariables {
  payload: unknown;
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
  _select?: unknown[] | null;
}

export interface StockOperationDetailsVariables {
  operationId: string;
  requestKey: string;
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
  _select?: unknown[] | null;
}

export interface StockWorkspaceVariables {
  requestKey: string;
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

export interface SystemRegisterSalesChannelEventData {
  _execute?: number | null;
}

export interface SystemRegisterSalesChannelEventVariables {
  connectionId: UUIDString;
  payload: unknown;
}

export interface SystemSalesChannelMappingsForSyncData {
  _select?: unknown[] | null;
}

export interface SystemSalesChannelMappingsForSyncVariables {
  jobId: UUIDString;
  requestKey: string;
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
  _execute?: number | null;
}

export interface TouchDeviceSessionVariables {
  sessionToken: string;
}

export interface UpdateCategoryData {
  _execute?: number | null;
}

export interface UpdateCategoryVariables {
  id: UUIDString;
  name: string;
}

export interface UpdatePlatformInvoiceData {
  _execute?: number | null;
}

export interface UpdatePlatformInvoiceVariables {
  payload: unknown;
}

export interface UpdatePlatformTenantData {
  _execute?: number | null;
}

export interface UpdatePlatformTenantVariables {
  payload: unknown;
}

export interface UpdateSalesChannelConnectionData {
  _execute?: number | null;
}

export interface UpdateSalesChannelConnectionVariables {
  id: UUIDString;
  displayName: string;
  externalStoreId: string;
  enabled: boolean;
}

export interface UpdateSalesChannelProductMappingData {
  _execute?: number | null;
}

export interface UpdateSalesChannelProductMappingVariables {
  id: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
  enabled: boolean;
}

export interface UpdateSubcategoryData {
  _execute?: number | null;
}

export interface UpdateSubcategoryVariables {
  id: UUIDString;
  categoryId: UUIDString;
  name: string;
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
  _execute?: number | null;
}

export interface VoidPlatformInvoiceVariables {
  invoiceId: UUIDString;
  reason: string;
  expectedVersion: Int64String;
}

/** Generated Node Admin SDK operation action function for the 'VerifySalesChannelOrderConstraints' Query. Allow users to execute without passing in DataConnect. */
export function verifySalesChannelOrderConstraints(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<VerifySalesChannelOrderConstraintsData>>;
/** Generated Node Admin SDK operation action function for the 'VerifySalesChannelOrderConstraints' Query. Allow users to pass in custom DataConnect instances. */
export function verifySalesChannelOrderConstraints(options?: OperationOptions): Promise<ExecuteOperationResponse<VerifySalesChannelOrderConstraintsData>>;

/** Generated Node Admin SDK operation action function for the 'BootstrapSalesChannelsNavigation' Mutation. Allow users to execute without passing in DataConnect. */
export function bootstrapSalesChannelsNavigation(dc: DataConnect, vars: BootstrapSalesChannelsNavigationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapSalesChannelsNavigationData>>;
/** Generated Node Admin SDK operation action function for the 'BootstrapSalesChannelsNavigation' Mutation. Allow users to pass in custom DataConnect instances. */
export function bootstrapSalesChannelsNavigation(vars: BootstrapSalesChannelsNavigationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapSalesChannelsNavigationData>>;

/** Generated Node Admin SDK operation action function for the 'BootstrapSalesChannelsNavigationV2' Mutation. Allow users to execute without passing in DataConnect. */
export function bootstrapSalesChannelsNavigationV2(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapSalesChannelsNavigationV2Data>>;
/** Generated Node Admin SDK operation action function for the 'BootstrapSalesChannelsNavigationV2' Mutation. Allow users to pass in custom DataConnect instances. */
export function bootstrapSalesChannelsNavigationV2(options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapSalesChannelsNavigationV2Data>>;

/** Generated Node Admin SDK operation action function for the 'BootstrapNavigationCatalog' Mutation. Allow users to execute without passing in DataConnect. */
export function bootstrapNavigationCatalog(dc: DataConnect, vars: BootstrapNavigationCatalogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapNavigationCatalogData>>;
/** Generated Node Admin SDK operation action function for the 'BootstrapNavigationCatalog' Mutation. Allow users to pass in custom DataConnect instances. */
export function bootstrapNavigationCatalog(vars: BootstrapNavigationCatalogVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<BootstrapNavigationCatalogData>>;

/** Generated Node Admin SDK operation action function for the 'CreateCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function createCategory(dc: DataConnect, vars: CreateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'CreateCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function createCategory(vars: CreateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function updateCategory(dc: DataConnect, vars: UpdateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateCategory(vars: UpdateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'ArchiveCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function archiveCategory(dc: DataConnect, vars: ArchiveCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'ArchiveCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function archiveCategory(vars: ArchiveCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'CreateSubcategory' Mutation. Allow users to execute without passing in DataConnect. */
export function createSubcategory(dc: DataConnect, vars: CreateSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSubcategoryData>>;
/** Generated Node Admin SDK operation action function for the 'CreateSubcategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function createSubcategory(vars: CreateSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSubcategoryData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateSubcategory' Mutation. Allow users to execute without passing in DataConnect. */
export function updateSubcategory(dc: DataConnect, vars: UpdateSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSubcategoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateSubcategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateSubcategory(vars: UpdateSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSubcategoryData>>;

/** Generated Node Admin SDK operation action function for the 'ArchiveSubcategory' Mutation. Allow users to execute without passing in DataConnect. */
export function archiveSubcategory(dc: DataConnect, vars: ArchiveSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSubcategoryData>>;
/** Generated Node Admin SDK operation action function for the 'ArchiveSubcategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function archiveSubcategory(vars: ArchiveSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSubcategoryData>>;

/** Generated Node Admin SDK operation action function for the 'RestoreCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function restoreCategory(dc: DataConnect, vars: RestoreCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RestoreCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'RestoreCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function restoreCategory(vars: RestoreCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RestoreCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'RestoreSubcategory' Mutation. Allow users to execute without passing in DataConnect. */
export function restoreSubcategory(dc: DataConnect, vars: RestoreSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RestoreSubcategoryData>>;
/** Generated Node Admin SDK operation action function for the 'RestoreSubcategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function restoreSubcategory(vars: RestoreSubcategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RestoreSubcategoryData>>;

/** Generated Node Admin SDK operation action function for the 'CreateCategoriesBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function createCategoriesBatch(dc: DataConnect, vars: CreateCategoriesBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateCategoriesBatchData>>;
/** Generated Node Admin SDK operation action function for the 'CreateCategoriesBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function createCategoriesBatch(vars: CreateCategoriesBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateCategoriesBatchData>>;

/** Generated Node Admin SDK operation action function for the 'CreateSubcategoriesBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function createSubcategoriesBatch(dc: DataConnect, vars: CreateSubcategoriesBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSubcategoriesBatchData>>;
/** Generated Node Admin SDK operation action function for the 'CreateSubcategoriesBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function createSubcategoriesBatch(vars: CreateSubcategoriesBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSubcategoriesBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SaveBranch' Mutation. Allow users to execute without passing in DataConnect. */
export function saveBranch(dc: DataConnect, vars: SaveBranchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveBranchData>>;
/** Generated Node Admin SDK operation action function for the 'SaveBranch' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveBranch(vars: SaveBranchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveBranchData>>;

/** Generated Node Admin SDK operation action function for the 'SetBranchStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setBranchStatus(dc: DataConnect, vars: SetBranchStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetBranchStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetBranchStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setBranchStatus(vars: SetBranchStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetBranchStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SaveSupplier' Mutation. Allow users to execute without passing in DataConnect. */
export function saveSupplier(dc: DataConnect, vars: SaveSupplierVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveSupplierData>>;
/** Generated Node Admin SDK operation action function for the 'SaveSupplier' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveSupplier(vars: SaveSupplierVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveSupplierData>>;

/** Generated Node Admin SDK operation action function for the 'SetSupplierStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setSupplierStatus(dc: DataConnect, vars: SetSupplierStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSupplierStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetSupplierStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setSupplierStatus(vars: SetSupplierStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSupplierStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SaveCustomer' Mutation. Allow users to execute without passing in DataConnect. */
export function saveCustomer(dc: DataConnect, vars: SaveCustomerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveCustomerData>>;
/** Generated Node Admin SDK operation action function for the 'SaveCustomer' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveCustomer(vars: SaveCustomerVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveCustomerData>>;

/** Generated Node Admin SDK operation action function for the 'SetCustomerStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setCustomerStatus(dc: DataConnect, vars: SetCustomerStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCustomerStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetCustomerStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setCustomerStatus(vars: SetCustomerStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCustomerStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SaveProduct' Mutation. Allow users to execute without passing in DataConnect. */
export function saveProduct(dc: DataConnect, vars: SaveProductVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveProductData>>;
/** Generated Node Admin SDK operation action function for the 'SaveProduct' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveProduct(vars: SaveProductVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveProductData>>;

/** Generated Node Admin SDK operation action function for the 'SetProductStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setProductStatus(dc: DataConnect, vars: SetProductStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetProductStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetProductStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setProductStatus(vars: SetProductStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetProductStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SaveProductComponents' Mutation. Allow users to execute without passing in DataConnect. */
export function saveProductComponents(dc: DataConnect, vars: SaveProductComponentsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveProductComponentsData>>;
/** Generated Node Admin SDK operation action function for the 'SaveProductComponents' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveProductComponents(vars: SaveProductComponentsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveProductComponentsData>>;

/** Generated Node Admin SDK operation action function for the 'SavePromotion' Mutation. Allow users to execute without passing in DataConnect. */
export function savePromotion(dc: DataConnect, vars: SavePromotionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SavePromotionData>>;
/** Generated Node Admin SDK operation action function for the 'SavePromotion' Mutation. Allow users to pass in custom DataConnect instances. */
export function savePromotion(vars: SavePromotionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SavePromotionData>>;

/** Generated Node Admin SDK operation action function for the 'SetPromotionStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setPromotionStatus(dc: DataConnect, vars: SetPromotionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPromotionStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetPromotionStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setPromotionStatus(vars: SetPromotionStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPromotionStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SetCategoriesStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setCategoriesStatusBatch(dc: DataConnect, vars: SetCategoriesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCategoriesStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetCategoriesStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setCategoriesStatusBatch(vars: SetCategoriesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCategoriesStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SetSubcategoriesStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setSubcategoriesStatusBatch(dc: DataConnect, vars: SetSubcategoriesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSubcategoriesStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetSubcategoriesStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setSubcategoriesStatusBatch(vars: SetSubcategoriesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSubcategoriesStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SetBranchesStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setBranchesStatusBatch(dc: DataConnect, vars: SetBranchesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetBranchesStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetBranchesStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setBranchesStatusBatch(vars: SetBranchesStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetBranchesStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SetSuppliersStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setSuppliersStatusBatch(dc: DataConnect, vars: SetSuppliersStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSuppliersStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetSuppliersStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setSuppliersStatusBatch(vars: SetSuppliersStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetSuppliersStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SetCustomersStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setCustomersStatusBatch(dc: DataConnect, vars: SetCustomersStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCustomersStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetCustomersStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setCustomersStatusBatch(vars: SetCustomersStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetCustomersStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'SetProductsStatusBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function setProductsStatusBatch(dc: DataConnect, vars: SetProductsStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetProductsStatusBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SetProductsStatusBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function setProductsStatusBatch(vars: SetProductsStatusBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetProductsStatusBatchData>>;

/** Generated Node Admin SDK operation action function for the 'EnsureSalesDefaults' Mutation. Allow users to execute without passing in DataConnect. */
export function ensureSalesDefaults(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<EnsureSalesDefaultsData>>;
/** Generated Node Admin SDK operation action function for the 'EnsureSalesDefaults' Mutation. Allow users to pass in custom DataConnect instances. */
export function ensureSalesDefaults(options?: OperationOptions): Promise<ExecuteOperationResponse<EnsureSalesDefaultsData>>;

/** Generated Node Admin SDK operation action function for the 'PostSale' Mutation. Allow users to execute without passing in DataConnect. */
export function postSale(dc: DataConnect, vars: PostSaleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostSaleData>>;
/** Generated Node Admin SDK operation action function for the 'PostSale' Mutation. Allow users to pass in custom DataConnect instances. */
export function postSale(vars: PostSaleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostSaleData>>;

/** Generated Node Admin SDK operation action function for the 'CancelSale' Mutation. Allow users to execute without passing in DataConnect. */
export function cancelSale(dc: DataConnect, vars: CancelSaleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelSaleData>>;
/** Generated Node Admin SDK operation action function for the 'CancelSale' Mutation. Allow users to pass in custom DataConnect instances. */
export function cancelSale(vars: CancelSaleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelSaleData>>;

/** Generated Node Admin SDK operation action function for the 'CreatePlatformTenant' Mutation. Allow users to execute without passing in DataConnect. */
export function createPlatformTenant(dc: DataConnect, vars: CreatePlatformTenantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePlatformTenantData>>;
/** Generated Node Admin SDK operation action function for the 'CreatePlatformTenant' Mutation. Allow users to pass in custom DataConnect instances. */
export function createPlatformTenant(vars: CreatePlatformTenantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePlatformTenantData>>;

/** Generated Node Admin SDK operation action function for the 'UpdatePlatformTenant' Mutation. Allow users to execute without passing in DataConnect. */
export function updatePlatformTenant(dc: DataConnect, vars: UpdatePlatformTenantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdatePlatformTenantData>>;
/** Generated Node Admin SDK operation action function for the 'UpdatePlatformTenant' Mutation. Allow users to pass in custom DataConnect instances. */
export function updatePlatformTenant(vars: UpdatePlatformTenantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdatePlatformTenantData>>;

/** Generated Node Admin SDK operation action function for the 'SetPlatformTenantStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setPlatformTenantStatus(dc: DataConnect, vars: SetPlatformTenantStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformTenantStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetPlatformTenantStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setPlatformTenantStatus(vars: SetPlatformTenantStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformTenantStatusData>>;

/** Generated Node Admin SDK operation action function for the 'LinkPlatformUser' Mutation. Allow users to execute without passing in DataConnect. */
export function linkPlatformUser(dc: DataConnect, vars: LinkPlatformUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LinkPlatformUserData>>;
/** Generated Node Admin SDK operation action function for the 'LinkPlatformUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function linkPlatformUser(vars: LinkPlatformUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LinkPlatformUserData>>;

/** Generated Node Admin SDK operation action function for the 'SetPlatformUserStatus' Mutation. Allow users to execute without passing in DataConnect. */
export function setPlatformUserStatus(dc: DataConnect, vars: SetPlatformUserStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformUserStatusData>>;
/** Generated Node Admin SDK operation action function for the 'SetPlatformUserStatus' Mutation. Allow users to pass in custom DataConnect instances. */
export function setPlatformUserStatus(vars: SetPlatformUserStatusVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformUserStatusData>>;

/** Generated Node Admin SDK operation action function for the 'SetPlatformRolePermission' Mutation. Allow users to execute without passing in DataConnect. */
export function setPlatformRolePermission(dc: DataConnect, vars: SetPlatformRolePermissionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformRolePermissionData>>;
/** Generated Node Admin SDK operation action function for the 'SetPlatformRolePermission' Mutation. Allow users to pass in custom DataConnect instances. */
export function setPlatformRolePermission(vars: SetPlatformRolePermissionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetPlatformRolePermissionData>>;

/** Generated Node Admin SDK operation action function for the 'CreatePlatformInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function createPlatformInvoice(dc: DataConnect, vars: CreatePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePlatformInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'CreatePlatformInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function createPlatformInvoice(vars: CreatePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePlatformInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'UpdatePlatformInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function updatePlatformInvoice(dc: DataConnect, vars: UpdatePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdatePlatformInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'UpdatePlatformInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function updatePlatformInvoice(vars: UpdatePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdatePlatformInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'VoidPlatformInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function voidPlatformInvoice(dc: DataConnect, vars: VoidPlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<VoidPlatformInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'VoidPlatformInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function voidPlatformInvoice(vars: VoidPlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<VoidPlatformInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'SettlePlatformInvoice' Mutation. Allow users to execute without passing in DataConnect. */
export function settlePlatformInvoice(dc: DataConnect, vars: SettlePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SettlePlatformInvoiceData>>;
/** Generated Node Admin SDK operation action function for the 'SettlePlatformInvoice' Mutation. Allow users to pass in custom DataConnect instances. */
export function settlePlatformInvoice(vars: SettlePlatformInvoiceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SettlePlatformInvoiceData>>;

/** Generated Node Admin SDK operation action function for the 'ReversePlatformPayment' Mutation. Allow users to execute without passing in DataConnect. */
export function reversePlatformPayment(dc: DataConnect, vars: ReversePlatformPaymentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReversePlatformPaymentData>>;
/** Generated Node Admin SDK operation action function for the 'ReversePlatformPayment' Mutation. Allow users to pass in custom DataConnect instances. */
export function reversePlatformPayment(vars: ReversePlatformPaymentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReversePlatformPaymentData>>;

/** Generated Node Admin SDK operation action function for the 'PostStockAdjustment' Mutation. Allow users to execute without passing in DataConnect. */
export function postStockAdjustment(dc: DataConnect, vars: PostStockAdjustmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostStockAdjustmentData>>;
/** Generated Node Admin SDK operation action function for the 'PostStockAdjustment' Mutation. Allow users to pass in custom DataConnect instances. */
export function postStockAdjustment(vars: PostStockAdjustmentVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostStockAdjustmentData>>;

/** Generated Node Admin SDK operation action function for the 'PostStockTransfer' Mutation. Allow users to execute without passing in DataConnect. */
export function postStockTransfer(dc: DataConnect, vars: PostStockTransferVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostStockTransferData>>;
/** Generated Node Admin SDK operation action function for the 'PostStockTransfer' Mutation. Allow users to pass in custom DataConnect instances. */
export function postStockTransfer(vars: PostStockTransferVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PostStockTransferData>>;

/** Generated Node Admin SDK operation action function for the 'SaveStockBatch' Mutation. Allow users to execute without passing in DataConnect. */
export function saveStockBatch(dc: DataConnect, vars: SaveStockBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveStockBatchData>>;
/** Generated Node Admin SDK operation action function for the 'SaveStockBatch' Mutation. Allow users to pass in custom DataConnect instances. */
export function saveStockBatch(vars: SaveStockBatchVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaveStockBatchData>>;

/** Generated Node Admin SDK operation action function for the 'ReverseStockOperation' Mutation. Allow users to execute without passing in DataConnect. */
export function reverseStockOperation(dc: DataConnect, vars: ReverseStockOperationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReverseStockOperationData>>;
/** Generated Node Admin SDK operation action function for the 'ReverseStockOperation' Mutation. Allow users to pass in custom DataConnect instances. */
export function reverseStockOperation(vars: ReverseStockOperationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReverseStockOperationData>>;

/** Generated Node Admin SDK operation action function for the 'OpenCashSession' Mutation. Allow users to execute without passing in DataConnect. */
export function openCashSession(dc: DataConnect, vars: OpenCashSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<OpenCashSessionData>>;
/** Generated Node Admin SDK operation action function for the 'OpenCashSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function openCashSession(vars: OpenCashSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<OpenCashSessionData>>;

/** Generated Node Admin SDK operation action function for the 'RegisterCashMovement' Mutation. Allow users to execute without passing in DataConnect. */
export function registerCashMovement(dc: DataConnect, vars: RegisterCashMovementVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegisterCashMovementData>>;
/** Generated Node Admin SDK operation action function for the 'RegisterCashMovement' Mutation. Allow users to pass in custom DataConnect instances. */
export function registerCashMovement(vars: RegisterCashMovementVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegisterCashMovementData>>;

/** Generated Node Admin SDK operation action function for the 'ClaimDeviceSession' Mutation. Allow users to execute without passing in DataConnect. */
export function claimDeviceSession(dc: DataConnect, vars: ClaimDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ClaimDeviceSessionData>>;
/** Generated Node Admin SDK operation action function for the 'ClaimDeviceSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function claimDeviceSession(vars: ClaimDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ClaimDeviceSessionData>>;

/** Generated Node Admin SDK operation action function for the 'TouchDeviceSession' Mutation. Allow users to execute without passing in DataConnect. */
export function touchDeviceSession(dc: DataConnect, vars: TouchDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<TouchDeviceSessionData>>;
/** Generated Node Admin SDK operation action function for the 'TouchDeviceSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function touchDeviceSession(vars: TouchDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<TouchDeviceSessionData>>;

/** Generated Node Admin SDK operation action function for the 'ReleaseDeviceSession' Mutation. Allow users to execute without passing in DataConnect. */
export function releaseDeviceSession(dc: DataConnect, vars: ReleaseDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReleaseDeviceSessionData>>;
/** Generated Node Admin SDK operation action function for the 'ReleaseDeviceSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function releaseDeviceSession(vars: ReleaseDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ReleaseDeviceSessionData>>;

/** Generated Node Admin SDK operation action function for the 'CreateSalesChannelConnection' Mutation. Allow users to execute without passing in DataConnect. */
export function createSalesChannelConnection(dc: DataConnect, vars: CreateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSalesChannelConnectionData>>;
/** Generated Node Admin SDK operation action function for the 'CreateSalesChannelConnection' Mutation. Allow users to pass in custom DataConnect instances. */
export function createSalesChannelConnection(vars: CreateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSalesChannelConnectionData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateSalesChannelConnection' Mutation. Allow users to execute without passing in DataConnect. */
export function updateSalesChannelConnection(dc: DataConnect, vars: UpdateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSalesChannelConnectionData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateSalesChannelConnection' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateSalesChannelConnection(vars: UpdateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSalesChannelConnectionData>>;

/** Generated Node Admin SDK operation action function for the 'ArchiveSalesChannelConnection' Mutation. Allow users to execute without passing in DataConnect. */
export function archiveSalesChannelConnection(dc: DataConnect, vars: ArchiveSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSalesChannelConnectionData>>;
/** Generated Node Admin SDK operation action function for the 'ArchiveSalesChannelConnection' Mutation. Allow users to pass in custom DataConnect instances. */
export function archiveSalesChannelConnection(vars: ArchiveSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSalesChannelConnectionData>>;

/** Generated Node Admin SDK operation action function for the 'CreateSalesChannelProductMapping' Mutation. Allow users to execute without passing in DataConnect. */
export function createSalesChannelProductMapping(dc: DataConnect, vars: CreateSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSalesChannelProductMappingData>>;
/** Generated Node Admin SDK operation action function for the 'CreateSalesChannelProductMapping' Mutation. Allow users to pass in custom DataConnect instances. */
export function createSalesChannelProductMapping(vars: CreateSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSalesChannelProductMappingData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateSalesChannelProductMapping' Mutation. Allow users to execute without passing in DataConnect. */
export function updateSalesChannelProductMapping(dc: DataConnect, vars: UpdateSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSalesChannelProductMappingData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateSalesChannelProductMapping' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateSalesChannelProductMapping(vars: UpdateSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateSalesChannelProductMappingData>>;

/** Generated Node Admin SDK operation action function for the 'ArchiveSalesChannelProductMapping' Mutation. Allow users to execute without passing in DataConnect. */
export function archiveSalesChannelProductMapping(dc: DataConnect, vars: ArchiveSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSalesChannelProductMappingData>>;
/** Generated Node Admin SDK operation action function for the 'ArchiveSalesChannelProductMapping' Mutation. Allow users to pass in custom DataConnect instances. */
export function archiveSalesChannelProductMapping(vars: ArchiveSalesChannelProductMappingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ArchiveSalesChannelProductMappingData>>;

/** Generated Node Admin SDK operation action function for the 'QueueSalesChannelOrderAction' Mutation. Allow users to execute without passing in DataConnect. */
export function queueSalesChannelOrderAction(dc: DataConnect, vars: QueueSalesChannelOrderActionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<QueueSalesChannelOrderActionData>>;
/** Generated Node Admin SDK operation action function for the 'QueueSalesChannelOrderAction' Mutation. Allow users to pass in custom DataConnect instances. */
export function queueSalesChannelOrderAction(vars: QueueSalesChannelOrderActionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<QueueSalesChannelOrderActionData>>;

/** Generated Node Admin SDK operation action function for the 'RetrySalesChannelCommand' Mutation. Allow users to execute without passing in DataConnect. */
export function retrySalesChannelCommand(dc: DataConnect, vars: RetrySalesChannelCommandVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RetrySalesChannelCommandData>>;
/** Generated Node Admin SDK operation action function for the 'RetrySalesChannelCommand' Mutation. Allow users to pass in custom DataConnect instances. */
export function retrySalesChannelCommand(vars: RetrySalesChannelCommandVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RetrySalesChannelCommandData>>;

/** Generated Node Admin SDK operation action function for the 'RequestSalesChannelSync' Mutation. Allow users to execute without passing in DataConnect. */
export function requestSalesChannelSync(dc: DataConnect, vars: RequestSalesChannelSyncVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestSalesChannelSyncData>>;
/** Generated Node Admin SDK operation action function for the 'RequestSalesChannelSync' Mutation. Allow users to pass in custom DataConnect instances. */
export function requestSalesChannelSync(vars: RequestSalesChannelSyncVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestSalesChannelSyncData>>;

/** Generated Node Admin SDK operation action function for the 'RequestSalesChannelAuthorization' Mutation. Allow users to execute without passing in DataConnect. */
export function requestSalesChannelAuthorization(dc: DataConnect, vars: RequestSalesChannelAuthorizationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestSalesChannelAuthorizationData>>;
/** Generated Node Admin SDK operation action function for the 'RequestSalesChannelAuthorization' Mutation. Allow users to pass in custom DataConnect instances. */
export function requestSalesChannelAuthorization(vars: RequestSalesChannelAuthorizationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestSalesChannelAuthorizationData>>;

/** Generated Node Admin SDK operation action function for the 'SystemClaimSalesChannelWork' Mutation. Allow users to execute without passing in DataConnect. */
export function systemClaimSalesChannelWork(dc: DataConnect, vars: SystemClaimSalesChannelWorkVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemClaimSalesChannelWorkData>>;
/** Generated Node Admin SDK operation action function for the 'SystemClaimSalesChannelWork' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemClaimSalesChannelWork(vars: SystemClaimSalesChannelWorkVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemClaimSalesChannelWorkData>>;

/** Generated Node Admin SDK operation action function for the 'SystemUpdateSalesChannelConnection' Mutation. Allow users to execute without passing in DataConnect. */
export function systemUpdateSalesChannelConnection(dc: DataConnect, vars: SystemUpdateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemUpdateSalesChannelConnectionData>>;
/** Generated Node Admin SDK operation action function for the 'SystemUpdateSalesChannelConnection' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemUpdateSalesChannelConnection(vars: SystemUpdateSalesChannelConnectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemUpdateSalesChannelConnectionData>>;

/** Generated Node Admin SDK operation action function for the 'SystemRegisterSalesChannelEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function systemRegisterSalesChannelEvent(dc: DataConnect, vars: SystemRegisterSalesChannelEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRegisterSalesChannelEventData>>;
/** Generated Node Admin SDK operation action function for the 'SystemRegisterSalesChannelEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemRegisterSalesChannelEvent(vars: SystemRegisterSalesChannelEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRegisterSalesChannelEventData>>;

/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelEventResult' Mutation. Allow users to execute without passing in DataConnect. */
export function systemRecordSalesChannelEventResult(dc: DataConnect, vars: SystemRecordSalesChannelEventResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelEventResultData>>;
/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelEventResult' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemRecordSalesChannelEventResult(vars: SystemRecordSalesChannelEventResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelEventResultData>>;

/** Generated Node Admin SDK operation action function for the 'SystemIngestSalesChannelOrder' Mutation. Allow users to execute without passing in DataConnect. */
export function systemIngestSalesChannelOrder(dc: DataConnect, vars: SystemIngestSalesChannelOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIngestSalesChannelOrderData>>;
/** Generated Node Admin SDK operation action function for the 'SystemIngestSalesChannelOrder' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemIngestSalesChannelOrder(vars: SystemIngestSalesChannelOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIngestSalesChannelOrderData>>;

/** Generated Node Admin SDK operation action function for the 'SystemApplySalesChannelOrderEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function systemApplySalesChannelOrderEvent(dc: DataConnect, vars: SystemApplySalesChannelOrderEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemApplySalesChannelOrderEventData>>;
/** Generated Node Admin SDK operation action function for the 'SystemApplySalesChannelOrderEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemApplySalesChannelOrderEvent(vars: SystemApplySalesChannelOrderEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemApplySalesChannelOrderEventData>>;

/** Generated Node Admin SDK operation action function for the 'SystemQueueDueSalesChannelSyncJobs' Mutation. Allow users to execute without passing in DataConnect. */
export function systemQueueDueSalesChannelSyncJobs(dc: DataConnect, vars: SystemQueueDueSalesChannelSyncJobsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemQueueDueSalesChannelSyncJobsData>>;
/** Generated Node Admin SDK operation action function for the 'SystemQueueDueSalesChannelSyncJobs' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemQueueDueSalesChannelSyncJobs(vars: SystemQueueDueSalesChannelSyncJobsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemQueueDueSalesChannelSyncJobsData>>;

/** Generated Node Admin SDK operation action function for the 'SystemPurgeExpiredSalesChannelPayloads' Mutation. Allow users to execute without passing in DataConnect. */
export function systemPurgeExpiredSalesChannelPayloads(dc: DataConnect, vars: SystemPurgeExpiredSalesChannelPayloadsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemPurgeExpiredSalesChannelPayloadsData>>;
/** Generated Node Admin SDK operation action function for the 'SystemPurgeExpiredSalesChannelPayloads' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemPurgeExpiredSalesChannelPayloads(vars: SystemPurgeExpiredSalesChannelPayloadsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemPurgeExpiredSalesChannelPayloadsData>>;

/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelCommandResult' Mutation. Allow users to execute without passing in DataConnect. */
export function systemRecordSalesChannelCommandResult(dc: DataConnect, vars: SystemRecordSalesChannelCommandResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelCommandResultData>>;
/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelCommandResult' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemRecordSalesChannelCommandResult(vars: SystemRecordSalesChannelCommandResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelCommandResultData>>;

/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelSyncResult' Mutation. Allow users to execute without passing in DataConnect. */
export function systemRecordSalesChannelSyncResult(dc: DataConnect, vars: SystemRecordSalesChannelSyncResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelSyncResultData>>;
/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelSyncResult' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemRecordSalesChannelSyncResult(vars: SystemRecordSalesChannelSyncResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelSyncResultData>>;

/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelMappingResult' Mutation. Allow users to execute without passing in DataConnect. */
export function systemRecordSalesChannelMappingResult(dc: DataConnect, vars: SystemRecordSalesChannelMappingResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelMappingResultData>>;
/** Generated Node Admin SDK operation action function for the 'SystemRecordSalesChannelMappingResult' Mutation. Allow users to pass in custom DataConnect instances. */
export function systemRecordSalesChannelMappingResult(vars: SystemRecordSalesChannelMappingResultVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemRecordSalesChannelMappingResultData>>;

/** Generated Node Admin SDK operation action function for the 'CloseCashSession' Mutation. Allow users to execute without passing in DataConnect. */
export function closeCashSession(dc: DataConnect, vars: CloseCashSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CloseCashSessionData>>;
/** Generated Node Admin SDK operation action function for the 'CloseCashSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function closeCashSession(vars: CloseCashSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CloseCashSessionData>>;

/** Generated Node Admin SDK operation action function for the 'GetCurrentUser' Query. Allow users to execute without passing in DataConnect. */
export function getCurrentUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetCurrentUser' Query. Allow users to pass in custom DataConnect instances. */
export function getCurrentUser(options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetCurrentUserAccess' Query. Allow users to execute without passing in DataConnect. */
export function getCurrentUserAccess(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserAccessData>>;
/** Generated Node Admin SDK operation action function for the 'GetCurrentUserAccess' Query. Allow users to pass in custom DataConnect instances. */
export function getCurrentUserAccess(options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserAccessData>>;

/** Generated Node Admin SDK operation action function for the 'ValidateDeviceSession' Query. Allow users to execute without passing in DataConnect. */
export function validateDeviceSession(dc: DataConnect, vars: ValidateDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ValidateDeviceSessionData>>;
/** Generated Node Admin SDK operation action function for the 'ValidateDeviceSession' Query. Allow users to pass in custom DataConnect instances. */
export function validateDeviceSession(vars: ValidateDeviceSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ValidateDeviceSessionData>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelOptions' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelOptions(dc: DataConnect, vars: SalesChannelOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOptionsData>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelOptions' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelOptions(vars: SalesChannelOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOptionsData>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelConnectionsV2' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelConnectionsV2(dc: DataConnect, vars: SalesChannelConnectionsV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelConnectionsV2Data>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelConnectionsV2' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelConnectionsV2(vars: SalesChannelConnectionsV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelConnectionsV2Data>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelProductMappingsV2' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelProductMappingsV2(dc: DataConnect, vars: SalesChannelProductMappingsV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelProductMappingsV2Data>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelProductMappingsV2' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelProductMappingsV2(vars: SalesChannelProductMappingsV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelProductMappingsV2Data>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelProductOptions' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelProductOptions(dc: DataConnect, vars: SalesChannelProductOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelProductOptionsData>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelProductOptions' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelProductOptions(vars: SalesChannelProductOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelProductOptionsData>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelOperations' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelOperations(dc: DataConnect, vars: SalesChannelOperationsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOperationsData>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelOperations' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelOperations(vars: SalesChannelOperationsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOperationsData>>;

/** Generated Node Admin SDK operation action function for the 'SystemSalesChannelWorkQueue' Query. Allow users to execute without passing in DataConnect. */
export function systemSalesChannelWorkQueue(dc: DataConnect, vars: SystemSalesChannelWorkQueueVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemSalesChannelWorkQueueData>>;
/** Generated Node Admin SDK operation action function for the 'SystemSalesChannelWorkQueue' Query. Allow users to pass in custom DataConnect instances. */
export function systemSalesChannelWorkQueue(vars: SystemSalesChannelWorkQueueVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemSalesChannelWorkQueueData>>;

/** Generated Node Admin SDK operation action function for the 'SystemIfoodConnectionsForPolling' Query. Allow users to execute without passing in DataConnect. */
export function systemIfoodConnectionsForPolling(dc: DataConnect, vars: SystemIfoodConnectionsForPollingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIfoodConnectionsForPollingData>>;
/** Generated Node Admin SDK operation action function for the 'SystemIfoodConnectionsForPolling' Query. Allow users to pass in custom DataConnect instances. */
export function systemIfoodConnectionsForPolling(vars: SystemIfoodConnectionsForPollingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIfoodConnectionsForPollingData>>;

/** Generated Node Admin SDK operation action function for the 'SystemIfoodConnectionByMerchant' Query. Allow users to execute without passing in DataConnect. */
export function systemIfoodConnectionByMerchant(dc: DataConnect, vars: SystemIfoodConnectionByMerchantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIfoodConnectionByMerchantData>>;
/** Generated Node Admin SDK operation action function for the 'SystemIfoodConnectionByMerchant' Query. Allow users to pass in custom DataConnect instances. */
export function systemIfoodConnectionByMerchant(vars: SystemIfoodConnectionByMerchantVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemIfoodConnectionByMerchantData>>;

/** Generated Node Admin SDK operation action function for the 'SystemSalesChannelMappingsForSync' Query. Allow users to execute without passing in DataConnect. */
export function systemSalesChannelMappingsForSync(dc: DataConnect, vars: SystemSalesChannelMappingsForSyncVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemSalesChannelMappingsForSyncData>>;
/** Generated Node Admin SDK operation action function for the 'SystemSalesChannelMappingsForSync' Query. Allow users to pass in custom DataConnect instances. */
export function systemSalesChannelMappingsForSync(vars: SystemSalesChannelMappingsForSyncVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SystemSalesChannelMappingsForSyncData>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelOrdersV2' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelOrdersV2(dc: DataConnect, vars: SalesChannelOrdersV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOrdersV2Data>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelOrdersV2' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelOrdersV2(vars: SalesChannelOrdersV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOrdersV2Data>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelWorkspace' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelWorkspace(dc: DataConnect, vars: SalesChannelWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelWorkspaceData>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelWorkspace' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelWorkspace(vars: SalesChannelWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelWorkspaceData>>;

/** Generated Node Admin SDK operation action function for the 'SalesChannelOrders' Query. Allow users to execute without passing in DataConnect. */
export function salesChannelOrders(dc: DataConnect, vars: SalesChannelOrdersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOrdersData>>;
/** Generated Node Admin SDK operation action function for the 'SalesChannelOrders' Query. Allow users to pass in custom DataConnect instances. */
export function salesChannelOrders(vars: SalesChannelOrdersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesChannelOrdersData>>;

/** Generated Node Admin SDK operation action function for the 'LatestPendingSalesChannelOrder' Query. Allow users to execute without passing in DataConnect. */
export function latestPendingSalesChannelOrder(dc: DataConnect, vars: LatestPendingSalesChannelOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LatestPendingSalesChannelOrderData>>;
/** Generated Node Admin SDK operation action function for the 'LatestPendingSalesChannelOrder' Query. Allow users to pass in custom DataConnect instances. */
export function latestPendingSalesChannelOrder(vars: LatestPendingSalesChannelOrderVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LatestPendingSalesChannelOrderData>>;

/** Generated Node Admin SDK operation action function for the 'SalesWorkspace' Query. Allow users to execute without passing in DataConnect. */
export function salesWorkspace(dc: DataConnect, vars: SalesWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesWorkspaceData>>;
/** Generated Node Admin SDK operation action function for the 'SalesWorkspace' Query. Allow users to pass in custom DataConnect instances. */
export function salesWorkspace(vars: SalesWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SalesWorkspaceData>>;

/** Generated Node Admin SDK operation action function for the 'ListSales' Query. Allow users to execute without passing in DataConnect. */
export function listSales(dc: DataConnect, vars: ListSalesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSalesData>>;
/** Generated Node Admin SDK operation action function for the 'ListSales' Query. Allow users to pass in custom DataConnect instances. */
export function listSales(vars: ListSalesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSalesData>>;

/** Generated Node Admin SDK operation action function for the 'SaleDetails' Query. Allow users to execute without passing in DataConnect. */
export function saleDetails(dc: DataConnect, vars: SaleDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaleDetailsData>>;
/** Generated Node Admin SDK operation action function for the 'SaleDetails' Query. Allow users to pass in custom DataConnect instances. */
export function saleDetails(vars: SaleDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SaleDetailsData>>;

/** Generated Node Admin SDK operation action function for the 'ListCategories' Query. Allow users to execute without passing in DataConnect. */
export function listCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCategoriesData>>;
/** Generated Node Admin SDK operation action function for the 'ListCategories' Query. Allow users to pass in custom DataConnect instances. */
export function listCategories(vars: ListCategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCategoriesData>>;

/** Generated Node Admin SDK operation action function for the 'ListSubcategories' Query. Allow users to execute without passing in DataConnect. */
export function listSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSubcategoriesData>>;
/** Generated Node Admin SDK operation action function for the 'ListSubcategories' Query. Allow users to pass in custom DataConnect instances. */
export function listSubcategories(vars: ListSubcategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSubcategoriesData>>;

/** Generated Node Admin SDK operation action function for the 'CategoryOptions' Query. Allow users to execute without passing in DataConnect. */
export function categoryOptions(dc: DataConnect, vars?: CategoryOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CategoryOptionsData>>;
/** Generated Node Admin SDK operation action function for the 'CategoryOptions' Query. Allow users to pass in custom DataConnect instances. */
export function categoryOptions(vars?: CategoryOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CategoryOptionsData>>;

/** Generated Node Admin SDK operation action function for the 'ListBranches' Query. Allow users to execute without passing in DataConnect. */
export function listBranches(dc: DataConnect, vars: ListBranchesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListBranchesData>>;
/** Generated Node Admin SDK operation action function for the 'ListBranches' Query. Allow users to pass in custom DataConnect instances. */
export function listBranches(vars: ListBranchesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListBranchesData>>;

/** Generated Node Admin SDK operation action function for the 'ListSuppliers' Query. Allow users to execute without passing in DataConnect. */
export function listSuppliers(dc: DataConnect, vars: ListSuppliersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSuppliersData>>;
/** Generated Node Admin SDK operation action function for the 'ListSuppliers' Query. Allow users to pass in custom DataConnect instances. */
export function listSuppliers(vars: ListSuppliersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSuppliersData>>;

/** Generated Node Admin SDK operation action function for the 'ListCustomers' Query. Allow users to execute without passing in DataConnect. */
export function listCustomers(dc: DataConnect, vars: ListCustomersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCustomersData>>;
/** Generated Node Admin SDK operation action function for the 'ListCustomers' Query. Allow users to pass in custom DataConnect instances. */
export function listCustomers(vars: ListCustomersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCustomersData>>;

/** Generated Node Admin SDK operation action function for the 'ListProducts' Query. Allow users to execute without passing in DataConnect. */
export function listProducts(dc: DataConnect, vars: ListProductsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListProductsData>>;
/** Generated Node Admin SDK operation action function for the 'ListProducts' Query. Allow users to pass in custom DataConnect instances. */
export function listProducts(vars: ListProductsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListProductsData>>;

/** Generated Node Admin SDK operation action function for the 'RegistrationOptions' Query. Allow users to execute without passing in DataConnect. */
export function registrationOptions(dc: DataConnect, vars?: RegistrationOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegistrationOptionsData>>;
/** Generated Node Admin SDK operation action function for the 'RegistrationOptions' Query. Allow users to pass in custom DataConnect instances. */
export function registrationOptions(vars?: RegistrationOptionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegistrationOptionsData>>;

/** Generated Node Admin SDK operation action function for the 'ProductComponents' Query. Allow users to execute without passing in DataConnect. */
export function productComponents(dc: DataConnect, vars: ProductComponentsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ProductComponentsData>>;
/** Generated Node Admin SDK operation action function for the 'ProductComponents' Query. Allow users to pass in custom DataConnect instances. */
export function productComponents(vars: ProductComponentsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ProductComponentsData>>;

/** Generated Node Admin SDK operation action function for the 'ProductPromotions' Query. Allow users to execute without passing in DataConnect. */
export function productPromotions(dc: DataConnect, vars: ProductPromotionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ProductPromotionsData>>;
/** Generated Node Admin SDK operation action function for the 'ProductPromotions' Query. Allow users to pass in custom DataConnect instances. */
export function productPromotions(vars: ProductPromotionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ProductPromotionsData>>;

/** Generated Node Admin SDK operation action function for the 'PlatformAdminWorkspace' Query. Allow users to execute without passing in DataConnect. */
export function platformAdminWorkspace(dc: DataConnect, vars: PlatformAdminWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformAdminWorkspaceData>>;
/** Generated Node Admin SDK operation action function for the 'PlatformAdminWorkspace' Query. Allow users to pass in custom DataConnect instances. */
export function platformAdminWorkspace(vars: PlatformAdminWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformAdminWorkspaceData>>;

/** Generated Node Admin SDK operation action function for the 'PlatformBillingWorkspace' Query. Allow users to execute without passing in DataConnect. */
export function platformBillingWorkspace(dc: DataConnect, vars: PlatformBillingWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformBillingWorkspaceData>>;
/** Generated Node Admin SDK operation action function for the 'PlatformBillingWorkspace' Query. Allow users to pass in custom DataConnect instances. */
export function platformBillingWorkspace(vars: PlatformBillingWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformBillingWorkspaceData>>;

/** Generated Node Admin SDK operation action function for the 'PlatformBillingWorkspaceV2' Query. Allow users to execute without passing in DataConnect. */
export function platformBillingWorkspaceV2(dc: DataConnect, vars: PlatformBillingWorkspaceV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformBillingWorkspaceV2Data>>;
/** Generated Node Admin SDK operation action function for the 'PlatformBillingWorkspaceV2' Query. Allow users to pass in custom DataConnect instances. */
export function platformBillingWorkspaceV2(vars: PlatformBillingWorkspaceV2Variables, options?: OperationOptions): Promise<ExecuteOperationResponse<PlatformBillingWorkspaceV2Data>>;

/** Generated Node Admin SDK operation action function for the 'StockWorkspace' Query. Allow users to execute without passing in DataConnect. */
export function stockWorkspace(dc: DataConnect, vars: StockWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<StockWorkspaceData>>;
/** Generated Node Admin SDK operation action function for the 'StockWorkspace' Query. Allow users to pass in custom DataConnect instances. */
export function stockWorkspace(vars: StockWorkspaceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<StockWorkspaceData>>;

/** Generated Node Admin SDK operation action function for the 'DailyProfitDashboard' Query. Allow users to execute without passing in DataConnect. */
export function dailyProfitDashboard(dc: DataConnect, vars: DailyProfitDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DailyProfitDashboardData>>;
/** Generated Node Admin SDK operation action function for the 'DailyProfitDashboard' Query. Allow users to pass in custom DataConnect instances. */
export function dailyProfitDashboard(vars: DailyProfitDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DailyProfitDashboardData>>;

/** Generated Node Admin SDK operation action function for the 'StockOperationDetails' Query. Allow users to execute without passing in DataConnect. */
export function stockOperationDetails(dc: DataConnect, vars: StockOperationDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<StockOperationDetailsData>>;
/** Generated Node Admin SDK operation action function for the 'StockOperationDetails' Query. Allow users to pass in custom DataConnect instances. */
export function stockOperationDetails(vars: StockOperationDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<StockOperationDetailsData>>;

/** Generated Node Admin SDK operation action function for the 'FinancialIndicatorsDashboard' Query. Allow users to execute without passing in DataConnect. */
export function financialIndicatorsDashboard(dc: DataConnect, vars: FinancialIndicatorsDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FinancialIndicatorsDashboardData>>;
/** Generated Node Admin SDK operation action function for the 'FinancialIndicatorsDashboard' Query. Allow users to pass in custom DataConnect instances. */
export function financialIndicatorsDashboard(vars: FinancialIndicatorsDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<FinancialIndicatorsDashboardData>>;

/** Generated Node Admin SDK operation action function for the 'OperationalAnalyticsDashboard' Query. Allow users to execute without passing in DataConnect. */
export function operationalAnalyticsDashboard(dc: DataConnect, vars: OperationalAnalyticsDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<OperationalAnalyticsDashboardData>>;
/** Generated Node Admin SDK operation action function for the 'OperationalAnalyticsDashboard' Query. Allow users to pass in custom DataConnect instances. */
export function operationalAnalyticsDashboard(vars: OperationalAnalyticsDashboardVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<OperationalAnalyticsDashboardData>>;
