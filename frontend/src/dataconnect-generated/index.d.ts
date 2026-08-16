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
}

export interface BootstrapNavigationCatalogVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}

export interface Branch_Key {
  id: UUIDString;
  __typename?: 'Branch_Key';
}

export interface CashMovement_Key {
  id: UUIDString;
  __typename?: 'CashMovement_Key';
}

export interface CashSession_Key {
  id: UUIDString;
  __typename?: 'CashSession_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface Customer_Key {
  id: UUIDString;
  __typename?: 'Customer_Key';
}

export interface FinancialAccount_Key {
  id: UUIDString;
  __typename?: 'FinancialAccount_Key';
}

export interface FinancialCategory_Key {
  id: UUIDString;
  __typename?: 'FinancialCategory_Key';
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
      active: boolean;
    } & Role_Key;
  } & User_Key;
}

export interface OfflineOperation_Key {
  id: UUIDString;
  __typename?: 'OfflineOperation_Key';
}

export interface PaymentMethod_Key {
  id: UUIDString;
  __typename?: 'PaymentMethod_Key';
}

export interface ProductComponent_Key {
  parentProductId: UUIDString;
  componentProductId: UUIDString;
  __typename?: 'ProductComponent_Key';
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface Promotion_Key {
  id: UUIDString;
  __typename?: 'Promotion_Key';
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

export interface StockTransferItem_Key {
  id: UUIDString;
  __typename?: 'StockTransferItem_Key';
}

export interface StockTransfer_Key {
  id: UUIDString;
  __typename?: 'StockTransfer_Key';
}

export interface Subcategory_Key {
  id: UUIDString;
  __typename?: 'Subcategory_Key';
}

export interface Supplier_Key {
  id: UUIDString;
  __typename?: 'Supplier_Key';
}

export interface Tenant_Key {
  id: UUIDString;
  __typename?: 'Tenant_Key';
}

export interface UserBranch_Key {
  userId: string;
  branchId: UUIDString;
  __typename?: 'UserBranch_Key';
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

