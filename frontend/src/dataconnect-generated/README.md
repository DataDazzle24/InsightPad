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
  - [*ListBranches*](#listbranches)
  - [*ListSuppliers*](#listsuppliers)
  - [*ListCustomers*](#listcustomers)
  - [*ListProducts*](#listproducts)
  - [*RegistrationOptions*](#registrationoptions)
  - [*ProductComponents*](#productcomponents)
  - [*ProductPromotions*](#productpromotions)
- [**Mutations**](#mutations)
  - [*BootstrapNavigationCatalog*](#bootstrapnavigationcatalog)
  - [*CreateCategory*](#createcategory)
  - [*UpdateCategory*](#updatecategory)
  - [*ArchiveCategory*](#archivecategory)
  - [*CreateSubcategory*](#createsubcategory)
  - [*UpdateSubcategory*](#updatesubcategory)
  - [*ArchiveSubcategory*](#archivesubcategory)
  - [*RestoreCategory*](#restorecategory)
  - [*RestoreSubcategory*](#restoresubcategory)
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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCategories(listCategoriesVars);
// Variables can be defined inline as well.
const { data } = await listCategories({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  requestKey: ..., // optional
};

// Call the `listCategoriesRef()` function to get a reference to the query.
const ref = listCategoriesRef(listCategoriesVars);
// Variables can be defined inline as well.
const ref = listCategoriesRef({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSubcategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSubcategories(listSubcategoriesVars);
// Variables can be defined inline as well.
const { data } = await listSubcategories({ search: ..., categoryId: ..., limit: ..., offset: ..., requestKey: ..., });

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
  requestKey: ..., // optional
};

// Call the `listSubcategoriesRef()` function to get a reference to the query.
const ref = listSubcategoriesRef(listSubcategoriesVars);
// Variables can be defined inline as well.
const ref = listSubcategoriesRef({ search: ..., categoryId: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listBranches()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listBranches(listBranchesVars);
// Variables can be defined inline as well.
const { data } = await listBranches({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listBranchesRef()` function to get a reference to the query.
const ref = listBranchesRef(listBranchesVars);
// Variables can be defined inline as well.
const ref = listBranchesRef({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSuppliers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSuppliers(listSuppliersVars);
// Variables can be defined inline as well.
const { data } = await listSuppliers({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listSuppliersRef()` function to get a reference to the query.
const ref = listSuppliersRef(listSuppliersVars);
// Variables can be defined inline as well.
const ref = listSuppliersRef({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCustomers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCustomers(listCustomersVars);
// Variables can be defined inline as well.
const { data } = await listCustomers({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listCustomersRef()` function to get a reference to the query.
const ref = listCustomersRef(listCustomersVars);
// Variables can be defined inline as well.
const ref = listCustomersRef({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listProducts(listProductsVars);
// Variables can be defined inline as well.
const { data } = await listProducts({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
  limit: ..., 
  offset: ..., 
  requestKey: ..., // optional
};

// Call the `listProductsRef()` function to get a reference to the query.
const ref = listProductsRef(listProductsVars);
// Variables can be defined inline as well.
const ref = listProductsRef({ search: ..., limit: ..., offset: ..., requestKey: ..., });

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
registrationOptions(options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, undefined>;

interface RegistrationOptionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<RegistrationOptionsData, undefined>;
}
export const registrationOptionsRef: RegistrationOptionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
registrationOptions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<RegistrationOptionsData, undefined>;

interface RegistrationOptionsRef {
  ...
  (dc: DataConnect): QueryRef<RegistrationOptionsData, undefined>;
}
export const registrationOptionsRef: RegistrationOptionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the registrationOptionsRef:
```typescript
const name = registrationOptionsRef.operationName;
console.log(name);
```

### Variables
The `RegistrationOptions` query has no variables.
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
import { connectorConfig, registrationOptions } from '@insightpad/dataconnect';


// Call the `registrationOptions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await registrationOptions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await registrationOptions(dataConnect);

console.log(data._select);

// Or, you can use the `Promise` API.
registrationOptions().then((response) => {
  const data = response.data;
  console.log(data._select);
});
```

### Using `RegistrationOptions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, registrationOptionsRef } from '@insightpad/dataconnect';


// Call the `registrationOptionsRef()` function to get a reference to the query.
const ref = registrationOptionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = registrationOptionsRef(dataConnect);

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
};

// Call the `saveProduct()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await saveProduct(saveProductVars);
// Variables can be defined inline as well.
const { data } = await saveProduct({ id: ..., payload: ..., });

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
};

// Call the `saveProductRef()` function to get a reference to the mutation.
const ref = saveProductRef(saveProductVars);
// Variables can be defined inline as well.
const ref = saveProductRef({ id: ..., payload: ..., });

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

