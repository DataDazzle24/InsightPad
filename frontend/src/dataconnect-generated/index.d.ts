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

export interface SalesChannelConnection_Key {
  id: UUIDString;
  __typename?: 'SalesChannelConnection_Key';
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

export interface TransitionSalesChannelOrderData {
  _execute?: number | null;
}

export interface TransitionSalesChannelOrderVariables {
  id: UUIDString;
  action: string;
  reason: string;
  expectedVersion: number;
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
  (): MutationRef<EnsureSalesDefaultsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<EnsureSalesDefaultsData, undefined>;
  operationName: string;
}
export const ensureSalesDefaultsRef: EnsureSalesDefaultsRef;

export function ensureSalesDefaults(): MutationPromise<EnsureSalesDefaultsData, undefined>;
export function ensureSalesDefaults(dc: DataConnect): MutationPromise<EnsureSalesDefaultsData, undefined>;

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

interface TransitionSalesChannelOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransitionSalesChannelOrderVariables): MutationRef<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: TransitionSalesChannelOrderVariables): MutationRef<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;
  operationName: string;
}
export const transitionSalesChannelOrderRef: TransitionSalesChannelOrderRef;

export function transitionSalesChannelOrder(vars: TransitionSalesChannelOrderVariables): MutationPromise<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;
export function transitionSalesChannelOrder(dc: DataConnect, vars: TransitionSalesChannelOrderVariables): MutationPromise<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;

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

