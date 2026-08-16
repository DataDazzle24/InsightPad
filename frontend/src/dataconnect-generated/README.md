# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `app`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCurrentUser*](#getcurrentuser)
  - [*GetCurrentUserAccess*](#getcurrentuseraccess)
- [**Mutations**](#mutations)
  - [*BootstrapNavigationCatalog*](#bootstrapnavigationcatalog)

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
});
```

