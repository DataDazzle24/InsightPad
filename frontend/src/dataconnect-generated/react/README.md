# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `app`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@insightpad/dataconnect/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
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

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `app`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `app`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `app` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetCurrentUser
You can execute the `GetCurrentUser` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
```

### Variables
The `GetCurrentUser` Query has no variables.
### Return Type
Recall that calling the `GetCurrentUser` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCurrentUser` Query is of type `GetCurrentUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCurrentUser`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useGetCurrentUser } from '@insightpad/dataconnect/react'

export default function GetCurrentUserComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCurrentUser();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCurrentUser(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCurrentUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCurrentUser(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetCurrentUserAccess
You can execute the `GetCurrentUserAccess` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetCurrentUserAccess(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetCurrentUserAccess(options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
```

### Variables
The `GetCurrentUserAccess` Query has no variables.
### Return Type
Recall that calling the `GetCurrentUserAccess` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetCurrentUserAccess` Query is of type `GetCurrentUserAccessData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetCurrentUserAccess`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useGetCurrentUserAccess } from '@insightpad/dataconnect/react'

export default function GetCurrentUserAccessComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetCurrentUserAccess();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetCurrentUserAccess(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetCurrentUserAccess(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetCurrentUserAccess(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListCategories
You can execute the `ListCategories` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCategories(vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
```

### Variables
The `ListCategories` Query requires an argument of type `ListCategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCategoriesVariables {
  search: string;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListCategories` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListCategories` Query is of type `ListCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCategoriesData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListCategories`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCategoriesVariables } from '@insightpad/dataconnect';
import { useListCategories } from '@insightpad/dataconnect/react'

export default function ListCategoriesComponent() {
  // The `useListCategories` Query hook requires an argument of type `ListCategoriesVariables`:
  const listCategoriesVars: ListCategoriesVariables = {
    search: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCategories(listCategoriesVars);
  // Variables can be defined inline as well.
  const query = useListCategories({ search: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCategories(dataConnect, listCategoriesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCategories(listCategoriesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCategories(dataConnect, listCategoriesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListSubcategories
You can execute the `ListSubcategories` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListSubcategories(vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;
```

### Variables
The `ListSubcategories` Query requires an argument of type `ListSubcategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListSubcategoriesVariables {
  search: string;
  categoryId?: UUIDString | null;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListSubcategories` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListSubcategories` Query is of type `ListSubcategoriesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListSubcategoriesData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListSubcategories`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListSubcategoriesVariables } from '@insightpad/dataconnect';
import { useListSubcategories } from '@insightpad/dataconnect/react'

export default function ListSubcategoriesComponent() {
  // The `useListSubcategories` Query hook requires an argument of type `ListSubcategoriesVariables`:
  const listSubcategoriesVars: ListSubcategoriesVariables = {
    search: ..., 
    categoryId: ..., // optional
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListSubcategories(listSubcategoriesVars);
  // Variables can be defined inline as well.
  const query = useListSubcategories({ search: ..., categoryId: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListSubcategories(dataConnect, listSubcategoriesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListSubcategories(listSubcategoriesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListSubcategories(dataConnect, listSubcategoriesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CategoryOptions
You can execute the `CategoryOptions` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useCategoryOptions(dc: DataConnect, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useCategoryOptions(options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, undefined>;
```

### Variables
The `CategoryOptions` Query has no variables.
### Return Type
Recall that calling the `CategoryOptions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `CategoryOptions` Query is of type `CategoryOptionsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CategoryOptionsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `CategoryOptions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useCategoryOptions } from '@insightpad/dataconnect/react'

export default function CategoryOptionsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useCategoryOptions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useCategoryOptions(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useCategoryOptions(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useCategoryOptions(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListBranches
You can execute the `ListBranches` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListBranches(dc: DataConnect, vars: ListBranchesVariables, options?: useDataConnectQueryOptions<ListBranchesData>): UseDataConnectQueryResult<ListBranchesData, ListBranchesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListBranches(vars: ListBranchesVariables, options?: useDataConnectQueryOptions<ListBranchesData>): UseDataConnectQueryResult<ListBranchesData, ListBranchesVariables>;
```

### Variables
The `ListBranches` Query requires an argument of type `ListBranchesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListBranchesVariables {
  search: string;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListBranches` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListBranches` Query is of type `ListBranchesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListBranchesData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListBranches`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListBranchesVariables } from '@insightpad/dataconnect';
import { useListBranches } from '@insightpad/dataconnect/react'

export default function ListBranchesComponent() {
  // The `useListBranches` Query hook requires an argument of type `ListBranchesVariables`:
  const listBranchesVars: ListBranchesVariables = {
    search: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListBranches(listBranchesVars);
  // Variables can be defined inline as well.
  const query = useListBranches({ search: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListBranches(dataConnect, listBranchesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListBranches(listBranchesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListBranches(dataConnect, listBranchesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListSuppliers
You can execute the `ListSuppliers` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListSuppliers(dc: DataConnect, vars: ListSuppliersVariables, options?: useDataConnectQueryOptions<ListSuppliersData>): UseDataConnectQueryResult<ListSuppliersData, ListSuppliersVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListSuppliers(vars: ListSuppliersVariables, options?: useDataConnectQueryOptions<ListSuppliersData>): UseDataConnectQueryResult<ListSuppliersData, ListSuppliersVariables>;
```

### Variables
The `ListSuppliers` Query requires an argument of type `ListSuppliersVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListSuppliersVariables {
  search: string;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListSuppliers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListSuppliers` Query is of type `ListSuppliersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListSuppliersData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListSuppliers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListSuppliersVariables } from '@insightpad/dataconnect';
import { useListSuppliers } from '@insightpad/dataconnect/react'

export default function ListSuppliersComponent() {
  // The `useListSuppliers` Query hook requires an argument of type `ListSuppliersVariables`:
  const listSuppliersVars: ListSuppliersVariables = {
    search: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListSuppliers(listSuppliersVars);
  // Variables can be defined inline as well.
  const query = useListSuppliers({ search: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListSuppliers(dataConnect, listSuppliersVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListSuppliers(listSuppliersVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListSuppliers(dataConnect, listSuppliersVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListCustomers
You can execute the `ListCustomers` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListCustomers(dc: DataConnect, vars: ListCustomersVariables, options?: useDataConnectQueryOptions<ListCustomersData>): UseDataConnectQueryResult<ListCustomersData, ListCustomersVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCustomers(vars: ListCustomersVariables, options?: useDataConnectQueryOptions<ListCustomersData>): UseDataConnectQueryResult<ListCustomersData, ListCustomersVariables>;
```

### Variables
The `ListCustomers` Query requires an argument of type `ListCustomersVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCustomersVariables {
  search: string;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListCustomers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListCustomers` Query is of type `ListCustomersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCustomersData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListCustomers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCustomersVariables } from '@insightpad/dataconnect';
import { useListCustomers } from '@insightpad/dataconnect/react'

export default function ListCustomersComponent() {
  // The `useListCustomers` Query hook requires an argument of type `ListCustomersVariables`:
  const listCustomersVars: ListCustomersVariables = {
    search: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCustomers(listCustomersVars);
  // Variables can be defined inline as well.
  const query = useListCustomers({ search: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCustomers(dataConnect, listCustomersVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCustomers(listCustomersVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCustomers(dataConnect, listCustomersVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListProducts
You can execute the `ListProducts` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListProducts(dc: DataConnect, vars: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListProducts(vars: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
```

### Variables
The `ListProducts` Query requires an argument of type `ListProductsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListProductsVariables {
  search: string;
  limit: number;
  offset: number;
  requestKey?: string | null;
}
```
### Return Type
Recall that calling the `ListProducts` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListProducts` Query is of type `ListProductsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListProductsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListProducts`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListProductsVariables } from '@insightpad/dataconnect';
import { useListProducts } from '@insightpad/dataconnect/react'

export default function ListProductsComponent() {
  // The `useListProducts` Query hook requires an argument of type `ListProductsVariables`:
  const listProductsVars: ListProductsVariables = {
    search: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListProducts(listProductsVars);
  // Variables can be defined inline as well.
  const query = useListProducts({ search: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListProducts(dataConnect, listProductsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(listProductsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListProducts(dataConnect, listProductsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RegistrationOptions
You can execute the `RegistrationOptions` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useRegistrationOptions(dc: DataConnect, options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useRegistrationOptions(options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, undefined>;
```

### Variables
The `RegistrationOptions` Query has no variables.
### Return Type
Recall that calling the `RegistrationOptions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `RegistrationOptions` Query is of type `RegistrationOptionsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RegistrationOptionsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `RegistrationOptions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useRegistrationOptions } from '@insightpad/dataconnect/react'

export default function RegistrationOptionsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useRegistrationOptions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useRegistrationOptions(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useRegistrationOptions(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useRegistrationOptions(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ProductComponents
You can execute the `ProductComponents` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useProductComponents(dc: DataConnect, vars: ProductComponentsVariables, options?: useDataConnectQueryOptions<ProductComponentsData>): UseDataConnectQueryResult<ProductComponentsData, ProductComponentsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useProductComponents(vars: ProductComponentsVariables, options?: useDataConnectQueryOptions<ProductComponentsData>): UseDataConnectQueryResult<ProductComponentsData, ProductComponentsVariables>;
```

### Variables
The `ProductComponents` Query requires an argument of type `ProductComponentsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ProductComponentsVariables {
  productId: UUIDString;
}
```
### Return Type
Recall that calling the `ProductComponents` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ProductComponents` Query is of type `ProductComponentsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductComponentsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ProductComponents`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductComponentsVariables } from '@insightpad/dataconnect';
import { useProductComponents } from '@insightpad/dataconnect/react'

export default function ProductComponentsComponent() {
  // The `useProductComponents` Query hook requires an argument of type `ProductComponentsVariables`:
  const productComponentsVars: ProductComponentsVariables = {
    productId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useProductComponents(productComponentsVars);
  // Variables can be defined inline as well.
  const query = useProductComponents({ productId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useProductComponents(dataConnect, productComponentsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useProductComponents(productComponentsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useProductComponents(dataConnect, productComponentsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ProductPromotions
You can execute the `ProductPromotions` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useProductPromotions(dc: DataConnect, vars: ProductPromotionsVariables, options?: useDataConnectQueryOptions<ProductPromotionsData>): UseDataConnectQueryResult<ProductPromotionsData, ProductPromotionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useProductPromotions(vars: ProductPromotionsVariables, options?: useDataConnectQueryOptions<ProductPromotionsData>): UseDataConnectQueryResult<ProductPromotionsData, ProductPromotionsVariables>;
```

### Variables
The `ProductPromotions` Query requires an argument of type `ProductPromotionsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ProductPromotionsVariables {
  productId: UUIDString;
}
```
### Return Type
Recall that calling the `ProductPromotions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ProductPromotions` Query is of type `ProductPromotionsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ProductPromotionsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ProductPromotions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ProductPromotionsVariables } from '@insightpad/dataconnect';
import { useProductPromotions } from '@insightpad/dataconnect/react'

export default function ProductPromotionsComponent() {
  // The `useProductPromotions` Query hook requires an argument of type `ProductPromotionsVariables`:
  const productPromotionsVars: ProductPromotionsVariables = {
    productId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useProductPromotions(productPromotionsVars);
  // Variables can be defined inline as well.
  const query = useProductPromotions({ productId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useProductPromotions(dataConnect, productPromotionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useProductPromotions(productPromotionsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useProductPromotions(dataConnect, productPromotionsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data._select);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `app` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## BootstrapNavigationCatalog
You can execute the `BootstrapNavigationCatalog` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useBootstrapNavigationCatalog(options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBootstrapNavigationCatalog(dc: DataConnect, options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
```

### Variables
The `BootstrapNavigationCatalog` Mutation requires an argument of type `BootstrapNavigationCatalogVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BootstrapNavigationCatalogVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}
```
### Return Type
Recall that calling the `BootstrapNavigationCatalog` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `BootstrapNavigationCatalog` Mutation is of type `BootstrapNavigationCatalogData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `BootstrapNavigationCatalog`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BootstrapNavigationCatalogVariables } from '@insightpad/dataconnect';
import { useBootstrapNavigationCatalog } from '@insightpad/dataconnect/react'

export default function BootstrapNavigationCatalogComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBootstrapNavigationCatalog();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBootstrapNavigationCatalog(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapNavigationCatalog(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapNavigationCatalog(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBootstrapNavigationCatalog` Mutation requires an argument of type `BootstrapNavigationCatalogVariables`:
  const bootstrapNavigationCatalogVars: BootstrapNavigationCatalogVariables = {
    tenantId: ..., 
    platformAdminRoleId: ..., 
  };
  mutation.mutate(bootstrapNavigationCatalogVars);
  // Variables can be defined inline as well.
  mutation.mutate({ tenantId: ..., platformAdminRoleId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(bootstrapNavigationCatalogVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.pageCaixa);
    console.log(mutation.data.pageGestaoVendas);
    console.log(mutation.data.pageEstoque);
    console.log(mutation.data.pageContasPagar);
    console.log(mutation.data.pageContasReceber);
    console.log(mutation.data.pageCategoria);
    console.log(mutation.data.pageSubcategoria);
    console.log(mutation.data.pageProduto);
    console.log(mutation.data.pageCliente);
    console.log(mutation.data.pageFornecedor);
    console.log(mutation.data.pageFilial);
    console.log(mutation.data.pageRelatorios);
    console.log(mutation.data.pageGestaoAcessos);
    console.log(mutation.data.permissionCaixa);
    console.log(mutation.data.permissionGestaoVendas);
    console.log(mutation.data.permissionEstoque);
    console.log(mutation.data.permissionContasPagar);
    console.log(mutation.data.permissionContasReceber);
    console.log(mutation.data.permissionCategoria);
    console.log(mutation.data.permissionSubcategoria);
    console.log(mutation.data.permissionProduto);
    console.log(mutation.data.permissionCliente);
    console.log(mutation.data.permissionFornecedor);
    console.log(mutation.data.permissionFilial);
    console.log(mutation.data.permissionRelatorios);
    console.log(mutation.data.permissionGestaoAcessos);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateCategory
You can execute the `CreateCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateCategory(options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;
```

### Variables
The `CreateCategory` Mutation requires an argument of type `CreateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateCategoryVariables {
  name: string;
}
```
### Return Type
Recall that calling the `CreateCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateCategory` Mutation is of type `CreateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateCategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateCategoryVariables } from '@insightpad/dataconnect';
import { useCreateCategory } from '@insightpad/dataconnect/react'

export default function CreateCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateCategory` Mutation requires an argument of type `CreateCategoryVariables`:
  const createCategoryVars: CreateCategoryVariables = {
    name: ..., 
  };
  mutation.mutate(createCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateCategory
You can execute the `UpdateCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateCategory(options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;
```

### Variables
The `UpdateCategory` Mutation requires an argument of type `UpdateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateCategoryVariables {
  id: UUIDString;
  name: string;
}
```
### Return Type
Recall that calling the `UpdateCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateCategory` Mutation is of type `UpdateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateCategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateCategoryVariables } from '@insightpad/dataconnect';
import { useUpdateCategory } from '@insightpad/dataconnect/react'

export default function UpdateCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateCategory` Mutation requires an argument of type `UpdateCategoryVariables`:
  const updateCategoryVars: UpdateCategoryVariables = {
    id: ..., 
    name: ..., 
  };
  mutation.mutate(updateCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ArchiveCategory
You can execute the `ArchiveCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useArchiveCategory(options?: useDataConnectMutationOptions<ArchiveCategoryData, FirebaseError, ArchiveCategoryVariables>): UseDataConnectMutationResult<ArchiveCategoryData, ArchiveCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useArchiveCategory(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveCategoryData, FirebaseError, ArchiveCategoryVariables>): UseDataConnectMutationResult<ArchiveCategoryData, ArchiveCategoryVariables>;
```

### Variables
The `ArchiveCategory` Mutation requires an argument of type `ArchiveCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ArchiveCategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `ArchiveCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ArchiveCategory` Mutation is of type `ArchiveCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ArchiveCategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ArchiveCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ArchiveCategoryVariables } from '@insightpad/dataconnect';
import { useArchiveCategory } from '@insightpad/dataconnect/react'

export default function ArchiveCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useArchiveCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useArchiveCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useArchiveCategory` Mutation requires an argument of type `ArchiveCategoryVariables`:
  const archiveCategoryVars: ArchiveCategoryVariables = {
    id: ..., 
  };
  mutation.mutate(archiveCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(archiveCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateSubcategory
You can execute the `CreateSubcategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateSubcategory(options?: useDataConnectMutationOptions<CreateSubcategoryData, FirebaseError, CreateSubcategoryVariables>): UseDataConnectMutationResult<CreateSubcategoryData, CreateSubcategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSubcategoryData, FirebaseError, CreateSubcategoryVariables>): UseDataConnectMutationResult<CreateSubcategoryData, CreateSubcategoryVariables>;
```

### Variables
The `CreateSubcategory` Mutation requires an argument of type `CreateSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateSubcategoryVariables {
  categoryId: UUIDString;
  name: string;
}
```
### Return Type
Recall that calling the `CreateSubcategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateSubcategory` Mutation is of type `CreateSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateSubcategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateSubcategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateSubcategoryVariables } from '@insightpad/dataconnect';
import { useCreateSubcategory } from '@insightpad/dataconnect/react'

export default function CreateSubcategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateSubcategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateSubcategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSubcategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSubcategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateSubcategory` Mutation requires an argument of type `CreateSubcategoryVariables`:
  const createSubcategoryVars: CreateSubcategoryVariables = {
    categoryId: ..., 
    name: ..., 
  };
  mutation.mutate(createSubcategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ categoryId: ..., name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createSubcategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateSubcategory
You can execute the `UpdateSubcategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateSubcategory(options?: useDataConnectMutationOptions<UpdateSubcategoryData, FirebaseError, UpdateSubcategoryVariables>): UseDataConnectMutationResult<UpdateSubcategoryData, UpdateSubcategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSubcategoryData, FirebaseError, UpdateSubcategoryVariables>): UseDataConnectMutationResult<UpdateSubcategoryData, UpdateSubcategoryVariables>;
```

### Variables
The `UpdateSubcategory` Mutation requires an argument of type `UpdateSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateSubcategoryVariables {
  id: UUIDString;
  categoryId: UUIDString;
  name: string;
}
```
### Return Type
Recall that calling the `UpdateSubcategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateSubcategory` Mutation is of type `UpdateSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateSubcategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateSubcategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateSubcategoryVariables } from '@insightpad/dataconnect';
import { useUpdateSubcategory } from '@insightpad/dataconnect/react'

export default function UpdateSubcategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateSubcategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateSubcategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSubcategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSubcategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateSubcategory` Mutation requires an argument of type `UpdateSubcategoryVariables`:
  const updateSubcategoryVars: UpdateSubcategoryVariables = {
    id: ..., 
    categoryId: ..., 
    name: ..., 
  };
  mutation.mutate(updateSubcategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., categoryId: ..., name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateSubcategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ArchiveSubcategory
You can execute the `ArchiveSubcategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useArchiveSubcategory(options?: useDataConnectMutationOptions<ArchiveSubcategoryData, FirebaseError, ArchiveSubcategoryVariables>): UseDataConnectMutationResult<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useArchiveSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveSubcategoryData, FirebaseError, ArchiveSubcategoryVariables>): UseDataConnectMutationResult<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
```

### Variables
The `ArchiveSubcategory` Mutation requires an argument of type `ArchiveSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ArchiveSubcategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `ArchiveSubcategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ArchiveSubcategory` Mutation is of type `ArchiveSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ArchiveSubcategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ArchiveSubcategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ArchiveSubcategoryVariables } from '@insightpad/dataconnect';
import { useArchiveSubcategory } from '@insightpad/dataconnect/react'

export default function ArchiveSubcategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useArchiveSubcategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useArchiveSubcategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveSubcategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveSubcategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useArchiveSubcategory` Mutation requires an argument of type `ArchiveSubcategoryVariables`:
  const archiveSubcategoryVars: ArchiveSubcategoryVariables = {
    id: ..., 
  };
  mutation.mutate(archiveSubcategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(archiveSubcategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RestoreCategory
You can execute the `RestoreCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRestoreCategory(options?: useDataConnectMutationOptions<RestoreCategoryData, FirebaseError, RestoreCategoryVariables>): UseDataConnectMutationResult<RestoreCategoryData, RestoreCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRestoreCategory(dc: DataConnect, options?: useDataConnectMutationOptions<RestoreCategoryData, FirebaseError, RestoreCategoryVariables>): UseDataConnectMutationResult<RestoreCategoryData, RestoreCategoryVariables>;
```

### Variables
The `RestoreCategory` Mutation requires an argument of type `RestoreCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RestoreCategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `RestoreCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RestoreCategory` Mutation is of type `RestoreCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RestoreCategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RestoreCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RestoreCategoryVariables } from '@insightpad/dataconnect';
import { useRestoreCategory } from '@insightpad/dataconnect/react'

export default function RestoreCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRestoreCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRestoreCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRestoreCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRestoreCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRestoreCategory` Mutation requires an argument of type `RestoreCategoryVariables`:
  const restoreCategoryVars: RestoreCategoryVariables = {
    id: ..., 
  };
  mutation.mutate(restoreCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(restoreCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RestoreSubcategory
You can execute the `RestoreSubcategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRestoreSubcategory(options?: useDataConnectMutationOptions<RestoreSubcategoryData, FirebaseError, RestoreSubcategoryVariables>): UseDataConnectMutationResult<RestoreSubcategoryData, RestoreSubcategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRestoreSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<RestoreSubcategoryData, FirebaseError, RestoreSubcategoryVariables>): UseDataConnectMutationResult<RestoreSubcategoryData, RestoreSubcategoryVariables>;
```

### Variables
The `RestoreSubcategory` Mutation requires an argument of type `RestoreSubcategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RestoreSubcategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `RestoreSubcategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RestoreSubcategory` Mutation is of type `RestoreSubcategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RestoreSubcategoryData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RestoreSubcategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RestoreSubcategoryVariables } from '@insightpad/dataconnect';
import { useRestoreSubcategory } from '@insightpad/dataconnect/react'

export default function RestoreSubcategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRestoreSubcategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRestoreSubcategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRestoreSubcategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRestoreSubcategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRestoreSubcategory` Mutation requires an argument of type `RestoreSubcategoryVariables`:
  const restoreSubcategoryVars: RestoreSubcategoryVariables = {
    id: ..., 
  };
  mutation.mutate(restoreSubcategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(restoreSubcategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SaveBranch
You can execute the `SaveBranch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveBranch(options?: useDataConnectMutationOptions<SaveBranchData, FirebaseError, SaveBranchVariables>): UseDataConnectMutationResult<SaveBranchData, SaveBranchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveBranch(dc: DataConnect, options?: useDataConnectMutationOptions<SaveBranchData, FirebaseError, SaveBranchVariables>): UseDataConnectMutationResult<SaveBranchData, SaveBranchVariables>;
```

### Variables
The `SaveBranch` Mutation requires an argument of type `SaveBranchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveBranchVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that calling the `SaveBranch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveBranch` Mutation is of type `SaveBranchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveBranchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveBranch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveBranchVariables } from '@insightpad/dataconnect';
import { useSaveBranch } from '@insightpad/dataconnect/react'

export default function SaveBranchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveBranch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveBranch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveBranch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveBranch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveBranch` Mutation requires an argument of type `SaveBranchVariables`:
  const saveBranchVars: SaveBranchVariables = {
    id: ..., // optional
    payload: ..., 
  };
  mutation.mutate(saveBranchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveBranchVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetBranchStatus
You can execute the `SetBranchStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetBranchStatus(options?: useDataConnectMutationOptions<SetBranchStatusData, FirebaseError, SetBranchStatusVariables>): UseDataConnectMutationResult<SetBranchStatusData, SetBranchStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetBranchStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetBranchStatusData, FirebaseError, SetBranchStatusVariables>): UseDataConnectMutationResult<SetBranchStatusData, SetBranchStatusVariables>;
```

### Variables
The `SetBranchStatus` Mutation requires an argument of type `SetBranchStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetBranchStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetBranchStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetBranchStatus` Mutation is of type `SetBranchStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetBranchStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetBranchStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetBranchStatusVariables } from '@insightpad/dataconnect';
import { useSetBranchStatus } from '@insightpad/dataconnect/react'

export default function SetBranchStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetBranchStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetBranchStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetBranchStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetBranchStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetBranchStatus` Mutation requires an argument of type `SetBranchStatusVariables`:
  const setBranchStatusVars: SetBranchStatusVariables = {
    id: ..., 
    active: ..., 
  };
  mutation.mutate(setBranchStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setBranchStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SaveSupplier
You can execute the `SaveSupplier` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveSupplier(options?: useDataConnectMutationOptions<SaveSupplierData, FirebaseError, SaveSupplierVariables>): UseDataConnectMutationResult<SaveSupplierData, SaveSupplierVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveSupplier(dc: DataConnect, options?: useDataConnectMutationOptions<SaveSupplierData, FirebaseError, SaveSupplierVariables>): UseDataConnectMutationResult<SaveSupplierData, SaveSupplierVariables>;
```

### Variables
The `SaveSupplier` Mutation requires an argument of type `SaveSupplierVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveSupplierVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that calling the `SaveSupplier` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveSupplier` Mutation is of type `SaveSupplierData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveSupplierData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveSupplier`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveSupplierVariables } from '@insightpad/dataconnect';
import { useSaveSupplier } from '@insightpad/dataconnect/react'

export default function SaveSupplierComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveSupplier();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveSupplier(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveSupplier(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveSupplier(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveSupplier` Mutation requires an argument of type `SaveSupplierVariables`:
  const saveSupplierVars: SaveSupplierVariables = {
    id: ..., // optional
    payload: ..., 
  };
  mutation.mutate(saveSupplierVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveSupplierVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetSupplierStatus
You can execute the `SetSupplierStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetSupplierStatus(options?: useDataConnectMutationOptions<SetSupplierStatusData, FirebaseError, SetSupplierStatusVariables>): UseDataConnectMutationResult<SetSupplierStatusData, SetSupplierStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetSupplierStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetSupplierStatusData, FirebaseError, SetSupplierStatusVariables>): UseDataConnectMutationResult<SetSupplierStatusData, SetSupplierStatusVariables>;
```

### Variables
The `SetSupplierStatus` Mutation requires an argument of type `SetSupplierStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetSupplierStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetSupplierStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetSupplierStatus` Mutation is of type `SetSupplierStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetSupplierStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetSupplierStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetSupplierStatusVariables } from '@insightpad/dataconnect';
import { useSetSupplierStatus } from '@insightpad/dataconnect/react'

export default function SetSupplierStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetSupplierStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetSupplierStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSupplierStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSupplierStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetSupplierStatus` Mutation requires an argument of type `SetSupplierStatusVariables`:
  const setSupplierStatusVars: SetSupplierStatusVariables = {
    id: ..., 
    active: ..., 
  };
  mutation.mutate(setSupplierStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setSupplierStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SaveCustomer
You can execute the `SaveCustomer` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveCustomer(options?: useDataConnectMutationOptions<SaveCustomerData, FirebaseError, SaveCustomerVariables>): UseDataConnectMutationResult<SaveCustomerData, SaveCustomerVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveCustomer(dc: DataConnect, options?: useDataConnectMutationOptions<SaveCustomerData, FirebaseError, SaveCustomerVariables>): UseDataConnectMutationResult<SaveCustomerData, SaveCustomerVariables>;
```

### Variables
The `SaveCustomer` Mutation requires an argument of type `SaveCustomerVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveCustomerVariables {
  id?: UUIDString | null;
  payload: unknown;
}
```
### Return Type
Recall that calling the `SaveCustomer` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveCustomer` Mutation is of type `SaveCustomerData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveCustomerData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveCustomer`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveCustomerVariables } from '@insightpad/dataconnect';
import { useSaveCustomer } from '@insightpad/dataconnect/react'

export default function SaveCustomerComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveCustomer();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveCustomer(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveCustomer(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveCustomer(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveCustomer` Mutation requires an argument of type `SaveCustomerVariables`:
  const saveCustomerVars: SaveCustomerVariables = {
    id: ..., // optional
    payload: ..., 
  };
  mutation.mutate(saveCustomerVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveCustomerVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetCustomerStatus
You can execute the `SetCustomerStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetCustomerStatus(options?: useDataConnectMutationOptions<SetCustomerStatusData, FirebaseError, SetCustomerStatusVariables>): UseDataConnectMutationResult<SetCustomerStatusData, SetCustomerStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetCustomerStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetCustomerStatusData, FirebaseError, SetCustomerStatusVariables>): UseDataConnectMutationResult<SetCustomerStatusData, SetCustomerStatusVariables>;
```

### Variables
The `SetCustomerStatus` Mutation requires an argument of type `SetCustomerStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetCustomerStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetCustomerStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetCustomerStatus` Mutation is of type `SetCustomerStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetCustomerStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetCustomerStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetCustomerStatusVariables } from '@insightpad/dataconnect';
import { useSetCustomerStatus } from '@insightpad/dataconnect/react'

export default function SetCustomerStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetCustomerStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetCustomerStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCustomerStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCustomerStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetCustomerStatus` Mutation requires an argument of type `SetCustomerStatusVariables`:
  const setCustomerStatusVars: SetCustomerStatusVariables = {
    id: ..., 
    active: ..., 
  };
  mutation.mutate(setCustomerStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setCustomerStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SaveProduct
You can execute the `SaveProduct` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveProduct(options?: useDataConnectMutationOptions<SaveProductData, FirebaseError, SaveProductVariables>): UseDataConnectMutationResult<SaveProductData, SaveProductVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveProduct(dc: DataConnect, options?: useDataConnectMutationOptions<SaveProductData, FirebaseError, SaveProductVariables>): UseDataConnectMutationResult<SaveProductData, SaveProductVariables>;
```

### Variables
The `SaveProduct` Mutation requires an argument of type `SaveProductVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveProductVariables {
  id?: UUIDString | null;
  payload: unknown;
  components?: unknown | null;
}
```
### Return Type
Recall that calling the `SaveProduct` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveProduct` Mutation is of type `SaveProductData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveProductData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveProduct`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveProductVariables } from '@insightpad/dataconnect';
import { useSaveProduct } from '@insightpad/dataconnect/react'

export default function SaveProductComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveProduct();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveProduct(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveProduct(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveProduct(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveProduct` Mutation requires an argument of type `SaveProductVariables`:
  const saveProductVars: SaveProductVariables = {
    id: ..., // optional
    payload: ..., 
    components: ..., // optional
  };
  mutation.mutate(saveProductVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., payload: ..., components: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveProductVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetProductStatus
You can execute the `SetProductStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetProductStatus(options?: useDataConnectMutationOptions<SetProductStatusData, FirebaseError, SetProductStatusVariables>): UseDataConnectMutationResult<SetProductStatusData, SetProductStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetProductStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetProductStatusData, FirebaseError, SetProductStatusVariables>): UseDataConnectMutationResult<SetProductStatusData, SetProductStatusVariables>;
```

### Variables
The `SetProductStatus` Mutation requires an argument of type `SetProductStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetProductStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetProductStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetProductStatus` Mutation is of type `SetProductStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetProductStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetProductStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetProductStatusVariables } from '@insightpad/dataconnect';
import { useSetProductStatus } from '@insightpad/dataconnect/react'

export default function SetProductStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetProductStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetProductStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetProductStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetProductStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetProductStatus` Mutation requires an argument of type `SetProductStatusVariables`:
  const setProductStatusVars: SetProductStatusVariables = {
    id: ..., 
    active: ..., 
  };
  mutation.mutate(setProductStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setProductStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SaveProductComponents
You can execute the `SaveProductComponents` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveProductComponents(options?: useDataConnectMutationOptions<SaveProductComponentsData, FirebaseError, SaveProductComponentsVariables>): UseDataConnectMutationResult<SaveProductComponentsData, SaveProductComponentsVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveProductComponents(dc: DataConnect, options?: useDataConnectMutationOptions<SaveProductComponentsData, FirebaseError, SaveProductComponentsVariables>): UseDataConnectMutationResult<SaveProductComponentsData, SaveProductComponentsVariables>;
```

### Variables
The `SaveProductComponents` Mutation requires an argument of type `SaveProductComponentsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveProductComponentsVariables {
  productId: UUIDString;
  components: unknown;
}
```
### Return Type
Recall that calling the `SaveProductComponents` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveProductComponents` Mutation is of type `SaveProductComponentsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveProductComponentsData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveProductComponents`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveProductComponentsVariables } from '@insightpad/dataconnect';
import { useSaveProductComponents } from '@insightpad/dataconnect/react'

export default function SaveProductComponentsComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveProductComponents();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveProductComponents(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveProductComponents(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveProductComponents(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveProductComponents` Mutation requires an argument of type `SaveProductComponentsVariables`:
  const saveProductComponentsVars: SaveProductComponentsVariables = {
    productId: ..., 
    components: ..., 
  };
  mutation.mutate(saveProductComponentsVars);
  // Variables can be defined inline as well.
  mutation.mutate({ productId: ..., components: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveProductComponentsVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SavePromotion
You can execute the `SavePromotion` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSavePromotion(options?: useDataConnectMutationOptions<SavePromotionData, FirebaseError, SavePromotionVariables>): UseDataConnectMutationResult<SavePromotionData, SavePromotionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSavePromotion(dc: DataConnect, options?: useDataConnectMutationOptions<SavePromotionData, FirebaseError, SavePromotionVariables>): UseDataConnectMutationResult<SavePromotionData, SavePromotionVariables>;
```

### Variables
The `SavePromotion` Mutation requires an argument of type `SavePromotionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SavePromotionVariables {
  id?: UUIDString | null;
  productId: UUIDString;
  promotionalPriceCents: Int64String;
  startsAt: TimestampString;
  endsAt: TimestampString;
}
```
### Return Type
Recall that calling the `SavePromotion` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SavePromotion` Mutation is of type `SavePromotionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SavePromotionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SavePromotion`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SavePromotionVariables } from '@insightpad/dataconnect';
import { useSavePromotion } from '@insightpad/dataconnect/react'

export default function SavePromotionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSavePromotion();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSavePromotion(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSavePromotion(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSavePromotion(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSavePromotion` Mutation requires an argument of type `SavePromotionVariables`:
  const savePromotionVars: SavePromotionVariables = {
    id: ..., // optional
    productId: ..., 
    promotionalPriceCents: ..., 
    startsAt: ..., 
    endsAt: ..., 
  };
  mutation.mutate(savePromotionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., productId: ..., promotionalPriceCents: ..., startsAt: ..., endsAt: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(savePromotionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetPromotionStatus
You can execute the `SetPromotionStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetPromotionStatus(options?: useDataConnectMutationOptions<SetPromotionStatusData, FirebaseError, SetPromotionStatusVariables>): UseDataConnectMutationResult<SetPromotionStatusData, SetPromotionStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetPromotionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPromotionStatusData, FirebaseError, SetPromotionStatusVariables>): UseDataConnectMutationResult<SetPromotionStatusData, SetPromotionStatusVariables>;
```

### Variables
The `SetPromotionStatus` Mutation requires an argument of type `SetPromotionStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetPromotionStatusVariables {
  id: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetPromotionStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetPromotionStatus` Mutation is of type `SetPromotionStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetPromotionStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetPromotionStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetPromotionStatusVariables } from '@insightpad/dataconnect';
import { useSetPromotionStatus } from '@insightpad/dataconnect/react'

export default function SetPromotionStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetPromotionStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetPromotionStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPromotionStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPromotionStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetPromotionStatus` Mutation requires an argument of type `SetPromotionStatusVariables`:
  const setPromotionStatusVars: SetPromotionStatusVariables = {
    id: ..., 
    active: ..., 
  };
  mutation.mutate(setPromotionStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setPromotionStatusVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data._execute);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

