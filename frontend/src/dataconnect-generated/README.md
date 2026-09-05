# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `app`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*VerifySalesChannelOrderConstraints*](#verifysaleschannelorderconstraints)
  - [*GetCurrentUser*](#getcurrentuser)
  - [*GetCurrentUserAccess*](#getcurrentuseraccess)
  - [*ValidateDeviceSession*](#validatedevicesession)
  - [*SalesChannelWorkspace*](#saleschannelworkspace)
  - [*SalesChannelOrders*](#saleschannelorders)
  - [*LatestPendingSalesChannelOrder*](#latestpendingsaleschannelorder)
  - [*SalesWorkspace*](#salesworkspace)
  - [*ListSales*](#listsales)
  - [*SaleDetails*](#saledetails)
  - [*ListCategories*](#listcategories)
  - [*ListSubcategories*](#listsubcategories)
  - [*CategoryOptions*](#categoryoptions)
  - [*ListBranches*](#listbranches)
  - [*ListSuppliers*](#listsuppliers)
  - [*ListCustomers*](#listcustomers)
  - [*ListProducts*](#listproducts)
  - [*RegistrationOptions*](#registrationoptions)
  - [*ProductComponents*](#productcomponents)
  - [*ProductPromotions*](#productpromotions)
  - [*PlatformAdminWorkspace*](#platformadminworkspace)
  - [*PlatformBillingWorkspace*](#platformbillingworkspace)
  - [*StockWorkspace*](#stockworkspace)
  - [*DailyProfitDashboard*](#dailyprofitdashboard)
  - [*StockOperationDetails*](#stockoperationdetails)
  - [*FinancialIndicatorsDashboard*](#financialindicatorsdashboard)
  - [*OperationalAnalyticsDashboard*](#operationalanalyticsdashboard)
- [**Mutations**](#mutations)
  - [*BootstrapSalesChannelsNavigation*](#bootstrapsaleschannelsnavigation)
  - [*BootstrapSalesChannelsNavigationV2*](#bootstrapsaleschannelsnavigationv2)
  - [*BootstrapNavigationCatalog*](#bootstrapnavigationcatalog)
  - [*CreateCategory*](#createcategory)
  - [*UpdateCategory*](#updatecategory)
  - [*ArchiveCategory*](#archivecategory)
  - [*CreateSubcategory*](#createsubcategory)
  - [*UpdateSubcategory*](#updatesubcategory)
  - [*ArchiveSubcategory*](#archivesubcategory)
  - [*RestoreCategory*](#restorecategory)
  - [*RestoreSubcategory*](#restoresubcategory)
  - [*CreateCategoriesBatch*](#createcategoriesbatch)
  - [*CreateSubcategoriesBatch*](#createsubcategoriesbatch)
  - [*SaveBranch*](#savebranch)
  - [*SetBranchStatus*](#setbranchstatus)
  - [*SaveSupplier*](#savesupplier)
  - [*SetSupplierStatus*](#setsupplierstatus)
  - [*SaveCustomer*](#savecustomer)
  - [*SetCustomerStatus*](#setcustomerstatus)
  - [*SaveProduct*](#saveproduct)
  - [*SetProductStatus*](#setproductstatus)
  - [*SaveProductComponents*](#saveproductcomponents)
  - [*SavePromotion*](#savepromotion)
  - [*SetPromotionStatus*](#setpromotionstatus)
  - [*SetCategoriesStatusBatch*](#setcategoriesstatusbatch)
  - [*SetSubcategoriesStatusBatch*](#setsubcategoriesstatusbatch)
  - [*SetBranchesStatusBatch*](#setbranchesstatusbatch)
  - [*SetSuppliersStatusBatch*](#setsuppliersstatusbatch)
  - [*SetCustomersStatusBatch*](#setcustomersstatusbatch)
  - [*SetProductsStatusBatch*](#setproductsstatusbatch)
  - [*EnsureSalesDefaults*](#ensuresalesdefaults)
  - [*PostSale*](#postsale)
  - [*CancelSale*](#cancelsale)
  - [*CreatePlatformTenant*](#createplatformtenant)
  - [*UpdatePlatformTenant*](#updateplatformtenant)
  - [*SetPlatformTenantStatus*](#setplatformtenantstatus)
  - [*LinkPlatformUser*](#linkplatformuser)
  - [*SetPlatformUserStatus*](#setplatformuserstatus)
  - [*SetPlatformRolePermission*](#setplatformrolepermission)
  - [*CreatePlatformInvoice*](#createplatforminvoice)
  - [*UpdatePlatformInvoice*](#updateplatforminvoice)
  - [*VoidPlatformInvoice*](#voidplatforminvoice)
  - [*SettlePlatformInvoice*](#settleplatforminvoice)
  - [*ReversePlatformPayment*](#reverseplatformpayment)
  - [*PostStockAdjustment*](#poststockadjustment)
  - [*PostStockTransfer*](#poststocktransfer)
  - [*SaveStockBatch*](#savestockbatch)
  - [*ReverseStockOperation*](#reversestockoperation)
  - [*OpenCashSession*](#opencashsession)
  - [*RegisterCashMovement*](#registercashmovement)
  - [*ClaimDeviceSession*](#claimdevicesession)
  - [*TouchDeviceSession*](#touchdevicesession)
  - [*ReleaseDeviceSession*](#releasedevicesession)
  - [*CreateSalesChannelConnection*](#createsaleschannelconnection)
  - [*UpdateSalesChannelConnection*](#updatesaleschannelconnection)
  - [*ArchiveSalesChannelConnection*](#archivesaleschannelconnection)
  - [*CreateSalesChannelProductMapping*](#createsaleschannelproductmapping)
  - [*UpdateSalesChannelProductMapping*](#updatesaleschannelproductmapping)
  - [*ArchiveSalesChannelProductMapping*](#archivesaleschannelproductmapping)
  - [*TransitionSalesChannelOrder*](#transitionsaleschannelorder)
  - [*CloseCashSession*](#closecashsession)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `app`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@insightpad/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `app` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## VerifySalesChannelOrderConstraints
You can execute the `VerifySalesChannelOrderConstraints` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
verifySalesChannelOrderConstraints(options?: ExecuteQueryOptions): QueryPromise<VerifySalesChannelOrderConstraintsData, undefined>;

interface VerifySalesChannelOrderConstraintsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<VerifySalesChannelOrderConstraintsData, undefined>;
}
export const verifySalesChannelOrderConstraintsRef: VerifySalesChannelOrderConstraintsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
verifySalesChannelOrderConstraints(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<VerifySalesChannelOrderConstraintsData, undefined>;

interface VerifySalesChannelOrderConstraintsRef {
  ...
  (dc: DataConnect): QueryRef<VerifySalesChannelOrderConstraintsData, undefined>;
}
export const verifySalesChannelOrderConstraintsRef: VerifySalesChannelOrderConstraintsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the verifySalesChannelOrderConstraintsRef:
```typescript
const name = verifySalesChannelOrderConstraintsRef.operationName;
console.log(name);
```

### Variables
The `VerifySalesChannelOrderConstraints` query has no variables.
### Return Type
Recall that executing the `VerifySalesChannelOrderConstraints` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `VerifySalesChannelOrderConstraintsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface VerifySalesChannelOrderConstraintsData {
  _select?: unknown[] | null;
}
```
### Using `VerifySalesChannelOrderConstraints`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, verifySalesChannelOrderConstraints } from '@insightpad/dataconnect';


// Call the `verifySalesChannelOrderConstraints()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await verifySalesChannelOrderConstraints();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await verifySalesChannelOrderConstraints(dataConnect);

console.log(data._select);

// Or, you can use the `Promise` API.
verifySalesChannelOrderConstraints().then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `VerifySalesChannelOrderConstraints`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, verifySalesChannelOrderConstraintsRef } from '@insightpad/dataconnect';


// Call the `verifySalesChannelOrderConstraintsRef()` function to get a reference to the query.
const ref = verifySalesChannelOrderConstraintsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = verifySalesChannelOrderConstraintsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## GetCurrentUser
You can execute the `GetCurrentUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCurrentUser(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface GetCurrentUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserData, undefined>;
}
export const getCurrentUserRef: GetCurrentUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCurrentUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserData, undefined>;

interface GetCurrentUserRef {
  ...
  (dc: DataConnect): QueryRef<GetCurrentUserData, undefined>;
}
export const getCurrentUserRef: GetCurrentUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCurrentUserRef:
```typescript
const name = getCurrentUserRef.operationName;
console.log(name);
```

### Variables
The `GetCurrentUser` query has no variables.
### Return Type
Recall that executing the `GetCurrentUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCurrentUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCurrentUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCurrentUser } from '@insightpad/dataconnect';


// Call the `getCurrentUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCurrentUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCurrentUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getCurrentUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetCurrentUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCurrentUserRef } from '@insightpad/dataconnect';


// Call the `getCurrentUserRef()` function to get a reference to the query.
const ref = getCurrentUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCurrentUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetCurrentUserAccess
You can execute the `GetCurrentUserAccess` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCurrentUserAccess(options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAccessData, undefined>;

interface GetCurrentUserAccessRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCurrentUserAccessData, undefined>;
}
export const getCurrentUserAccessRef: GetCurrentUserAccessRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCurrentUserAccess(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCurrentUserAccessData, undefined>;

interface GetCurrentUserAccessRef {
  ...
  (dc: DataConnect): QueryRef<GetCurrentUserAccessData, undefined>;
}
export const getCurrentUserAccessRef: GetCurrentUserAccessRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCurrentUserAccessRef:
```typescript
const name = getCurrentUserAccessRef.operationName;
console.log(name);
```

### Variables
The `GetCurrentUserAccess` query has no variables.
### Return Type
Recall that executing the `GetCurrentUserAccess` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCurrentUserAccessData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCurrentUserAccess`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCurrentUserAccess } from '@insightpad/dataconnect';


// Call the `getCurrentUserAccess()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCurrentUserAccess();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCurrentUserAccess(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getCurrentUserAccess().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetCurrentUserAccess`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCurrentUserAccessRef } from '@insightpad/dataconnect';


// Call the `getCurrentUserAccessRef()` function to get a reference to the query.
const ref = getCurrentUserAccessRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCurrentUserAccessRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ValidateDeviceSession
You can execute the `ValidateDeviceSession` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
validateDeviceSession(vars: ValidateDeviceSessionVariables, options?: ExecuteQueryOptions): QueryPromise<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;

interface ValidateDeviceSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ValidateDeviceSessionVariables): QueryRef<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
}
export const validateDeviceSessionRef: ValidateDeviceSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
validateDeviceSession(dc: DataConnect, vars: ValidateDeviceSessionVariables, options?: ExecuteQueryOptions): QueryPromise<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;

interface ValidateDeviceSessionRef {
  ...
  (dc: DataConnect, vars: ValidateDeviceSessionVariables): QueryRef<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
}
export const validateDeviceSessionRef: ValidateDeviceSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the validateDeviceSessionRef:
```typescript
const name = validateDeviceSessionRef.operationName;
console.log(name);
```

### Variables
The `ValidateDeviceSession` query requires an argument of type `ValidateDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ValidateDeviceSessionVariables {
  sessionToken: string;
  requestKey: string;
}
```
### Return Type
Recall that executing the `ValidateDeviceSession` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ValidateDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ValidateDeviceSessionData {
  _select?: unknown[] | null;
}
```
### Using `ValidateDeviceSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, validateDeviceSession, ValidateDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ValidateDeviceSession` query requires an argument of type `ValidateDeviceSessionVariables`:
const validateDeviceSessionVars: ValidateDeviceSessionVariables = {
  sessionToken: ..., 
  requestKey: ..., 
};

// Call the `validateDeviceSession()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await validateDeviceSession(validateDeviceSessionVars);
// Variables can be defined inline as well.
const { data } = await validateDeviceSession({ sessionToken: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await validateDeviceSession(dataConnect, validateDeviceSessionVars);

console.log(data._select);

// Or, you can use the `Promise` API.
validateDeviceSession(validateDeviceSessionVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ValidateDeviceSession`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, validateDeviceSessionRef, ValidateDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ValidateDeviceSession` query requires an argument of type `ValidateDeviceSessionVariables`:
const validateDeviceSessionVars: ValidateDeviceSessionVariables = {
  sessionToken: ..., 
  requestKey: ..., 
};

// Call the `validateDeviceSessionRef()` function to get a reference to the query.
const ref = validateDeviceSessionRef(validateDeviceSessionVars);
// Variables can be defined inline as well.
const ref = validateDeviceSessionRef({ sessionToken: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = validateDeviceSessionRef(dataConnect, validateDeviceSessionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## SalesChannelWorkspace
You can execute the `SalesChannelWorkspace` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
salesChannelWorkspace(vars: SalesChannelWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;

interface SalesChannelWorkspaceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelWorkspaceVariables): QueryRef<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
}
export const salesChannelWorkspaceRef: SalesChannelWorkspaceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
salesChannelWorkspace(dc: DataConnect, vars: SalesChannelWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;

interface SalesChannelWorkspaceRef {
  ...
  (dc: DataConnect, vars: SalesChannelWorkspaceVariables): QueryRef<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
}
export const salesChannelWorkspaceRef: SalesChannelWorkspaceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the salesChannelWorkspaceRef:
```typescript
const name = salesChannelWorkspaceRef.operationName;
console.log(name);
```

### Variables
The `SalesChannelWorkspace` query requires an argument of type `SalesChannelWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SalesChannelWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that executing the `SalesChannelWorkspace` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SalesChannelWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SalesChannelWorkspaceData {
  _select?: unknown[] | null;
}
```
### Using `SalesChannelWorkspace`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, salesChannelWorkspace, SalesChannelWorkspaceVariables } from '@insightpad/dataconnect';

// The `SalesChannelWorkspace` query requires an argument of type `SalesChannelWorkspaceVariables`:
const salesChannelWorkspaceVars: SalesChannelWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `salesChannelWorkspace()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await salesChannelWorkspace(salesChannelWorkspaceVars);
// Variables can be defined inline as well.
const { data } = await salesChannelWorkspace({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await salesChannelWorkspace(dataConnect, salesChannelWorkspaceVars);

console.log(data._select);

// Or, you can use the `Promise` API.
salesChannelWorkspace(salesChannelWorkspaceVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `SalesChannelWorkspace`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, salesChannelWorkspaceRef, SalesChannelWorkspaceVariables } from '@insightpad/dataconnect';

// The `SalesChannelWorkspace` query requires an argument of type `SalesChannelWorkspaceVariables`:
const salesChannelWorkspaceVars: SalesChannelWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `salesChannelWorkspaceRef()` function to get a reference to the query.
const ref = salesChannelWorkspaceRef(salesChannelWorkspaceVars);
// Variables can be defined inline as well.
const ref = salesChannelWorkspaceRef({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = salesChannelWorkspaceRef(dataConnect, salesChannelWorkspaceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## SalesChannelOrders
You can execute the `SalesChannelOrders` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
salesChannelOrders(vars: SalesChannelOrdersVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersData, SalesChannelOrdersVariables>;

interface SalesChannelOrdersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesChannelOrdersVariables): QueryRef<SalesChannelOrdersData, SalesChannelOrdersVariables>;
}
export const salesChannelOrdersRef: SalesChannelOrdersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
salesChannelOrders(dc: DataConnect, vars: SalesChannelOrdersVariables, options?: ExecuteQueryOptions): QueryPromise<SalesChannelOrdersData, SalesChannelOrdersVariables>;

interface SalesChannelOrdersRef {
  ...
  (dc: DataConnect, vars: SalesChannelOrdersVariables): QueryRef<SalesChannelOrdersData, SalesChannelOrdersVariables>;
}
export const salesChannelOrdersRef: SalesChannelOrdersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the salesChannelOrdersRef:
```typescript
const name = salesChannelOrdersRef.operationName;
console.log(name);
```

### Variables
The `SalesChannelOrders` query requires an argument of type `SalesChannelOrdersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SalesChannelOrdersVariables {
  term: string;
  status: string;
  provider: string;
  branchId?: UUIDString | null;
  limit: number;
  offset: number;
  requestKey: string;
}
```
### Return Type
Recall that executing the `SalesChannelOrders` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SalesChannelOrdersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SalesChannelOrdersData {
  _select?: unknown[] | null;
}
```
### Using `SalesChannelOrders`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, salesChannelOrders, SalesChannelOrdersVariables } from '@insightpad/dataconnect';

// The `SalesChannelOrders` query requires an argument of type `SalesChannelOrdersVariables`:
const salesChannelOrdersVars: SalesChannelOrdersVariables = {
  term: ..., 
  status: ..., 
  provider: ..., 
  branchId: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `salesChannelOrders()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await salesChannelOrders(salesChannelOrdersVars);
// Variables can be defined inline as well.
const { data } = await salesChannelOrders({ term: ..., status: ..., provider: ..., branchId: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await salesChannelOrders(dataConnect, salesChannelOrdersVars);

console.log(data._select);

// Or, you can use the `Promise` API.
salesChannelOrders(salesChannelOrdersVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `SalesChannelOrders`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, salesChannelOrdersRef, SalesChannelOrdersVariables } from '@insightpad/dataconnect';

// The `SalesChannelOrders` query requires an argument of type `SalesChannelOrdersVariables`:
const salesChannelOrdersVars: SalesChannelOrdersVariables = {
  term: ..., 
  status: ..., 
  provider: ..., 
  branchId: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `salesChannelOrdersRef()` function to get a reference to the query.
const ref = salesChannelOrdersRef(salesChannelOrdersVars);
// Variables can be defined inline as well.
const ref = salesChannelOrdersRef({ term: ..., status: ..., provider: ..., branchId: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = salesChannelOrdersRef(dataConnect, salesChannelOrdersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## LatestPendingSalesChannelOrder
You can execute the `LatestPendingSalesChannelOrder` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
latestPendingSalesChannelOrder(vars: LatestPendingSalesChannelOrderVariables, options?: ExecuteQueryOptions): QueryPromise<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;

interface LatestPendingSalesChannelOrderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: LatestPendingSalesChannelOrderVariables): QueryRef<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;
}
export const latestPendingSalesChannelOrderRef: LatestPendingSalesChannelOrderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
latestPendingSalesChannelOrder(dc: DataConnect, vars: LatestPendingSalesChannelOrderVariables, options?: ExecuteQueryOptions): QueryPromise<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;

interface LatestPendingSalesChannelOrderRef {
  ...
  (dc: DataConnect, vars: LatestPendingSalesChannelOrderVariables): QueryRef<LatestPendingSalesChannelOrderData, LatestPendingSalesChannelOrderVariables>;
}
export const latestPendingSalesChannelOrderRef: LatestPendingSalesChannelOrderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the latestPendingSalesChannelOrderRef:
```typescript
const name = latestPendingSalesChannelOrderRef.operationName;
console.log(name);
```

### Variables
The `LatestPendingSalesChannelOrder` query requires an argument of type `LatestPendingSalesChannelOrderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface LatestPendingSalesChannelOrderVariables {
  requestKey: string;
}
```
### Return Type
Recall that executing the `LatestPendingSalesChannelOrder` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `LatestPendingSalesChannelOrderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface LatestPendingSalesChannelOrderData {
  _select?: unknown[] | null;
}
```
### Using `LatestPendingSalesChannelOrder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, latestPendingSalesChannelOrder, LatestPendingSalesChannelOrderVariables } from '@insightpad/dataconnect';

// The `LatestPendingSalesChannelOrder` query requires an argument of type `LatestPendingSalesChannelOrderVariables`:
const latestPendingSalesChannelOrderVars: LatestPendingSalesChannelOrderVariables = {
  requestKey: ..., 
};

// Call the `latestPendingSalesChannelOrder()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await latestPendingSalesChannelOrder(latestPendingSalesChannelOrderVars);
// Variables can be defined inline as well.
const { data } = await latestPendingSalesChannelOrder({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await latestPendingSalesChannelOrder(dataConnect, latestPendingSalesChannelOrderVars);

console.log(data._select);

// Or, you can use the `Promise` API.
latestPendingSalesChannelOrder(latestPendingSalesChannelOrderVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `LatestPendingSalesChannelOrder`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, latestPendingSalesChannelOrderRef, LatestPendingSalesChannelOrderVariables } from '@insightpad/dataconnect';

// The `LatestPendingSalesChannelOrder` query requires an argument of type `LatestPendingSalesChannelOrderVariables`:
const latestPendingSalesChannelOrderVars: LatestPendingSalesChannelOrderVariables = {
  requestKey: ..., 
};

// Call the `latestPendingSalesChannelOrderRef()` function to get a reference to the query.
const ref = latestPendingSalesChannelOrderRef(latestPendingSalesChannelOrderVars);
// Variables can be defined inline as well.
const ref = latestPendingSalesChannelOrderRef({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = latestPendingSalesChannelOrderRef(dataConnect, latestPendingSalesChannelOrderVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## SalesWorkspace
You can execute the `SalesWorkspace` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
salesWorkspace(vars: SalesWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesWorkspaceData, SalesWorkspaceVariables>;

interface SalesWorkspaceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SalesWorkspaceVariables): QueryRef<SalesWorkspaceData, SalesWorkspaceVariables>;
}
export const salesWorkspaceRef: SalesWorkspaceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
salesWorkspace(dc: DataConnect, vars: SalesWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<SalesWorkspaceData, SalesWorkspaceVariables>;

interface SalesWorkspaceRef {
  ...
  (dc: DataConnect, vars: SalesWorkspaceVariables): QueryRef<SalesWorkspaceData, SalesWorkspaceVariables>;
}
export const salesWorkspaceRef: SalesWorkspaceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the salesWorkspaceRef:
```typescript
const name = salesWorkspaceRef.operationName;
console.log(name);
```

### Variables
The `SalesWorkspace` query requires an argument of type `SalesWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SalesWorkspaceVariables {
  branchId?: UUIDString | null;
  requestKey: string;
}
```
### Return Type
Recall that executing the `SalesWorkspace` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SalesWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SalesWorkspaceData {
  _select?: unknown[] | null;
}
```
### Using `SalesWorkspace`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, salesWorkspace, SalesWorkspaceVariables } from '@insightpad/dataconnect';

// The `SalesWorkspace` query requires an argument of type `SalesWorkspaceVariables`:
const salesWorkspaceVars: SalesWorkspaceVariables = {
  branchId: ..., // optional
  requestKey: ..., 
};

// Call the `salesWorkspace()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await salesWorkspace(salesWorkspaceVars);
// Variables can be defined inline as well.
const { data } = await salesWorkspace({ branchId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await salesWorkspace(dataConnect, salesWorkspaceVars);

console.log(data._select);

// Or, you can use the `Promise` API.
salesWorkspace(salesWorkspaceVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `SalesWorkspace`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, salesWorkspaceRef, SalesWorkspaceVariables } from '@insightpad/dataconnect';

// The `SalesWorkspace` query requires an argument of type `SalesWorkspaceVariables`:
const salesWorkspaceVars: SalesWorkspaceVariables = {
  branchId: ..., // optional
  requestKey: ..., 
};

// Call the `salesWorkspaceRef()` function to get a reference to the query.
const ref = salesWorkspaceRef(salesWorkspaceVars);
// Variables can be defined inline as well.
const ref = salesWorkspaceRef({ branchId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = salesWorkspaceRef(dataConnect, salesWorkspaceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListSales
You can execute the `ListSales` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSales(vars: ListSalesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSalesData, ListSalesVariables>;

interface ListSalesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSalesVariables): QueryRef<ListSalesData, ListSalesVariables>;
}
export const listSalesRef: ListSalesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSales(dc: DataConnect, vars: ListSalesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSalesData, ListSalesVariables>;

interface ListSalesRef {
  ...
  (dc: DataConnect, vars: ListSalesVariables): QueryRef<ListSalesData, ListSalesVariables>;
}
export const listSalesRef: ListSalesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSalesRef:
```typescript
const name = listSalesRef.operationName;
console.log(name);
```

### Variables
The `ListSales` query requires an argument of type `ListSalesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListSalesVariables {
  filters: unknown;
  limit: number;
  offset: number;
  requestKey: string;
}
```
### Return Type
Recall that executing the `ListSales` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSalesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSalesData {
  _select?: unknown[] | null;
}
```
### Using `ListSales`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSales, ListSalesVariables } from '@insightpad/dataconnect';

// The `ListSales` query requires an argument of type `ListSalesVariables`:
const listSalesVars: ListSalesVariables = {
  filters: ..., 
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `listSales()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSales(listSalesVars);
// Variables can be defined inline as well.
const { data } = await listSales({ filters: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSales(dataConnect, listSalesVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listSales(listSalesVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListSales`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSalesRef, ListSalesVariables } from '@insightpad/dataconnect';

// The `ListSales` query requires an argument of type `ListSalesVariables`:
const listSalesVars: ListSalesVariables = {
  filters: ..., 
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `listSalesRef()` function to get a reference to the query.
const ref = listSalesRef(listSalesVars);
// Variables can be defined inline as well.
const ref = listSalesRef({ filters: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSalesRef(dataConnect, listSalesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## SaleDetails
You can execute the `SaleDetails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saleDetails(vars: SaleDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SaleDetailsData, SaleDetailsVariables>;

interface SaleDetailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaleDetailsVariables): QueryRef<SaleDetailsData, SaleDetailsVariables>;
}
export const saleDetailsRef: SaleDetailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
saleDetails(dc: DataConnect, vars: SaleDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<SaleDetailsData, SaleDetailsVariables>;

interface SaleDetailsRef {
  ...
  (dc: DataConnect, vars: SaleDetailsVariables): QueryRef<SaleDetailsData, SaleDetailsVariables>;
}
export const saleDetailsRef: SaleDetailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saleDetailsRef:
```typescript
const name = saleDetailsRef.operationName;
console.log(name);
```

### Variables
The `SaleDetails` query requires an argument of type `SaleDetailsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaleDetailsVariables {
  saleId: UUIDString;
  requestKey: string;
}
```
### Return Type
Recall that executing the `SaleDetails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaleDetailsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaleDetailsData {
  _select?: unknown[] | null;
}
```
### Using `SaleDetails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saleDetails, SaleDetailsVariables } from '@insightpad/dataconnect';

// The `SaleDetails` query requires an argument of type `SaleDetailsVariables`:
const saleDetailsVars: SaleDetailsVariables = {
  saleId: ..., 
  requestKey: ..., 
};

// Call the `saleDetails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saleDetails(saleDetailsVars);
// Variables can be defined inline as well.
const { data } = await saleDetails({ saleId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saleDetails(dataConnect, saleDetailsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
saleDetails(saleDetailsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `SaleDetails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, saleDetailsRef, SaleDetailsVariables } from '@insightpad/dataconnect';

// The `SaleDetails` query requires an argument of type `SaleDetailsVariables`:
const saleDetailsVars: SaleDetailsVariables = {
  saleId: ..., 
  requestKey: ..., 
};

// Call the `saleDetailsRef()` function to get a reference to the query.
const ref = saleDetailsRef(saleDetailsVars);
// Variables can be defined inline as well.
const ref = saleDetailsRef({ saleId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saleDetailsRef(dataConnect, saleDetailsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListCategories
You can execute the `ListCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCategories(vars: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
}
export const listCategoriesRef: ListCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListCategoriesRef {
  ...
  (dc: DataConnect, vars: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
}
export const listCategoriesRef: ListCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCategoriesRef:
```typescript
const name = listCategoriesRef.operationName;
console.log(name);
```

### Variables
The `ListCategories` query requires an argument of type `ListCategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCategoriesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCategoriesData {
  _select?: unknown[] | null;
}
```
### Using `ListCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCategories, ListCategoriesVariables } from '@insightpad/dataconnect';

// The `ListCategories` query requires an argument of type `ListCategoriesVariables`:
const listCategoriesVars: ListCategoriesVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCategories(listCategoriesVars);
// Variables can be defined inline as well.
const { data } = await listCategories({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCategories(dataConnect, listCategoriesVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listCategories(listCategoriesVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCategoriesRef, ListCategoriesVariables } from '@insightpad/dataconnect';

// The `ListCategories` query requires an argument of type `ListCategoriesVariables`:
const listCategoriesVars: ListCategoriesVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCategoriesRef()` function to get a reference to the query.
const ref = listCategoriesRef(listCategoriesVars);
// Variables can be defined inline as well.
const ref = listCategoriesRef({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCategoriesRef(dataConnect, listCategoriesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListSubcategories
You can execute the `ListSubcategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSubcategories(vars: ListSubcategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSubcategoriesData, ListSubcategoriesVariables>;

interface ListSubcategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSubcategoriesVariables): QueryRef<ListSubcategoriesData, ListSubcategoriesVariables>;
}
export const listSubcategoriesRef: ListSubcategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListSubcategoriesData, ListSubcategoriesVariables>;

interface ListSubcategoriesRef {
  ...
  (dc: DataConnect, vars: ListSubcategoriesVariables): QueryRef<ListSubcategoriesData, ListSubcategoriesVariables>;
}
export const listSubcategoriesRef: ListSubcategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSubcategoriesRef:
```typescript
const name = listSubcategoriesRef.operationName;
console.log(name);
```

### Variables
The `ListSubcategories` query requires an argument of type `ListSubcategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListSubcategoriesVariables {
  search: string;
  categoryId?: UUIDString | null;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListSubcategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSubcategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSubcategoriesData {
  _select?: unknown[] | null;
}
```
### Using `ListSubcategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSubcategories, ListSubcategoriesVariables } from '@insightpad/dataconnect';

// The `ListSubcategories` query requires an argument of type `ListSubcategoriesVariables`:
const listSubcategoriesVars: ListSubcategoriesVariables = {
  search: ..., 
  categoryId: ..., // optional
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSubcategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSubcategories(listSubcategoriesVars);
// Variables can be defined inline as well.
const { data } = await listSubcategories({ search: ..., categoryId: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSubcategories(dataConnect, listSubcategoriesVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listSubcategories(listSubcategoriesVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListSubcategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSubcategoriesRef, ListSubcategoriesVariables } from '@insightpad/dataconnect';

// The `ListSubcategories` query requires an argument of type `ListSubcategoriesVariables`:
const listSubcategoriesVars: ListSubcategoriesVariables = {
  search: ..., 
  categoryId: ..., // optional
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSubcategoriesRef()` function to get a reference to the query.
const ref = listSubcategoriesRef(listSubcategoriesVars);
// Variables can be defined inline as well.
const ref = listSubcategoriesRef({ search: ..., categoryId: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSubcategoriesRef(dataConnect, listSubcategoriesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## CategoryOptions
You can execute the `CategoryOptions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
categoryOptions(vars?: CategoryOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, CategoryOptionsVariables>;

interface CategoryOptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: CategoryOptionsVariables): QueryRef<CategoryOptionsData, CategoryOptionsVariables>;
}
export const categoryOptionsRef: CategoryOptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
categoryOptions(dc: DataConnect, vars?: CategoryOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, CategoryOptionsVariables>;

interface CategoryOptionsRef {
  ...
  (dc: DataConnect, vars?: CategoryOptionsVariables): QueryRef<CategoryOptionsData, CategoryOptionsVariables>;
}
export const categoryOptionsRef: CategoryOptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the categoryOptionsRef:
```typescript
const name = categoryOptionsRef.operationName;
console.log(name);
```

### Variables
The `CategoryOptions` query has an optional argument of type `CategoryOptionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CategoryOptionsVariables {
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `CategoryOptions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CategoryOptionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CategoryOptionsData {
  _select?: unknown[] | null;
}
```
### Using `CategoryOptions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, categoryOptions, CategoryOptionsVariables } from '@insightpad/dataconnect';

// The `CategoryOptions` query has an optional argument of type `CategoryOptionsVariables`:
const categoryOptionsVars: CategoryOptionsVariables = {
  requestKey: ..., // optional
};

// Call the `categoryOptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await categoryOptions(categoryOptionsVars);
// Variables can be defined inline as well.
const { data } = await categoryOptions({ requestKey: ..., });
// Since all variables are optional for this query, you can omit the `CategoryOptionsVariables` argument.
const { data } = await categoryOptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await categoryOptions(dataConnect, categoryOptionsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
categoryOptions(categoryOptionsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `CategoryOptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, categoryOptionsRef, CategoryOptionsVariables } from '@insightpad/dataconnect';

// The `CategoryOptions` query has an optional argument of type `CategoryOptionsVariables`:
const categoryOptionsVars: CategoryOptionsVariables = {
  requestKey: ..., // optional
};

// Call the `categoryOptionsRef()` function to get a reference to the query.
const ref = categoryOptionsRef(categoryOptionsVars);
// Variables can be defined inline as well.
const ref = categoryOptionsRef({ requestKey: ..., });
// Since all variables are optional for this query, you can omit the `CategoryOptionsVariables` argument.
const ref = categoryOptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = categoryOptionsRef(dataConnect, categoryOptionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListBranches
You can execute the `ListBranches` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listBranches(vars: ListBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<ListBranchesData, ListBranchesVariables>;

interface ListBranchesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListBranchesVariables): QueryRef<ListBranchesData, ListBranchesVariables>;
}
export const listBranchesRef: ListBranchesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listBranches(dc: DataConnect, vars: ListBranchesVariables, options?: ExecuteQueryOptions): QueryPromise<ListBranchesData, ListBranchesVariables>;

interface ListBranchesRef {
  ...
  (dc: DataConnect, vars: ListBranchesVariables): QueryRef<ListBranchesData, ListBranchesVariables>;
}
export const listBranchesRef: ListBranchesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listBranchesRef:
```typescript
const name = listBranchesRef.operationName;
console.log(name);
```

### Variables
The `ListBranches` query requires an argument of type `ListBranchesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListBranchesVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListBranches` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListBranchesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListBranchesData {
  _select?: unknown[] | null;
}
```
### Using `ListBranches`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listBranches, ListBranchesVariables } from '@insightpad/dataconnect';

// The `ListBranches` query requires an argument of type `ListBranchesVariables`:
const listBranchesVars: ListBranchesVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listBranches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBranches(listBranchesVars);
// Variables can be defined inline as well.
const { data } = await listBranches({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listBranches(dataConnect, listBranchesVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listBranches(listBranchesVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListBranches`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listBranchesRef, ListBranchesVariables } from '@insightpad/dataconnect';

// The `ListBranches` query requires an argument of type `ListBranchesVariables`:
const listBranchesVars: ListBranchesVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listBranchesRef()` function to get a reference to the query.
const ref = listBranchesRef(listBranchesVars);
// Variables can be defined inline as well.
const ref = listBranchesRef({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listBranchesRef(dataConnect, listBranchesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListSuppliers
You can execute the `ListSuppliers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSuppliers(vars: ListSuppliersVariables, options?: ExecuteQueryOptions): QueryPromise<ListSuppliersData, ListSuppliersVariables>;

interface ListSuppliersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListSuppliersVariables): QueryRef<ListSuppliersData, ListSuppliersVariables>;
}
export const listSuppliersRef: ListSuppliersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSuppliers(dc: DataConnect, vars: ListSuppliersVariables, options?: ExecuteQueryOptions): QueryPromise<ListSuppliersData, ListSuppliersVariables>;

interface ListSuppliersRef {
  ...
  (dc: DataConnect, vars: ListSuppliersVariables): QueryRef<ListSuppliersData, ListSuppliersVariables>;
}
export const listSuppliersRef: ListSuppliersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSuppliersRef:
```typescript
const name = listSuppliersRef.operationName;
console.log(name);
```

### Variables
The `ListSuppliers` query requires an argument of type `ListSuppliersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListSuppliersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListSuppliers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSuppliersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSuppliersData {
  _select?: unknown[] | null;
}
```
### Using `ListSuppliers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSuppliers, ListSuppliersVariables } from '@insightpad/dataconnect';

// The `ListSuppliers` query requires an argument of type `ListSuppliersVariables`:
const listSuppliersVars: ListSuppliersVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSuppliers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSuppliers(listSuppliersVars);
// Variables can be defined inline as well.
const { data } = await listSuppliers({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSuppliers(dataConnect, listSuppliersVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listSuppliers(listSuppliersVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListSuppliers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSuppliersRef, ListSuppliersVariables } from '@insightpad/dataconnect';

// The `ListSuppliers` query requires an argument of type `ListSuppliersVariables`:
const listSuppliersVars: ListSuppliersVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSuppliersRef()` function to get a reference to the query.
const ref = listSuppliersRef(listSuppliersVars);
// Variables can be defined inline as well.
const ref = listSuppliersRef({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSuppliersRef(dataConnect, listSuppliersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListCustomers
You can execute the `ListCustomers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCustomers(vars: ListCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<ListCustomersData, ListCustomersVariables>;

interface ListCustomersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListCustomersVariables): QueryRef<ListCustomersData, ListCustomersVariables>;
}
export const listCustomersRef: ListCustomersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCustomers(dc: DataConnect, vars: ListCustomersVariables, options?: ExecuteQueryOptions): QueryPromise<ListCustomersData, ListCustomersVariables>;

interface ListCustomersRef {
  ...
  (dc: DataConnect, vars: ListCustomersVariables): QueryRef<ListCustomersData, ListCustomersVariables>;
}
export const listCustomersRef: ListCustomersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCustomersRef:
```typescript
const name = listCustomersRef.operationName;
console.log(name);
```

### Variables
The `ListCustomers` query requires an argument of type `ListCustomersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCustomersVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListCustomers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCustomersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListCustomersData {
  _select?: unknown[] | null;
}
```
### Using `ListCustomers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCustomers, ListCustomersVariables } from '@insightpad/dataconnect';

// The `ListCustomers` query requires an argument of type `ListCustomersVariables`:
const listCustomersVars: ListCustomersVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCustomers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCustomers(listCustomersVars);
// Variables can be defined inline as well.
const { data } = await listCustomers({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCustomers(dataConnect, listCustomersVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listCustomers(listCustomersVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListCustomers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCustomersRef, ListCustomersVariables } from '@insightpad/dataconnect';

// The `ListCustomers` query requires an argument of type `ListCustomersVariables`:
const listCustomersVars: ListCustomersVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCustomersRef()` function to get a reference to the query.
const ref = listCustomersRef(listCustomersVars);
// Variables can be defined inline as well.
const ref = listCustomersRef({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCustomersRef(dataConnect, listCustomersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ListProducts
You can execute the `ListProducts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listProducts(vars: ListProductsVariables, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, ListProductsVariables>;

interface ListProductsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
}
export const listProductsRef: ListProductsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listProducts(dc: DataConnect, vars: ListProductsVariables, options?: ExecuteQueryOptions): QueryPromise<ListProductsData, ListProductsVariables>;

interface ListProductsRef {
  ...
  (dc: DataConnect, vars: ListProductsVariables): QueryRef<ListProductsData, ListProductsVariables>;
}
export const listProductsRef: ListProductsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listProductsRef:
```typescript
const name = listProductsRef.operationName;
console.log(name);
```

### Variables
The `ListProducts` query requires an argument of type `ListProductsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListProductsVariables {
  search: string;
  sortField?: string | null;
  sortDirection?: string | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `ListProducts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListProductsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListProductsData {
  _select?: unknown[] | null;
}
```
### Using `ListProducts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listProducts, ListProductsVariables } from '@insightpad/dataconnect';

// The `ListProducts` query requires an argument of type `ListProductsVariables`:
const listProductsVars: ListProductsVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProducts(listProductsVars);
// Variables can be defined inline as well.
const { data } = await listProducts({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listProducts(dataConnect, listProductsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
listProducts(listProductsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ListProducts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listProductsRef, ListProductsVariables } from '@insightpad/dataconnect';

// The `ListProducts` query requires an argument of type `ListProductsVariables`:
const listProductsVars: ListProductsVariables = {
  search: ..., 
  sortField: ..., // optional
  sortDirection: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listProductsRef()` function to get a reference to the query.
const ref = listProductsRef(listProductsVars);
// Variables can be defined inline as well.
const ref = listProductsRef({ search: ..., sortField: ..., sortDirection: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listProductsRef(dataConnect, listProductsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## RegistrationOptions
You can execute the `RegistrationOptions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
registrationOptions(vars?: RegistrationOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, RegistrationOptionsVariables>;

interface RegistrationOptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: RegistrationOptionsVariables): QueryRef<RegistrationOptionsData, RegistrationOptionsVariables>;
}
export const registrationOptionsRef: RegistrationOptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
registrationOptions(dc: DataConnect, vars?: RegistrationOptionsVariables, options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, RegistrationOptionsVariables>;

interface RegistrationOptionsRef {
  ...
  (dc: DataConnect, vars?: RegistrationOptionsVariables): QueryRef<RegistrationOptionsData, RegistrationOptionsVariables>;
}
export const registrationOptionsRef: RegistrationOptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registrationOptionsRef:
```typescript
const name = registrationOptionsRef.operationName;
console.log(name);
```

### Variables
The `RegistrationOptions` query has an optional argument of type `RegistrationOptionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegistrationOptionsVariables {
  requestKey?: string | null;
}
```
### Return Type
Recall that executing the `RegistrationOptions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegistrationOptionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegistrationOptionsData {
  _select?: unknown[] | null;
}
```
### Using `RegistrationOptions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registrationOptions, RegistrationOptionsVariables } from '@insightpad/dataconnect';

// The `RegistrationOptions` query has an optional argument of type `RegistrationOptionsVariables`:
const registrationOptionsVars: RegistrationOptionsVariables = {
  requestKey: ..., // optional
};

// Call the `registrationOptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registrationOptions(registrationOptionsVars);
// Variables can be defined inline as well.
const { data } = await registrationOptions({ requestKey: ..., });
// Since all variables are optional for this query, you can omit the `RegistrationOptionsVariables` argument.
const { data } = await registrationOptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registrationOptions(dataConnect, registrationOptionsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
registrationOptions(registrationOptionsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `RegistrationOptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, registrationOptionsRef, RegistrationOptionsVariables } from '@insightpad/dataconnect';

// The `RegistrationOptions` query has an optional argument of type `RegistrationOptionsVariables`:
const registrationOptionsVars: RegistrationOptionsVariables = {
  requestKey: ..., // optional
};

// Call the `registrationOptionsRef()` function to get a reference to the query.
const ref = registrationOptionsRef(registrationOptionsVars);
// Variables can be defined inline as well.
const ref = registrationOptionsRef({ requestKey: ..., });
// Since all variables are optional for this query, you can omit the `RegistrationOptionsVariables` argument.
const ref = registrationOptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registrationOptionsRef(dataConnect, registrationOptionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ProductComponents
You can execute the `ProductComponents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
productComponents(vars: ProductComponentsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductComponentsData, ProductComponentsVariables>;

interface ProductComponentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductComponentsVariables): QueryRef<ProductComponentsData, ProductComponentsVariables>;
}
export const productComponentsRef: ProductComponentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
productComponents(dc: DataConnect, vars: ProductComponentsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductComponentsData, ProductComponentsVariables>;

interface ProductComponentsRef {
  ...
  (dc: DataConnect, vars: ProductComponentsVariables): QueryRef<ProductComponentsData, ProductComponentsVariables>;
}
export const productComponentsRef: ProductComponentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productComponentsRef:
```typescript
const name = productComponentsRef.operationName;
console.log(name);
```

### Variables
The `ProductComponents` query requires an argument of type `ProductComponentsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ProductComponentsVariables {
  productId: UUIDString;
}
```
### Return Type
Recall that executing the `ProductComponents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductComponentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductComponentsData {
  _select?: unknown[] | null;
}
```
### Using `ProductComponents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productComponents, ProductComponentsVariables } from '@insightpad/dataconnect';

// The `ProductComponents` query requires an argument of type `ProductComponentsVariables`:
const productComponentsVars: ProductComponentsVariables = {
  productId: ..., 
};

// Call the `productComponents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productComponents(productComponentsVars);
// Variables can be defined inline as well.
const { data } = await productComponents({ productId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productComponents(dataConnect, productComponentsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
productComponents(productComponentsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ProductComponents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, productComponentsRef, ProductComponentsVariables } from '@insightpad/dataconnect';

// The `ProductComponents` query requires an argument of type `ProductComponentsVariables`:
const productComponentsVars: ProductComponentsVariables = {
  productId: ..., 
};

// Call the `productComponentsRef()` function to get a reference to the query.
const ref = productComponentsRef(productComponentsVars);
// Variables can be defined inline as well.
const ref = productComponentsRef({ productId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productComponentsRef(dataConnect, productComponentsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## ProductPromotions
You can execute the `ProductPromotions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
productPromotions(vars: ProductPromotionsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductPromotionsData, ProductPromotionsVariables>;

interface ProductPromotionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ProductPromotionsVariables): QueryRef<ProductPromotionsData, ProductPromotionsVariables>;
}
export const productPromotionsRef: ProductPromotionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
productPromotions(dc: DataConnect, vars: ProductPromotionsVariables, options?: ExecuteQueryOptions): QueryPromise<ProductPromotionsData, ProductPromotionsVariables>;

interface ProductPromotionsRef {
  ...
  (dc: DataConnect, vars: ProductPromotionsVariables): QueryRef<ProductPromotionsData, ProductPromotionsVariables>;
}
export const productPromotionsRef: ProductPromotionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the productPromotionsRef:
```typescript
const name = productPromotionsRef.operationName;
console.log(name);
```

### Variables
The `ProductPromotions` query requires an argument of type `ProductPromotionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ProductPromotionsVariables {
  productId: UUIDString;
}
```
### Return Type
Recall that executing the `ProductPromotions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ProductPromotionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ProductPromotionsData {
  _select?: unknown[] | null;
}
```
### Using `ProductPromotions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, productPromotions, ProductPromotionsVariables } from '@insightpad/dataconnect';

// The `ProductPromotions` query requires an argument of type `ProductPromotionsVariables`:
const productPromotionsVars: ProductPromotionsVariables = {
  productId: ..., 
};

// Call the `productPromotions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await productPromotions(productPromotionsVars);
// Variables can be defined inline as well.
const { data } = await productPromotions({ productId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await productPromotions(dataConnect, productPromotionsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
productPromotions(productPromotionsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `ProductPromotions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, productPromotionsRef, ProductPromotionsVariables } from '@insightpad/dataconnect';

// The `ProductPromotions` query requires an argument of type `ProductPromotionsVariables`:
const productPromotionsVars: ProductPromotionsVariables = {
  productId: ..., 
};

// Call the `productPromotionsRef()` function to get a reference to the query.
const ref = productPromotionsRef(productPromotionsVars);
// Variables can be defined inline as well.
const ref = productPromotionsRef({ productId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = productPromotionsRef(dataConnect, productPromotionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## PlatformAdminWorkspace
You can execute the `PlatformAdminWorkspace` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
platformAdminWorkspace(vars: PlatformAdminWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;

interface PlatformAdminWorkspaceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformAdminWorkspaceVariables): QueryRef<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
}
export const platformAdminWorkspaceRef: PlatformAdminWorkspaceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformAdminWorkspace(dc: DataConnect, vars: PlatformAdminWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;

interface PlatformAdminWorkspaceRef {
  ...
  (dc: DataConnect, vars: PlatformAdminWorkspaceVariables): QueryRef<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
}
export const platformAdminWorkspaceRef: PlatformAdminWorkspaceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformAdminWorkspaceRef:
```typescript
const name = platformAdminWorkspaceRef.operationName;
console.log(name);
```

### Variables
The `PlatformAdminWorkspace` query requires an argument of type `PlatformAdminWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PlatformAdminWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that executing the `PlatformAdminWorkspace` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformAdminWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlatformAdminWorkspaceData {
  _select?: unknown[] | null;
}
```
### Using `PlatformAdminWorkspace`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformAdminWorkspace, PlatformAdminWorkspaceVariables } from '@insightpad/dataconnect';

// The `PlatformAdminWorkspace` query requires an argument of type `PlatformAdminWorkspaceVariables`:
const platformAdminWorkspaceVars: PlatformAdminWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `platformAdminWorkspace()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformAdminWorkspace(platformAdminWorkspaceVars);
// Variables can be defined inline as well.
const { data } = await platformAdminWorkspace({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformAdminWorkspace(dataConnect, platformAdminWorkspaceVars);

console.log(data._select);

// Or, you can use the `Promise` API.
platformAdminWorkspace(platformAdminWorkspaceVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `PlatformAdminWorkspace`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformAdminWorkspaceRef, PlatformAdminWorkspaceVariables } from '@insightpad/dataconnect';

// The `PlatformAdminWorkspace` query requires an argument of type `PlatformAdminWorkspaceVariables`:
const platformAdminWorkspaceVars: PlatformAdminWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `platformAdminWorkspaceRef()` function to get a reference to the query.
const ref = platformAdminWorkspaceRef(platformAdminWorkspaceVars);
// Variables can be defined inline as well.
const ref = platformAdminWorkspaceRef({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformAdminWorkspaceRef(dataConnect, platformAdminWorkspaceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## PlatformBillingWorkspace
You can execute the `PlatformBillingWorkspace` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
platformBillingWorkspace(vars: PlatformBillingWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;

interface PlatformBillingWorkspaceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PlatformBillingWorkspaceVariables): QueryRef<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;
}
export const platformBillingWorkspaceRef: PlatformBillingWorkspaceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
platformBillingWorkspace(dc: DataConnect, vars: PlatformBillingWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;

interface PlatformBillingWorkspaceRef {
  ...
  (dc: DataConnect, vars: PlatformBillingWorkspaceVariables): QueryRef<PlatformBillingWorkspaceData, PlatformBillingWorkspaceVariables>;
}
export const platformBillingWorkspaceRef: PlatformBillingWorkspaceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the platformBillingWorkspaceRef:
```typescript
const name = platformBillingWorkspaceRef.operationName;
console.log(name);
```

### Variables
The `PlatformBillingWorkspace` query requires an argument of type `PlatformBillingWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `PlatformBillingWorkspace` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PlatformBillingWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PlatformBillingWorkspaceData {
  _select?: unknown[] | null;
}
```
### Using `PlatformBillingWorkspace`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, platformBillingWorkspace, PlatformBillingWorkspaceVariables } from '@insightpad/dataconnect';

// The `PlatformBillingWorkspace` query requires an argument of type `PlatformBillingWorkspaceVariables`:
const platformBillingWorkspaceVars: PlatformBillingWorkspaceVariables = {
  term: ..., 
  status: ..., 
  tenantId: ..., // optional
  dueFrom: ..., // optional
  dueTo: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `platformBillingWorkspace()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await platformBillingWorkspace(platformBillingWorkspaceVars);
// Variables can be defined inline as well.
const { data } = await platformBillingWorkspace({ term: ..., status: ..., tenantId: ..., dueFrom: ..., dueTo: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await platformBillingWorkspace(dataConnect, platformBillingWorkspaceVars);

console.log(data._select);

// Or, you can use the `Promise` API.
platformBillingWorkspace(platformBillingWorkspaceVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `PlatformBillingWorkspace`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, platformBillingWorkspaceRef, PlatformBillingWorkspaceVariables } from '@insightpad/dataconnect';

// The `PlatformBillingWorkspace` query requires an argument of type `PlatformBillingWorkspaceVariables`:
const platformBillingWorkspaceVars: PlatformBillingWorkspaceVariables = {
  term: ..., 
  status: ..., 
  tenantId: ..., // optional
  dueFrom: ..., // optional
  dueTo: ..., // optional
  limit: ..., 
  offset: ..., 
  requestKey: ..., 
};

// Call the `platformBillingWorkspaceRef()` function to get a reference to the query.
const ref = platformBillingWorkspaceRef(platformBillingWorkspaceVars);
// Variables can be defined inline as well.
const ref = platformBillingWorkspaceRef({ term: ..., status: ..., tenantId: ..., dueFrom: ..., dueTo: ..., limit: ..., offset: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = platformBillingWorkspaceRef(dataConnect, platformBillingWorkspaceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## StockWorkspace
You can execute the `StockWorkspace` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
stockWorkspace(vars: StockWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<StockWorkspaceData, StockWorkspaceVariables>;

interface StockWorkspaceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: StockWorkspaceVariables): QueryRef<StockWorkspaceData, StockWorkspaceVariables>;
}
export const stockWorkspaceRef: StockWorkspaceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
stockWorkspace(dc: DataConnect, vars: StockWorkspaceVariables, options?: ExecuteQueryOptions): QueryPromise<StockWorkspaceData, StockWorkspaceVariables>;

interface StockWorkspaceRef {
  ...
  (dc: DataConnect, vars: StockWorkspaceVariables): QueryRef<StockWorkspaceData, StockWorkspaceVariables>;
}
export const stockWorkspaceRef: StockWorkspaceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the stockWorkspaceRef:
```typescript
const name = stockWorkspaceRef.operationName;
console.log(name);
```

### Variables
The `StockWorkspace` query requires an argument of type `StockWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface StockWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that executing the `StockWorkspace` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `StockWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface StockWorkspaceData {
  _select?: unknown[] | null;
}
```
### Using `StockWorkspace`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, stockWorkspace, StockWorkspaceVariables } from '@insightpad/dataconnect';

// The `StockWorkspace` query requires an argument of type `StockWorkspaceVariables`:
const stockWorkspaceVars: StockWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `stockWorkspace()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await stockWorkspace(stockWorkspaceVars);
// Variables can be defined inline as well.
const { data } = await stockWorkspace({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await stockWorkspace(dataConnect, stockWorkspaceVars);

console.log(data._select);

// Or, you can use the `Promise` API.
stockWorkspace(stockWorkspaceVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `StockWorkspace`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, stockWorkspaceRef, StockWorkspaceVariables } from '@insightpad/dataconnect';

// The `StockWorkspace` query requires an argument of type `StockWorkspaceVariables`:
const stockWorkspaceVars: StockWorkspaceVariables = {
  requestKey: ..., 
};

// Call the `stockWorkspaceRef()` function to get a reference to the query.
const ref = stockWorkspaceRef(stockWorkspaceVars);
// Variables can be defined inline as well.
const ref = stockWorkspaceRef({ requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = stockWorkspaceRef(dataConnect, stockWorkspaceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## DailyProfitDashboard
You can execute the `DailyProfitDashboard` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
dailyProfitDashboard(vars: DailyProfitDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<DailyProfitDashboardData, DailyProfitDashboardVariables>;

interface DailyProfitDashboardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DailyProfitDashboardVariables): QueryRef<DailyProfitDashboardData, DailyProfitDashboardVariables>;
}
export const dailyProfitDashboardRef: DailyProfitDashboardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
dailyProfitDashboard(dc: DataConnect, vars: DailyProfitDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<DailyProfitDashboardData, DailyProfitDashboardVariables>;

interface DailyProfitDashboardRef {
  ...
  (dc: DataConnect, vars: DailyProfitDashboardVariables): QueryRef<DailyProfitDashboardData, DailyProfitDashboardVariables>;
}
export const dailyProfitDashboardRef: DailyProfitDashboardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the dailyProfitDashboardRef:
```typescript
const name = dailyProfitDashboardRef.operationName;
console.log(name);
```

### Variables
The `DailyProfitDashboard` query requires an argument of type `DailyProfitDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DailyProfitDashboardVariables {
  from: DateString;
  to: DateString;
  branchId?: UUIDString | null;
  requestKey: string;
}
```
### Return Type
Recall that executing the `DailyProfitDashboard` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DailyProfitDashboardData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DailyProfitDashboardData {
  _select?: unknown[] | null;
}
```
### Using `DailyProfitDashboard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, dailyProfitDashboard, DailyProfitDashboardVariables } from '@insightpad/dataconnect';

// The `DailyProfitDashboard` query requires an argument of type `DailyProfitDashboardVariables`:
const dailyProfitDashboardVars: DailyProfitDashboardVariables = {
  from: ..., 
  to: ..., 
  branchId: ..., // optional
  requestKey: ..., 
};

// Call the `dailyProfitDashboard()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await dailyProfitDashboard(dailyProfitDashboardVars);
// Variables can be defined inline as well.
const { data } = await dailyProfitDashboard({ from: ..., to: ..., branchId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await dailyProfitDashboard(dataConnect, dailyProfitDashboardVars);

console.log(data._select);

// Or, you can use the `Promise` API.
dailyProfitDashboard(dailyProfitDashboardVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `DailyProfitDashboard`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, dailyProfitDashboardRef, DailyProfitDashboardVariables } from '@insightpad/dataconnect';

// The `DailyProfitDashboard` query requires an argument of type `DailyProfitDashboardVariables`:
const dailyProfitDashboardVars: DailyProfitDashboardVariables = {
  from: ..., 
  to: ..., 
  branchId: ..., // optional
  requestKey: ..., 
};

// Call the `dailyProfitDashboardRef()` function to get a reference to the query.
const ref = dailyProfitDashboardRef(dailyProfitDashboardVars);
// Variables can be defined inline as well.
const ref = dailyProfitDashboardRef({ from: ..., to: ..., branchId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = dailyProfitDashboardRef(dataConnect, dailyProfitDashboardVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## StockOperationDetails
You can execute the `StockOperationDetails` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
stockOperationDetails(vars: StockOperationDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<StockOperationDetailsData, StockOperationDetailsVariables>;

interface StockOperationDetailsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: StockOperationDetailsVariables): QueryRef<StockOperationDetailsData, StockOperationDetailsVariables>;
}
export const stockOperationDetailsRef: StockOperationDetailsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
stockOperationDetails(dc: DataConnect, vars: StockOperationDetailsVariables, options?: ExecuteQueryOptions): QueryPromise<StockOperationDetailsData, StockOperationDetailsVariables>;

interface StockOperationDetailsRef {
  ...
  (dc: DataConnect, vars: StockOperationDetailsVariables): QueryRef<StockOperationDetailsData, StockOperationDetailsVariables>;
}
export const stockOperationDetailsRef: StockOperationDetailsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the stockOperationDetailsRef:
```typescript
const name = stockOperationDetailsRef.operationName;
console.log(name);
```

### Variables
The `StockOperationDetails` query requires an argument of type `StockOperationDetailsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface StockOperationDetailsVariables {
  operationId: string;
  requestKey: string;
}
```
### Return Type
Recall that executing the `StockOperationDetails` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `StockOperationDetailsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface StockOperationDetailsData {
  _select?: unknown[] | null;
}
```
### Using `StockOperationDetails`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, stockOperationDetails, StockOperationDetailsVariables } from '@insightpad/dataconnect';

// The `StockOperationDetails` query requires an argument of type `StockOperationDetailsVariables`:
const stockOperationDetailsVars: StockOperationDetailsVariables = {
  operationId: ..., 
  requestKey: ..., 
};

// Call the `stockOperationDetails()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await stockOperationDetails(stockOperationDetailsVars);
// Variables can be defined inline as well.
const { data } = await stockOperationDetails({ operationId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await stockOperationDetails(dataConnect, stockOperationDetailsVars);

console.log(data._select);

// Or, you can use the `Promise` API.
stockOperationDetails(stockOperationDetailsVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `StockOperationDetails`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, stockOperationDetailsRef, StockOperationDetailsVariables } from '@insightpad/dataconnect';

// The `StockOperationDetails` query requires an argument of type `StockOperationDetailsVariables`:
const stockOperationDetailsVars: StockOperationDetailsVariables = {
  operationId: ..., 
  requestKey: ..., 
};

// Call the `stockOperationDetailsRef()` function to get a reference to the query.
const ref = stockOperationDetailsRef(stockOperationDetailsVars);
// Variables can be defined inline as well.
const ref = stockOperationDetailsRef({ operationId: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = stockOperationDetailsRef(dataConnect, stockOperationDetailsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## FinancialIndicatorsDashboard
You can execute the `FinancialIndicatorsDashboard` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
financialIndicatorsDashboard(vars: FinancialIndicatorsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;

interface FinancialIndicatorsDashboardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: FinancialIndicatorsDashboardVariables): QueryRef<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
}
export const financialIndicatorsDashboardRef: FinancialIndicatorsDashboardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
financialIndicatorsDashboard(dc: DataConnect, vars: FinancialIndicatorsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;

interface FinancialIndicatorsDashboardRef {
  ...
  (dc: DataConnect, vars: FinancialIndicatorsDashboardVariables): QueryRef<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
}
export const financialIndicatorsDashboardRef: FinancialIndicatorsDashboardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the financialIndicatorsDashboardRef:
```typescript
const name = financialIndicatorsDashboardRef.operationName;
console.log(name);
```

### Variables
The `FinancialIndicatorsDashboard` query requires an argument of type `FinancialIndicatorsDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface FinancialIndicatorsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
}
```
### Return Type
Recall that executing the `FinancialIndicatorsDashboard` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `FinancialIndicatorsDashboardData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface FinancialIndicatorsDashboardData {
  _select?: unknown[] | null;
}
```
### Using `FinancialIndicatorsDashboard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, financialIndicatorsDashboard, FinancialIndicatorsDashboardVariables } from '@insightpad/dataconnect';

// The `FinancialIndicatorsDashboard` query requires an argument of type `FinancialIndicatorsDashboardVariables`:
const financialIndicatorsDashboardVars: FinancialIndicatorsDashboardVariables = {
  from: ..., 
  to: ..., 
  filters: ..., 
  requestKey: ..., 
};

// Call the `financialIndicatorsDashboard()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await financialIndicatorsDashboard(financialIndicatorsDashboardVars);
// Variables can be defined inline as well.
const { data } = await financialIndicatorsDashboard({ from: ..., to: ..., filters: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await financialIndicatorsDashboard(dataConnect, financialIndicatorsDashboardVars);

console.log(data._select);

// Or, you can use the `Promise` API.
financialIndicatorsDashboard(financialIndicatorsDashboardVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `FinancialIndicatorsDashboard`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, financialIndicatorsDashboardRef, FinancialIndicatorsDashboardVariables } from '@insightpad/dataconnect';

// The `FinancialIndicatorsDashboard` query requires an argument of type `FinancialIndicatorsDashboardVariables`:
const financialIndicatorsDashboardVars: FinancialIndicatorsDashboardVariables = {
  from: ..., 
  to: ..., 
  filters: ..., 
  requestKey: ..., 
};

// Call the `financialIndicatorsDashboardRef()` function to get a reference to the query.
const ref = financialIndicatorsDashboardRef(financialIndicatorsDashboardVars);
// Variables can be defined inline as well.
const ref = financialIndicatorsDashboardRef({ from: ..., to: ..., filters: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = financialIndicatorsDashboardRef(dataConnect, financialIndicatorsDashboardVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

## OperationalAnalyticsDashboard
You can execute the `OperationalAnalyticsDashboard` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
operationalAnalyticsDashboard(vars: OperationalAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;

interface OperationalAnalyticsDashboardRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: OperationalAnalyticsDashboardVariables): QueryRef<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
}
export const operationalAnalyticsDashboardRef: OperationalAnalyticsDashboardRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
operationalAnalyticsDashboard(dc: DataConnect, vars: OperationalAnalyticsDashboardVariables, options?: ExecuteQueryOptions): QueryPromise<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;

interface OperationalAnalyticsDashboardRef {
  ...
  (dc: DataConnect, vars: OperationalAnalyticsDashboardVariables): QueryRef<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
}
export const operationalAnalyticsDashboardRef: OperationalAnalyticsDashboardRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the operationalAnalyticsDashboardRef:
```typescript
const name = operationalAnalyticsDashboardRef.operationName;
console.log(name);
```

### Variables
The `OperationalAnalyticsDashboard` query requires an argument of type `OperationalAnalyticsDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface OperationalAnalyticsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
}
```
### Return Type
Recall that executing the `OperationalAnalyticsDashboard` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `OperationalAnalyticsDashboardData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface OperationalAnalyticsDashboardData {
  _select?: unknown[] | null;
}
```
### Using `OperationalAnalyticsDashboard`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, operationalAnalyticsDashboard, OperationalAnalyticsDashboardVariables } from '@insightpad/dataconnect';

// The `OperationalAnalyticsDashboard` query requires an argument of type `OperationalAnalyticsDashboardVariables`:
const operationalAnalyticsDashboardVars: OperationalAnalyticsDashboardVariables = {
  from: ..., 
  to: ..., 
  filters: ..., 
  requestKey: ..., 
};

// Call the `operationalAnalyticsDashboard()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await operationalAnalyticsDashboard(operationalAnalyticsDashboardVars);
// Variables can be defined inline as well.
const { data } = await operationalAnalyticsDashboard({ from: ..., to: ..., filters: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await operationalAnalyticsDashboard(dataConnect, operationalAnalyticsDashboardVars);

console.log(data._select);

// Or, you can use the `Promise` API.
operationalAnalyticsDashboard(operationalAnalyticsDashboardVars).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `OperationalAnalyticsDashboard`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, operationalAnalyticsDashboardRef, OperationalAnalyticsDashboardVariables } from '@insightpad/dataconnect';

// The `OperationalAnalyticsDashboard` query requires an argument of type `OperationalAnalyticsDashboardVariables`:
const operationalAnalyticsDashboardVars: OperationalAnalyticsDashboardVariables = {
  from: ..., 
  to: ..., 
  filters: ..., 
  requestKey: ..., 
};

// Call the `operationalAnalyticsDashboardRef()` function to get a reference to the query.
const ref = operationalAnalyticsDashboardRef(operationalAnalyticsDashboardVars);
// Variables can be defined inline as well.
const ref = operationalAnalyticsDashboardRef({ from: ..., to: ..., filters: ..., requestKey: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = operationalAnalyticsDashboardRef(dataConnect, operationalAnalyticsDashboardVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data._select);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `app` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## BootstrapSalesChannelsNavigation
You can execute the `BootstrapSalesChannelsNavigation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
bootstrapSalesChannelsNavigation(vars: BootstrapSalesChannelsNavigationVariables): MutationPromise<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;

interface BootstrapSalesChannelsNavigationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapSalesChannelsNavigationVariables): MutationRef<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
}
export const bootstrapSalesChannelsNavigationRef: BootstrapSalesChannelsNavigationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bootstrapSalesChannelsNavigation(dc: DataConnect, vars: BootstrapSalesChannelsNavigationVariables): MutationPromise<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;

interface BootstrapSalesChannelsNavigationRef {
  ...
  (dc: DataConnect, vars: BootstrapSalesChannelsNavigationVariables): MutationRef<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
}
export const bootstrapSalesChannelsNavigationRef: BootstrapSalesChannelsNavigationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bootstrapSalesChannelsNavigationRef:
```typescript
const name = bootstrapSalesChannelsNavigationRef.operationName;
console.log(name);
```

### Variables
The `BootstrapSalesChannelsNavigation` mutation requires an argument of type `BootstrapSalesChannelsNavigationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BootstrapSalesChannelsNavigationVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}
```
### Return Type
Recall that executing the `BootstrapSalesChannelsNavigation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BootstrapSalesChannelsNavigationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BootstrapSalesChannelsNavigationData {
  page: AppPage_Key;
  permission: RolePagePermission_Key;
}
```
### Using `BootstrapSalesChannelsNavigation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bootstrapSalesChannelsNavigation, BootstrapSalesChannelsNavigationVariables } from '@insightpad/dataconnect';

// The `BootstrapSalesChannelsNavigation` mutation requires an argument of type `BootstrapSalesChannelsNavigationVariables`:
const bootstrapSalesChannelsNavigationVars: BootstrapSalesChannelsNavigationVariables = {
  tenantId: ..., 
  platformAdminRoleId: ..., 
};

// Call the `bootstrapSalesChannelsNavigation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bootstrapSalesChannelsNavigation(bootstrapSalesChannelsNavigationVars);
// Variables can be defined inline as well.
const { data } = await bootstrapSalesChannelsNavigation({ tenantId: ..., platformAdminRoleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bootstrapSalesChannelsNavigation(dataConnect, bootstrapSalesChannelsNavigationVars);

console.log(data.page);
console.log(data.permission);

// Or, you can use the `Promise` API.
bootstrapSalesChannelsNavigation(bootstrapSalesChannelsNavigationVars).then((response) => {
  const data = response.data;
  console.log(data.page);
  console.log(data.permission);
});
```

### Using `BootstrapSalesChannelsNavigation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bootstrapSalesChannelsNavigationRef, BootstrapSalesChannelsNavigationVariables } from '@insightpad/dataconnect';

// The `BootstrapSalesChannelsNavigation` mutation requires an argument of type `BootstrapSalesChannelsNavigationVariables`:
const bootstrapSalesChannelsNavigationVars: BootstrapSalesChannelsNavigationVariables = {
  tenantId: ..., 
  platformAdminRoleId: ..., 
};

// Call the `bootstrapSalesChannelsNavigationRef()` function to get a reference to the mutation.
const ref = bootstrapSalesChannelsNavigationRef(bootstrapSalesChannelsNavigationVars);
// Variables can be defined inline as well.
const ref = bootstrapSalesChannelsNavigationRef({ tenantId: ..., platformAdminRoleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bootstrapSalesChannelsNavigationRef(dataConnect, bootstrapSalesChannelsNavigationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.page);
console.log(data.permission);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.page);
  console.log(data.permission);
});
```

## BootstrapSalesChannelsNavigationV2
You can execute the `BootstrapSalesChannelsNavigationV2` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
bootstrapSalesChannelsNavigationV2(): MutationPromise<BootstrapSalesChannelsNavigationV2Data, undefined>;

interface BootstrapSalesChannelsNavigationV2Ref {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<BootstrapSalesChannelsNavigationV2Data, undefined>;
}
export const bootstrapSalesChannelsNavigationV2Ref: BootstrapSalesChannelsNavigationV2Ref;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bootstrapSalesChannelsNavigationV2(dc: DataConnect): MutationPromise<BootstrapSalesChannelsNavigationV2Data, undefined>;

interface BootstrapSalesChannelsNavigationV2Ref {
  ...
  (dc: DataConnect): MutationRef<BootstrapSalesChannelsNavigationV2Data, undefined>;
}
export const bootstrapSalesChannelsNavigationV2Ref: BootstrapSalesChannelsNavigationV2Ref;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bootstrapSalesChannelsNavigationV2Ref:
```typescript
const name = bootstrapSalesChannelsNavigationV2Ref.operationName;
console.log(name);
```

### Variables
The `BootstrapSalesChannelsNavigationV2` mutation has no variables.
### Return Type
Recall that executing the `BootstrapSalesChannelsNavigationV2` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BootstrapSalesChannelsNavigationV2Data`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface BootstrapSalesChannelsNavigationV2Data {
  _execute?: number | null;
}
```
### Using `BootstrapSalesChannelsNavigationV2`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bootstrapSalesChannelsNavigationV2 } from '@insightpad/dataconnect';


// Call the `bootstrapSalesChannelsNavigationV2()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bootstrapSalesChannelsNavigationV2();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bootstrapSalesChannelsNavigationV2(dataConnect);

console.log(data._execute);

// Or, you can use the `Promise` API.
bootstrapSalesChannelsNavigationV2().then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `BootstrapSalesChannelsNavigationV2`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bootstrapSalesChannelsNavigationV2Ref } from '@insightpad/dataconnect';


// Call the `bootstrapSalesChannelsNavigationV2Ref()` function to get a reference to the mutation.
const ref = bootstrapSalesChannelsNavigationV2Ref();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bootstrapSalesChannelsNavigationV2Ref(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## BootstrapNavigationCatalog
You can execute the `BootstrapNavigationCatalog` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
bootstrapNavigationCatalog(vars: BootstrapNavigationCatalogVariables): MutationPromise<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;

interface BootstrapNavigationCatalogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BootstrapNavigationCatalogVariables): MutationRef<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
}
export const bootstrapNavigationCatalogRef: BootstrapNavigationCatalogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
bootstrapNavigationCatalog(dc: DataConnect, vars: BootstrapNavigationCatalogVariables): MutationPromise<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;

interface BootstrapNavigationCatalogRef {
  ...
  (dc: DataConnect, vars: BootstrapNavigationCatalogVariables): MutationRef<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
}
export const bootstrapNavigationCatalogRef: BootstrapNavigationCatalogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bootstrapNavigationCatalogRef:
```typescript
const name = bootstrapNavigationCatalogRef.operationName;
console.log(name);
```

### Variables
The `BootstrapNavigationCatalog` mutation requires an argument of type `BootstrapNavigationCatalogVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BootstrapNavigationCatalogVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}
```
### Return Type
Recall that executing the `BootstrapNavigationCatalog` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BootstrapNavigationCatalogData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `BootstrapNavigationCatalog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bootstrapNavigationCatalog, BootstrapNavigationCatalogVariables } from '@insightpad/dataconnect';

// The `BootstrapNavigationCatalog` mutation requires an argument of type `BootstrapNavigationCatalogVariables`:
const bootstrapNavigationCatalogVars: BootstrapNavigationCatalogVariables = {
  tenantId: ..., 
  platformAdminRoleId: ..., 
};

// Call the `bootstrapNavigationCatalog()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bootstrapNavigationCatalog(bootstrapNavigationCatalogVars);
// Variables can be defined inline as well.
const { data } = await bootstrapNavigationCatalog({ tenantId: ..., platformAdminRoleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bootstrapNavigationCatalog(dataConnect, bootstrapNavigationCatalogVars);

console.log(data.pageCaixa);
console.log(data.pageGestaoVendas);
console.log(data.pageEstoque);
console.log(data.pageContasPagar);
console.log(data.pageContasReceber);
console.log(data.pageCategoria);
console.log(data.pageSubcategoria);
console.log(data.pageProduto);
console.log(data.pageCliente);
console.log(data.pageFornecedor);
console.log(data.pageFilial);
console.log(data.pageRelatorios);
console.log(data.pageGestaoAcessos);
console.log(data.pageCanaisVenda);
console.log(data.permissionCaixa);
console.log(data.permissionGestaoVendas);
console.log(data.permissionEstoque);
console.log(data.permissionContasPagar);
console.log(data.permissionContasReceber);
console.log(data.permissionCategoria);
console.log(data.permissionSubcategoria);
console.log(data.permissionProduto);
console.log(data.permissionCliente);
console.log(data.permissionFornecedor);
console.log(data.permissionFilial);
console.log(data.permissionRelatorios);
console.log(data.permissionGestaoAcessos);
console.log(data.permissionCanaisVenda);

// Or, you can use the `Promise` API.
bootstrapNavigationCatalog(bootstrapNavigationCatalogVars).then((response) => {
  const data = response.data;
  console.log(data.pageCaixa);
  console.log(data.pageGestaoVendas);
  console.log(data.pageEstoque);
  console.log(data.pageContasPagar);
  console.log(data.pageContasReceber);
  console.log(data.pageCategoria);
  console.log(data.pageSubcategoria);
  console.log(data.pageProduto);
  console.log(data.pageCliente);
  console.log(data.pageFornecedor);
  console.log(data.pageFilial);
  console.log(data.pageRelatorios);
  console.log(data.pageGestaoAcessos);
  console.log(data.pageCanaisVenda);
  console.log(data.permissionCaixa);
  console.log(data.permissionGestaoVendas);
  console.log(data.permissionEstoque);
  console.log(data.permissionContasPagar);
  console.log(data.permissionContasReceber);
  console.log(data.permissionCategoria);
  console.log(data.permissionSubcategoria);
  console.log(data.permissionProduto);
  console.log(data.permissionCliente);
  console.log(data.permissionFornecedor);
  console.log(data.permissionFilial);
  console.log(data.permissionRelatorios);
  console.log(data.permissionGestaoAcessos);
  console.log(data.permissionCanaisVenda);
});
```

### Using `BootstrapNavigationCatalog`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, bootstrapNavigationCatalogRef, BootstrapNavigationCatalogVariables } from '@insightpad/dataconnect';

// The `BootstrapNavigationCatalog` mutation requires an argument of type `BootstrapNavigationCatalogVariables`:
const bootstrapNavigationCatalogVars: BootstrapNavigationCatalogVariables = {
  tenantId: ..., 
  platformAdminRoleId: ..., 
};

// Call the `bootstrapNavigationCatalogRef()` function to get a reference to the mutation.
const ref = bootstrapNavigationCatalogRef(bootstrapNavigationCatalogVars);
// Variables can be defined inline as well.
const ref = bootstrapNavigationCatalogRef({ tenantId: ..., platformAdminRoleId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bootstrapNavigationCatalogRef(dataConnect, bootstrapNavigationCatalogVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.pageCaixa);
console.log(data.pageGestaoVendas);
console.log(data.pageEstoque);
console.log(data.pageContasPagar);
console.log(data.pageContasReceber);
console.log(data.pageCategoria);
console.log(data.pageSubcategoria);
console.log(data.pageProduto);
console.log(data.pageCliente);
console.log(data.pageFornecedor);
console.log(data.pageFilial);
console.log(data.pageRelatorios);
console.log(data.pageGestaoAcessos);
console.log(data.pageCanaisVenda);
console.log(data.permissionCaixa);
console.log(data.permissionGestaoVendas);
console.log(data.permissionEstoque);
console.log(data.permissionContasPagar);
console.log(data.permissionContasReceber);
console.log(data.permissionCategoria);
console.log(data.permissionSubcategoria);
console.log(data.permissionProduto);
console.log(data.permissionCliente);
console.log(data.permissionFornecedor);
console.log(data.permissionFilial);
console.log(data.permissionRelatorios);
console.log(data.permissionGestaoAcessos);
console.log(data.permissionCanaisVenda);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.pageCaixa);
  console.log(data.pageGestaoVendas);
  console.log(data.pageEstoque);
  console.log(data.pageContasPagar);
  console.log(data.pageContasReceber);
  console.log(data.pageCategoria);
  console.log(data.pageSubcategoria);
  console.log(data.pageProduto);
  console.log(data.pageCliente);
  console.log(data.pageFornecedor);
  console.log(data.pageFilial);
  console.log(data.pageRelatorios);
  console.log(data.pageGestaoAcessos);
  console.log(data.pageCanaisVenda);
  console.log(data.permissionCaixa);
  console.log(data.permissionGestaoVendas);
  console.log(data.permissionEstoque);
  console.log(data.permissionContasPagar);
  console.log(data.permissionContasReceber);
  console.log(data.permissionCategoria);
  console.log(data.permissionSubcategoria);
  console.log(data.permissionProduto);
  console.log(data.permissionCliente);
  console.log(data.permissionFornecedor);
  console.log(data.permissionFilial);
  console.log(data.permissionRelatorios);
  console.log(data.permissionGestaoAcessos);
  console.log(data.permissionCanaisVenda);
});
```

## CreateCategory
You can execute the `CreateCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCategory(vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCategory(dc: DataConnect, vars: CreateCategoryVariables): MutationPromise<CreateCategoryData, CreateCategoryVariables>;

interface CreateCategoryRef {
  ...
  (dc: DataConnect, vars: CreateCategoryVariables): MutationRef<CreateCategoryData, CreateCategoryVariables>;
}
export const createCategoryRef: CreateCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCategoryRef:
```typescript
const name = createCategoryRef.operationName;
console.log(name);
```

### Variables
The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCategoryVariables {
  name: string;
}
```
### Return Type
Recall that executing the `CreateCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCategoryData {
  _execute?: number | null;
}
```
### Using `CreateCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCategory, CreateCategoryVariables } from '@insightpad/dataconnect';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  name: ..., 
};

// Call the `createCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCategory(createCategoryVars);
// Variables can be defined inline as well.
const { data } = await createCategory({ name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCategory(dataConnect, createCategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createCategory(createCategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCategoryRef, CreateCategoryVariables } from '@insightpad/dataconnect';

// The `CreateCategory` mutation requires an argument of type `CreateCategoryVariables`:
const createCategoryVars: CreateCategoryVariables = {
  name: ..., 
};

// Call the `createCategoryRef()` function to get a reference to the mutation.
const ref = createCategoryRef(createCategoryVars);
// Variables can be defined inline as well.
const ref = createCategoryRef({ name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCategoryRef(dataConnect, createCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdateCategory
You can execute the `UpdateCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCategory(vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface UpdateCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
}
export const updateCategoryRef: UpdateCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCategory(dc: DataConnect, vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface UpdateCategoryRef {
  ...
  (dc: DataConnect, vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
}
export const updateCategoryRef: UpdateCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCategoryRef:
```typescript
const name = updateCategoryRef.operationName;
console.log(name);
```

### Variables
The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCategoryVariables {
  id: UUIDString;
  name: string;
}
```
### Return Type
Recall that executing the `UpdateCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCategoryData {
  _execute?: number | null;
}
```
### Using `UpdateCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCategory, UpdateCategoryVariables } from '@insightpad/dataconnect';

// The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`:
const updateCategoryVars: UpdateCategoryVariables = {
  id: ..., 
  name: ..., 
};

// Call the `updateCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCategory(updateCategoryVars);
// Variables can be defined inline as well.
const { data } = await updateCategory({ id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCategory(dataConnect, updateCategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updateCategory(updateCategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdateCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCategoryRef, UpdateCategoryVariables } from '@insightpad/dataconnect';

// The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`:
const updateCategoryVars: UpdateCategoryVariables = {
  id: ..., 
  name: ..., 
};

// Call the `updateCategoryRef()` function to get a reference to the mutation.
const ref = updateCategoryRef(updateCategoryVars);
// Variables can be defined inline as well.
const ref = updateCategoryRef({ id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCategoryRef(dataConnect, updateCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ArchiveCategory
You can execute the `ArchiveCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
archiveCategory(vars: ArchiveCategoryVariables): MutationPromise<ArchiveCategoryData, ArchiveCategoryVariables>;

interface ArchiveCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveCategoryVariables): MutationRef<ArchiveCategoryData, ArchiveCategoryVariables>;
}
export const archiveCategoryRef: ArchiveCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
archiveCategory(dc: DataConnect, vars: ArchiveCategoryVariables): MutationPromise<ArchiveCategoryData, ArchiveCategoryVariables>;

interface ArchiveCategoryRef {
  ...
  (dc: DataConnect, vars: ArchiveCategoryVariables): MutationRef<ArchiveCategoryData, ArchiveCategoryVariables>;
}
export const archiveCategoryRef: ArchiveCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the archiveCategoryRef:
```typescript
const name = archiveCategoryRef.operationName;
console.log(name);
```

### Variables
The `ArchiveCategory` mutation requires an argument of type `ArchiveCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ArchiveCategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `ArchiveCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ArchiveCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ArchiveCategoryData {
  _execute?: number | null;
}
```
### Using `ArchiveCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, archiveCategory, ArchiveCategoryVariables } from '@insightpad/dataconnect';

// The `ArchiveCategory` mutation requires an argument of type `ArchiveCategoryVariables`:
const archiveCategoryVars: ArchiveCategoryVariables = {
  id: ..., 
};

// Call the `archiveCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await archiveCategory(archiveCategoryVars);
// Variables can be defined inline as well.
const { data } = await archiveCategory({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await archiveCategory(dataConnect, archiveCategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
archiveCategory(archiveCategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ArchiveCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, archiveCategoryRef, ArchiveCategoryVariables } from '@insightpad/dataconnect';

// The `ArchiveCategory` mutation requires an argument of type `ArchiveCategoryVariables`:
const archiveCategoryVars: ArchiveCategoryVariables = {
  id: ..., 
};

// Call the `archiveCategoryRef()` function to get a reference to the mutation.
const ref = archiveCategoryRef(archiveCategoryVars);
// Variables can be defined inline as well.
const ref = archiveCategoryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = archiveCategoryRef(dataConnect, archiveCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreateSubcategory
You can execute the `CreateSubcategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSubcategory(vars: CreateSubcategoryVariables): MutationPromise<CreateSubcategoryData, CreateSubcategoryVariables>;

interface CreateSubcategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubcategoryVariables): MutationRef<CreateSubcategoryData, CreateSubcategoryVariables>;
}
export const createSubcategoryRef: CreateSubcategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSubcategory(dc: DataConnect, vars: CreateSubcategoryVariables): MutationPromise<CreateSubcategoryData, CreateSubcategoryVariables>;

interface CreateSubcategoryRef {
  ...
  (dc: DataConnect, vars: CreateSubcategoryVariables): MutationRef<CreateSubcategoryData, CreateSubcategoryVariables>;
}
export const createSubcategoryRef: CreateSubcategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSubcategoryRef:
```typescript
const name = createSubcategoryRef.operationName;
console.log(name);
```

### Variables
The `CreateSubcategory` mutation requires an argument of type `CreateSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSubcategoryVariables {
  categoryId: UUIDString;
  name: string;
}
```
### Return Type
Recall that executing the `CreateSubcategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSubcategoryData {
  _execute?: number | null;
}
```
### Using `CreateSubcategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSubcategory, CreateSubcategoryVariables } from '@insightpad/dataconnect';

// The `CreateSubcategory` mutation requires an argument of type `CreateSubcategoryVariables`:
const createSubcategoryVars: CreateSubcategoryVariables = {
  categoryId: ..., 
  name: ..., 
};

// Call the `createSubcategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSubcategory(createSubcategoryVars);
// Variables can be defined inline as well.
const { data } = await createSubcategory({ categoryId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSubcategory(dataConnect, createSubcategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createSubcategory(createSubcategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateSubcategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSubcategoryRef, CreateSubcategoryVariables } from '@insightpad/dataconnect';

// The `CreateSubcategory` mutation requires an argument of type `CreateSubcategoryVariables`:
const createSubcategoryVars: CreateSubcategoryVariables = {
  categoryId: ..., 
  name: ..., 
};

// Call the `createSubcategoryRef()` function to get a reference to the mutation.
const ref = createSubcategoryRef(createSubcategoryVars);
// Variables can be defined inline as well.
const ref = createSubcategoryRef({ categoryId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSubcategoryRef(dataConnect, createSubcategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdateSubcategory
You can execute the `UpdateSubcategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSubcategory(vars: UpdateSubcategoryVariables): MutationPromise<UpdateSubcategoryData, UpdateSubcategoryVariables>;

interface UpdateSubcategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubcategoryVariables): MutationRef<UpdateSubcategoryData, UpdateSubcategoryVariables>;
}
export const updateSubcategoryRef: UpdateSubcategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSubcategory(dc: DataConnect, vars: UpdateSubcategoryVariables): MutationPromise<UpdateSubcategoryData, UpdateSubcategoryVariables>;

interface UpdateSubcategoryRef {
  ...
  (dc: DataConnect, vars: UpdateSubcategoryVariables): MutationRef<UpdateSubcategoryData, UpdateSubcategoryVariables>;
}
export const updateSubcategoryRef: UpdateSubcategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSubcategoryRef:
```typescript
const name = updateSubcategoryRef.operationName;
console.log(name);
```

### Variables
The `UpdateSubcategory` mutation requires an argument of type `UpdateSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSubcategoryVariables {
  id: UUIDString;
  categoryId: UUIDString;
  name: string;
}
```
### Return Type
Recall that executing the `UpdateSubcategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSubcategoryData {
  _execute?: number | null;
}
```
### Using `UpdateSubcategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSubcategory, UpdateSubcategoryVariables } from '@insightpad/dataconnect';

// The `UpdateSubcategory` mutation requires an argument of type `UpdateSubcategoryVariables`:
const updateSubcategoryVars: UpdateSubcategoryVariables = {
  id: ..., 
  categoryId: ..., 
  name: ..., 
};

// Call the `updateSubcategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSubcategory(updateSubcategoryVars);
// Variables can be defined inline as well.
const { data } = await updateSubcategory({ id: ..., categoryId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSubcategory(dataConnect, updateSubcategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updateSubcategory(updateSubcategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdateSubcategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSubcategoryRef, UpdateSubcategoryVariables } from '@insightpad/dataconnect';

// The `UpdateSubcategory` mutation requires an argument of type `UpdateSubcategoryVariables`:
const updateSubcategoryVars: UpdateSubcategoryVariables = {
  id: ..., 
  categoryId: ..., 
  name: ..., 
};

// Call the `updateSubcategoryRef()` function to get a reference to the mutation.
const ref = updateSubcategoryRef(updateSubcategoryVars);
// Variables can be defined inline as well.
const ref = updateSubcategoryRef({ id: ..., categoryId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSubcategoryRef(dataConnect, updateSubcategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ArchiveSubcategory
You can execute the `ArchiveSubcategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
archiveSubcategory(vars: ArchiveSubcategoryVariables): MutationPromise<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;

interface ArchiveSubcategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSubcategoryVariables): MutationRef<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
}
export const archiveSubcategoryRef: ArchiveSubcategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
archiveSubcategory(dc: DataConnect, vars: ArchiveSubcategoryVariables): MutationPromise<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;

interface ArchiveSubcategoryRef {
  ...
  (dc: DataConnect, vars: ArchiveSubcategoryVariables): MutationRef<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
}
export const archiveSubcategoryRef: ArchiveSubcategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the archiveSubcategoryRef:
```typescript
const name = archiveSubcategoryRef.operationName;
console.log(name);
```

### Variables
The `ArchiveSubcategory` mutation requires an argument of type `ArchiveSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ArchiveSubcategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `ArchiveSubcategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ArchiveSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ArchiveSubcategoryData {
  _execute?: number | null;
}
```
### Using `ArchiveSubcategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, archiveSubcategory, ArchiveSubcategoryVariables } from '@insightpad/dataconnect';

// The `ArchiveSubcategory` mutation requires an argument of type `ArchiveSubcategoryVariables`:
const archiveSubcategoryVars: ArchiveSubcategoryVariables = {
  id: ..., 
};

// Call the `archiveSubcategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await archiveSubcategory(archiveSubcategoryVars);
// Variables can be defined inline as well.
const { data } = await archiveSubcategory({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await archiveSubcategory(dataConnect, archiveSubcategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
archiveSubcategory(archiveSubcategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ArchiveSubcategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, archiveSubcategoryRef, ArchiveSubcategoryVariables } from '@insightpad/dataconnect';

// The `ArchiveSubcategory` mutation requires an argument of type `ArchiveSubcategoryVariables`:
const archiveSubcategoryVars: ArchiveSubcategoryVariables = {
  id: ..., 
};

// Call the `archiveSubcategoryRef()` function to get a reference to the mutation.
const ref = archiveSubcategoryRef(archiveSubcategoryVars);
// Variables can be defined inline as well.
const ref = archiveSubcategoryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = archiveSubcategoryRef(dataConnect, archiveSubcategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## RestoreCategory
You can execute the `RestoreCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
restoreCategory(vars: RestoreCategoryVariables): MutationPromise<RestoreCategoryData, RestoreCategoryVariables>;

interface RestoreCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreCategoryVariables): MutationRef<RestoreCategoryData, RestoreCategoryVariables>;
}
export const restoreCategoryRef: RestoreCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
restoreCategory(dc: DataConnect, vars: RestoreCategoryVariables): MutationPromise<RestoreCategoryData, RestoreCategoryVariables>;

interface RestoreCategoryRef {
  ...
  (dc: DataConnect, vars: RestoreCategoryVariables): MutationRef<RestoreCategoryData, RestoreCategoryVariables>;
}
export const restoreCategoryRef: RestoreCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the restoreCategoryRef:
```typescript
const name = restoreCategoryRef.operationName;
console.log(name);
```

### Variables
The `RestoreCategory` mutation requires an argument of type `RestoreCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RestoreCategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `RestoreCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RestoreCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RestoreCategoryData {
  _execute?: number | null;
}
```
### Using `RestoreCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, restoreCategory, RestoreCategoryVariables } from '@insightpad/dataconnect';

// The `RestoreCategory` mutation requires an argument of type `RestoreCategoryVariables`:
const restoreCategoryVars: RestoreCategoryVariables = {
  id: ..., 
};

// Call the `restoreCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await restoreCategory(restoreCategoryVars);
// Variables can be defined inline as well.
const { data } = await restoreCategory({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await restoreCategory(dataConnect, restoreCategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
restoreCategory(restoreCategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `RestoreCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, restoreCategoryRef, RestoreCategoryVariables } from '@insightpad/dataconnect';

// The `RestoreCategory` mutation requires an argument of type `RestoreCategoryVariables`:
const restoreCategoryVars: RestoreCategoryVariables = {
  id: ..., 
};

// Call the `restoreCategoryRef()` function to get a reference to the mutation.
const ref = restoreCategoryRef(restoreCategoryVars);
// Variables can be defined inline as well.
const ref = restoreCategoryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = restoreCategoryRef(dataConnect, restoreCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## RestoreSubcategory
You can execute the `RestoreSubcategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
restoreSubcategory(vars: RestoreSubcategoryVariables): MutationPromise<RestoreSubcategoryData, RestoreSubcategoryVariables>;

interface RestoreSubcategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RestoreSubcategoryVariables): MutationRef<RestoreSubcategoryData, RestoreSubcategoryVariables>;
}
export const restoreSubcategoryRef: RestoreSubcategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
restoreSubcategory(dc: DataConnect, vars: RestoreSubcategoryVariables): MutationPromise<RestoreSubcategoryData, RestoreSubcategoryVariables>;

interface RestoreSubcategoryRef {
  ...
  (dc: DataConnect, vars: RestoreSubcategoryVariables): MutationRef<RestoreSubcategoryData, RestoreSubcategoryVariables>;
}
export const restoreSubcategoryRef: RestoreSubcategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the restoreSubcategoryRef:
```typescript
const name = restoreSubcategoryRef.operationName;
console.log(name);
```

### Variables
The `RestoreSubcategory` mutation requires an argument of type `RestoreSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RestoreSubcategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `RestoreSubcategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RestoreSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RestoreSubcategoryData {
  _execute?: number | null;
}
```
### Using `RestoreSubcategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, restoreSubcategory, RestoreSubcategoryVariables } from '@insightpad/dataconnect';

// The `RestoreSubcategory` mutation requires an argument of type `RestoreSubcategoryVariables`:
const restoreSubcategoryVars: RestoreSubcategoryVariables = {
  id: ..., 
};

// Call the `restoreSubcategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await restoreSubcategory(restoreSubcategoryVars);
// Variables can be defined inline as well.
const { data } = await restoreSubcategory({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await restoreSubcategory(dataConnect, restoreSubcategoryVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
restoreSubcategory(restoreSubcategoryVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `RestoreSubcategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, restoreSubcategoryRef, RestoreSubcategoryVariables } from '@insightpad/dataconnect';

// The `RestoreSubcategory` mutation requires an argument of type `RestoreSubcategoryVariables`:
const restoreSubcategoryVars: RestoreSubcategoryVariables = {
  id: ..., 
};

// Call the `restoreSubcategoryRef()` function to get a reference to the mutation.
const ref = restoreSubcategoryRef(restoreSubcategoryVars);
// Variables can be defined inline as well.
const ref = restoreSubcategoryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = restoreSubcategoryRef(dataConnect, restoreSubcategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreateCategoriesBatch
You can execute the `CreateCategoriesBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createCategoriesBatch(vars: CreateCategoriesBatchVariables): MutationPromise<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;

interface CreateCategoriesBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCategoriesBatchVariables): MutationRef<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
}
export const createCategoriesBatchRef: CreateCategoriesBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createCategoriesBatch(dc: DataConnect, vars: CreateCategoriesBatchVariables): MutationPromise<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;

interface CreateCategoriesBatchRef {
  ...
  (dc: DataConnect, vars: CreateCategoriesBatchVariables): MutationRef<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
}
export const createCategoriesBatchRef: CreateCategoriesBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createCategoriesBatchRef:
```typescript
const name = createCategoriesBatchRef.operationName;
console.log(name);
```

### Variables
The `CreateCategoriesBatch` mutation requires an argument of type `CreateCategoriesBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateCategoriesBatchVariables {
  names: unknown;
}
```
### Return Type
Recall that executing the `CreateCategoriesBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateCategoriesBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateCategoriesBatchData {
  _execute?: number | null;
}
```
### Using `CreateCategoriesBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createCategoriesBatch, CreateCategoriesBatchVariables } from '@insightpad/dataconnect';

// The `CreateCategoriesBatch` mutation requires an argument of type `CreateCategoriesBatchVariables`:
const createCategoriesBatchVars: CreateCategoriesBatchVariables = {
  names: ..., 
};

// Call the `createCategoriesBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createCategoriesBatch(createCategoriesBatchVars);
// Variables can be defined inline as well.
const { data } = await createCategoriesBatch({ names: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createCategoriesBatch(dataConnect, createCategoriesBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createCategoriesBatch(createCategoriesBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateCategoriesBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createCategoriesBatchRef, CreateCategoriesBatchVariables } from '@insightpad/dataconnect';

// The `CreateCategoriesBatch` mutation requires an argument of type `CreateCategoriesBatchVariables`:
const createCategoriesBatchVars: CreateCategoriesBatchVariables = {
  names: ..., 
};

// Call the `createCategoriesBatchRef()` function to get a reference to the mutation.
const ref = createCategoriesBatchRef(createCategoriesBatchVars);
// Variables can be defined inline as well.
const ref = createCategoriesBatchRef({ names: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createCategoriesBatchRef(dataConnect, createCategoriesBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreateSubcategoriesBatch
You can execute the `CreateSubcategoriesBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSubcategoriesBatch(vars: CreateSubcategoriesBatchVariables): MutationPromise<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;

interface CreateSubcategoriesBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubcategoriesBatchVariables): MutationRef<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
}
export const createSubcategoriesBatchRef: CreateSubcategoriesBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSubcategoriesBatch(dc: DataConnect, vars: CreateSubcategoriesBatchVariables): MutationPromise<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;

interface CreateSubcategoriesBatchRef {
  ...
  (dc: DataConnect, vars: CreateSubcategoriesBatchVariables): MutationRef<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
}
export const createSubcategoriesBatchRef: CreateSubcategoriesBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSubcategoriesBatchRef:
```typescript
const name = createSubcategoriesBatchRef.operationName;
console.log(name);
```

### Variables
The `CreateSubcategoriesBatch` mutation requires an argument of type `CreateSubcategoriesBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSubcategoriesBatchVariables {
  items: unknown;
}
```
### Return Type
Recall that executing the `CreateSubcategoriesBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSubcategoriesBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSubcategoriesBatchData {
  _execute?: number | null;
}
```
### Using `CreateSubcategoriesBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSubcategoriesBatch, CreateSubcategoriesBatchVariables } from '@insightpad/dataconnect';

// The `CreateSubcategoriesBatch` mutation requires an argument of type `CreateSubcategoriesBatchVariables`:
const createSubcategoriesBatchVars: CreateSubcategoriesBatchVariables = {
  items: ..., 
};

// Call the `createSubcategoriesBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSubcategoriesBatch(createSubcategoriesBatchVars);
// Variables can be defined inline as well.
const { data } = await createSubcategoriesBatch({ items: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSubcategoriesBatch(dataConnect, createSubcategoriesBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createSubcategoriesBatch(createSubcategoriesBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateSubcategoriesBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSubcategoriesBatchRef, CreateSubcategoriesBatchVariables } from '@insightpad/dataconnect';

// The `CreateSubcategoriesBatch` mutation requires an argument of type `CreateSubcategoriesBatchVariables`:
const createSubcategoriesBatchVars: CreateSubcategoriesBatchVariables = {
  items: ..., 
};

// Call the `createSubcategoriesBatchRef()` function to get a reference to the mutation.
const ref = createSubcategoriesBatchRef(createSubcategoriesBatchVars);
// Variables can be defined inline as well.
const ref = createSubcategoriesBatchRef({ items: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSubcategoriesBatchRef(dataConnect, createSubcategoriesBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveBranch
You can execute the `SaveBranch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveBranch(vars: SaveBranchVariables): MutationPromise<SaveBranchData, SaveBranchVariables>;

interface SaveBranchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveBranchVariables): MutationRef<SaveBranchData, SaveBranchVariables>;
}
export const saveBranchRef: SaveBranchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveBranch(dc: DataConnect, vars: SaveBranchVariables): MutationPromise<SaveBranchData, SaveBranchVariables>;

interface SaveBranchRef {
  ...
  (dc: DataConnect, vars: SaveBranchVariables): MutationRef<SaveBranchData, SaveBranchVariables>;
}
export const saveBranchRef: SaveBranchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveBranchRef:
```typescript
const name = saveBranchRef.operationName;
console.log(name);
```

### Variables
The `SaveBranch` mutation requires an argument of type `SaveBranchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveBranchVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that executing the `SaveBranch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveBranchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveBranchData {
  _execute?: number | null;
}
```
### Using `SaveBranch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveBranch, SaveBranchVariables } from '@insightpad/dataconnect';

// The `SaveBranch` mutation requires an argument of type `SaveBranchVariables`:
const saveBranchVars: SaveBranchVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveBranch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveBranch(saveBranchVars);
// Variables can be defined inline as well.
const { data } = await saveBranch({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveBranch(dataConnect, saveBranchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveBranch(saveBranchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveBranch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveBranchRef, SaveBranchVariables } from '@insightpad/dataconnect';

// The `SaveBranch` mutation requires an argument of type `SaveBranchVariables`:
const saveBranchVars: SaveBranchVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveBranchRef()` function to get a reference to the mutation.
const ref = saveBranchRef(saveBranchVars);
// Variables can be defined inline as well.
const ref = saveBranchRef({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveBranchRef(dataConnect, saveBranchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetBranchStatus
You can execute the `SetBranchStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setBranchStatus(vars: SetBranchStatusVariables): MutationPromise<SetBranchStatusData, SetBranchStatusVariables>;

interface SetBranchStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetBranchStatusVariables): MutationRef<SetBranchStatusData, SetBranchStatusVariables>;
}
export const setBranchStatusRef: SetBranchStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setBranchStatus(dc: DataConnect, vars: SetBranchStatusVariables): MutationPromise<SetBranchStatusData, SetBranchStatusVariables>;

interface SetBranchStatusRef {
  ...
  (dc: DataConnect, vars: SetBranchStatusVariables): MutationRef<SetBranchStatusData, SetBranchStatusVariables>;
}
export const setBranchStatusRef: SetBranchStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setBranchStatusRef:
```typescript
const name = setBranchStatusRef.operationName;
console.log(name);
```

### Variables
The `SetBranchStatus` mutation requires an argument of type `SetBranchStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetBranchStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetBranchStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetBranchStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetBranchStatusData {
  _execute?: number | null;
}
```
### Using `SetBranchStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setBranchStatus, SetBranchStatusVariables } from '@insightpad/dataconnect';

// The `SetBranchStatus` mutation requires an argument of type `SetBranchStatusVariables`:
const setBranchStatusVars: SetBranchStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setBranchStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setBranchStatus(setBranchStatusVars);
// Variables can be defined inline as well.
const { data } = await setBranchStatus({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setBranchStatus(dataConnect, setBranchStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setBranchStatus(setBranchStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetBranchStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setBranchStatusRef, SetBranchStatusVariables } from '@insightpad/dataconnect';

// The `SetBranchStatus` mutation requires an argument of type `SetBranchStatusVariables`:
const setBranchStatusVars: SetBranchStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setBranchStatusRef()` function to get a reference to the mutation.
const ref = setBranchStatusRef(setBranchStatusVars);
// Variables can be defined inline as well.
const ref = setBranchStatusRef({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setBranchStatusRef(dataConnect, setBranchStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveSupplier
You can execute the `SaveSupplier` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveSupplier(vars: SaveSupplierVariables): MutationPromise<SaveSupplierData, SaveSupplierVariables>;

interface SaveSupplierRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveSupplierVariables): MutationRef<SaveSupplierData, SaveSupplierVariables>;
}
export const saveSupplierRef: SaveSupplierRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveSupplier(dc: DataConnect, vars: SaveSupplierVariables): MutationPromise<SaveSupplierData, SaveSupplierVariables>;

interface SaveSupplierRef {
  ...
  (dc: DataConnect, vars: SaveSupplierVariables): MutationRef<SaveSupplierData, SaveSupplierVariables>;
}
export const saveSupplierRef: SaveSupplierRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveSupplierRef:
```typescript
const name = saveSupplierRef.operationName;
console.log(name);
```

### Variables
The `SaveSupplier` mutation requires an argument of type `SaveSupplierVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveSupplierVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that executing the `SaveSupplier` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveSupplierData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveSupplierData {
  _execute?: number | null;
}
```
### Using `SaveSupplier`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveSupplier, SaveSupplierVariables } from '@insightpad/dataconnect';

// The `SaveSupplier` mutation requires an argument of type `SaveSupplierVariables`:
const saveSupplierVars: SaveSupplierVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveSupplier()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveSupplier(saveSupplierVars);
// Variables can be defined inline as well.
const { data } = await saveSupplier({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveSupplier(dataConnect, saveSupplierVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveSupplier(saveSupplierVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveSupplier`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveSupplierRef, SaveSupplierVariables } from '@insightpad/dataconnect';

// The `SaveSupplier` mutation requires an argument of type `SaveSupplierVariables`:
const saveSupplierVars: SaveSupplierVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveSupplierRef()` function to get a reference to the mutation.
const ref = saveSupplierRef(saveSupplierVars);
// Variables can be defined inline as well.
const ref = saveSupplierRef({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveSupplierRef(dataConnect, saveSupplierVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetSupplierStatus
You can execute the `SetSupplierStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setSupplierStatus(vars: SetSupplierStatusVariables): MutationPromise<SetSupplierStatusData, SetSupplierStatusVariables>;

interface SetSupplierStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSupplierStatusVariables): MutationRef<SetSupplierStatusData, SetSupplierStatusVariables>;
}
export const setSupplierStatusRef: SetSupplierStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setSupplierStatus(dc: DataConnect, vars: SetSupplierStatusVariables): MutationPromise<SetSupplierStatusData, SetSupplierStatusVariables>;

interface SetSupplierStatusRef {
  ...
  (dc: DataConnect, vars: SetSupplierStatusVariables): MutationRef<SetSupplierStatusData, SetSupplierStatusVariables>;
}
export const setSupplierStatusRef: SetSupplierStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setSupplierStatusRef:
```typescript
const name = setSupplierStatusRef.operationName;
console.log(name);
```

### Variables
The `SetSupplierStatus` mutation requires an argument of type `SetSupplierStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetSupplierStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetSupplierStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetSupplierStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetSupplierStatusData {
  _execute?: number | null;
}
```
### Using `SetSupplierStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setSupplierStatus, SetSupplierStatusVariables } from '@insightpad/dataconnect';

// The `SetSupplierStatus` mutation requires an argument of type `SetSupplierStatusVariables`:
const setSupplierStatusVars: SetSupplierStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setSupplierStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setSupplierStatus(setSupplierStatusVars);
// Variables can be defined inline as well.
const { data } = await setSupplierStatus({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setSupplierStatus(dataConnect, setSupplierStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setSupplierStatus(setSupplierStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetSupplierStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setSupplierStatusRef, SetSupplierStatusVariables } from '@insightpad/dataconnect';

// The `SetSupplierStatus` mutation requires an argument of type `SetSupplierStatusVariables`:
const setSupplierStatusVars: SetSupplierStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setSupplierStatusRef()` function to get a reference to the mutation.
const ref = setSupplierStatusRef(setSupplierStatusVars);
// Variables can be defined inline as well.
const ref = setSupplierStatusRef({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setSupplierStatusRef(dataConnect, setSupplierStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveCustomer
You can execute the `SaveCustomer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveCustomer(vars: SaveCustomerVariables): MutationPromise<SaveCustomerData, SaveCustomerVariables>;

interface SaveCustomerRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveCustomerVariables): MutationRef<SaveCustomerData, SaveCustomerVariables>;
}
export const saveCustomerRef: SaveCustomerRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveCustomer(dc: DataConnect, vars: SaveCustomerVariables): MutationPromise<SaveCustomerData, SaveCustomerVariables>;

interface SaveCustomerRef {
  ...
  (dc: DataConnect, vars: SaveCustomerVariables): MutationRef<SaveCustomerData, SaveCustomerVariables>;
}
export const saveCustomerRef: SaveCustomerRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveCustomerRef:
```typescript
const name = saveCustomerRef.operationName;
console.log(name);
```

### Variables
The `SaveCustomer` mutation requires an argument of type `SaveCustomerVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveCustomerVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that executing the `SaveCustomer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveCustomerData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveCustomerData {
  _execute?: number | null;
}
```
### Using `SaveCustomer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveCustomer, SaveCustomerVariables } from '@insightpad/dataconnect';

// The `SaveCustomer` mutation requires an argument of type `SaveCustomerVariables`:
const saveCustomerVars: SaveCustomerVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveCustomer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveCustomer(saveCustomerVars);
// Variables can be defined inline as well.
const { data } = await saveCustomer({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveCustomer(dataConnect, saveCustomerVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveCustomer(saveCustomerVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveCustomer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveCustomerRef, SaveCustomerVariables } from '@insightpad/dataconnect';

// The `SaveCustomer` mutation requires an argument of type `SaveCustomerVariables`:
const saveCustomerVars: SaveCustomerVariables = {
  id: ..., // optional
  payload: ..., 
};

// Call the `saveCustomerRef()` function to get a reference to the mutation.
const ref = saveCustomerRef(saveCustomerVars);
// Variables can be defined inline as well.
const ref = saveCustomerRef({ id: ..., payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveCustomerRef(dataConnect, saveCustomerVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetCustomerStatus
You can execute the `SetCustomerStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setCustomerStatus(vars: SetCustomerStatusVariables): MutationPromise<SetCustomerStatusData, SetCustomerStatusVariables>;

interface SetCustomerStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCustomerStatusVariables): MutationRef<SetCustomerStatusData, SetCustomerStatusVariables>;
}
export const setCustomerStatusRef: SetCustomerStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setCustomerStatus(dc: DataConnect, vars: SetCustomerStatusVariables): MutationPromise<SetCustomerStatusData, SetCustomerStatusVariables>;

interface SetCustomerStatusRef {
  ...
  (dc: DataConnect, vars: SetCustomerStatusVariables): MutationRef<SetCustomerStatusData, SetCustomerStatusVariables>;
}
export const setCustomerStatusRef: SetCustomerStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setCustomerStatusRef:
```typescript
const name = setCustomerStatusRef.operationName;
console.log(name);
```

### Variables
The `SetCustomerStatus` mutation requires an argument of type `SetCustomerStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetCustomerStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetCustomerStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetCustomerStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetCustomerStatusData {
  _execute?: number | null;
}
```
### Using `SetCustomerStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setCustomerStatus, SetCustomerStatusVariables } from '@insightpad/dataconnect';

// The `SetCustomerStatus` mutation requires an argument of type `SetCustomerStatusVariables`:
const setCustomerStatusVars: SetCustomerStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setCustomerStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setCustomerStatus(setCustomerStatusVars);
// Variables can be defined inline as well.
const { data } = await setCustomerStatus({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setCustomerStatus(dataConnect, setCustomerStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setCustomerStatus(setCustomerStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetCustomerStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setCustomerStatusRef, SetCustomerStatusVariables } from '@insightpad/dataconnect';

// The `SetCustomerStatus` mutation requires an argument of type `SetCustomerStatusVariables`:
const setCustomerStatusVars: SetCustomerStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setCustomerStatusRef()` function to get a reference to the mutation.
const ref = setCustomerStatusRef(setCustomerStatusVars);
// Variables can be defined inline as well.
const ref = setCustomerStatusRef({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setCustomerStatusRef(dataConnect, setCustomerStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveProduct
You can execute the `SaveProduct` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveProduct(vars: SaveProductVariables): MutationPromise<SaveProductData, SaveProductVariables>;

interface SaveProductRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveProductVariables): MutationRef<SaveProductData, SaveProductVariables>;
}
export const saveProductRef: SaveProductRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveProduct(dc: DataConnect, vars: SaveProductVariables): MutationPromise<SaveProductData, SaveProductVariables>;

interface SaveProductRef {
  ...
  (dc: DataConnect, vars: SaveProductVariables): MutationRef<SaveProductData, SaveProductVariables>;
}
export const saveProductRef: SaveProductRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveProductRef:
```typescript
const name = saveProductRef.operationName;
console.log(name);
```

### Variables
The `SaveProduct` mutation requires an argument of type `SaveProductVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveProductVariables {
  id?: UUIDString | null;
  payload: unknown;
  components?: unknown | null;
}
```
### Return Type
Recall that executing the `SaveProduct` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveProductData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveProductData {
  _execute?: number | null;
}
```
### Using `SaveProduct`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveProduct, SaveProductVariables } from '@insightpad/dataconnect';

// The `SaveProduct` mutation requires an argument of type `SaveProductVariables`:
const saveProductVars: SaveProductVariables = {
  id: ..., // optional
  payload: ..., 
  components: ..., // optional
};

// Call the `saveProduct()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveProduct(saveProductVars);
// Variables can be defined inline as well.
const { data } = await saveProduct({ id: ..., payload: ..., components: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveProduct(dataConnect, saveProductVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveProduct(saveProductVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveProduct`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveProductRef, SaveProductVariables } from '@insightpad/dataconnect';

// The `SaveProduct` mutation requires an argument of type `SaveProductVariables`:
const saveProductVars: SaveProductVariables = {
  id: ..., // optional
  payload: ..., 
  components: ..., // optional
};

// Call the `saveProductRef()` function to get a reference to the mutation.
const ref = saveProductRef(saveProductVars);
// Variables can be defined inline as well.
const ref = saveProductRef({ id: ..., payload: ..., components: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveProductRef(dataConnect, saveProductVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetProductStatus
You can execute the `SetProductStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setProductStatus(vars: SetProductStatusVariables): MutationPromise<SetProductStatusData, SetProductStatusVariables>;

interface SetProductStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetProductStatusVariables): MutationRef<SetProductStatusData, SetProductStatusVariables>;
}
export const setProductStatusRef: SetProductStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setProductStatus(dc: DataConnect, vars: SetProductStatusVariables): MutationPromise<SetProductStatusData, SetProductStatusVariables>;

interface SetProductStatusRef {
  ...
  (dc: DataConnect, vars: SetProductStatusVariables): MutationRef<SetProductStatusData, SetProductStatusVariables>;
}
export const setProductStatusRef: SetProductStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setProductStatusRef:
```typescript
const name = setProductStatusRef.operationName;
console.log(name);
```

### Variables
The `SetProductStatus` mutation requires an argument of type `SetProductStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetProductStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetProductStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetProductStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetProductStatusData {
  _execute?: number | null;
}
```
### Using `SetProductStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setProductStatus, SetProductStatusVariables } from '@insightpad/dataconnect';

// The `SetProductStatus` mutation requires an argument of type `SetProductStatusVariables`:
const setProductStatusVars: SetProductStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setProductStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setProductStatus(setProductStatusVars);
// Variables can be defined inline as well.
const { data } = await setProductStatus({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setProductStatus(dataConnect, setProductStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setProductStatus(setProductStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetProductStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setProductStatusRef, SetProductStatusVariables } from '@insightpad/dataconnect';

// The `SetProductStatus` mutation requires an argument of type `SetProductStatusVariables`:
const setProductStatusVars: SetProductStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setProductStatusRef()` function to get a reference to the mutation.
const ref = setProductStatusRef(setProductStatusVars);
// Variables can be defined inline as well.
const ref = setProductStatusRef({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setProductStatusRef(dataConnect, setProductStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveProductComponents
You can execute the `SaveProductComponents` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveProductComponents(vars: SaveProductComponentsVariables): MutationPromise<SaveProductComponentsData, SaveProductComponentsVariables>;

interface SaveProductComponentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveProductComponentsVariables): MutationRef<SaveProductComponentsData, SaveProductComponentsVariables>;
}
export const saveProductComponentsRef: SaveProductComponentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveProductComponents(dc: DataConnect, vars: SaveProductComponentsVariables): MutationPromise<SaveProductComponentsData, SaveProductComponentsVariables>;

interface SaveProductComponentsRef {
  ...
  (dc: DataConnect, vars: SaveProductComponentsVariables): MutationRef<SaveProductComponentsData, SaveProductComponentsVariables>;
}
export const saveProductComponentsRef: SaveProductComponentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveProductComponentsRef:
```typescript
const name = saveProductComponentsRef.operationName;
console.log(name);
```

### Variables
The `SaveProductComponents` mutation requires an argument of type `SaveProductComponentsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveProductComponentsVariables {
  productId: UUIDString;
  components: unknown;
}
```
### Return Type
Recall that executing the `SaveProductComponents` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveProductComponentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveProductComponentsData {
  _execute?: number | null;
}
```
### Using `SaveProductComponents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveProductComponents, SaveProductComponentsVariables } from '@insightpad/dataconnect';

// The `SaveProductComponents` mutation requires an argument of type `SaveProductComponentsVariables`:
const saveProductComponentsVars: SaveProductComponentsVariables = {
  productId: ..., 
  components: ..., 
};

// Call the `saveProductComponents()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveProductComponents(saveProductComponentsVars);
// Variables can be defined inline as well.
const { data } = await saveProductComponents({ productId: ..., components: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveProductComponents(dataConnect, saveProductComponentsVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveProductComponents(saveProductComponentsVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveProductComponents`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveProductComponentsRef, SaveProductComponentsVariables } from '@insightpad/dataconnect';

// The `SaveProductComponents` mutation requires an argument of type `SaveProductComponentsVariables`:
const saveProductComponentsVars: SaveProductComponentsVariables = {
  productId: ..., 
  components: ..., 
};

// Call the `saveProductComponentsRef()` function to get a reference to the mutation.
const ref = saveProductComponentsRef(saveProductComponentsVars);
// Variables can be defined inline as well.
const ref = saveProductComponentsRef({ productId: ..., components: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveProductComponentsRef(dataConnect, saveProductComponentsVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SavePromotion
You can execute the `SavePromotion` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
savePromotion(vars: SavePromotionVariables): MutationPromise<SavePromotionData, SavePromotionVariables>;

interface SavePromotionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SavePromotionVariables): MutationRef<SavePromotionData, SavePromotionVariables>;
}
export const savePromotionRef: SavePromotionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
savePromotion(dc: DataConnect, vars: SavePromotionVariables): MutationPromise<SavePromotionData, SavePromotionVariables>;

interface SavePromotionRef {
  ...
  (dc: DataConnect, vars: SavePromotionVariables): MutationRef<SavePromotionData, SavePromotionVariables>;
}
export const savePromotionRef: SavePromotionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the savePromotionRef:
```typescript
const name = savePromotionRef.operationName;
console.log(name);
```

### Variables
The `SavePromotion` mutation requires an argument of type `SavePromotionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SavePromotionVariables {
  id?: UUIDString | null;
  productId: UUIDString;
  promotionalPriceCents: Int64String;
  startsAt: TimestampString;
  endsAt: TimestampString;
}
```
### Return Type
Recall that executing the `SavePromotion` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SavePromotionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SavePromotionData {
  _execute?: number | null;
}
```
### Using `SavePromotion`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, savePromotion, SavePromotionVariables } from '@insightpad/dataconnect';

// The `SavePromotion` mutation requires an argument of type `SavePromotionVariables`:
const savePromotionVars: SavePromotionVariables = {
  id: ..., // optional
  productId: ..., 
  promotionalPriceCents: ..., 
  startsAt: ..., 
  endsAt: ..., 
};

// Call the `savePromotion()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await savePromotion(savePromotionVars);
// Variables can be defined inline as well.
const { data } = await savePromotion({ id: ..., productId: ..., promotionalPriceCents: ..., startsAt: ..., endsAt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await savePromotion(dataConnect, savePromotionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
savePromotion(savePromotionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SavePromotion`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, savePromotionRef, SavePromotionVariables } from '@insightpad/dataconnect';

// The `SavePromotion` mutation requires an argument of type `SavePromotionVariables`:
const savePromotionVars: SavePromotionVariables = {
  id: ..., // optional
  productId: ..., 
  promotionalPriceCents: ..., 
  startsAt: ..., 
  endsAt: ..., 
};

// Call the `savePromotionRef()` function to get a reference to the mutation.
const ref = savePromotionRef(savePromotionVars);
// Variables can be defined inline as well.
const ref = savePromotionRef({ id: ..., productId: ..., promotionalPriceCents: ..., startsAt: ..., endsAt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = savePromotionRef(dataConnect, savePromotionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetPromotionStatus
You can execute the `SetPromotionStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setPromotionStatus(vars: SetPromotionStatusVariables): MutationPromise<SetPromotionStatusData, SetPromotionStatusVariables>;

interface SetPromotionStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPromotionStatusVariables): MutationRef<SetPromotionStatusData, SetPromotionStatusVariables>;
}
export const setPromotionStatusRef: SetPromotionStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setPromotionStatus(dc: DataConnect, vars: SetPromotionStatusVariables): MutationPromise<SetPromotionStatusData, SetPromotionStatusVariables>;

interface SetPromotionStatusRef {
  ...
  (dc: DataConnect, vars: SetPromotionStatusVariables): MutationRef<SetPromotionStatusData, SetPromotionStatusVariables>;
}
export const setPromotionStatusRef: SetPromotionStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setPromotionStatusRef:
```typescript
const name = setPromotionStatusRef.operationName;
console.log(name);
```

### Variables
The `SetPromotionStatus` mutation requires an argument of type `SetPromotionStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetPromotionStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetPromotionStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetPromotionStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetPromotionStatusData {
  _execute?: number | null;
}
```
### Using `SetPromotionStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setPromotionStatus, SetPromotionStatusVariables } from '@insightpad/dataconnect';

// The `SetPromotionStatus` mutation requires an argument of type `SetPromotionStatusVariables`:
const setPromotionStatusVars: SetPromotionStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setPromotionStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setPromotionStatus(setPromotionStatusVars);
// Variables can be defined inline as well.
const { data } = await setPromotionStatus({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setPromotionStatus(dataConnect, setPromotionStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setPromotionStatus(setPromotionStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetPromotionStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setPromotionStatusRef, SetPromotionStatusVariables } from '@insightpad/dataconnect';

// The `SetPromotionStatus` mutation requires an argument of type `SetPromotionStatusVariables`:
const setPromotionStatusVars: SetPromotionStatusVariables = {
  id: ..., 
  active: ..., 
};

// Call the `setPromotionStatusRef()` function to get a reference to the mutation.
const ref = setPromotionStatusRef(setPromotionStatusVars);
// Variables can be defined inline as well.
const ref = setPromotionStatusRef({ id: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setPromotionStatusRef(dataConnect, setPromotionStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetCategoriesStatusBatch
You can execute the `SetCategoriesStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setCategoriesStatusBatch(vars: SetCategoriesStatusBatchVariables): MutationPromise<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;

interface SetCategoriesStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCategoriesStatusBatchVariables): MutationRef<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
}
export const setCategoriesStatusBatchRef: SetCategoriesStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setCategoriesStatusBatch(dc: DataConnect, vars: SetCategoriesStatusBatchVariables): MutationPromise<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;

interface SetCategoriesStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetCategoriesStatusBatchVariables): MutationRef<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
}
export const setCategoriesStatusBatchRef: SetCategoriesStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setCategoriesStatusBatchRef:
```typescript
const name = setCategoriesStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetCategoriesStatusBatch` mutation requires an argument of type `SetCategoriesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetCategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetCategoriesStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetCategoriesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetCategoriesStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetCategoriesStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setCategoriesStatusBatch, SetCategoriesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetCategoriesStatusBatch` mutation requires an argument of type `SetCategoriesStatusBatchVariables`:
const setCategoriesStatusBatchVars: SetCategoriesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setCategoriesStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setCategoriesStatusBatch(setCategoriesStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setCategoriesStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setCategoriesStatusBatch(dataConnect, setCategoriesStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setCategoriesStatusBatch(setCategoriesStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetCategoriesStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setCategoriesStatusBatchRef, SetCategoriesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetCategoriesStatusBatch` mutation requires an argument of type `SetCategoriesStatusBatchVariables`:
const setCategoriesStatusBatchVars: SetCategoriesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setCategoriesStatusBatchRef()` function to get a reference to the mutation.
const ref = setCategoriesStatusBatchRef(setCategoriesStatusBatchVars);
// Variables can be defined inline as well.
const ref = setCategoriesStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setCategoriesStatusBatchRef(dataConnect, setCategoriesStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetSubcategoriesStatusBatch
You can execute the `SetSubcategoriesStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setSubcategoriesStatusBatch(vars: SetSubcategoriesStatusBatchVariables): MutationPromise<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;

interface SetSubcategoriesStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSubcategoriesStatusBatchVariables): MutationRef<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
}
export const setSubcategoriesStatusBatchRef: SetSubcategoriesStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setSubcategoriesStatusBatch(dc: DataConnect, vars: SetSubcategoriesStatusBatchVariables): MutationPromise<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;

interface SetSubcategoriesStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetSubcategoriesStatusBatchVariables): MutationRef<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
}
export const setSubcategoriesStatusBatchRef: SetSubcategoriesStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setSubcategoriesStatusBatchRef:
```typescript
const name = setSubcategoriesStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetSubcategoriesStatusBatch` mutation requires an argument of type `SetSubcategoriesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetSubcategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetSubcategoriesStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetSubcategoriesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetSubcategoriesStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetSubcategoriesStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setSubcategoriesStatusBatch, SetSubcategoriesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetSubcategoriesStatusBatch` mutation requires an argument of type `SetSubcategoriesStatusBatchVariables`:
const setSubcategoriesStatusBatchVars: SetSubcategoriesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setSubcategoriesStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setSubcategoriesStatusBatch(setSubcategoriesStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setSubcategoriesStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setSubcategoriesStatusBatch(dataConnect, setSubcategoriesStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setSubcategoriesStatusBatch(setSubcategoriesStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetSubcategoriesStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setSubcategoriesStatusBatchRef, SetSubcategoriesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetSubcategoriesStatusBatch` mutation requires an argument of type `SetSubcategoriesStatusBatchVariables`:
const setSubcategoriesStatusBatchVars: SetSubcategoriesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setSubcategoriesStatusBatchRef()` function to get a reference to the mutation.
const ref = setSubcategoriesStatusBatchRef(setSubcategoriesStatusBatchVars);
// Variables can be defined inline as well.
const ref = setSubcategoriesStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setSubcategoriesStatusBatchRef(dataConnect, setSubcategoriesStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetBranchesStatusBatch
You can execute the `SetBranchesStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setBranchesStatusBatch(vars: SetBranchesStatusBatchVariables): MutationPromise<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;

interface SetBranchesStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetBranchesStatusBatchVariables): MutationRef<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
}
export const setBranchesStatusBatchRef: SetBranchesStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setBranchesStatusBatch(dc: DataConnect, vars: SetBranchesStatusBatchVariables): MutationPromise<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;

interface SetBranchesStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetBranchesStatusBatchVariables): MutationRef<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
}
export const setBranchesStatusBatchRef: SetBranchesStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setBranchesStatusBatchRef:
```typescript
const name = setBranchesStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetBranchesStatusBatch` mutation requires an argument of type `SetBranchesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetBranchesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetBranchesStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetBranchesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetBranchesStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetBranchesStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setBranchesStatusBatch, SetBranchesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetBranchesStatusBatch` mutation requires an argument of type `SetBranchesStatusBatchVariables`:
const setBranchesStatusBatchVars: SetBranchesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setBranchesStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setBranchesStatusBatch(setBranchesStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setBranchesStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setBranchesStatusBatch(dataConnect, setBranchesStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setBranchesStatusBatch(setBranchesStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetBranchesStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setBranchesStatusBatchRef, SetBranchesStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetBranchesStatusBatch` mutation requires an argument of type `SetBranchesStatusBatchVariables`:
const setBranchesStatusBatchVars: SetBranchesStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setBranchesStatusBatchRef()` function to get a reference to the mutation.
const ref = setBranchesStatusBatchRef(setBranchesStatusBatchVars);
// Variables can be defined inline as well.
const ref = setBranchesStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setBranchesStatusBatchRef(dataConnect, setBranchesStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetSuppliersStatusBatch
You can execute the `SetSuppliersStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setSuppliersStatusBatch(vars: SetSuppliersStatusBatchVariables): MutationPromise<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;

interface SetSuppliersStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetSuppliersStatusBatchVariables): MutationRef<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
}
export const setSuppliersStatusBatchRef: SetSuppliersStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setSuppliersStatusBatch(dc: DataConnect, vars: SetSuppliersStatusBatchVariables): MutationPromise<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;

interface SetSuppliersStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetSuppliersStatusBatchVariables): MutationRef<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
}
export const setSuppliersStatusBatchRef: SetSuppliersStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setSuppliersStatusBatchRef:
```typescript
const name = setSuppliersStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetSuppliersStatusBatch` mutation requires an argument of type `SetSuppliersStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetSuppliersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetSuppliersStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetSuppliersStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetSuppliersStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetSuppliersStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setSuppliersStatusBatch, SetSuppliersStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetSuppliersStatusBatch` mutation requires an argument of type `SetSuppliersStatusBatchVariables`:
const setSuppliersStatusBatchVars: SetSuppliersStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setSuppliersStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setSuppliersStatusBatch(setSuppliersStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setSuppliersStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setSuppliersStatusBatch(dataConnect, setSuppliersStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setSuppliersStatusBatch(setSuppliersStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetSuppliersStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setSuppliersStatusBatchRef, SetSuppliersStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetSuppliersStatusBatch` mutation requires an argument of type `SetSuppliersStatusBatchVariables`:
const setSuppliersStatusBatchVars: SetSuppliersStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setSuppliersStatusBatchRef()` function to get a reference to the mutation.
const ref = setSuppliersStatusBatchRef(setSuppliersStatusBatchVars);
// Variables can be defined inline as well.
const ref = setSuppliersStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setSuppliersStatusBatchRef(dataConnect, setSuppliersStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetCustomersStatusBatch
You can execute the `SetCustomersStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setCustomersStatusBatch(vars: SetCustomersStatusBatchVariables): MutationPromise<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;

interface SetCustomersStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetCustomersStatusBatchVariables): MutationRef<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
}
export const setCustomersStatusBatchRef: SetCustomersStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setCustomersStatusBatch(dc: DataConnect, vars: SetCustomersStatusBatchVariables): MutationPromise<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;

interface SetCustomersStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetCustomersStatusBatchVariables): MutationRef<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
}
export const setCustomersStatusBatchRef: SetCustomersStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setCustomersStatusBatchRef:
```typescript
const name = setCustomersStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetCustomersStatusBatch` mutation requires an argument of type `SetCustomersStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetCustomersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetCustomersStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetCustomersStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetCustomersStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetCustomersStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setCustomersStatusBatch, SetCustomersStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetCustomersStatusBatch` mutation requires an argument of type `SetCustomersStatusBatchVariables`:
const setCustomersStatusBatchVars: SetCustomersStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setCustomersStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setCustomersStatusBatch(setCustomersStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setCustomersStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setCustomersStatusBatch(dataConnect, setCustomersStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setCustomersStatusBatch(setCustomersStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetCustomersStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setCustomersStatusBatchRef, SetCustomersStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetCustomersStatusBatch` mutation requires an argument of type `SetCustomersStatusBatchVariables`:
const setCustomersStatusBatchVars: SetCustomersStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setCustomersStatusBatchRef()` function to get a reference to the mutation.
const ref = setCustomersStatusBatchRef(setCustomersStatusBatchVars);
// Variables can be defined inline as well.
const ref = setCustomersStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setCustomersStatusBatchRef(dataConnect, setCustomersStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetProductsStatusBatch
You can execute the `SetProductsStatusBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setProductsStatusBatch(vars: SetProductsStatusBatchVariables): MutationPromise<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;

interface SetProductsStatusBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetProductsStatusBatchVariables): MutationRef<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
}
export const setProductsStatusBatchRef: SetProductsStatusBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setProductsStatusBatch(dc: DataConnect, vars: SetProductsStatusBatchVariables): MutationPromise<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;

interface SetProductsStatusBatchRef {
  ...
  (dc: DataConnect, vars: SetProductsStatusBatchVariables): MutationRef<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
}
export const setProductsStatusBatchRef: SetProductsStatusBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setProductsStatusBatchRef:
```typescript
const name = setProductsStatusBatchRef.operationName;
console.log(name);
```

### Variables
The `SetProductsStatusBatch` mutation requires an argument of type `SetProductsStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetProductsStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetProductsStatusBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetProductsStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetProductsStatusBatchData {
  _execute?: number | null;
}
```
### Using `SetProductsStatusBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setProductsStatusBatch, SetProductsStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetProductsStatusBatch` mutation requires an argument of type `SetProductsStatusBatchVariables`:
const setProductsStatusBatchVars: SetProductsStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setProductsStatusBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setProductsStatusBatch(setProductsStatusBatchVars);
// Variables can be defined inline as well.
const { data } = await setProductsStatusBatch({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setProductsStatusBatch(dataConnect, setProductsStatusBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setProductsStatusBatch(setProductsStatusBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetProductsStatusBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setProductsStatusBatchRef, SetProductsStatusBatchVariables } from '@insightpad/dataconnect';

// The `SetProductsStatusBatch` mutation requires an argument of type `SetProductsStatusBatchVariables`:
const setProductsStatusBatchVars: SetProductsStatusBatchVariables = {
  ids: ..., 
  active: ..., 
};

// Call the `setProductsStatusBatchRef()` function to get a reference to the mutation.
const ref = setProductsStatusBatchRef(setProductsStatusBatchVars);
// Variables can be defined inline as well.
const ref = setProductsStatusBatchRef({ ids: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setProductsStatusBatchRef(dataConnect, setProductsStatusBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## EnsureSalesDefaults
You can execute the `EnsureSalesDefaults` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
ensureSalesDefaults(): MutationPromise<EnsureSalesDefaultsData, undefined>;

interface EnsureSalesDefaultsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<EnsureSalesDefaultsData, undefined>;
}
export const ensureSalesDefaultsRef: EnsureSalesDefaultsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
ensureSalesDefaults(dc: DataConnect): MutationPromise<EnsureSalesDefaultsData, undefined>;

interface EnsureSalesDefaultsRef {
  ...
  (dc: DataConnect): MutationRef<EnsureSalesDefaultsData, undefined>;
}
export const ensureSalesDefaultsRef: EnsureSalesDefaultsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the ensureSalesDefaultsRef:
```typescript
const name = ensureSalesDefaultsRef.operationName;
console.log(name);
```

### Variables
The `EnsureSalesDefaults` mutation has no variables.
### Return Type
Recall that executing the `EnsureSalesDefaults` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `EnsureSalesDefaultsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface EnsureSalesDefaultsData {
  _execute?: number | null;
}
```
### Using `EnsureSalesDefaults`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ensureSalesDefaults } from '@insightpad/dataconnect';


// Call the `ensureSalesDefaults()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await ensureSalesDefaults();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await ensureSalesDefaults(dataConnect);

console.log(data._execute);

// Or, you can use the `Promise` API.
ensureSalesDefaults().then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `EnsureSalesDefaults`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, ensureSalesDefaultsRef } from '@insightpad/dataconnect';


// Call the `ensureSalesDefaultsRef()` function to get a reference to the mutation.
const ref = ensureSalesDefaultsRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = ensureSalesDefaultsRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## PostSale
You can execute the `PostSale` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
postSale(vars: PostSaleVariables): MutationPromise<PostSaleData, PostSaleVariables>;

interface PostSaleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostSaleVariables): MutationRef<PostSaleData, PostSaleVariables>;
}
export const postSaleRef: PostSaleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
postSale(dc: DataConnect, vars: PostSaleVariables): MutationPromise<PostSaleData, PostSaleVariables>;

interface PostSaleRef {
  ...
  (dc: DataConnect, vars: PostSaleVariables): MutationRef<PostSaleData, PostSaleVariables>;
}
export const postSaleRef: PostSaleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the postSaleRef:
```typescript
const name = postSaleRef.operationName;
console.log(name);
```

### Variables
The `PostSale` mutation requires an argument of type `PostSaleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PostSaleVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `PostSale` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PostSaleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PostSaleData {
  _execute?: number | null;
}
```
### Using `PostSale`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, postSale, PostSaleVariables } from '@insightpad/dataconnect';

// The `PostSale` mutation requires an argument of type `PostSaleVariables`:
const postSaleVars: PostSaleVariables = {
  payload: ..., 
};

// Call the `postSale()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await postSale(postSaleVars);
// Variables can be defined inline as well.
const { data } = await postSale({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await postSale(dataConnect, postSaleVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
postSale(postSaleVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `PostSale`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, postSaleRef, PostSaleVariables } from '@insightpad/dataconnect';

// The `PostSale` mutation requires an argument of type `PostSaleVariables`:
const postSaleVars: PostSaleVariables = {
  payload: ..., 
};

// Call the `postSaleRef()` function to get a reference to the mutation.
const ref = postSaleRef(postSaleVars);
// Variables can be defined inline as well.
const ref = postSaleRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = postSaleRef(dataConnect, postSaleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CancelSale
You can execute the `CancelSale` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
cancelSale(vars: CancelSaleVariables): MutationPromise<CancelSaleData, CancelSaleVariables>;

interface CancelSaleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelSaleVariables): MutationRef<CancelSaleData, CancelSaleVariables>;
}
export const cancelSaleRef: CancelSaleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cancelSale(dc: DataConnect, vars: CancelSaleVariables): MutationPromise<CancelSaleData, CancelSaleVariables>;

interface CancelSaleRef {
  ...
  (dc: DataConnect, vars: CancelSaleVariables): MutationRef<CancelSaleData, CancelSaleVariables>;
}
export const cancelSaleRef: CancelSaleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cancelSaleRef:
```typescript
const name = cancelSaleRef.operationName;
console.log(name);
```

### Variables
The `CancelSale` mutation requires an argument of type `CancelSaleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CancelSaleVariables {
  saleId: UUIDString;
  reason: string;
}
```
### Return Type
Recall that executing the `CancelSale` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CancelSaleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CancelSaleData {
  _execute?: number | null;
}
```
### Using `CancelSale`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cancelSale, CancelSaleVariables } from '@insightpad/dataconnect';

// The `CancelSale` mutation requires an argument of type `CancelSaleVariables`:
const cancelSaleVars: CancelSaleVariables = {
  saleId: ..., 
  reason: ..., 
};

// Call the `cancelSale()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cancelSale(cancelSaleVars);
// Variables can be defined inline as well.
const { data } = await cancelSale({ saleId: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cancelSale(dataConnect, cancelSaleVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
cancelSale(cancelSaleVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CancelSale`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cancelSaleRef, CancelSaleVariables } from '@insightpad/dataconnect';

// The `CancelSale` mutation requires an argument of type `CancelSaleVariables`:
const cancelSaleVars: CancelSaleVariables = {
  saleId: ..., 
  reason: ..., 
};

// Call the `cancelSaleRef()` function to get a reference to the mutation.
const ref = cancelSaleRef(cancelSaleVars);
// Variables can be defined inline as well.
const ref = cancelSaleRef({ saleId: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cancelSaleRef(dataConnect, cancelSaleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreatePlatformTenant
You can execute the `CreatePlatformTenant` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPlatformTenant(vars: CreatePlatformTenantVariables): MutationPromise<CreatePlatformTenantData, CreatePlatformTenantVariables>;

interface CreatePlatformTenantRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformTenantVariables): MutationRef<CreatePlatformTenantData, CreatePlatformTenantVariables>;
}
export const createPlatformTenantRef: CreatePlatformTenantRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPlatformTenant(dc: DataConnect, vars: CreatePlatformTenantVariables): MutationPromise<CreatePlatformTenantData, CreatePlatformTenantVariables>;

interface CreatePlatformTenantRef {
  ...
  (dc: DataConnect, vars: CreatePlatformTenantVariables): MutationRef<CreatePlatformTenantData, CreatePlatformTenantVariables>;
}
export const createPlatformTenantRef: CreatePlatformTenantRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPlatformTenantRef:
```typescript
const name = createPlatformTenantRef.operationName;
console.log(name);
```

### Variables
The `CreatePlatformTenant` mutation requires an argument of type `CreatePlatformTenantVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePlatformTenantVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `CreatePlatformTenant` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePlatformTenantData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePlatformTenantData {
  _execute?: number | null;
}
```
### Using `CreatePlatformTenant`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPlatformTenant, CreatePlatformTenantVariables } from '@insightpad/dataconnect';

// The `CreatePlatformTenant` mutation requires an argument of type `CreatePlatformTenantVariables`:
const createPlatformTenantVars: CreatePlatformTenantVariables = {
  payload: ..., 
};

// Call the `createPlatformTenant()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPlatformTenant(createPlatformTenantVars);
// Variables can be defined inline as well.
const { data } = await createPlatformTenant({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPlatformTenant(dataConnect, createPlatformTenantVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createPlatformTenant(createPlatformTenantVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreatePlatformTenant`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPlatformTenantRef, CreatePlatformTenantVariables } from '@insightpad/dataconnect';

// The `CreatePlatformTenant` mutation requires an argument of type `CreatePlatformTenantVariables`:
const createPlatformTenantVars: CreatePlatformTenantVariables = {
  payload: ..., 
};

// Call the `createPlatformTenantRef()` function to get a reference to the mutation.
const ref = createPlatformTenantRef(createPlatformTenantVars);
// Variables can be defined inline as well.
const ref = createPlatformTenantRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPlatformTenantRef(dataConnect, createPlatformTenantVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdatePlatformTenant
You can execute the `UpdatePlatformTenant` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePlatformTenant(vars: UpdatePlatformTenantVariables): MutationPromise<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;

interface UpdatePlatformTenantRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlatformTenantVariables): MutationRef<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;
}
export const updatePlatformTenantRef: UpdatePlatformTenantRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePlatformTenant(dc: DataConnect, vars: UpdatePlatformTenantVariables): MutationPromise<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;

interface UpdatePlatformTenantRef {
  ...
  (dc: DataConnect, vars: UpdatePlatformTenantVariables): MutationRef<UpdatePlatformTenantData, UpdatePlatformTenantVariables>;
}
export const updatePlatformTenantRef: UpdatePlatformTenantRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePlatformTenantRef:
```typescript
const name = updatePlatformTenantRef.operationName;
console.log(name);
```

### Variables
The `UpdatePlatformTenant` mutation requires an argument of type `UpdatePlatformTenantVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePlatformTenantVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `UpdatePlatformTenant` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePlatformTenantData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePlatformTenantData {
  _execute?: number | null;
}
```
### Using `UpdatePlatformTenant`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePlatformTenant, UpdatePlatformTenantVariables } from '@insightpad/dataconnect';

// The `UpdatePlatformTenant` mutation requires an argument of type `UpdatePlatformTenantVariables`:
const updatePlatformTenantVars: UpdatePlatformTenantVariables = {
  payload: ..., 
};

// Call the `updatePlatformTenant()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePlatformTenant(updatePlatformTenantVars);
// Variables can be defined inline as well.
const { data } = await updatePlatformTenant({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePlatformTenant(dataConnect, updatePlatformTenantVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updatePlatformTenant(updatePlatformTenantVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdatePlatformTenant`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePlatformTenantRef, UpdatePlatformTenantVariables } from '@insightpad/dataconnect';

// The `UpdatePlatformTenant` mutation requires an argument of type `UpdatePlatformTenantVariables`:
const updatePlatformTenantVars: UpdatePlatformTenantVariables = {
  payload: ..., 
};

// Call the `updatePlatformTenantRef()` function to get a reference to the mutation.
const ref = updatePlatformTenantRef(updatePlatformTenantVars);
// Variables can be defined inline as well.
const ref = updatePlatformTenantRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePlatformTenantRef(dataConnect, updatePlatformTenantVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetPlatformTenantStatus
You can execute the `SetPlatformTenantStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setPlatformTenantStatus(vars: SetPlatformTenantStatusVariables): MutationPromise<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;

interface SetPlatformTenantStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformTenantStatusVariables): MutationRef<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
}
export const setPlatformTenantStatusRef: SetPlatformTenantStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setPlatformTenantStatus(dc: DataConnect, vars: SetPlatformTenantStatusVariables): MutationPromise<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;

interface SetPlatformTenantStatusRef {
  ...
  (dc: DataConnect, vars: SetPlatformTenantStatusVariables): MutationRef<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
}
export const setPlatformTenantStatusRef: SetPlatformTenantStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setPlatformTenantStatusRef:
```typescript
const name = setPlatformTenantStatusRef.operationName;
console.log(name);
```

### Variables
The `SetPlatformTenantStatus` mutation requires an argument of type `SetPlatformTenantStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetPlatformTenantStatusVariables {
  tenantId: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetPlatformTenantStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetPlatformTenantStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetPlatformTenantStatusData {
  _execute?: number | null;
}
```
### Using `SetPlatformTenantStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setPlatformTenantStatus, SetPlatformTenantStatusVariables } from '@insightpad/dataconnect';

// The `SetPlatformTenantStatus` mutation requires an argument of type `SetPlatformTenantStatusVariables`:
const setPlatformTenantStatusVars: SetPlatformTenantStatusVariables = {
  tenantId: ..., 
  active: ..., 
};

// Call the `setPlatformTenantStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setPlatformTenantStatus(setPlatformTenantStatusVars);
// Variables can be defined inline as well.
const { data } = await setPlatformTenantStatus({ tenantId: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setPlatformTenantStatus(dataConnect, setPlatformTenantStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setPlatformTenantStatus(setPlatformTenantStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetPlatformTenantStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setPlatformTenantStatusRef, SetPlatformTenantStatusVariables } from '@insightpad/dataconnect';

// The `SetPlatformTenantStatus` mutation requires an argument of type `SetPlatformTenantStatusVariables`:
const setPlatformTenantStatusVars: SetPlatformTenantStatusVariables = {
  tenantId: ..., 
  active: ..., 
};

// Call the `setPlatformTenantStatusRef()` function to get a reference to the mutation.
const ref = setPlatformTenantStatusRef(setPlatformTenantStatusVars);
// Variables can be defined inline as well.
const ref = setPlatformTenantStatusRef({ tenantId: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setPlatformTenantStatusRef(dataConnect, setPlatformTenantStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## LinkPlatformUser
You can execute the `LinkPlatformUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
linkPlatformUser(vars: LinkPlatformUserVariables): MutationPromise<LinkPlatformUserData, LinkPlatformUserVariables>;

interface LinkPlatformUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: LinkPlatformUserVariables): MutationRef<LinkPlatformUserData, LinkPlatformUserVariables>;
}
export const linkPlatformUserRef: LinkPlatformUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
linkPlatformUser(dc: DataConnect, vars: LinkPlatformUserVariables): MutationPromise<LinkPlatformUserData, LinkPlatformUserVariables>;

interface LinkPlatformUserRef {
  ...
  (dc: DataConnect, vars: LinkPlatformUserVariables): MutationRef<LinkPlatformUserData, LinkPlatformUserVariables>;
}
export const linkPlatformUserRef: LinkPlatformUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the linkPlatformUserRef:
```typescript
const name = linkPlatformUserRef.operationName;
console.log(name);
```

### Variables
The `LinkPlatformUser` mutation requires an argument of type `LinkPlatformUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface LinkPlatformUserVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `LinkPlatformUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `LinkPlatformUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface LinkPlatformUserData {
  _execute?: number | null;
}
```
### Using `LinkPlatformUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, linkPlatformUser, LinkPlatformUserVariables } from '@insightpad/dataconnect';

// The `LinkPlatformUser` mutation requires an argument of type `LinkPlatformUserVariables`:
const linkPlatformUserVars: LinkPlatformUserVariables = {
  payload: ..., 
};

// Call the `linkPlatformUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await linkPlatformUser(linkPlatformUserVars);
// Variables can be defined inline as well.
const { data } = await linkPlatformUser({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await linkPlatformUser(dataConnect, linkPlatformUserVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
linkPlatformUser(linkPlatformUserVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `LinkPlatformUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, linkPlatformUserRef, LinkPlatformUserVariables } from '@insightpad/dataconnect';

// The `LinkPlatformUser` mutation requires an argument of type `LinkPlatformUserVariables`:
const linkPlatformUserVars: LinkPlatformUserVariables = {
  payload: ..., 
};

// Call the `linkPlatformUserRef()` function to get a reference to the mutation.
const ref = linkPlatformUserRef(linkPlatformUserVars);
// Variables can be defined inline as well.
const ref = linkPlatformUserRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = linkPlatformUserRef(dataConnect, linkPlatformUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetPlatformUserStatus
You can execute the `SetPlatformUserStatus` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setPlatformUserStatus(vars: SetPlatformUserStatusVariables): MutationPromise<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;

interface SetPlatformUserStatusRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformUserStatusVariables): MutationRef<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
}
export const setPlatformUserStatusRef: SetPlatformUserStatusRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setPlatformUserStatus(dc: DataConnect, vars: SetPlatformUserStatusVariables): MutationPromise<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;

interface SetPlatformUserStatusRef {
  ...
  (dc: DataConnect, vars: SetPlatformUserStatusVariables): MutationRef<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
}
export const setPlatformUserStatusRef: SetPlatformUserStatusRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setPlatformUserStatusRef:
```typescript
const name = setPlatformUserStatusRef.operationName;
console.log(name);
```

### Variables
The `SetPlatformUserStatus` mutation requires an argument of type `SetPlatformUserStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetPlatformUserStatusVariables {
  userId: string;
  active: boolean;
}
```
### Return Type
Recall that executing the `SetPlatformUserStatus` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetPlatformUserStatusData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetPlatformUserStatusData {
  _execute?: number | null;
}
```
### Using `SetPlatformUserStatus`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setPlatformUserStatus, SetPlatformUserStatusVariables } from '@insightpad/dataconnect';

// The `SetPlatformUserStatus` mutation requires an argument of type `SetPlatformUserStatusVariables`:
const setPlatformUserStatusVars: SetPlatformUserStatusVariables = {
  userId: ..., 
  active: ..., 
};

// Call the `setPlatformUserStatus()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setPlatformUserStatus(setPlatformUserStatusVars);
// Variables can be defined inline as well.
const { data } = await setPlatformUserStatus({ userId: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setPlatformUserStatus(dataConnect, setPlatformUserStatusVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setPlatformUserStatus(setPlatformUserStatusVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetPlatformUserStatus`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setPlatformUserStatusRef, SetPlatformUserStatusVariables } from '@insightpad/dataconnect';

// The `SetPlatformUserStatus` mutation requires an argument of type `SetPlatformUserStatusVariables`:
const setPlatformUserStatusVars: SetPlatformUserStatusVariables = {
  userId: ..., 
  active: ..., 
};

// Call the `setPlatformUserStatusRef()` function to get a reference to the mutation.
const ref = setPlatformUserStatusRef(setPlatformUserStatusVars);
// Variables can be defined inline as well.
const ref = setPlatformUserStatusRef({ userId: ..., active: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setPlatformUserStatusRef(dataConnect, setPlatformUserStatusVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SetPlatformRolePermission
You can execute the `SetPlatformRolePermission` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setPlatformRolePermission(vars: SetPlatformRolePermissionVariables): MutationPromise<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;

interface SetPlatformRolePermissionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetPlatformRolePermissionVariables): MutationRef<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
}
export const setPlatformRolePermissionRef: SetPlatformRolePermissionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setPlatformRolePermission(dc: DataConnect, vars: SetPlatformRolePermissionVariables): MutationPromise<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;

interface SetPlatformRolePermissionRef {
  ...
  (dc: DataConnect, vars: SetPlatformRolePermissionVariables): MutationRef<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
}
export const setPlatformRolePermissionRef: SetPlatformRolePermissionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setPlatformRolePermissionRef:
```typescript
const name = setPlatformRolePermissionRef.operationName;
console.log(name);
```

### Variables
The `SetPlatformRolePermission` mutation requires an argument of type `SetPlatformRolePermissionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetPlatformRolePermissionVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `SetPlatformRolePermission` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetPlatformRolePermissionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetPlatformRolePermissionData {
  _execute?: number | null;
}
```
### Using `SetPlatformRolePermission`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setPlatformRolePermission, SetPlatformRolePermissionVariables } from '@insightpad/dataconnect';

// The `SetPlatformRolePermission` mutation requires an argument of type `SetPlatformRolePermissionVariables`:
const setPlatformRolePermissionVars: SetPlatformRolePermissionVariables = {
  payload: ..., 
};

// Call the `setPlatformRolePermission()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setPlatformRolePermission(setPlatformRolePermissionVars);
// Variables can be defined inline as well.
const { data } = await setPlatformRolePermission({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setPlatformRolePermission(dataConnect, setPlatformRolePermissionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
setPlatformRolePermission(setPlatformRolePermissionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SetPlatformRolePermission`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setPlatformRolePermissionRef, SetPlatformRolePermissionVariables } from '@insightpad/dataconnect';

// The `SetPlatformRolePermission` mutation requires an argument of type `SetPlatformRolePermissionVariables`:
const setPlatformRolePermissionVars: SetPlatformRolePermissionVariables = {
  payload: ..., 
};

// Call the `setPlatformRolePermissionRef()` function to get a reference to the mutation.
const ref = setPlatformRolePermissionRef(setPlatformRolePermissionVars);
// Variables can be defined inline as well.
const ref = setPlatformRolePermissionRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setPlatformRolePermissionRef(dataConnect, setPlatformRolePermissionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreatePlatformInvoice
You can execute the `CreatePlatformInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPlatformInvoice(vars: CreatePlatformInvoiceVariables): MutationPromise<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;

interface CreatePlatformInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePlatformInvoiceVariables): MutationRef<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;
}
export const createPlatformInvoiceRef: CreatePlatformInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPlatformInvoice(dc: DataConnect, vars: CreatePlatformInvoiceVariables): MutationPromise<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;

interface CreatePlatformInvoiceRef {
  ...
  (dc: DataConnect, vars: CreatePlatformInvoiceVariables): MutationRef<CreatePlatformInvoiceData, CreatePlatformInvoiceVariables>;
}
export const createPlatformInvoiceRef: CreatePlatformInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPlatformInvoiceRef:
```typescript
const name = createPlatformInvoiceRef.operationName;
console.log(name);
```

### Variables
The `CreatePlatformInvoice` mutation requires an argument of type `CreatePlatformInvoiceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePlatformInvoiceVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `CreatePlatformInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePlatformInvoiceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePlatformInvoiceData {
  _execute?: number | null;
}
```
### Using `CreatePlatformInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPlatformInvoice, CreatePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `CreatePlatformInvoice` mutation requires an argument of type `CreatePlatformInvoiceVariables`:
const createPlatformInvoiceVars: CreatePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `createPlatformInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPlatformInvoice(createPlatformInvoiceVars);
// Variables can be defined inline as well.
const { data } = await createPlatformInvoice({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPlatformInvoice(dataConnect, createPlatformInvoiceVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createPlatformInvoice(createPlatformInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreatePlatformInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPlatformInvoiceRef, CreatePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `CreatePlatformInvoice` mutation requires an argument of type `CreatePlatformInvoiceVariables`:
const createPlatformInvoiceVars: CreatePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `createPlatformInvoiceRef()` function to get a reference to the mutation.
const ref = createPlatformInvoiceRef(createPlatformInvoiceVars);
// Variables can be defined inline as well.
const ref = createPlatformInvoiceRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPlatformInvoiceRef(dataConnect, createPlatformInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdatePlatformInvoice
You can execute the `UpdatePlatformInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePlatformInvoice(vars: UpdatePlatformInvoiceVariables): MutationPromise<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;

interface UpdatePlatformInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlatformInvoiceVariables): MutationRef<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;
}
export const updatePlatformInvoiceRef: UpdatePlatformInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePlatformInvoice(dc: DataConnect, vars: UpdatePlatformInvoiceVariables): MutationPromise<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;

interface UpdatePlatformInvoiceRef {
  ...
  (dc: DataConnect, vars: UpdatePlatformInvoiceVariables): MutationRef<UpdatePlatformInvoiceData, UpdatePlatformInvoiceVariables>;
}
export const updatePlatformInvoiceRef: UpdatePlatformInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePlatformInvoiceRef:
```typescript
const name = updatePlatformInvoiceRef.operationName;
console.log(name);
```

### Variables
The `UpdatePlatformInvoice` mutation requires an argument of type `UpdatePlatformInvoiceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePlatformInvoiceVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `UpdatePlatformInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePlatformInvoiceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePlatformInvoiceData {
  _execute?: number | null;
}
```
### Using `UpdatePlatformInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePlatformInvoice, UpdatePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `UpdatePlatformInvoice` mutation requires an argument of type `UpdatePlatformInvoiceVariables`:
const updatePlatformInvoiceVars: UpdatePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `updatePlatformInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePlatformInvoice(updatePlatformInvoiceVars);
// Variables can be defined inline as well.
const { data } = await updatePlatformInvoice({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePlatformInvoice(dataConnect, updatePlatformInvoiceVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updatePlatformInvoice(updatePlatformInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdatePlatformInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePlatformInvoiceRef, UpdatePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `UpdatePlatformInvoice` mutation requires an argument of type `UpdatePlatformInvoiceVariables`:
const updatePlatformInvoiceVars: UpdatePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `updatePlatformInvoiceRef()` function to get a reference to the mutation.
const ref = updatePlatformInvoiceRef(updatePlatformInvoiceVars);
// Variables can be defined inline as well.
const ref = updatePlatformInvoiceRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePlatformInvoiceRef(dataConnect, updatePlatformInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## VoidPlatformInvoice
You can execute the `VoidPlatformInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
voidPlatformInvoice(vars: VoidPlatformInvoiceVariables): MutationPromise<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;

interface VoidPlatformInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: VoidPlatformInvoiceVariables): MutationRef<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;
}
export const voidPlatformInvoiceRef: VoidPlatformInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
voidPlatformInvoice(dc: DataConnect, vars: VoidPlatformInvoiceVariables): MutationPromise<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;

interface VoidPlatformInvoiceRef {
  ...
  (dc: DataConnect, vars: VoidPlatformInvoiceVariables): MutationRef<VoidPlatformInvoiceData, VoidPlatformInvoiceVariables>;
}
export const voidPlatformInvoiceRef: VoidPlatformInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the voidPlatformInvoiceRef:
```typescript
const name = voidPlatformInvoiceRef.operationName;
console.log(name);
```

### Variables
The `VoidPlatformInvoice` mutation requires an argument of type `VoidPlatformInvoiceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface VoidPlatformInvoiceVariables {
  invoiceId: UUIDString;
  reason: string;
  expectedVersion: Int64String;
}
```
### Return Type
Recall that executing the `VoidPlatformInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `VoidPlatformInvoiceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface VoidPlatformInvoiceData {
  _execute?: number | null;
}
```
### Using `VoidPlatformInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, voidPlatformInvoice, VoidPlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `VoidPlatformInvoice` mutation requires an argument of type `VoidPlatformInvoiceVariables`:
const voidPlatformInvoiceVars: VoidPlatformInvoiceVariables = {
  invoiceId: ..., 
  reason: ..., 
  expectedVersion: ..., 
};

// Call the `voidPlatformInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await voidPlatformInvoice(voidPlatformInvoiceVars);
// Variables can be defined inline as well.
const { data } = await voidPlatformInvoice({ invoiceId: ..., reason: ..., expectedVersion: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await voidPlatformInvoice(dataConnect, voidPlatformInvoiceVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
voidPlatformInvoice(voidPlatformInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `VoidPlatformInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, voidPlatformInvoiceRef, VoidPlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `VoidPlatformInvoice` mutation requires an argument of type `VoidPlatformInvoiceVariables`:
const voidPlatformInvoiceVars: VoidPlatformInvoiceVariables = {
  invoiceId: ..., 
  reason: ..., 
  expectedVersion: ..., 
};

// Call the `voidPlatformInvoiceRef()` function to get a reference to the mutation.
const ref = voidPlatformInvoiceRef(voidPlatformInvoiceVars);
// Variables can be defined inline as well.
const ref = voidPlatformInvoiceRef({ invoiceId: ..., reason: ..., expectedVersion: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = voidPlatformInvoiceRef(dataConnect, voidPlatformInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SettlePlatformInvoice
You can execute the `SettlePlatformInvoice` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
settlePlatformInvoice(vars: SettlePlatformInvoiceVariables): MutationPromise<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;

interface SettlePlatformInvoiceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SettlePlatformInvoiceVariables): MutationRef<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;
}
export const settlePlatformInvoiceRef: SettlePlatformInvoiceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
settlePlatformInvoice(dc: DataConnect, vars: SettlePlatformInvoiceVariables): MutationPromise<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;

interface SettlePlatformInvoiceRef {
  ...
  (dc: DataConnect, vars: SettlePlatformInvoiceVariables): MutationRef<SettlePlatformInvoiceData, SettlePlatformInvoiceVariables>;
}
export const settlePlatformInvoiceRef: SettlePlatformInvoiceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the settlePlatformInvoiceRef:
```typescript
const name = settlePlatformInvoiceRef.operationName;
console.log(name);
```

### Variables
The `SettlePlatformInvoice` mutation requires an argument of type `SettlePlatformInvoiceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SettlePlatformInvoiceVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `SettlePlatformInvoice` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SettlePlatformInvoiceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SettlePlatformInvoiceData {
  _execute?: number | null;
}
```
### Using `SettlePlatformInvoice`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, settlePlatformInvoice, SettlePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `SettlePlatformInvoice` mutation requires an argument of type `SettlePlatformInvoiceVariables`:
const settlePlatformInvoiceVars: SettlePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `settlePlatformInvoice()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await settlePlatformInvoice(settlePlatformInvoiceVars);
// Variables can be defined inline as well.
const { data } = await settlePlatformInvoice({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await settlePlatformInvoice(dataConnect, settlePlatformInvoiceVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
settlePlatformInvoice(settlePlatformInvoiceVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SettlePlatformInvoice`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, settlePlatformInvoiceRef, SettlePlatformInvoiceVariables } from '@insightpad/dataconnect';

// The `SettlePlatformInvoice` mutation requires an argument of type `SettlePlatformInvoiceVariables`:
const settlePlatformInvoiceVars: SettlePlatformInvoiceVariables = {
  payload: ..., 
};

// Call the `settlePlatformInvoiceRef()` function to get a reference to the mutation.
const ref = settlePlatformInvoiceRef(settlePlatformInvoiceVars);
// Variables can be defined inline as well.
const ref = settlePlatformInvoiceRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = settlePlatformInvoiceRef(dataConnect, settlePlatformInvoiceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ReversePlatformPayment
You can execute the `ReversePlatformPayment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
reversePlatformPayment(vars: ReversePlatformPaymentVariables): MutationPromise<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;

interface ReversePlatformPaymentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReversePlatformPaymentVariables): MutationRef<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;
}
export const reversePlatformPaymentRef: ReversePlatformPaymentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
reversePlatformPayment(dc: DataConnect, vars: ReversePlatformPaymentVariables): MutationPromise<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;

interface ReversePlatformPaymentRef {
  ...
  (dc: DataConnect, vars: ReversePlatformPaymentVariables): MutationRef<ReversePlatformPaymentData, ReversePlatformPaymentVariables>;
}
export const reversePlatformPaymentRef: ReversePlatformPaymentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the reversePlatformPaymentRef:
```typescript
const name = reversePlatformPaymentRef.operationName;
console.log(name);
```

### Variables
The `ReversePlatformPayment` mutation requires an argument of type `ReversePlatformPaymentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReversePlatformPaymentVariables {
  paymentId: UUIDString;
  reason: string;
}
```
### Return Type
Recall that executing the `ReversePlatformPayment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReversePlatformPaymentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReversePlatformPaymentData {
  _execute?: number | null;
}
```
### Using `ReversePlatformPayment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, reversePlatformPayment, ReversePlatformPaymentVariables } from '@insightpad/dataconnect';

// The `ReversePlatformPayment` mutation requires an argument of type `ReversePlatformPaymentVariables`:
const reversePlatformPaymentVars: ReversePlatformPaymentVariables = {
  paymentId: ..., 
  reason: ..., 
};

// Call the `reversePlatformPayment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await reversePlatformPayment(reversePlatformPaymentVars);
// Variables can be defined inline as well.
const { data } = await reversePlatformPayment({ paymentId: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await reversePlatformPayment(dataConnect, reversePlatformPaymentVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
reversePlatformPayment(reversePlatformPaymentVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ReversePlatformPayment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, reversePlatformPaymentRef, ReversePlatformPaymentVariables } from '@insightpad/dataconnect';

// The `ReversePlatformPayment` mutation requires an argument of type `ReversePlatformPaymentVariables`:
const reversePlatformPaymentVars: ReversePlatformPaymentVariables = {
  paymentId: ..., 
  reason: ..., 
};

// Call the `reversePlatformPaymentRef()` function to get a reference to the mutation.
const ref = reversePlatformPaymentRef(reversePlatformPaymentVars);
// Variables can be defined inline as well.
const ref = reversePlatformPaymentRef({ paymentId: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = reversePlatformPaymentRef(dataConnect, reversePlatformPaymentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## PostStockAdjustment
You can execute the `PostStockAdjustment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
postStockAdjustment(vars: PostStockAdjustmentVariables): MutationPromise<PostStockAdjustmentData, PostStockAdjustmentVariables>;

interface PostStockAdjustmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostStockAdjustmentVariables): MutationRef<PostStockAdjustmentData, PostStockAdjustmentVariables>;
}
export const postStockAdjustmentRef: PostStockAdjustmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
postStockAdjustment(dc: DataConnect, vars: PostStockAdjustmentVariables): MutationPromise<PostStockAdjustmentData, PostStockAdjustmentVariables>;

interface PostStockAdjustmentRef {
  ...
  (dc: DataConnect, vars: PostStockAdjustmentVariables): MutationRef<PostStockAdjustmentData, PostStockAdjustmentVariables>;
}
export const postStockAdjustmentRef: PostStockAdjustmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the postStockAdjustmentRef:
```typescript
const name = postStockAdjustmentRef.operationName;
console.log(name);
```

### Variables
The `PostStockAdjustment` mutation requires an argument of type `PostStockAdjustmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PostStockAdjustmentVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `PostStockAdjustment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PostStockAdjustmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PostStockAdjustmentData {
  _execute?: number | null;
}
```
### Using `PostStockAdjustment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, postStockAdjustment, PostStockAdjustmentVariables } from '@insightpad/dataconnect';

// The `PostStockAdjustment` mutation requires an argument of type `PostStockAdjustmentVariables`:
const postStockAdjustmentVars: PostStockAdjustmentVariables = {
  payload: ..., 
};

// Call the `postStockAdjustment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await postStockAdjustment(postStockAdjustmentVars);
// Variables can be defined inline as well.
const { data } = await postStockAdjustment({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await postStockAdjustment(dataConnect, postStockAdjustmentVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
postStockAdjustment(postStockAdjustmentVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `PostStockAdjustment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, postStockAdjustmentRef, PostStockAdjustmentVariables } from '@insightpad/dataconnect';

// The `PostStockAdjustment` mutation requires an argument of type `PostStockAdjustmentVariables`:
const postStockAdjustmentVars: PostStockAdjustmentVariables = {
  payload: ..., 
};

// Call the `postStockAdjustmentRef()` function to get a reference to the mutation.
const ref = postStockAdjustmentRef(postStockAdjustmentVars);
// Variables can be defined inline as well.
const ref = postStockAdjustmentRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = postStockAdjustmentRef(dataConnect, postStockAdjustmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## PostStockTransfer
You can execute the `PostStockTransfer` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
postStockTransfer(vars: PostStockTransferVariables): MutationPromise<PostStockTransferData, PostStockTransferVariables>;

interface PostStockTransferRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: PostStockTransferVariables): MutationRef<PostStockTransferData, PostStockTransferVariables>;
}
export const postStockTransferRef: PostStockTransferRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
postStockTransfer(dc: DataConnect, vars: PostStockTransferVariables): MutationPromise<PostStockTransferData, PostStockTransferVariables>;

interface PostStockTransferRef {
  ...
  (dc: DataConnect, vars: PostStockTransferVariables): MutationRef<PostStockTransferData, PostStockTransferVariables>;
}
export const postStockTransferRef: PostStockTransferRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the postStockTransferRef:
```typescript
const name = postStockTransferRef.operationName;
console.log(name);
```

### Variables
The `PostStockTransfer` mutation requires an argument of type `PostStockTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface PostStockTransferVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `PostStockTransfer` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `PostStockTransferData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface PostStockTransferData {
  _execute?: number | null;
}
```
### Using `PostStockTransfer`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, postStockTransfer, PostStockTransferVariables } from '@insightpad/dataconnect';

// The `PostStockTransfer` mutation requires an argument of type `PostStockTransferVariables`:
const postStockTransferVars: PostStockTransferVariables = {
  payload: ..., 
};

// Call the `postStockTransfer()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await postStockTransfer(postStockTransferVars);
// Variables can be defined inline as well.
const { data } = await postStockTransfer({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await postStockTransfer(dataConnect, postStockTransferVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
postStockTransfer(postStockTransferVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `PostStockTransfer`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, postStockTransferRef, PostStockTransferVariables } from '@insightpad/dataconnect';

// The `PostStockTransfer` mutation requires an argument of type `PostStockTransferVariables`:
const postStockTransferVars: PostStockTransferVariables = {
  payload: ..., 
};

// Call the `postStockTransferRef()` function to get a reference to the mutation.
const ref = postStockTransferRef(postStockTransferVars);
// Variables can be defined inline as well.
const ref = postStockTransferRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = postStockTransferRef(dataConnect, postStockTransferVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## SaveStockBatch
You can execute the `SaveStockBatch` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
saveStockBatch(vars: SaveStockBatchVariables): MutationPromise<SaveStockBatchData, SaveStockBatchVariables>;

interface SaveStockBatchRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SaveStockBatchVariables): MutationRef<SaveStockBatchData, SaveStockBatchVariables>;
}
export const saveStockBatchRef: SaveStockBatchRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
saveStockBatch(dc: DataConnect, vars: SaveStockBatchVariables): MutationPromise<SaveStockBatchData, SaveStockBatchVariables>;

interface SaveStockBatchRef {
  ...
  (dc: DataConnect, vars: SaveStockBatchVariables): MutationRef<SaveStockBatchData, SaveStockBatchVariables>;
}
export const saveStockBatchRef: SaveStockBatchRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the saveStockBatchRef:
```typescript
const name = saveStockBatchRef.operationName;
console.log(name);
```

### Variables
The `SaveStockBatch` mutation requires an argument of type `SaveStockBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SaveStockBatchVariables {
  payload: unknown;
}
```
### Return Type
Recall that executing the `SaveStockBatch` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SaveStockBatchData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SaveStockBatchData {
  _execute?: number | null;
}
```
### Using `SaveStockBatch`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, saveStockBatch, SaveStockBatchVariables } from '@insightpad/dataconnect';

// The `SaveStockBatch` mutation requires an argument of type `SaveStockBatchVariables`:
const saveStockBatchVars: SaveStockBatchVariables = {
  payload: ..., 
};

// Call the `saveStockBatch()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveStockBatch(saveStockBatchVars);
// Variables can be defined inline as well.
const { data } = await saveStockBatch({ payload: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await saveStockBatch(dataConnect, saveStockBatchVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
saveStockBatch(saveStockBatchVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `SaveStockBatch`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, saveStockBatchRef, SaveStockBatchVariables } from '@insightpad/dataconnect';

// The `SaveStockBatch` mutation requires an argument of type `SaveStockBatchVariables`:
const saveStockBatchVars: SaveStockBatchVariables = {
  payload: ..., 
};

// Call the `saveStockBatchRef()` function to get a reference to the mutation.
const ref = saveStockBatchRef(saveStockBatchVars);
// Variables can be defined inline as well.
const ref = saveStockBatchRef({ payload: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = saveStockBatchRef(dataConnect, saveStockBatchVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ReverseStockOperation
You can execute the `ReverseStockOperation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
reverseStockOperation(vars: ReverseStockOperationVariables): MutationPromise<ReverseStockOperationData, ReverseStockOperationVariables>;

interface ReverseStockOperationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReverseStockOperationVariables): MutationRef<ReverseStockOperationData, ReverseStockOperationVariables>;
}
export const reverseStockOperationRef: ReverseStockOperationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
reverseStockOperation(dc: DataConnect, vars: ReverseStockOperationVariables): MutationPromise<ReverseStockOperationData, ReverseStockOperationVariables>;

interface ReverseStockOperationRef {
  ...
  (dc: DataConnect, vars: ReverseStockOperationVariables): MutationRef<ReverseStockOperationData, ReverseStockOperationVariables>;
}
export const reverseStockOperationRef: ReverseStockOperationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the reverseStockOperationRef:
```typescript
const name = reverseStockOperationRef.operationName;
console.log(name);
```

### Variables
The `ReverseStockOperation` mutation requires an argument of type `ReverseStockOperationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReverseStockOperationVariables {
  operationId: string;
  movementIds: unknown;
  reason: string;
}
```
### Return Type
Recall that executing the `ReverseStockOperation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReverseStockOperationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReverseStockOperationData {
  _execute?: number | null;
}
```
### Using `ReverseStockOperation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, reverseStockOperation, ReverseStockOperationVariables } from '@insightpad/dataconnect';

// The `ReverseStockOperation` mutation requires an argument of type `ReverseStockOperationVariables`:
const reverseStockOperationVars: ReverseStockOperationVariables = {
  operationId: ..., 
  movementIds: ..., 
  reason: ..., 
};

// Call the `reverseStockOperation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await reverseStockOperation(reverseStockOperationVars);
// Variables can be defined inline as well.
const { data } = await reverseStockOperation({ operationId: ..., movementIds: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await reverseStockOperation(dataConnect, reverseStockOperationVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
reverseStockOperation(reverseStockOperationVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ReverseStockOperation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, reverseStockOperationRef, ReverseStockOperationVariables } from '@insightpad/dataconnect';

// The `ReverseStockOperation` mutation requires an argument of type `ReverseStockOperationVariables`:
const reverseStockOperationVars: ReverseStockOperationVariables = {
  operationId: ..., 
  movementIds: ..., 
  reason: ..., 
};

// Call the `reverseStockOperationRef()` function to get a reference to the mutation.
const ref = reverseStockOperationRef(reverseStockOperationVars);
// Variables can be defined inline as well.
const ref = reverseStockOperationRef({ operationId: ..., movementIds: ..., reason: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = reverseStockOperationRef(dataConnect, reverseStockOperationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## OpenCashSession
You can execute the `OpenCashSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
openCashSession(vars: OpenCashSessionVariables): MutationPromise<OpenCashSessionData, OpenCashSessionVariables>;

interface OpenCashSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: OpenCashSessionVariables): MutationRef<OpenCashSessionData, OpenCashSessionVariables>;
}
export const openCashSessionRef: OpenCashSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
openCashSession(dc: DataConnect, vars: OpenCashSessionVariables): MutationPromise<OpenCashSessionData, OpenCashSessionVariables>;

interface OpenCashSessionRef {
  ...
  (dc: DataConnect, vars: OpenCashSessionVariables): MutationRef<OpenCashSessionData, OpenCashSessionVariables>;
}
export const openCashSessionRef: OpenCashSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the openCashSessionRef:
```typescript
const name = openCashSessionRef.operationName;
console.log(name);
```

### Variables
The `OpenCashSession` mutation requires an argument of type `OpenCashSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface OpenCashSessionVariables {
  branchId: UUIDString;
  openingAmountCents: Int64String;
  notes: string;
}
```
### Return Type
Recall that executing the `OpenCashSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `OpenCashSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface OpenCashSessionData {
  _execute?: number | null;
}
```
### Using `OpenCashSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, openCashSession, OpenCashSessionVariables } from '@insightpad/dataconnect';

// The `OpenCashSession` mutation requires an argument of type `OpenCashSessionVariables`:
const openCashSessionVars: OpenCashSessionVariables = {
  branchId: ..., 
  openingAmountCents: ..., 
  notes: ..., 
};

// Call the `openCashSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await openCashSession(openCashSessionVars);
// Variables can be defined inline as well.
const { data } = await openCashSession({ branchId: ..., openingAmountCents: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await openCashSession(dataConnect, openCashSessionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
openCashSession(openCashSessionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `OpenCashSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, openCashSessionRef, OpenCashSessionVariables } from '@insightpad/dataconnect';

// The `OpenCashSession` mutation requires an argument of type `OpenCashSessionVariables`:
const openCashSessionVars: OpenCashSessionVariables = {
  branchId: ..., 
  openingAmountCents: ..., 
  notes: ..., 
};

// Call the `openCashSessionRef()` function to get a reference to the mutation.
const ref = openCashSessionRef(openCashSessionVars);
// Variables can be defined inline as well.
const ref = openCashSessionRef({ branchId: ..., openingAmountCents: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = openCashSessionRef(dataConnect, openCashSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## RegisterCashMovement
You can execute the `RegisterCashMovement` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
registerCashMovement(vars: RegisterCashMovementVariables): MutationPromise<RegisterCashMovementData, RegisterCashMovementVariables>;

interface RegisterCashMovementRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegisterCashMovementVariables): MutationRef<RegisterCashMovementData, RegisterCashMovementVariables>;
}
export const registerCashMovementRef: RegisterCashMovementRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
registerCashMovement(dc: DataConnect, vars: RegisterCashMovementVariables): MutationPromise<RegisterCashMovementData, RegisterCashMovementVariables>;

interface RegisterCashMovementRef {
  ...
  (dc: DataConnect, vars: RegisterCashMovementVariables): MutationRef<RegisterCashMovementData, RegisterCashMovementVariables>;
}
export const registerCashMovementRef: RegisterCashMovementRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registerCashMovementRef:
```typescript
const name = registerCashMovementRef.operationName;
console.log(name);
```

### Variables
The `RegisterCashMovement` mutation requires an argument of type `RegisterCashMovementVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegisterCashMovementVariables {
  sessionId: UUIDString;
  movementType: string;
  amountCents: Int64String;
  description: string;
}
```
### Return Type
Recall that executing the `RegisterCashMovement` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegisterCashMovementData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegisterCashMovementData {
  _execute?: number | null;
}
```
### Using `RegisterCashMovement`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, registerCashMovement, RegisterCashMovementVariables } from '@insightpad/dataconnect';

// The `RegisterCashMovement` mutation requires an argument of type `RegisterCashMovementVariables`:
const registerCashMovementVars: RegisterCashMovementVariables = {
  sessionId: ..., 
  movementType: ..., 
  amountCents: ..., 
  description: ..., 
};

// Call the `registerCashMovement()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registerCashMovement(registerCashMovementVars);
// Variables can be defined inline as well.
const { data } = await registerCashMovement({ sessionId: ..., movementType: ..., amountCents: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registerCashMovement(dataConnect, registerCashMovementVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
registerCashMovement(registerCashMovementVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `RegisterCashMovement`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, registerCashMovementRef, RegisterCashMovementVariables } from '@insightpad/dataconnect';

// The `RegisterCashMovement` mutation requires an argument of type `RegisterCashMovementVariables`:
const registerCashMovementVars: RegisterCashMovementVariables = {
  sessionId: ..., 
  movementType: ..., 
  amountCents: ..., 
  description: ..., 
};

// Call the `registerCashMovementRef()` function to get a reference to the mutation.
const ref = registerCashMovementRef(registerCashMovementVars);
// Variables can be defined inline as well.
const ref = registerCashMovementRef({ sessionId: ..., movementType: ..., amountCents: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registerCashMovementRef(dataConnect, registerCashMovementVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ClaimDeviceSession
You can execute the `ClaimDeviceSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
claimDeviceSession(vars: ClaimDeviceSessionVariables): MutationPromise<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;

interface ClaimDeviceSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ClaimDeviceSessionVariables): MutationRef<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
}
export const claimDeviceSessionRef: ClaimDeviceSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
claimDeviceSession(dc: DataConnect, vars: ClaimDeviceSessionVariables): MutationPromise<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;

interface ClaimDeviceSessionRef {
  ...
  (dc: DataConnect, vars: ClaimDeviceSessionVariables): MutationRef<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
}
export const claimDeviceSessionRef: ClaimDeviceSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the claimDeviceSessionRef:
```typescript
const name = claimDeviceSessionRef.operationName;
console.log(name);
```

### Variables
The `ClaimDeviceSession` mutation requires an argument of type `ClaimDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ClaimDeviceSessionVariables {
  sessionToken: string;
  deviceId: string;
  deviceName: string;
}
```
### Return Type
Recall that executing the `ClaimDeviceSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClaimDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClaimDeviceSessionData {
  _execute?: number | null;
}
```
### Using `ClaimDeviceSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, claimDeviceSession, ClaimDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ClaimDeviceSession` mutation requires an argument of type `ClaimDeviceSessionVariables`:
const claimDeviceSessionVars: ClaimDeviceSessionVariables = {
  sessionToken: ..., 
  deviceId: ..., 
  deviceName: ..., 
};

// Call the `claimDeviceSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await claimDeviceSession(claimDeviceSessionVars);
// Variables can be defined inline as well.
const { data } = await claimDeviceSession({ sessionToken: ..., deviceId: ..., deviceName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await claimDeviceSession(dataConnect, claimDeviceSessionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
claimDeviceSession(claimDeviceSessionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ClaimDeviceSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, claimDeviceSessionRef, ClaimDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ClaimDeviceSession` mutation requires an argument of type `ClaimDeviceSessionVariables`:
const claimDeviceSessionVars: ClaimDeviceSessionVariables = {
  sessionToken: ..., 
  deviceId: ..., 
  deviceName: ..., 
};

// Call the `claimDeviceSessionRef()` function to get a reference to the mutation.
const ref = claimDeviceSessionRef(claimDeviceSessionVars);
// Variables can be defined inline as well.
const ref = claimDeviceSessionRef({ sessionToken: ..., deviceId: ..., deviceName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = claimDeviceSessionRef(dataConnect, claimDeviceSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## TouchDeviceSession
You can execute the `TouchDeviceSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
touchDeviceSession(vars: TouchDeviceSessionVariables): MutationPromise<TouchDeviceSessionData, TouchDeviceSessionVariables>;

interface TouchDeviceSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TouchDeviceSessionVariables): MutationRef<TouchDeviceSessionData, TouchDeviceSessionVariables>;
}
export const touchDeviceSessionRef: TouchDeviceSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
touchDeviceSession(dc: DataConnect, vars: TouchDeviceSessionVariables): MutationPromise<TouchDeviceSessionData, TouchDeviceSessionVariables>;

interface TouchDeviceSessionRef {
  ...
  (dc: DataConnect, vars: TouchDeviceSessionVariables): MutationRef<TouchDeviceSessionData, TouchDeviceSessionVariables>;
}
export const touchDeviceSessionRef: TouchDeviceSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the touchDeviceSessionRef:
```typescript
const name = touchDeviceSessionRef.operationName;
console.log(name);
```

### Variables
The `TouchDeviceSession` mutation requires an argument of type `TouchDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TouchDeviceSessionVariables {
  sessionToken: string;
}
```
### Return Type
Recall that executing the `TouchDeviceSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TouchDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TouchDeviceSessionData {
  _execute?: number | null;
}
```
### Using `TouchDeviceSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, touchDeviceSession, TouchDeviceSessionVariables } from '@insightpad/dataconnect';

// The `TouchDeviceSession` mutation requires an argument of type `TouchDeviceSessionVariables`:
const touchDeviceSessionVars: TouchDeviceSessionVariables = {
  sessionToken: ..., 
};

// Call the `touchDeviceSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await touchDeviceSession(touchDeviceSessionVars);
// Variables can be defined inline as well.
const { data } = await touchDeviceSession({ sessionToken: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await touchDeviceSession(dataConnect, touchDeviceSessionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
touchDeviceSession(touchDeviceSessionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `TouchDeviceSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, touchDeviceSessionRef, TouchDeviceSessionVariables } from '@insightpad/dataconnect';

// The `TouchDeviceSession` mutation requires an argument of type `TouchDeviceSessionVariables`:
const touchDeviceSessionVars: TouchDeviceSessionVariables = {
  sessionToken: ..., 
};

// Call the `touchDeviceSessionRef()` function to get a reference to the mutation.
const ref = touchDeviceSessionRef(touchDeviceSessionVars);
// Variables can be defined inline as well.
const ref = touchDeviceSessionRef({ sessionToken: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = touchDeviceSessionRef(dataConnect, touchDeviceSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ReleaseDeviceSession
You can execute the `ReleaseDeviceSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
releaseDeviceSession(vars: ReleaseDeviceSessionVariables): MutationPromise<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;

interface ReleaseDeviceSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ReleaseDeviceSessionVariables): MutationRef<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
}
export const releaseDeviceSessionRef: ReleaseDeviceSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
releaseDeviceSession(dc: DataConnect, vars: ReleaseDeviceSessionVariables): MutationPromise<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;

interface ReleaseDeviceSessionRef {
  ...
  (dc: DataConnect, vars: ReleaseDeviceSessionVariables): MutationRef<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
}
export const releaseDeviceSessionRef: ReleaseDeviceSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the releaseDeviceSessionRef:
```typescript
const name = releaseDeviceSessionRef.operationName;
console.log(name);
```

### Variables
The `ReleaseDeviceSession` mutation requires an argument of type `ReleaseDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ReleaseDeviceSessionVariables {
  sessionToken: string;
}
```
### Return Type
Recall that executing the `ReleaseDeviceSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ReleaseDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ReleaseDeviceSessionData {
  _execute?: number | null;
}
```
### Using `ReleaseDeviceSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, releaseDeviceSession, ReleaseDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ReleaseDeviceSession` mutation requires an argument of type `ReleaseDeviceSessionVariables`:
const releaseDeviceSessionVars: ReleaseDeviceSessionVariables = {
  sessionToken: ..., 
};

// Call the `releaseDeviceSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await releaseDeviceSession(releaseDeviceSessionVars);
// Variables can be defined inline as well.
const { data } = await releaseDeviceSession({ sessionToken: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await releaseDeviceSession(dataConnect, releaseDeviceSessionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
releaseDeviceSession(releaseDeviceSessionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ReleaseDeviceSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, releaseDeviceSessionRef, ReleaseDeviceSessionVariables } from '@insightpad/dataconnect';

// The `ReleaseDeviceSession` mutation requires an argument of type `ReleaseDeviceSessionVariables`:
const releaseDeviceSessionVars: ReleaseDeviceSessionVariables = {
  sessionToken: ..., 
};

// Call the `releaseDeviceSessionRef()` function to get a reference to the mutation.
const ref = releaseDeviceSessionRef(releaseDeviceSessionVars);
// Variables can be defined inline as well.
const ref = releaseDeviceSessionRef({ sessionToken: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = releaseDeviceSessionRef(dataConnect, releaseDeviceSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreateSalesChannelConnection
You can execute the `CreateSalesChannelConnection` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSalesChannelConnection(vars: CreateSalesChannelConnectionVariables): MutationPromise<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;

interface CreateSalesChannelConnectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSalesChannelConnectionVariables): MutationRef<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
}
export const createSalesChannelConnectionRef: CreateSalesChannelConnectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSalesChannelConnection(dc: DataConnect, vars: CreateSalesChannelConnectionVariables): MutationPromise<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;

interface CreateSalesChannelConnectionRef {
  ...
  (dc: DataConnect, vars: CreateSalesChannelConnectionVariables): MutationRef<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
}
export const createSalesChannelConnectionRef: CreateSalesChannelConnectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSalesChannelConnectionRef:
```typescript
const name = createSalesChannelConnectionRef.operationName;
console.log(name);
```

### Variables
The `CreateSalesChannelConnection` mutation requires an argument of type `CreateSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSalesChannelConnectionVariables {
  provider: string;
  branchId: UUIDString;
  displayName: string;
  externalStoreId: string;
}
```
### Return Type
Recall that executing the `CreateSalesChannelConnection` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSalesChannelConnectionData {
  _execute?: number | null;
}
```
### Using `CreateSalesChannelConnection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSalesChannelConnection, CreateSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `CreateSalesChannelConnection` mutation requires an argument of type `CreateSalesChannelConnectionVariables`:
const createSalesChannelConnectionVars: CreateSalesChannelConnectionVariables = {
  provider: ..., 
  branchId: ..., 
  displayName: ..., 
  externalStoreId: ..., 
};

// Call the `createSalesChannelConnection()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSalesChannelConnection(createSalesChannelConnectionVars);
// Variables can be defined inline as well.
const { data } = await createSalesChannelConnection({ provider: ..., branchId: ..., displayName: ..., externalStoreId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSalesChannelConnection(dataConnect, createSalesChannelConnectionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createSalesChannelConnection(createSalesChannelConnectionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateSalesChannelConnection`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSalesChannelConnectionRef, CreateSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `CreateSalesChannelConnection` mutation requires an argument of type `CreateSalesChannelConnectionVariables`:
const createSalesChannelConnectionVars: CreateSalesChannelConnectionVariables = {
  provider: ..., 
  branchId: ..., 
  displayName: ..., 
  externalStoreId: ..., 
};

// Call the `createSalesChannelConnectionRef()` function to get a reference to the mutation.
const ref = createSalesChannelConnectionRef(createSalesChannelConnectionVars);
// Variables can be defined inline as well.
const ref = createSalesChannelConnectionRef({ provider: ..., branchId: ..., displayName: ..., externalStoreId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSalesChannelConnectionRef(dataConnect, createSalesChannelConnectionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdateSalesChannelConnection
You can execute the `UpdateSalesChannelConnection` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSalesChannelConnection(vars: UpdateSalesChannelConnectionVariables): MutationPromise<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;

interface UpdateSalesChannelConnectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSalesChannelConnectionVariables): MutationRef<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
}
export const updateSalesChannelConnectionRef: UpdateSalesChannelConnectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSalesChannelConnection(dc: DataConnect, vars: UpdateSalesChannelConnectionVariables): MutationPromise<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;

interface UpdateSalesChannelConnectionRef {
  ...
  (dc: DataConnect, vars: UpdateSalesChannelConnectionVariables): MutationRef<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
}
export const updateSalesChannelConnectionRef: UpdateSalesChannelConnectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSalesChannelConnectionRef:
```typescript
const name = updateSalesChannelConnectionRef.operationName;
console.log(name);
```

### Variables
The `UpdateSalesChannelConnection` mutation requires an argument of type `UpdateSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSalesChannelConnectionVariables {
  id: UUIDString;
  displayName: string;
  externalStoreId: string;
  enabled: boolean;
}
```
### Return Type
Recall that executing the `UpdateSalesChannelConnection` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSalesChannelConnectionData {
  _execute?: number | null;
}
```
### Using `UpdateSalesChannelConnection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSalesChannelConnection, UpdateSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `UpdateSalesChannelConnection` mutation requires an argument of type `UpdateSalesChannelConnectionVariables`:
const updateSalesChannelConnectionVars: UpdateSalesChannelConnectionVariables = {
  id: ..., 
  displayName: ..., 
  externalStoreId: ..., 
  enabled: ..., 
};

// Call the `updateSalesChannelConnection()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSalesChannelConnection(updateSalesChannelConnectionVars);
// Variables can be defined inline as well.
const { data } = await updateSalesChannelConnection({ id: ..., displayName: ..., externalStoreId: ..., enabled: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSalesChannelConnection(dataConnect, updateSalesChannelConnectionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updateSalesChannelConnection(updateSalesChannelConnectionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdateSalesChannelConnection`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSalesChannelConnectionRef, UpdateSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `UpdateSalesChannelConnection` mutation requires an argument of type `UpdateSalesChannelConnectionVariables`:
const updateSalesChannelConnectionVars: UpdateSalesChannelConnectionVariables = {
  id: ..., 
  displayName: ..., 
  externalStoreId: ..., 
  enabled: ..., 
};

// Call the `updateSalesChannelConnectionRef()` function to get a reference to the mutation.
const ref = updateSalesChannelConnectionRef(updateSalesChannelConnectionVars);
// Variables can be defined inline as well.
const ref = updateSalesChannelConnectionRef({ id: ..., displayName: ..., externalStoreId: ..., enabled: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSalesChannelConnectionRef(dataConnect, updateSalesChannelConnectionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ArchiveSalesChannelConnection
You can execute the `ArchiveSalesChannelConnection` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
archiveSalesChannelConnection(vars: ArchiveSalesChannelConnectionVariables): MutationPromise<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;

interface ArchiveSalesChannelConnectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSalesChannelConnectionVariables): MutationRef<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
}
export const archiveSalesChannelConnectionRef: ArchiveSalesChannelConnectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
archiveSalesChannelConnection(dc: DataConnect, vars: ArchiveSalesChannelConnectionVariables): MutationPromise<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;

interface ArchiveSalesChannelConnectionRef {
  ...
  (dc: DataConnect, vars: ArchiveSalesChannelConnectionVariables): MutationRef<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
}
export const archiveSalesChannelConnectionRef: ArchiveSalesChannelConnectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the archiveSalesChannelConnectionRef:
```typescript
const name = archiveSalesChannelConnectionRef.operationName;
console.log(name);
```

### Variables
The `ArchiveSalesChannelConnection` mutation requires an argument of type `ArchiveSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ArchiveSalesChannelConnectionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `ArchiveSalesChannelConnection` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ArchiveSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ArchiveSalesChannelConnectionData {
  _execute?: number | null;
}
```
### Using `ArchiveSalesChannelConnection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, archiveSalesChannelConnection, ArchiveSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `ArchiveSalesChannelConnection` mutation requires an argument of type `ArchiveSalesChannelConnectionVariables`:
const archiveSalesChannelConnectionVars: ArchiveSalesChannelConnectionVariables = {
  id: ..., 
};

// Call the `archiveSalesChannelConnection()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await archiveSalesChannelConnection(archiveSalesChannelConnectionVars);
// Variables can be defined inline as well.
const { data } = await archiveSalesChannelConnection({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await archiveSalesChannelConnection(dataConnect, archiveSalesChannelConnectionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
archiveSalesChannelConnection(archiveSalesChannelConnectionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ArchiveSalesChannelConnection`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, archiveSalesChannelConnectionRef, ArchiveSalesChannelConnectionVariables } from '@insightpad/dataconnect';

// The `ArchiveSalesChannelConnection` mutation requires an argument of type `ArchiveSalesChannelConnectionVariables`:
const archiveSalesChannelConnectionVars: ArchiveSalesChannelConnectionVariables = {
  id: ..., 
};

// Call the `archiveSalesChannelConnectionRef()` function to get a reference to the mutation.
const ref = archiveSalesChannelConnectionRef(archiveSalesChannelConnectionVars);
// Variables can be defined inline as well.
const ref = archiveSalesChannelConnectionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = archiveSalesChannelConnectionRef(dataConnect, archiveSalesChannelConnectionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CreateSalesChannelProductMapping
You can execute the `CreateSalesChannelProductMapping` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSalesChannelProductMapping(vars: CreateSalesChannelProductMappingVariables): MutationPromise<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;

interface CreateSalesChannelProductMappingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSalesChannelProductMappingVariables): MutationRef<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;
}
export const createSalesChannelProductMappingRef: CreateSalesChannelProductMappingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSalesChannelProductMapping(dc: DataConnect, vars: CreateSalesChannelProductMappingVariables): MutationPromise<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;

interface CreateSalesChannelProductMappingRef {
  ...
  (dc: DataConnect, vars: CreateSalesChannelProductMappingVariables): MutationRef<CreateSalesChannelProductMappingData, CreateSalesChannelProductMappingVariables>;
}
export const createSalesChannelProductMappingRef: CreateSalesChannelProductMappingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSalesChannelProductMappingRef:
```typescript
const name = createSalesChannelProductMappingRef.operationName;
console.log(name);
```

### Variables
The `CreateSalesChannelProductMapping` mutation requires an argument of type `CreateSalesChannelProductMappingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSalesChannelProductMappingVariables {
  connectionId: UUIDString;
  productId: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
}
```
### Return Type
Recall that executing the `CreateSalesChannelProductMapping` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSalesChannelProductMappingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSalesChannelProductMappingData {
  _execute?: number | null;
}
```
### Using `CreateSalesChannelProductMapping`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSalesChannelProductMapping, CreateSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `CreateSalesChannelProductMapping` mutation requires an argument of type `CreateSalesChannelProductMappingVariables`:
const createSalesChannelProductMappingVars: CreateSalesChannelProductMappingVariables = {
  connectionId: ..., 
  productId: ..., 
  externalProductId: ..., 
  externalProductName: ..., 
  syncPrice: ..., 
  syncStock: ..., 
};

// Call the `createSalesChannelProductMapping()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSalesChannelProductMapping(createSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const { data } = await createSalesChannelProductMapping({ connectionId: ..., productId: ..., externalProductId: ..., externalProductName: ..., syncPrice: ..., syncStock: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSalesChannelProductMapping(dataConnect, createSalesChannelProductMappingVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
createSalesChannelProductMapping(createSalesChannelProductMappingVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CreateSalesChannelProductMapping`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSalesChannelProductMappingRef, CreateSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `CreateSalesChannelProductMapping` mutation requires an argument of type `CreateSalesChannelProductMappingVariables`:
const createSalesChannelProductMappingVars: CreateSalesChannelProductMappingVariables = {
  connectionId: ..., 
  productId: ..., 
  externalProductId: ..., 
  externalProductName: ..., 
  syncPrice: ..., 
  syncStock: ..., 
};

// Call the `createSalesChannelProductMappingRef()` function to get a reference to the mutation.
const ref = createSalesChannelProductMappingRef(createSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const ref = createSalesChannelProductMappingRef({ connectionId: ..., productId: ..., externalProductId: ..., externalProductName: ..., syncPrice: ..., syncStock: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSalesChannelProductMappingRef(dataConnect, createSalesChannelProductMappingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## UpdateSalesChannelProductMapping
You can execute the `UpdateSalesChannelProductMapping` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSalesChannelProductMapping(vars: UpdateSalesChannelProductMappingVariables): MutationPromise<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;

interface UpdateSalesChannelProductMappingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSalesChannelProductMappingVariables): MutationRef<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;
}
export const updateSalesChannelProductMappingRef: UpdateSalesChannelProductMappingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSalesChannelProductMapping(dc: DataConnect, vars: UpdateSalesChannelProductMappingVariables): MutationPromise<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;

interface UpdateSalesChannelProductMappingRef {
  ...
  (dc: DataConnect, vars: UpdateSalesChannelProductMappingVariables): MutationRef<UpdateSalesChannelProductMappingData, UpdateSalesChannelProductMappingVariables>;
}
export const updateSalesChannelProductMappingRef: UpdateSalesChannelProductMappingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSalesChannelProductMappingRef:
```typescript
const name = updateSalesChannelProductMappingRef.operationName;
console.log(name);
```

### Variables
The `UpdateSalesChannelProductMapping` mutation requires an argument of type `UpdateSalesChannelProductMappingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSalesChannelProductMappingVariables {
  id: UUIDString;
  externalProductId: string;
  externalProductName: string;
  syncPrice: boolean;
  syncStock: boolean;
  enabled: boolean;
}
```
### Return Type
Recall that executing the `UpdateSalesChannelProductMapping` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSalesChannelProductMappingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSalesChannelProductMappingData {
  _execute?: number | null;
}
```
### Using `UpdateSalesChannelProductMapping`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSalesChannelProductMapping, UpdateSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `UpdateSalesChannelProductMapping` mutation requires an argument of type `UpdateSalesChannelProductMappingVariables`:
const updateSalesChannelProductMappingVars: UpdateSalesChannelProductMappingVariables = {
  id: ..., 
  externalProductId: ..., 
  externalProductName: ..., 
  syncPrice: ..., 
  syncStock: ..., 
  enabled: ..., 
};

// Call the `updateSalesChannelProductMapping()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSalesChannelProductMapping(updateSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const { data } = await updateSalesChannelProductMapping({ id: ..., externalProductId: ..., externalProductName: ..., syncPrice: ..., syncStock: ..., enabled: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSalesChannelProductMapping(dataConnect, updateSalesChannelProductMappingVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
updateSalesChannelProductMapping(updateSalesChannelProductMappingVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `UpdateSalesChannelProductMapping`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSalesChannelProductMappingRef, UpdateSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `UpdateSalesChannelProductMapping` mutation requires an argument of type `UpdateSalesChannelProductMappingVariables`:
const updateSalesChannelProductMappingVars: UpdateSalesChannelProductMappingVariables = {
  id: ..., 
  externalProductId: ..., 
  externalProductName: ..., 
  syncPrice: ..., 
  syncStock: ..., 
  enabled: ..., 
};

// Call the `updateSalesChannelProductMappingRef()` function to get a reference to the mutation.
const ref = updateSalesChannelProductMappingRef(updateSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const ref = updateSalesChannelProductMappingRef({ id: ..., externalProductId: ..., externalProductName: ..., syncPrice: ..., syncStock: ..., enabled: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSalesChannelProductMappingRef(dataConnect, updateSalesChannelProductMappingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## ArchiveSalesChannelProductMapping
You can execute the `ArchiveSalesChannelProductMapping` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
archiveSalesChannelProductMapping(vars: ArchiveSalesChannelProductMappingVariables): MutationPromise<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;

interface ArchiveSalesChannelProductMappingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ArchiveSalesChannelProductMappingVariables): MutationRef<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;
}
export const archiveSalesChannelProductMappingRef: ArchiveSalesChannelProductMappingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
archiveSalesChannelProductMapping(dc: DataConnect, vars: ArchiveSalesChannelProductMappingVariables): MutationPromise<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;

interface ArchiveSalesChannelProductMappingRef {
  ...
  (dc: DataConnect, vars: ArchiveSalesChannelProductMappingVariables): MutationRef<ArchiveSalesChannelProductMappingData, ArchiveSalesChannelProductMappingVariables>;
}
export const archiveSalesChannelProductMappingRef: ArchiveSalesChannelProductMappingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the archiveSalesChannelProductMappingRef:
```typescript
const name = archiveSalesChannelProductMappingRef.operationName;
console.log(name);
```

### Variables
The `ArchiveSalesChannelProductMapping` mutation requires an argument of type `ArchiveSalesChannelProductMappingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ArchiveSalesChannelProductMappingVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `ArchiveSalesChannelProductMapping` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ArchiveSalesChannelProductMappingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ArchiveSalesChannelProductMappingData {
  _execute?: number | null;
}
```
### Using `ArchiveSalesChannelProductMapping`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, archiveSalesChannelProductMapping, ArchiveSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `ArchiveSalesChannelProductMapping` mutation requires an argument of type `ArchiveSalesChannelProductMappingVariables`:
const archiveSalesChannelProductMappingVars: ArchiveSalesChannelProductMappingVariables = {
  id: ..., 
};

// Call the `archiveSalesChannelProductMapping()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await archiveSalesChannelProductMapping(archiveSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const { data } = await archiveSalesChannelProductMapping({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await archiveSalesChannelProductMapping(dataConnect, archiveSalesChannelProductMappingVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
archiveSalesChannelProductMapping(archiveSalesChannelProductMappingVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `ArchiveSalesChannelProductMapping`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, archiveSalesChannelProductMappingRef, ArchiveSalesChannelProductMappingVariables } from '@insightpad/dataconnect';

// The `ArchiveSalesChannelProductMapping` mutation requires an argument of type `ArchiveSalesChannelProductMappingVariables`:
const archiveSalesChannelProductMappingVars: ArchiveSalesChannelProductMappingVariables = {
  id: ..., 
};

// Call the `archiveSalesChannelProductMappingRef()` function to get a reference to the mutation.
const ref = archiveSalesChannelProductMappingRef(archiveSalesChannelProductMappingVars);
// Variables can be defined inline as well.
const ref = archiveSalesChannelProductMappingRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = archiveSalesChannelProductMappingRef(dataConnect, archiveSalesChannelProductMappingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## TransitionSalesChannelOrder
You can execute the `TransitionSalesChannelOrder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
transitionSalesChannelOrder(vars: TransitionSalesChannelOrderVariables): MutationPromise<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;

interface TransitionSalesChannelOrderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: TransitionSalesChannelOrderVariables): MutationRef<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;
}
export const transitionSalesChannelOrderRef: TransitionSalesChannelOrderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
transitionSalesChannelOrder(dc: DataConnect, vars: TransitionSalesChannelOrderVariables): MutationPromise<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;

interface TransitionSalesChannelOrderRef {
  ...
  (dc: DataConnect, vars: TransitionSalesChannelOrderVariables): MutationRef<TransitionSalesChannelOrderData, TransitionSalesChannelOrderVariables>;
}
export const transitionSalesChannelOrderRef: TransitionSalesChannelOrderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the transitionSalesChannelOrderRef:
```typescript
const name = transitionSalesChannelOrderRef.operationName;
console.log(name);
```

### Variables
The `TransitionSalesChannelOrder` mutation requires an argument of type `TransitionSalesChannelOrderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface TransitionSalesChannelOrderVariables {
  id: UUIDString;
  action: string;
  reason: string;
  expectedVersion: number;
}
```
### Return Type
Recall that executing the `TransitionSalesChannelOrder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `TransitionSalesChannelOrderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface TransitionSalesChannelOrderData {
  _execute?: number | null;
}
```
### Using `TransitionSalesChannelOrder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, transitionSalesChannelOrder, TransitionSalesChannelOrderVariables } from '@insightpad/dataconnect';

// The `TransitionSalesChannelOrder` mutation requires an argument of type `TransitionSalesChannelOrderVariables`:
const transitionSalesChannelOrderVars: TransitionSalesChannelOrderVariables = {
  id: ..., 
  action: ..., 
  reason: ..., 
  expectedVersion: ..., 
};

// Call the `transitionSalesChannelOrder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await transitionSalesChannelOrder(transitionSalesChannelOrderVars);
// Variables can be defined inline as well.
const { data } = await transitionSalesChannelOrder({ id: ..., action: ..., reason: ..., expectedVersion: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await transitionSalesChannelOrder(dataConnect, transitionSalesChannelOrderVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
transitionSalesChannelOrder(transitionSalesChannelOrderVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `TransitionSalesChannelOrder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, transitionSalesChannelOrderRef, TransitionSalesChannelOrderVariables } from '@insightpad/dataconnect';

// The `TransitionSalesChannelOrder` mutation requires an argument of type `TransitionSalesChannelOrderVariables`:
const transitionSalesChannelOrderVars: TransitionSalesChannelOrderVariables = {
  id: ..., 
  action: ..., 
  reason: ..., 
  expectedVersion: ..., 
};

// Call the `transitionSalesChannelOrderRef()` function to get a reference to the mutation.
const ref = transitionSalesChannelOrderRef(transitionSalesChannelOrderVars);
// Variables can be defined inline as well.
const ref = transitionSalesChannelOrderRef({ id: ..., action: ..., reason: ..., expectedVersion: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = transitionSalesChannelOrderRef(dataConnect, transitionSalesChannelOrderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

## CloseCashSession
You can execute the `CloseCashSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
closeCashSession(vars: CloseCashSessionVariables): MutationPromise<CloseCashSessionData, CloseCashSessionVariables>;

interface CloseCashSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CloseCashSessionVariables): MutationRef<CloseCashSessionData, CloseCashSessionVariables>;
}
export const closeCashSessionRef: CloseCashSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
closeCashSession(dc: DataConnect, vars: CloseCashSessionVariables): MutationPromise<CloseCashSessionData, CloseCashSessionVariables>;

interface CloseCashSessionRef {
  ...
  (dc: DataConnect, vars: CloseCashSessionVariables): MutationRef<CloseCashSessionData, CloseCashSessionVariables>;
}
export const closeCashSessionRef: CloseCashSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the closeCashSessionRef:
```typescript
const name = closeCashSessionRef.operationName;
console.log(name);
```

### Variables
The `CloseCashSession` mutation requires an argument of type `CloseCashSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CloseCashSessionVariables {
  sessionId: UUIDString;
  countedAmountCents: Int64String;
  notes: string;
}
```
### Return Type
Recall that executing the `CloseCashSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CloseCashSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CloseCashSessionData {
  _execute?: number | null;
}
```
### Using `CloseCashSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, closeCashSession, CloseCashSessionVariables } from '@insightpad/dataconnect';

// The `CloseCashSession` mutation requires an argument of type `CloseCashSessionVariables`:
const closeCashSessionVars: CloseCashSessionVariables = {
  sessionId: ..., 
  countedAmountCents: ..., 
  notes: ..., 
};

// Call the `closeCashSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await closeCashSession(closeCashSessionVars);
// Variables can be defined inline as well.
const { data } = await closeCashSession({ sessionId: ..., countedAmountCents: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await closeCashSession(dataConnect, closeCashSessionVars);

console.log(data._execute);

// Or, you can use the `Promise` API.
closeCashSession(closeCashSessionVars).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

### Using `CloseCashSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, closeCashSessionRef, CloseCashSessionVariables } from '@insightpad/dataconnect';

// The `CloseCashSession` mutation requires an argument of type `CloseCashSessionVariables`:
const closeCashSessionVars: CloseCashSessionVariables = {
  sessionId: ..., 
  countedAmountCents: ..., 
  notes: ..., 
};

// Call the `closeCashSessionRef()` function to get a reference to the mutation.
const ref = closeCashSessionRef(closeCashSessionVars);
// Variables can be defined inline as well.
const ref = closeCashSessionRef({ sessionId: ..., countedAmountCents: ..., notes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = closeCashSessionRef(dataConnect, closeCashSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data._execute);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data._execute);
});
```

