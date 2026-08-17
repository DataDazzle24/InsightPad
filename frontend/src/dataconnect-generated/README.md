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
  - [*ListCategories*](#listcategories)
  - [*ListSubcategories*](#listsubcategories)
  - [*CategoryOptions*](#categoryoptions)
- [**Mutations**](#mutations)
  - [*BootstrapNavigationCatalog*](#bootstrapnavigationcatalog)
  - [*CreateCategory*](#createcategory)
  - [*UpdateCategory*](#updatecategory)
  - [*ArchiveCategory*](#archivecategory)
  - [*CreateSubcategory*](#createsubcategory)
  - [*UpdateSubcategory*](#updatesubcategory)
  - [*ArchiveSubcategory*](#archivesubcategory)

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
  limit: number;
  offset: number;
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
  limit: ..., 
  offset: ..., 
};

// Call the `listCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCategories(listCategoriesVars);
// Variables can be defined inline as well.
const { data } = await listCategories({ search: ..., limit: ..., offset: ..., });

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
  limit: ..., 
  offset: ..., 
};

// Call the `listCategoriesRef()` function to get a reference to the query.
const ref = listCategoriesRef(listCategoriesVars);
// Variables can be defined inline as well.
const ref = listCategoriesRef({ search: ..., limit: ..., offset: ..., });

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
  limit: number;
  offset: number;
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
  limit: ..., 
  offset: ..., 
};

// Call the `listSubcategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSubcategories(listSubcategoriesVars);
// Variables can be defined inline as well.
const { data } = await listSubcategories({ search: ..., categoryId: ..., limit: ..., offset: ..., });

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
  limit: ..., 
  offset: ..., 
};

// Call the `listSubcategoriesRef()` function to get a reference to the query.
const ref = listSubcategoriesRef(listSubcategoriesVars);
// Variables can be defined inline as well.
const ref = listSubcategoriesRef({ search: ..., categoryId: ..., limit: ..., offset: ..., });

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
categoryOptions(options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, undefined>;

interface CategoryOptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<CategoryOptionsData, undefined>;
}
export const categoryOptionsRef: CategoryOptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
categoryOptions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<CategoryOptionsData, undefined>;

interface CategoryOptionsRef {
  ...
  (dc: DataConnect): QueryRef<CategoryOptionsData, undefined>;
}
export const categoryOptionsRef: CategoryOptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the categoryOptionsRef:
```typescript
const name = categoryOptionsRef.operationName;
console.log(name);
```

### Variables
The `CategoryOptions` query has no variables.
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
import { connectorConfig, categoryOptions } from '@insightpad/dataconnect';


// Call the `categoryOptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await categoryOptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await categoryOptions(dataConnect);

console.log(data._select);

// Or, you can use the `Promise` API.
categoryOptions().then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `CategoryOptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, categoryOptionsRef } from '@insightpad/dataconnect';


// Call the `categoryOptionsRef()` function to get a reference to the query.
const ref = categoryOptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = categoryOptionsRef(dataConnect);

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

