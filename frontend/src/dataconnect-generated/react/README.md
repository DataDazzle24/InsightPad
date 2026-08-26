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
  - [*ValidateDeviceSession*](#validatedevicesession)
  - [*SalesChannelWorkspace*](#saleschannelworkspace)
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
  - [*SetPlatformTenantStatus*](#setplatformtenantstatus)
  - [*LinkPlatformUser*](#linkplatformuser)
  - [*SetPlatformUserStatus*](#setplatformuserstatus)
  - [*SetPlatformRolePermission*](#setplatformrolepermission)
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
  - [*CloseCashSession*](#closecashsession)
  - [*RecoverPlatformAdministrator*](#recoverplatformadministrator)

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
      systemRole: boolean;
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

## ValidateDeviceSession
You can execute the `ValidateDeviceSession` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useValidateDeviceSession(dc: DataConnect, vars: ValidateDeviceSessionVariables, options?: useDataConnectQueryOptions<ValidateDeviceSessionData>): UseDataConnectQueryResult<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useValidateDeviceSession(vars: ValidateDeviceSessionVariables, options?: useDataConnectQueryOptions<ValidateDeviceSessionData>): UseDataConnectQueryResult<ValidateDeviceSessionData, ValidateDeviceSessionVariables>;
```

### Variables
The `ValidateDeviceSession` Query requires an argument of type `ValidateDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ValidateDeviceSessionVariables {
  sessionToken: string;
  requestKey: string;
}
```
### Return Type
Recall that calling the `ValidateDeviceSession` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ValidateDeviceSession` Query is of type `ValidateDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ValidateDeviceSessionData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ValidateDeviceSession`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ValidateDeviceSessionVariables } from '@insightpad/dataconnect';
import { useValidateDeviceSession } from '@insightpad/dataconnect/react'

export default function ValidateDeviceSessionComponent() {
  // The `useValidateDeviceSession` Query hook requires an argument of type `ValidateDeviceSessionVariables`:
  const validateDeviceSessionVars: ValidateDeviceSessionVariables = {
    sessionToken: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useValidateDeviceSession(validateDeviceSessionVars);
  // Variables can be defined inline as well.
  const query = useValidateDeviceSession({ sessionToken: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useValidateDeviceSession(dataConnect, validateDeviceSessionVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useValidateDeviceSession(validateDeviceSessionVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useValidateDeviceSession(dataConnect, validateDeviceSessionVars, options);

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

## SalesChannelWorkspace
You can execute the `SalesChannelWorkspace` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useSalesChannelWorkspace(dc: DataConnect, vars: SalesChannelWorkspaceVariables, options?: useDataConnectQueryOptions<SalesChannelWorkspaceData>): UseDataConnectQueryResult<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useSalesChannelWorkspace(vars: SalesChannelWorkspaceVariables, options?: useDataConnectQueryOptions<SalesChannelWorkspaceData>): UseDataConnectQueryResult<SalesChannelWorkspaceData, SalesChannelWorkspaceVariables>;
```

### Variables
The `SalesChannelWorkspace` Query requires an argument of type `SalesChannelWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SalesChannelWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that calling the `SalesChannelWorkspace` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `SalesChannelWorkspace` Query is of type `SalesChannelWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SalesChannelWorkspaceData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `SalesChannelWorkspace`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SalesChannelWorkspaceVariables } from '@insightpad/dataconnect';
import { useSalesChannelWorkspace } from '@insightpad/dataconnect/react'

export default function SalesChannelWorkspaceComponent() {
  // The `useSalesChannelWorkspace` Query hook requires an argument of type `SalesChannelWorkspaceVariables`:
  const salesChannelWorkspaceVars: SalesChannelWorkspaceVariables = {
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useSalesChannelWorkspace(salesChannelWorkspaceVars);
  // Variables can be defined inline as well.
  const query = useSalesChannelWorkspace({ requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useSalesChannelWorkspace(dataConnect, salesChannelWorkspaceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useSalesChannelWorkspace(salesChannelWorkspaceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useSalesChannelWorkspace(dataConnect, salesChannelWorkspaceVars, options);

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

## SalesWorkspace
You can execute the `SalesWorkspace` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useSalesWorkspace(dc: DataConnect, vars: SalesWorkspaceVariables, options?: useDataConnectQueryOptions<SalesWorkspaceData>): UseDataConnectQueryResult<SalesWorkspaceData, SalesWorkspaceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useSalesWorkspace(vars: SalesWorkspaceVariables, options?: useDataConnectQueryOptions<SalesWorkspaceData>): UseDataConnectQueryResult<SalesWorkspaceData, SalesWorkspaceVariables>;
```

### Variables
The `SalesWorkspace` Query requires an argument of type `SalesWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SalesWorkspaceVariables {
  branchId?: UUIDString | null;
  requestKey: string;
}
```
### Return Type
Recall that calling the `SalesWorkspace` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `SalesWorkspace` Query is of type `SalesWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SalesWorkspaceData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `SalesWorkspace`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SalesWorkspaceVariables } from '@insightpad/dataconnect';
import { useSalesWorkspace } from '@insightpad/dataconnect/react'

export default function SalesWorkspaceComponent() {
  // The `useSalesWorkspace` Query hook requires an argument of type `SalesWorkspaceVariables`:
  const salesWorkspaceVars: SalesWorkspaceVariables = {
    branchId: ..., // optional
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useSalesWorkspace(salesWorkspaceVars);
  // Variables can be defined inline as well.
  const query = useSalesWorkspace({ branchId: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useSalesWorkspace(dataConnect, salesWorkspaceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useSalesWorkspace(salesWorkspaceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useSalesWorkspace(dataConnect, salesWorkspaceVars, options);

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

## ListSales
You can execute the `ListSales` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListSales(dc: DataConnect, vars: ListSalesVariables, options?: useDataConnectQueryOptions<ListSalesData>): UseDataConnectQueryResult<ListSalesData, ListSalesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListSales(vars: ListSalesVariables, options?: useDataConnectQueryOptions<ListSalesData>): UseDataConnectQueryResult<ListSalesData, ListSalesVariables>;
```

### Variables
The `ListSales` Query requires an argument of type `ListSalesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListSalesVariables {
  filters: unknown;
  limit: number;
  offset: number;
  requestKey: string;
}
```
### Return Type
Recall that calling the `ListSales` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListSales` Query is of type `ListSalesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListSalesData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListSales`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListSalesVariables } from '@insightpad/dataconnect';
import { useListSales } from '@insightpad/dataconnect/react'

export default function ListSalesComponent() {
  // The `useListSales` Query hook requires an argument of type `ListSalesVariables`:
  const listSalesVars: ListSalesVariables = {
    filters: ..., 
    limit: ..., 
    offset: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListSales(listSalesVars);
  // Variables can be defined inline as well.
  const query = useListSales({ filters: ..., limit: ..., offset: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListSales(dataConnect, listSalesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListSales(listSalesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListSales(dataConnect, listSalesVars, options);

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

## SaleDetails
You can execute the `SaleDetails` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useSaleDetails(dc: DataConnect, vars: SaleDetailsVariables, options?: useDataConnectQueryOptions<SaleDetailsData>): UseDataConnectQueryResult<SaleDetailsData, SaleDetailsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useSaleDetails(vars: SaleDetailsVariables, options?: useDataConnectQueryOptions<SaleDetailsData>): UseDataConnectQueryResult<SaleDetailsData, SaleDetailsVariables>;
```

### Variables
The `SaleDetails` Query requires an argument of type `SaleDetailsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaleDetailsVariables {
  saleId: UUIDString;
  requestKey: string;
}
```
### Return Type
Recall that calling the `SaleDetails` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `SaleDetails` Query is of type `SaleDetailsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaleDetailsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `SaleDetails`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaleDetailsVariables } from '@insightpad/dataconnect';
import { useSaleDetails } from '@insightpad/dataconnect/react'

export default function SaleDetailsComponent() {
  // The `useSaleDetails` Query hook requires an argument of type `SaleDetailsVariables`:
  const saleDetailsVars: SaleDetailsVariables = {
    saleId: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useSaleDetails(saleDetailsVars);
  // Variables can be defined inline as well.
  const query = useSaleDetails({ saleId: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useSaleDetails(dataConnect, saleDetailsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useSaleDetails(saleDetailsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useSaleDetails(dataConnect, saleDetailsVars, options);

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
useCategoryOptions(dc: DataConnect, vars?: CategoryOptionsVariables, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, CategoryOptionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useCategoryOptions(vars?: CategoryOptionsVariables, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, CategoryOptionsVariables>;
```

### Variables
The `CategoryOptions` Query has an optional argument of type `CategoryOptionsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CategoryOptionsVariables {
  requestKey?: string | null;
}
```
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
import { connectorConfig, CategoryOptionsVariables } from '@insightpad/dataconnect';
import { useCategoryOptions } from '@insightpad/dataconnect/react'

export default function CategoryOptionsComponent() {
  // The `useCategoryOptions` Query hook has an optional argument of type `CategoryOptionsVariables`:
  const categoryOptionsVars: CategoryOptionsVariables = {
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useCategoryOptions(categoryOptionsVars);
  // Variables can be defined inline as well.
  const query = useCategoryOptions({ requestKey: ..., });
  // Since all variables are optional for this Query, you can omit the `CategoryOptionsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useCategoryOptions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useCategoryOptions(dataConnect, categoryOptionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useCategoryOptions(categoryOptionsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useCategoryOptions(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useCategoryOptions(dataConnect, categoryOptionsVars /** or undefined */, options);

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
useRegistrationOptions(dc: DataConnect, vars?: RegistrationOptionsVariables, options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, RegistrationOptionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useRegistrationOptions(vars?: RegistrationOptionsVariables, options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, RegistrationOptionsVariables>;
```

### Variables
The `RegistrationOptions` Query has an optional argument of type `RegistrationOptionsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RegistrationOptionsVariables {
  requestKey?: string | null;
}
```
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
import { connectorConfig, RegistrationOptionsVariables } from '@insightpad/dataconnect';
import { useRegistrationOptions } from '@insightpad/dataconnect/react'

export default function RegistrationOptionsComponent() {
  // The `useRegistrationOptions` Query hook has an optional argument of type `RegistrationOptionsVariables`:
  const registrationOptionsVars: RegistrationOptionsVariables = {
    requestKey: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useRegistrationOptions(registrationOptionsVars);
  // Variables can be defined inline as well.
  const query = useRegistrationOptions({ requestKey: ..., });
  // Since all variables are optional for this Query, you can omit the `RegistrationOptionsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useRegistrationOptions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useRegistrationOptions(dataConnect, registrationOptionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useRegistrationOptions(registrationOptionsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useRegistrationOptions(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useRegistrationOptions(dataConnect, registrationOptionsVars /** or undefined */, options);

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

## PlatformAdminWorkspace
You can execute the `PlatformAdminWorkspace` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
usePlatformAdminWorkspace(dc: DataConnect, vars: PlatformAdminWorkspaceVariables, options?: useDataConnectQueryOptions<PlatformAdminWorkspaceData>): UseDataConnectQueryResult<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
usePlatformAdminWorkspace(vars: PlatformAdminWorkspaceVariables, options?: useDataConnectQueryOptions<PlatformAdminWorkspaceData>): UseDataConnectQueryResult<PlatformAdminWorkspaceData, PlatformAdminWorkspaceVariables>;
```

### Variables
The `PlatformAdminWorkspace` Query requires an argument of type `PlatformAdminWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface PlatformAdminWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that calling the `PlatformAdminWorkspace` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `PlatformAdminWorkspace` Query is of type `PlatformAdminWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface PlatformAdminWorkspaceData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `PlatformAdminWorkspace`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, PlatformAdminWorkspaceVariables } from '@insightpad/dataconnect';
import { usePlatformAdminWorkspace } from '@insightpad/dataconnect/react'

export default function PlatformAdminWorkspaceComponent() {
  // The `usePlatformAdminWorkspace` Query hook requires an argument of type `PlatformAdminWorkspaceVariables`:
  const platformAdminWorkspaceVars: PlatformAdminWorkspaceVariables = {
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = usePlatformAdminWorkspace(platformAdminWorkspaceVars);
  // Variables can be defined inline as well.
  const query = usePlatformAdminWorkspace({ requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = usePlatformAdminWorkspace(dataConnect, platformAdminWorkspaceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = usePlatformAdminWorkspace(platformAdminWorkspaceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = usePlatformAdminWorkspace(dataConnect, platformAdminWorkspaceVars, options);

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

## StockWorkspace
You can execute the `StockWorkspace` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useStockWorkspace(dc: DataConnect, vars: StockWorkspaceVariables, options?: useDataConnectQueryOptions<StockWorkspaceData>): UseDataConnectQueryResult<StockWorkspaceData, StockWorkspaceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useStockWorkspace(vars: StockWorkspaceVariables, options?: useDataConnectQueryOptions<StockWorkspaceData>): UseDataConnectQueryResult<StockWorkspaceData, StockWorkspaceVariables>;
```

### Variables
The `StockWorkspace` Query requires an argument of type `StockWorkspaceVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface StockWorkspaceVariables {
  requestKey: string;
}
```
### Return Type
Recall that calling the `StockWorkspace` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `StockWorkspace` Query is of type `StockWorkspaceData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface StockWorkspaceData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `StockWorkspace`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, StockWorkspaceVariables } from '@insightpad/dataconnect';
import { useStockWorkspace } from '@insightpad/dataconnect/react'

export default function StockWorkspaceComponent() {
  // The `useStockWorkspace` Query hook requires an argument of type `StockWorkspaceVariables`:
  const stockWorkspaceVars: StockWorkspaceVariables = {
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useStockWorkspace(stockWorkspaceVars);
  // Variables can be defined inline as well.
  const query = useStockWorkspace({ requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useStockWorkspace(dataConnect, stockWorkspaceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useStockWorkspace(stockWorkspaceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useStockWorkspace(dataConnect, stockWorkspaceVars, options);

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

## DailyProfitDashboard
You can execute the `DailyProfitDashboard` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useDailyProfitDashboard(dc: DataConnect, vars: DailyProfitDashboardVariables, options?: useDataConnectQueryOptions<DailyProfitDashboardData>): UseDataConnectQueryResult<DailyProfitDashboardData, DailyProfitDashboardVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useDailyProfitDashboard(vars: DailyProfitDashboardVariables, options?: useDataConnectQueryOptions<DailyProfitDashboardData>): UseDataConnectQueryResult<DailyProfitDashboardData, DailyProfitDashboardVariables>;
```

### Variables
The `DailyProfitDashboard` Query requires an argument of type `DailyProfitDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DailyProfitDashboardVariables {
  from: DateString;
  to: DateString;
  branchId?: UUIDString | null;
  requestKey: string;
}
```
### Return Type
Recall that calling the `DailyProfitDashboard` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `DailyProfitDashboard` Query is of type `DailyProfitDashboardData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DailyProfitDashboardData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `DailyProfitDashboard`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DailyProfitDashboardVariables } from '@insightpad/dataconnect';
import { useDailyProfitDashboard } from '@insightpad/dataconnect/react'

export default function DailyProfitDashboardComponent() {
  // The `useDailyProfitDashboard` Query hook requires an argument of type `DailyProfitDashboardVariables`:
  const dailyProfitDashboardVars: DailyProfitDashboardVariables = {
    from: ..., 
    to: ..., 
    branchId: ..., // optional
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useDailyProfitDashboard(dailyProfitDashboardVars);
  // Variables can be defined inline as well.
  const query = useDailyProfitDashboard({ from: ..., to: ..., branchId: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useDailyProfitDashboard(dataConnect, dailyProfitDashboardVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useDailyProfitDashboard(dailyProfitDashboardVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useDailyProfitDashboard(dataConnect, dailyProfitDashboardVars, options);

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

## StockOperationDetails
You can execute the `StockOperationDetails` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useStockOperationDetails(dc: DataConnect, vars: StockOperationDetailsVariables, options?: useDataConnectQueryOptions<StockOperationDetailsData>): UseDataConnectQueryResult<StockOperationDetailsData, StockOperationDetailsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useStockOperationDetails(vars: StockOperationDetailsVariables, options?: useDataConnectQueryOptions<StockOperationDetailsData>): UseDataConnectQueryResult<StockOperationDetailsData, StockOperationDetailsVariables>;
```

### Variables
The `StockOperationDetails` Query requires an argument of type `StockOperationDetailsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface StockOperationDetailsVariables {
  operationId: string;
  requestKey: string;
}
```
### Return Type
Recall that calling the `StockOperationDetails` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `StockOperationDetails` Query is of type `StockOperationDetailsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface StockOperationDetailsData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `StockOperationDetails`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, StockOperationDetailsVariables } from '@insightpad/dataconnect';
import { useStockOperationDetails } from '@insightpad/dataconnect/react'

export default function StockOperationDetailsComponent() {
  // The `useStockOperationDetails` Query hook requires an argument of type `StockOperationDetailsVariables`:
  const stockOperationDetailsVars: StockOperationDetailsVariables = {
    operationId: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useStockOperationDetails(stockOperationDetailsVars);
  // Variables can be defined inline as well.
  const query = useStockOperationDetails({ operationId: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useStockOperationDetails(dataConnect, stockOperationDetailsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useStockOperationDetails(stockOperationDetailsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useStockOperationDetails(dataConnect, stockOperationDetailsVars, options);

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

## FinancialIndicatorsDashboard
You can execute the `FinancialIndicatorsDashboard` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useFinancialIndicatorsDashboard(dc: DataConnect, vars: FinancialIndicatorsDashboardVariables, options?: useDataConnectQueryOptions<FinancialIndicatorsDashboardData>): UseDataConnectQueryResult<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useFinancialIndicatorsDashboard(vars: FinancialIndicatorsDashboardVariables, options?: useDataConnectQueryOptions<FinancialIndicatorsDashboardData>): UseDataConnectQueryResult<FinancialIndicatorsDashboardData, FinancialIndicatorsDashboardVariables>;
```

### Variables
The `FinancialIndicatorsDashboard` Query requires an argument of type `FinancialIndicatorsDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface FinancialIndicatorsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
}
```
### Return Type
Recall that calling the `FinancialIndicatorsDashboard` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `FinancialIndicatorsDashboard` Query is of type `FinancialIndicatorsDashboardData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface FinancialIndicatorsDashboardData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `FinancialIndicatorsDashboard`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, FinancialIndicatorsDashboardVariables } from '@insightpad/dataconnect';
import { useFinancialIndicatorsDashboard } from '@insightpad/dataconnect/react'

export default function FinancialIndicatorsDashboardComponent() {
  // The `useFinancialIndicatorsDashboard` Query hook requires an argument of type `FinancialIndicatorsDashboardVariables`:
  const financialIndicatorsDashboardVars: FinancialIndicatorsDashboardVariables = {
    from: ..., 
    to: ..., 
    filters: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useFinancialIndicatorsDashboard(financialIndicatorsDashboardVars);
  // Variables can be defined inline as well.
  const query = useFinancialIndicatorsDashboard({ from: ..., to: ..., filters: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useFinancialIndicatorsDashboard(dataConnect, financialIndicatorsDashboardVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useFinancialIndicatorsDashboard(financialIndicatorsDashboardVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useFinancialIndicatorsDashboard(dataConnect, financialIndicatorsDashboardVars, options);

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

## OperationalAnalyticsDashboard
You can execute the `OperationalAnalyticsDashboard` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useOperationalAnalyticsDashboard(dc: DataConnect, vars: OperationalAnalyticsDashboardVariables, options?: useDataConnectQueryOptions<OperationalAnalyticsDashboardData>): UseDataConnectQueryResult<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useOperationalAnalyticsDashboard(vars: OperationalAnalyticsDashboardVariables, options?: useDataConnectQueryOptions<OperationalAnalyticsDashboardData>): UseDataConnectQueryResult<OperationalAnalyticsDashboardData, OperationalAnalyticsDashboardVariables>;
```

### Variables
The `OperationalAnalyticsDashboard` Query requires an argument of type `OperationalAnalyticsDashboardVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface OperationalAnalyticsDashboardVariables {
  from: DateString;
  to: DateString;
  filters: unknown;
  requestKey: string;
}
```
### Return Type
Recall that calling the `OperationalAnalyticsDashboard` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `OperationalAnalyticsDashboard` Query is of type `OperationalAnalyticsDashboardData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface OperationalAnalyticsDashboardData {
  _select?: unknown[] | null;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `OperationalAnalyticsDashboard`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, OperationalAnalyticsDashboardVariables } from '@insightpad/dataconnect';
import { useOperationalAnalyticsDashboard } from '@insightpad/dataconnect/react'

export default function OperationalAnalyticsDashboardComponent() {
  // The `useOperationalAnalyticsDashboard` Query hook requires an argument of type `OperationalAnalyticsDashboardVariables`:
  const operationalAnalyticsDashboardVars: OperationalAnalyticsDashboardVariables = {
    from: ..., 
    to: ..., 
    filters: ..., 
    requestKey: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useOperationalAnalyticsDashboard(operationalAnalyticsDashboardVars);
  // Variables can be defined inline as well.
  const query = useOperationalAnalyticsDashboard({ from: ..., to: ..., filters: ..., requestKey: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useOperationalAnalyticsDashboard(dataConnect, operationalAnalyticsDashboardVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useOperationalAnalyticsDashboard(operationalAnalyticsDashboardVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useOperationalAnalyticsDashboard(dataConnect, operationalAnalyticsDashboardVars, options);

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

## BootstrapSalesChannelsNavigation
You can execute the `BootstrapSalesChannelsNavigation` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useBootstrapSalesChannelsNavigation(options?: useDataConnectMutationOptions<BootstrapSalesChannelsNavigationData, FirebaseError, BootstrapSalesChannelsNavigationVariables>): UseDataConnectMutationResult<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBootstrapSalesChannelsNavigation(dc: DataConnect, options?: useDataConnectMutationOptions<BootstrapSalesChannelsNavigationData, FirebaseError, BootstrapSalesChannelsNavigationVariables>): UseDataConnectMutationResult<BootstrapSalesChannelsNavigationData, BootstrapSalesChannelsNavigationVariables>;
```

### Variables
The `BootstrapSalesChannelsNavigation` Mutation requires an argument of type `BootstrapSalesChannelsNavigationVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BootstrapSalesChannelsNavigationVariables {
  tenantId: UUIDString;
  platformAdminRoleId: UUIDString;
}
```
### Return Type
Recall that calling the `BootstrapSalesChannelsNavigation` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `BootstrapSalesChannelsNavigation` Mutation is of type `BootstrapSalesChannelsNavigationData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BootstrapSalesChannelsNavigationData {
  page: AppPage_Key;
  permission: RolePagePermission_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `BootstrapSalesChannelsNavigation`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BootstrapSalesChannelsNavigationVariables } from '@insightpad/dataconnect';
import { useBootstrapSalesChannelsNavigation } from '@insightpad/dataconnect/react'

export default function BootstrapSalesChannelsNavigationComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBootstrapSalesChannelsNavigation();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBootstrapSalesChannelsNavigation(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapSalesChannelsNavigation(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapSalesChannelsNavigation(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useBootstrapSalesChannelsNavigation` Mutation requires an argument of type `BootstrapSalesChannelsNavigationVariables`:
  const bootstrapSalesChannelsNavigationVars: BootstrapSalesChannelsNavigationVariables = {
    tenantId: ..., 
    platformAdminRoleId: ..., 
  };
  mutation.mutate(bootstrapSalesChannelsNavigationVars);
  // Variables can be defined inline as well.
  mutation.mutate({ tenantId: ..., platformAdminRoleId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(bootstrapSalesChannelsNavigationVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.page);
    console.log(mutation.data.permission);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## BootstrapSalesChannelsNavigationV2
You can execute the `BootstrapSalesChannelsNavigationV2` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useBootstrapSalesChannelsNavigationV2(options?: useDataConnectMutationOptions<BootstrapSalesChannelsNavigationV2Data, FirebaseError, void>): UseDataConnectMutationResult<BootstrapSalesChannelsNavigationV2Data, undefined>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useBootstrapSalesChannelsNavigationV2(dc: DataConnect, options?: useDataConnectMutationOptions<BootstrapSalesChannelsNavigationV2Data, FirebaseError, void>): UseDataConnectMutationResult<BootstrapSalesChannelsNavigationV2Data, undefined>;
```

### Variables
The `BootstrapSalesChannelsNavigationV2` Mutation has no variables.
### Return Type
Recall that calling the `BootstrapSalesChannelsNavigationV2` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `BootstrapSalesChannelsNavigationV2` Mutation is of type `BootstrapSalesChannelsNavigationV2Data`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface BootstrapSalesChannelsNavigationV2Data {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `BootstrapSalesChannelsNavigationV2`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useBootstrapSalesChannelsNavigationV2 } from '@insightpad/dataconnect/react'

export default function BootstrapSalesChannelsNavigationV2Component() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useBootstrapSalesChannelsNavigationV2();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useBootstrapSalesChannelsNavigationV2(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapSalesChannelsNavigationV2(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useBootstrapSalesChannelsNavigationV2(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since this Mutation accepts no variables, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(undefined, options);

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
    console.log(mutation.data.pageCanaisVenda);
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
    console.log(mutation.data.permissionCanaisVenda);
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

## CreateCategoriesBatch
You can execute the `CreateCategoriesBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateCategoriesBatch(options?: useDataConnectMutationOptions<CreateCategoriesBatchData, FirebaseError, CreateCategoriesBatchVariables>): UseDataConnectMutationResult<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateCategoriesBatch(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoriesBatchData, FirebaseError, CreateCategoriesBatchVariables>): UseDataConnectMutationResult<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
```

### Variables
The `CreateCategoriesBatch` Mutation requires an argument of type `CreateCategoriesBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateCategoriesBatchVariables {
  names: unknown;
}
```
### Return Type
Recall that calling the `CreateCategoriesBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateCategoriesBatch` Mutation is of type `CreateCategoriesBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateCategoriesBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateCategoriesBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateCategoriesBatchVariables } from '@insightpad/dataconnect';
import { useCreateCategoriesBatch } from '@insightpad/dataconnect/react'

export default function CreateCategoriesBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateCategoriesBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateCategoriesBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCategoriesBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateCategoriesBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateCategoriesBatch` Mutation requires an argument of type `CreateCategoriesBatchVariables`:
  const createCategoriesBatchVars: CreateCategoriesBatchVariables = {
    names: ..., 
  };
  mutation.mutate(createCategoriesBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ names: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createCategoriesBatchVars, options);

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

## CreateSubcategoriesBatch
You can execute the `CreateSubcategoriesBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateSubcategoriesBatch(options?: useDataConnectMutationOptions<CreateSubcategoriesBatchData, FirebaseError, CreateSubcategoriesBatchVariables>): UseDataConnectMutationResult<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateSubcategoriesBatch(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSubcategoriesBatchData, FirebaseError, CreateSubcategoriesBatchVariables>): UseDataConnectMutationResult<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
```

### Variables
The `CreateSubcategoriesBatch` Mutation requires an argument of type `CreateSubcategoriesBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateSubcategoriesBatchVariables {
  items: unknown;
}
```
### Return Type
Recall that calling the `CreateSubcategoriesBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateSubcategoriesBatch` Mutation is of type `CreateSubcategoriesBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateSubcategoriesBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateSubcategoriesBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateSubcategoriesBatchVariables } from '@insightpad/dataconnect';
import { useCreateSubcategoriesBatch } from '@insightpad/dataconnect/react'

export default function CreateSubcategoriesBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateSubcategoriesBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateSubcategoriesBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSubcategoriesBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSubcategoriesBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateSubcategoriesBatch` Mutation requires an argument of type `CreateSubcategoriesBatchVariables`:
  const createSubcategoriesBatchVars: CreateSubcategoriesBatchVariables = {
    items: ..., 
  };
  mutation.mutate(createSubcategoriesBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ items: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createSubcategoriesBatchVars, options);

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

## SetCategoriesStatusBatch
You can execute the `SetCategoriesStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetCategoriesStatusBatch(options?: useDataConnectMutationOptions<SetCategoriesStatusBatchData, FirebaseError, SetCategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetCategoriesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetCategoriesStatusBatchData, FirebaseError, SetCategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
```

### Variables
The `SetCategoriesStatusBatch` Mutation requires an argument of type `SetCategoriesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetCategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetCategoriesStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetCategoriesStatusBatch` Mutation is of type `SetCategoriesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetCategoriesStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetCategoriesStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetCategoriesStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetCategoriesStatusBatch } from '@insightpad/dataconnect/react'

export default function SetCategoriesStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetCategoriesStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetCategoriesStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCategoriesStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCategoriesStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetCategoriesStatusBatch` Mutation requires an argument of type `SetCategoriesStatusBatchVariables`:
  const setCategoriesStatusBatchVars: SetCategoriesStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setCategoriesStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setCategoriesStatusBatchVars, options);

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

## SetSubcategoriesStatusBatch
You can execute the `SetSubcategoriesStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetSubcategoriesStatusBatch(options?: useDataConnectMutationOptions<SetSubcategoriesStatusBatchData, FirebaseError, SetSubcategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetSubcategoriesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetSubcategoriesStatusBatchData, FirebaseError, SetSubcategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
```

### Variables
The `SetSubcategoriesStatusBatch` Mutation requires an argument of type `SetSubcategoriesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetSubcategoriesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetSubcategoriesStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetSubcategoriesStatusBatch` Mutation is of type `SetSubcategoriesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetSubcategoriesStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetSubcategoriesStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetSubcategoriesStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetSubcategoriesStatusBatch } from '@insightpad/dataconnect/react'

export default function SetSubcategoriesStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetSubcategoriesStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetSubcategoriesStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSubcategoriesStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSubcategoriesStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetSubcategoriesStatusBatch` Mutation requires an argument of type `SetSubcategoriesStatusBatchVariables`:
  const setSubcategoriesStatusBatchVars: SetSubcategoriesStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setSubcategoriesStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setSubcategoriesStatusBatchVars, options);

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

## SetBranchesStatusBatch
You can execute the `SetBranchesStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetBranchesStatusBatch(options?: useDataConnectMutationOptions<SetBranchesStatusBatchData, FirebaseError, SetBranchesStatusBatchVariables>): UseDataConnectMutationResult<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetBranchesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetBranchesStatusBatchData, FirebaseError, SetBranchesStatusBatchVariables>): UseDataConnectMutationResult<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
```

### Variables
The `SetBranchesStatusBatch` Mutation requires an argument of type `SetBranchesStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetBranchesStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetBranchesStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetBranchesStatusBatch` Mutation is of type `SetBranchesStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetBranchesStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetBranchesStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetBranchesStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetBranchesStatusBatch } from '@insightpad/dataconnect/react'

export default function SetBranchesStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetBranchesStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetBranchesStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetBranchesStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetBranchesStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetBranchesStatusBatch` Mutation requires an argument of type `SetBranchesStatusBatchVariables`:
  const setBranchesStatusBatchVars: SetBranchesStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setBranchesStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setBranchesStatusBatchVars, options);

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

## SetSuppliersStatusBatch
You can execute the `SetSuppliersStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetSuppliersStatusBatch(options?: useDataConnectMutationOptions<SetSuppliersStatusBatchData, FirebaseError, SetSuppliersStatusBatchVariables>): UseDataConnectMutationResult<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetSuppliersStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetSuppliersStatusBatchData, FirebaseError, SetSuppliersStatusBatchVariables>): UseDataConnectMutationResult<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
```

### Variables
The `SetSuppliersStatusBatch` Mutation requires an argument of type `SetSuppliersStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetSuppliersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetSuppliersStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetSuppliersStatusBatch` Mutation is of type `SetSuppliersStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetSuppliersStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetSuppliersStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetSuppliersStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetSuppliersStatusBatch } from '@insightpad/dataconnect/react'

export default function SetSuppliersStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetSuppliersStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetSuppliersStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSuppliersStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetSuppliersStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetSuppliersStatusBatch` Mutation requires an argument of type `SetSuppliersStatusBatchVariables`:
  const setSuppliersStatusBatchVars: SetSuppliersStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setSuppliersStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setSuppliersStatusBatchVars, options);

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

## SetCustomersStatusBatch
You can execute the `SetCustomersStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetCustomersStatusBatch(options?: useDataConnectMutationOptions<SetCustomersStatusBatchData, FirebaseError, SetCustomersStatusBatchVariables>): UseDataConnectMutationResult<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetCustomersStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetCustomersStatusBatchData, FirebaseError, SetCustomersStatusBatchVariables>): UseDataConnectMutationResult<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
```

### Variables
The `SetCustomersStatusBatch` Mutation requires an argument of type `SetCustomersStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetCustomersStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetCustomersStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetCustomersStatusBatch` Mutation is of type `SetCustomersStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetCustomersStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetCustomersStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetCustomersStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetCustomersStatusBatch } from '@insightpad/dataconnect/react'

export default function SetCustomersStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetCustomersStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetCustomersStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCustomersStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetCustomersStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetCustomersStatusBatch` Mutation requires an argument of type `SetCustomersStatusBatchVariables`:
  const setCustomersStatusBatchVars: SetCustomersStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setCustomersStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setCustomersStatusBatchVars, options);

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

## SetProductsStatusBatch
You can execute the `SetProductsStatusBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetProductsStatusBatch(options?: useDataConnectMutationOptions<SetProductsStatusBatchData, FirebaseError, SetProductsStatusBatchVariables>): UseDataConnectMutationResult<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetProductsStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetProductsStatusBatchData, FirebaseError, SetProductsStatusBatchVariables>): UseDataConnectMutationResult<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
```

### Variables
The `SetProductsStatusBatch` Mutation requires an argument of type `SetProductsStatusBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetProductsStatusBatchVariables {
  ids: unknown;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetProductsStatusBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetProductsStatusBatch` Mutation is of type `SetProductsStatusBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetProductsStatusBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetProductsStatusBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetProductsStatusBatchVariables } from '@insightpad/dataconnect';
import { useSetProductsStatusBatch } from '@insightpad/dataconnect/react'

export default function SetProductsStatusBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetProductsStatusBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetProductsStatusBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetProductsStatusBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetProductsStatusBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetProductsStatusBatch` Mutation requires an argument of type `SetProductsStatusBatchVariables`:
  const setProductsStatusBatchVars: SetProductsStatusBatchVariables = {
    ids: ..., 
    active: ..., 
  };
  mutation.mutate(setProductsStatusBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ ids: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setProductsStatusBatchVars, options);

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

## EnsureSalesDefaults
You can execute the `EnsureSalesDefaults` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useEnsureSalesDefaults(options?: useDataConnectMutationOptions<EnsureSalesDefaultsData, FirebaseError, void>): UseDataConnectMutationResult<EnsureSalesDefaultsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useEnsureSalesDefaults(dc: DataConnect, options?: useDataConnectMutationOptions<EnsureSalesDefaultsData, FirebaseError, void>): UseDataConnectMutationResult<EnsureSalesDefaultsData, undefined>;
```

### Variables
The `EnsureSalesDefaults` Mutation has no variables.
### Return Type
Recall that calling the `EnsureSalesDefaults` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `EnsureSalesDefaults` Mutation is of type `EnsureSalesDefaultsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface EnsureSalesDefaultsData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `EnsureSalesDefaults`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useEnsureSalesDefaults } from '@insightpad/dataconnect/react'

export default function EnsureSalesDefaultsComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useEnsureSalesDefaults();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useEnsureSalesDefaults(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useEnsureSalesDefaults(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useEnsureSalesDefaults(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since this Mutation accepts no variables, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(undefined, options);

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

## PostSale
You can execute the `PostSale` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
usePostSale(options?: useDataConnectMutationOptions<PostSaleData, FirebaseError, PostSaleVariables>): UseDataConnectMutationResult<PostSaleData, PostSaleVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
usePostSale(dc: DataConnect, options?: useDataConnectMutationOptions<PostSaleData, FirebaseError, PostSaleVariables>): UseDataConnectMutationResult<PostSaleData, PostSaleVariables>;
```

### Variables
The `PostSale` Mutation requires an argument of type `PostSaleVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface PostSaleVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `PostSale` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `PostSale` Mutation is of type `PostSaleData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface PostSaleData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `PostSale`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, PostSaleVariables } from '@insightpad/dataconnect';
import { usePostSale } from '@insightpad/dataconnect/react'

export default function PostSaleComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = usePostSale();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = usePostSale(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostSale(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostSale(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `usePostSale` Mutation requires an argument of type `PostSaleVariables`:
  const postSaleVars: PostSaleVariables = {
    payload: ..., 
  };
  mutation.mutate(postSaleVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(postSaleVars, options);

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

## CancelSale
You can execute the `CancelSale` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCancelSale(options?: useDataConnectMutationOptions<CancelSaleData, FirebaseError, CancelSaleVariables>): UseDataConnectMutationResult<CancelSaleData, CancelSaleVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCancelSale(dc: DataConnect, options?: useDataConnectMutationOptions<CancelSaleData, FirebaseError, CancelSaleVariables>): UseDataConnectMutationResult<CancelSaleData, CancelSaleVariables>;
```

### Variables
The `CancelSale` Mutation requires an argument of type `CancelSaleVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CancelSaleVariables {
  saleId: UUIDString;
  reason: string;
}
```
### Return Type
Recall that calling the `CancelSale` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CancelSale` Mutation is of type `CancelSaleData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CancelSaleData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CancelSale`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CancelSaleVariables } from '@insightpad/dataconnect';
import { useCancelSale } from '@insightpad/dataconnect/react'

export default function CancelSaleComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCancelSale();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCancelSale(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCancelSale(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCancelSale(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCancelSale` Mutation requires an argument of type `CancelSaleVariables`:
  const cancelSaleVars: CancelSaleVariables = {
    saleId: ..., 
    reason: ..., 
  };
  mutation.mutate(cancelSaleVars);
  // Variables can be defined inline as well.
  mutation.mutate({ saleId: ..., reason: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(cancelSaleVars, options);

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

## CreatePlatformTenant
You can execute the `CreatePlatformTenant` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreatePlatformTenant(options?: useDataConnectMutationOptions<CreatePlatformTenantData, FirebaseError, CreatePlatformTenantVariables>): UseDataConnectMutationResult<CreatePlatformTenantData, CreatePlatformTenantVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreatePlatformTenant(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePlatformTenantData, FirebaseError, CreatePlatformTenantVariables>): UseDataConnectMutationResult<CreatePlatformTenantData, CreatePlatformTenantVariables>;
```

### Variables
The `CreatePlatformTenant` Mutation requires an argument of type `CreatePlatformTenantVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreatePlatformTenantVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `CreatePlatformTenant` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreatePlatformTenant` Mutation is of type `CreatePlatformTenantData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreatePlatformTenantData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreatePlatformTenant`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreatePlatformTenantVariables } from '@insightpad/dataconnect';
import { useCreatePlatformTenant } from '@insightpad/dataconnect/react'

export default function CreatePlatformTenantComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreatePlatformTenant();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreatePlatformTenant(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePlatformTenant(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreatePlatformTenant(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreatePlatformTenant` Mutation requires an argument of type `CreatePlatformTenantVariables`:
  const createPlatformTenantVars: CreatePlatformTenantVariables = {
    payload: ..., 
  };
  mutation.mutate(createPlatformTenantVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createPlatformTenantVars, options);

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

## SetPlatformTenantStatus
You can execute the `SetPlatformTenantStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetPlatformTenantStatus(options?: useDataConnectMutationOptions<SetPlatformTenantStatusData, FirebaseError, SetPlatformTenantStatusVariables>): UseDataConnectMutationResult<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetPlatformTenantStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPlatformTenantStatusData, FirebaseError, SetPlatformTenantStatusVariables>): UseDataConnectMutationResult<SetPlatformTenantStatusData, SetPlatformTenantStatusVariables>;
```

### Variables
The `SetPlatformTenantStatus` Mutation requires an argument of type `SetPlatformTenantStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetPlatformTenantStatusVariables {
  tenantId: UUIDString;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetPlatformTenantStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetPlatformTenantStatus` Mutation is of type `SetPlatformTenantStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetPlatformTenantStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetPlatformTenantStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetPlatformTenantStatusVariables } from '@insightpad/dataconnect';
import { useSetPlatformTenantStatus } from '@insightpad/dataconnect/react'

export default function SetPlatformTenantStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetPlatformTenantStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetPlatformTenantStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformTenantStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformTenantStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetPlatformTenantStatus` Mutation requires an argument of type `SetPlatformTenantStatusVariables`:
  const setPlatformTenantStatusVars: SetPlatformTenantStatusVariables = {
    tenantId: ..., 
    active: ..., 
  };
  mutation.mutate(setPlatformTenantStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ tenantId: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setPlatformTenantStatusVars, options);

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

## LinkPlatformUser
You can execute the `LinkPlatformUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useLinkPlatformUser(options?: useDataConnectMutationOptions<LinkPlatformUserData, FirebaseError, LinkPlatformUserVariables>): UseDataConnectMutationResult<LinkPlatformUserData, LinkPlatformUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useLinkPlatformUser(dc: DataConnect, options?: useDataConnectMutationOptions<LinkPlatformUserData, FirebaseError, LinkPlatformUserVariables>): UseDataConnectMutationResult<LinkPlatformUserData, LinkPlatformUserVariables>;
```

### Variables
The `LinkPlatformUser` Mutation requires an argument of type `LinkPlatformUserVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface LinkPlatformUserVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `LinkPlatformUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `LinkPlatformUser` Mutation is of type `LinkPlatformUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface LinkPlatformUserData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `LinkPlatformUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, LinkPlatformUserVariables } from '@insightpad/dataconnect';
import { useLinkPlatformUser } from '@insightpad/dataconnect/react'

export default function LinkPlatformUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useLinkPlatformUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useLinkPlatformUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useLinkPlatformUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useLinkPlatformUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useLinkPlatformUser` Mutation requires an argument of type `LinkPlatformUserVariables`:
  const linkPlatformUserVars: LinkPlatformUserVariables = {
    payload: ..., 
  };
  mutation.mutate(linkPlatformUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(linkPlatformUserVars, options);

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

## SetPlatformUserStatus
You can execute the `SetPlatformUserStatus` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetPlatformUserStatus(options?: useDataConnectMutationOptions<SetPlatformUserStatusData, FirebaseError, SetPlatformUserStatusVariables>): UseDataConnectMutationResult<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetPlatformUserStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPlatformUserStatusData, FirebaseError, SetPlatformUserStatusVariables>): UseDataConnectMutationResult<SetPlatformUserStatusData, SetPlatformUserStatusVariables>;
```

### Variables
The `SetPlatformUserStatus` Mutation requires an argument of type `SetPlatformUserStatusVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetPlatformUserStatusVariables {
  userId: string;
  active: boolean;
}
```
### Return Type
Recall that calling the `SetPlatformUserStatus` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetPlatformUserStatus` Mutation is of type `SetPlatformUserStatusData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetPlatformUserStatusData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetPlatformUserStatus`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetPlatformUserStatusVariables } from '@insightpad/dataconnect';
import { useSetPlatformUserStatus } from '@insightpad/dataconnect/react'

export default function SetPlatformUserStatusComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetPlatformUserStatus();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetPlatformUserStatus(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformUserStatus(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformUserStatus(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetPlatformUserStatus` Mutation requires an argument of type `SetPlatformUserStatusVariables`:
  const setPlatformUserStatusVars: SetPlatformUserStatusVariables = {
    userId: ..., 
    active: ..., 
  };
  mutation.mutate(setPlatformUserStatusVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., active: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setPlatformUserStatusVars, options);

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

## SetPlatformRolePermission
You can execute the `SetPlatformRolePermission` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetPlatformRolePermission(options?: useDataConnectMutationOptions<SetPlatformRolePermissionData, FirebaseError, SetPlatformRolePermissionVariables>): UseDataConnectMutationResult<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetPlatformRolePermission(dc: DataConnect, options?: useDataConnectMutationOptions<SetPlatformRolePermissionData, FirebaseError, SetPlatformRolePermissionVariables>): UseDataConnectMutationResult<SetPlatformRolePermissionData, SetPlatformRolePermissionVariables>;
```

### Variables
The `SetPlatformRolePermission` Mutation requires an argument of type `SetPlatformRolePermissionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetPlatformRolePermissionVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `SetPlatformRolePermission` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetPlatformRolePermission` Mutation is of type `SetPlatformRolePermissionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetPlatformRolePermissionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetPlatformRolePermission`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetPlatformRolePermissionVariables } from '@insightpad/dataconnect';
import { useSetPlatformRolePermission } from '@insightpad/dataconnect/react'

export default function SetPlatformRolePermissionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetPlatformRolePermission();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetPlatformRolePermission(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformRolePermission(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetPlatformRolePermission(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetPlatformRolePermission` Mutation requires an argument of type `SetPlatformRolePermissionVariables`:
  const setPlatformRolePermissionVars: SetPlatformRolePermissionVariables = {
    payload: ..., 
  };
  mutation.mutate(setPlatformRolePermissionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setPlatformRolePermissionVars, options);

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

## PostStockAdjustment
You can execute the `PostStockAdjustment` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
usePostStockAdjustment(options?: useDataConnectMutationOptions<PostStockAdjustmentData, FirebaseError, PostStockAdjustmentVariables>): UseDataConnectMutationResult<PostStockAdjustmentData, PostStockAdjustmentVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
usePostStockAdjustment(dc: DataConnect, options?: useDataConnectMutationOptions<PostStockAdjustmentData, FirebaseError, PostStockAdjustmentVariables>): UseDataConnectMutationResult<PostStockAdjustmentData, PostStockAdjustmentVariables>;
```

### Variables
The `PostStockAdjustment` Mutation requires an argument of type `PostStockAdjustmentVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface PostStockAdjustmentVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `PostStockAdjustment` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `PostStockAdjustment` Mutation is of type `PostStockAdjustmentData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface PostStockAdjustmentData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `PostStockAdjustment`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, PostStockAdjustmentVariables } from '@insightpad/dataconnect';
import { usePostStockAdjustment } from '@insightpad/dataconnect/react'

export default function PostStockAdjustmentComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = usePostStockAdjustment();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = usePostStockAdjustment(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostStockAdjustment(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostStockAdjustment(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `usePostStockAdjustment` Mutation requires an argument of type `PostStockAdjustmentVariables`:
  const postStockAdjustmentVars: PostStockAdjustmentVariables = {
    payload: ..., 
  };
  mutation.mutate(postStockAdjustmentVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(postStockAdjustmentVars, options);

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

## PostStockTransfer
You can execute the `PostStockTransfer` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
usePostStockTransfer(options?: useDataConnectMutationOptions<PostStockTransferData, FirebaseError, PostStockTransferVariables>): UseDataConnectMutationResult<PostStockTransferData, PostStockTransferVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
usePostStockTransfer(dc: DataConnect, options?: useDataConnectMutationOptions<PostStockTransferData, FirebaseError, PostStockTransferVariables>): UseDataConnectMutationResult<PostStockTransferData, PostStockTransferVariables>;
```

### Variables
The `PostStockTransfer` Mutation requires an argument of type `PostStockTransferVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface PostStockTransferVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `PostStockTransfer` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `PostStockTransfer` Mutation is of type `PostStockTransferData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface PostStockTransferData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `PostStockTransfer`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, PostStockTransferVariables } from '@insightpad/dataconnect';
import { usePostStockTransfer } from '@insightpad/dataconnect/react'

export default function PostStockTransferComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = usePostStockTransfer();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = usePostStockTransfer(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostStockTransfer(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = usePostStockTransfer(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `usePostStockTransfer` Mutation requires an argument of type `PostStockTransferVariables`:
  const postStockTransferVars: PostStockTransferVariables = {
    payload: ..., 
  };
  mutation.mutate(postStockTransferVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(postStockTransferVars, options);

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

## SaveStockBatch
You can execute the `SaveStockBatch` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSaveStockBatch(options?: useDataConnectMutationOptions<SaveStockBatchData, FirebaseError, SaveStockBatchVariables>): UseDataConnectMutationResult<SaveStockBatchData, SaveStockBatchVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSaveStockBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SaveStockBatchData, FirebaseError, SaveStockBatchVariables>): UseDataConnectMutationResult<SaveStockBatchData, SaveStockBatchVariables>;
```

### Variables
The `SaveStockBatch` Mutation requires an argument of type `SaveStockBatchVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SaveStockBatchVariables {
  payload: unknown;
}
```
### Return Type
Recall that calling the `SaveStockBatch` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SaveStockBatch` Mutation is of type `SaveStockBatchData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SaveStockBatchData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SaveStockBatch`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SaveStockBatchVariables } from '@insightpad/dataconnect';
import { useSaveStockBatch } from '@insightpad/dataconnect/react'

export default function SaveStockBatchComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSaveStockBatch();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSaveStockBatch(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveStockBatch(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSaveStockBatch(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSaveStockBatch` Mutation requires an argument of type `SaveStockBatchVariables`:
  const saveStockBatchVars: SaveStockBatchVariables = {
    payload: ..., 
  };
  mutation.mutate(saveStockBatchVars);
  // Variables can be defined inline as well.
  mutation.mutate({ payload: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(saveStockBatchVars, options);

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

## ReverseStockOperation
You can execute the `ReverseStockOperation` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useReverseStockOperation(options?: useDataConnectMutationOptions<ReverseStockOperationData, FirebaseError, ReverseStockOperationVariables>): UseDataConnectMutationResult<ReverseStockOperationData, ReverseStockOperationVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useReverseStockOperation(dc: DataConnect, options?: useDataConnectMutationOptions<ReverseStockOperationData, FirebaseError, ReverseStockOperationVariables>): UseDataConnectMutationResult<ReverseStockOperationData, ReverseStockOperationVariables>;
```

### Variables
The `ReverseStockOperation` Mutation requires an argument of type `ReverseStockOperationVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ReverseStockOperationVariables {
  operationId: string;
  movementIds: unknown;
  reason: string;
}
```
### Return Type
Recall that calling the `ReverseStockOperation` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ReverseStockOperation` Mutation is of type `ReverseStockOperationData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ReverseStockOperationData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ReverseStockOperation`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ReverseStockOperationVariables } from '@insightpad/dataconnect';
import { useReverseStockOperation } from '@insightpad/dataconnect/react'

export default function ReverseStockOperationComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useReverseStockOperation();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useReverseStockOperation(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useReverseStockOperation(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useReverseStockOperation(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useReverseStockOperation` Mutation requires an argument of type `ReverseStockOperationVariables`:
  const reverseStockOperationVars: ReverseStockOperationVariables = {
    operationId: ..., 
    movementIds: ..., 
    reason: ..., 
  };
  mutation.mutate(reverseStockOperationVars);
  // Variables can be defined inline as well.
  mutation.mutate({ operationId: ..., movementIds: ..., reason: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(reverseStockOperationVars, options);

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

## OpenCashSession
You can execute the `OpenCashSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useOpenCashSession(options?: useDataConnectMutationOptions<OpenCashSessionData, FirebaseError, OpenCashSessionVariables>): UseDataConnectMutationResult<OpenCashSessionData, OpenCashSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useOpenCashSession(dc: DataConnect, options?: useDataConnectMutationOptions<OpenCashSessionData, FirebaseError, OpenCashSessionVariables>): UseDataConnectMutationResult<OpenCashSessionData, OpenCashSessionVariables>;
```

### Variables
The `OpenCashSession` Mutation requires an argument of type `OpenCashSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface OpenCashSessionVariables {
  branchId: UUIDString;
  openingAmountCents: Int64String;
  notes: string;
}
```
### Return Type
Recall that calling the `OpenCashSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `OpenCashSession` Mutation is of type `OpenCashSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface OpenCashSessionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `OpenCashSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, OpenCashSessionVariables } from '@insightpad/dataconnect';
import { useOpenCashSession } from '@insightpad/dataconnect/react'

export default function OpenCashSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useOpenCashSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useOpenCashSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useOpenCashSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useOpenCashSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useOpenCashSession` Mutation requires an argument of type `OpenCashSessionVariables`:
  const openCashSessionVars: OpenCashSessionVariables = {
    branchId: ..., 
    openingAmountCents: ..., 
    notes: ..., 
  };
  mutation.mutate(openCashSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ branchId: ..., openingAmountCents: ..., notes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(openCashSessionVars, options);

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

## RegisterCashMovement
You can execute the `RegisterCashMovement` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRegisterCashMovement(options?: useDataConnectMutationOptions<RegisterCashMovementData, FirebaseError, RegisterCashMovementVariables>): UseDataConnectMutationResult<RegisterCashMovementData, RegisterCashMovementVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRegisterCashMovement(dc: DataConnect, options?: useDataConnectMutationOptions<RegisterCashMovementData, FirebaseError, RegisterCashMovementVariables>): UseDataConnectMutationResult<RegisterCashMovementData, RegisterCashMovementVariables>;
```

### Variables
The `RegisterCashMovement` Mutation requires an argument of type `RegisterCashMovementVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RegisterCashMovementVariables {
  sessionId: UUIDString;
  movementType: string;
  amountCents: Int64String;
  description: string;
}
```
### Return Type
Recall that calling the `RegisterCashMovement` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RegisterCashMovement` Mutation is of type `RegisterCashMovementData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RegisterCashMovementData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RegisterCashMovement`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RegisterCashMovementVariables } from '@insightpad/dataconnect';
import { useRegisterCashMovement } from '@insightpad/dataconnect/react'

export default function RegisterCashMovementComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRegisterCashMovement();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRegisterCashMovement(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegisterCashMovement(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegisterCashMovement(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRegisterCashMovement` Mutation requires an argument of type `RegisterCashMovementVariables`:
  const registerCashMovementVars: RegisterCashMovementVariables = {
    sessionId: ..., 
    movementType: ..., 
    amountCents: ..., 
    description: ..., 
  };
  mutation.mutate(registerCashMovementVars);
  // Variables can be defined inline as well.
  mutation.mutate({ sessionId: ..., movementType: ..., amountCents: ..., description: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(registerCashMovementVars, options);

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

## ClaimDeviceSession
You can execute the `ClaimDeviceSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useClaimDeviceSession(options?: useDataConnectMutationOptions<ClaimDeviceSessionData, FirebaseError, ClaimDeviceSessionVariables>): UseDataConnectMutationResult<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useClaimDeviceSession(dc: DataConnect, options?: useDataConnectMutationOptions<ClaimDeviceSessionData, FirebaseError, ClaimDeviceSessionVariables>): UseDataConnectMutationResult<ClaimDeviceSessionData, ClaimDeviceSessionVariables>;
```

### Variables
The `ClaimDeviceSession` Mutation requires an argument of type `ClaimDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ClaimDeviceSessionVariables {
  sessionToken: string;
  deviceId: string;
  deviceName: string;
}
```
### Return Type
Recall that calling the `ClaimDeviceSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ClaimDeviceSession` Mutation is of type `ClaimDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ClaimDeviceSessionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ClaimDeviceSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ClaimDeviceSessionVariables } from '@insightpad/dataconnect';
import { useClaimDeviceSession } from '@insightpad/dataconnect/react'

export default function ClaimDeviceSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useClaimDeviceSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useClaimDeviceSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useClaimDeviceSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useClaimDeviceSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useClaimDeviceSession` Mutation requires an argument of type `ClaimDeviceSessionVariables`:
  const claimDeviceSessionVars: ClaimDeviceSessionVariables = {
    sessionToken: ..., 
    deviceId: ..., 
    deviceName: ..., 
  };
  mutation.mutate(claimDeviceSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ sessionToken: ..., deviceId: ..., deviceName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(claimDeviceSessionVars, options);

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

## TouchDeviceSession
You can execute the `TouchDeviceSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useTouchDeviceSession(options?: useDataConnectMutationOptions<TouchDeviceSessionData, FirebaseError, TouchDeviceSessionVariables>): UseDataConnectMutationResult<TouchDeviceSessionData, TouchDeviceSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useTouchDeviceSession(dc: DataConnect, options?: useDataConnectMutationOptions<TouchDeviceSessionData, FirebaseError, TouchDeviceSessionVariables>): UseDataConnectMutationResult<TouchDeviceSessionData, TouchDeviceSessionVariables>;
```

### Variables
The `TouchDeviceSession` Mutation requires an argument of type `TouchDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface TouchDeviceSessionVariables {
  sessionToken: string;
}
```
### Return Type
Recall that calling the `TouchDeviceSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `TouchDeviceSession` Mutation is of type `TouchDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface TouchDeviceSessionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `TouchDeviceSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, TouchDeviceSessionVariables } from '@insightpad/dataconnect';
import { useTouchDeviceSession } from '@insightpad/dataconnect/react'

export default function TouchDeviceSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useTouchDeviceSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useTouchDeviceSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTouchDeviceSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useTouchDeviceSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useTouchDeviceSession` Mutation requires an argument of type `TouchDeviceSessionVariables`:
  const touchDeviceSessionVars: TouchDeviceSessionVariables = {
    sessionToken: ..., 
  };
  mutation.mutate(touchDeviceSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ sessionToken: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(touchDeviceSessionVars, options);

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

## ReleaseDeviceSession
You can execute the `ReleaseDeviceSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useReleaseDeviceSession(options?: useDataConnectMutationOptions<ReleaseDeviceSessionData, FirebaseError, ReleaseDeviceSessionVariables>): UseDataConnectMutationResult<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useReleaseDeviceSession(dc: DataConnect, options?: useDataConnectMutationOptions<ReleaseDeviceSessionData, FirebaseError, ReleaseDeviceSessionVariables>): UseDataConnectMutationResult<ReleaseDeviceSessionData, ReleaseDeviceSessionVariables>;
```

### Variables
The `ReleaseDeviceSession` Mutation requires an argument of type `ReleaseDeviceSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ReleaseDeviceSessionVariables {
  sessionToken: string;
}
```
### Return Type
Recall that calling the `ReleaseDeviceSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ReleaseDeviceSession` Mutation is of type `ReleaseDeviceSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ReleaseDeviceSessionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ReleaseDeviceSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ReleaseDeviceSessionVariables } from '@insightpad/dataconnect';
import { useReleaseDeviceSession } from '@insightpad/dataconnect/react'

export default function ReleaseDeviceSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useReleaseDeviceSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useReleaseDeviceSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useReleaseDeviceSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useReleaseDeviceSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useReleaseDeviceSession` Mutation requires an argument of type `ReleaseDeviceSessionVariables`:
  const releaseDeviceSessionVars: ReleaseDeviceSessionVariables = {
    sessionToken: ..., 
  };
  mutation.mutate(releaseDeviceSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ sessionToken: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(releaseDeviceSessionVars, options);

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

## CreateSalesChannelConnection
You can execute the `CreateSalesChannelConnection` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateSalesChannelConnection(options?: useDataConnectMutationOptions<CreateSalesChannelConnectionData, FirebaseError, CreateSalesChannelConnectionVariables>): UseDataConnectMutationResult<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateSalesChannelConnection(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSalesChannelConnectionData, FirebaseError, CreateSalesChannelConnectionVariables>): UseDataConnectMutationResult<CreateSalesChannelConnectionData, CreateSalesChannelConnectionVariables>;
```

### Variables
The `CreateSalesChannelConnection` Mutation requires an argument of type `CreateSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateSalesChannelConnectionVariables {
  provider: string;
  branchId: UUIDString;
  displayName: string;
  externalStoreId: string;
}
```
### Return Type
Recall that calling the `CreateSalesChannelConnection` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateSalesChannelConnection` Mutation is of type `CreateSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateSalesChannelConnectionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateSalesChannelConnection`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateSalesChannelConnectionVariables } from '@insightpad/dataconnect';
import { useCreateSalesChannelConnection } from '@insightpad/dataconnect/react'

export default function CreateSalesChannelConnectionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateSalesChannelConnection();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateSalesChannelConnection(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSalesChannelConnection(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSalesChannelConnection(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateSalesChannelConnection` Mutation requires an argument of type `CreateSalesChannelConnectionVariables`:
  const createSalesChannelConnectionVars: CreateSalesChannelConnectionVariables = {
    provider: ..., 
    branchId: ..., 
    displayName: ..., 
    externalStoreId: ..., 
  };
  mutation.mutate(createSalesChannelConnectionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ provider: ..., branchId: ..., displayName: ..., externalStoreId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createSalesChannelConnectionVars, options);

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

## UpdateSalesChannelConnection
You can execute the `UpdateSalesChannelConnection` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateSalesChannelConnection(options?: useDataConnectMutationOptions<UpdateSalesChannelConnectionData, FirebaseError, UpdateSalesChannelConnectionVariables>): UseDataConnectMutationResult<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateSalesChannelConnection(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSalesChannelConnectionData, FirebaseError, UpdateSalesChannelConnectionVariables>): UseDataConnectMutationResult<UpdateSalesChannelConnectionData, UpdateSalesChannelConnectionVariables>;
```

### Variables
The `UpdateSalesChannelConnection` Mutation requires an argument of type `UpdateSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateSalesChannelConnectionVariables {
  id: UUIDString;
  displayName: string;
  externalStoreId: string;
  enabled: boolean;
}
```
### Return Type
Recall that calling the `UpdateSalesChannelConnection` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateSalesChannelConnection` Mutation is of type `UpdateSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateSalesChannelConnectionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateSalesChannelConnection`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateSalesChannelConnectionVariables } from '@insightpad/dataconnect';
import { useUpdateSalesChannelConnection } from '@insightpad/dataconnect/react'

export default function UpdateSalesChannelConnectionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateSalesChannelConnection();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateSalesChannelConnection(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSalesChannelConnection(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateSalesChannelConnection(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateSalesChannelConnection` Mutation requires an argument of type `UpdateSalesChannelConnectionVariables`:
  const updateSalesChannelConnectionVars: UpdateSalesChannelConnectionVariables = {
    id: ..., 
    displayName: ..., 
    externalStoreId: ..., 
    enabled: ..., 
  };
  mutation.mutate(updateSalesChannelConnectionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., displayName: ..., externalStoreId: ..., enabled: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateSalesChannelConnectionVars, options);

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

## ArchiveSalesChannelConnection
You can execute the `ArchiveSalesChannelConnection` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useArchiveSalesChannelConnection(options?: useDataConnectMutationOptions<ArchiveSalesChannelConnectionData, FirebaseError, ArchiveSalesChannelConnectionVariables>): UseDataConnectMutationResult<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useArchiveSalesChannelConnection(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveSalesChannelConnectionData, FirebaseError, ArchiveSalesChannelConnectionVariables>): UseDataConnectMutationResult<ArchiveSalesChannelConnectionData, ArchiveSalesChannelConnectionVariables>;
```

### Variables
The `ArchiveSalesChannelConnection` Mutation requires an argument of type `ArchiveSalesChannelConnectionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ArchiveSalesChannelConnectionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `ArchiveSalesChannelConnection` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ArchiveSalesChannelConnection` Mutation is of type `ArchiveSalesChannelConnectionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ArchiveSalesChannelConnectionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ArchiveSalesChannelConnection`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ArchiveSalesChannelConnectionVariables } from '@insightpad/dataconnect';
import { useArchiveSalesChannelConnection } from '@insightpad/dataconnect/react'

export default function ArchiveSalesChannelConnectionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useArchiveSalesChannelConnection();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useArchiveSalesChannelConnection(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveSalesChannelConnection(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useArchiveSalesChannelConnection(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useArchiveSalesChannelConnection` Mutation requires an argument of type `ArchiveSalesChannelConnectionVariables`:
  const archiveSalesChannelConnectionVars: ArchiveSalesChannelConnectionVariables = {
    id: ..., 
  };
  mutation.mutate(archiveSalesChannelConnectionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(archiveSalesChannelConnectionVars, options);

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

## CloseCashSession
You can execute the `CloseCashSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCloseCashSession(options?: useDataConnectMutationOptions<CloseCashSessionData, FirebaseError, CloseCashSessionVariables>): UseDataConnectMutationResult<CloseCashSessionData, CloseCashSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCloseCashSession(dc: DataConnect, options?: useDataConnectMutationOptions<CloseCashSessionData, FirebaseError, CloseCashSessionVariables>): UseDataConnectMutationResult<CloseCashSessionData, CloseCashSessionVariables>;
```

### Variables
The `CloseCashSession` Mutation requires an argument of type `CloseCashSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CloseCashSessionVariables {
  sessionId: UUIDString;
  countedAmountCents: Int64String;
  notes: string;
}
```
### Return Type
Recall that calling the `CloseCashSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CloseCashSession` Mutation is of type `CloseCashSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CloseCashSessionData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CloseCashSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CloseCashSessionVariables } from '@insightpad/dataconnect';
import { useCloseCashSession } from '@insightpad/dataconnect/react'

export default function CloseCashSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCloseCashSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCloseCashSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCloseCashSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCloseCashSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCloseCashSession` Mutation requires an argument of type `CloseCashSessionVariables`:
  const closeCashSessionVars: CloseCashSessionVariables = {
    sessionId: ..., 
    countedAmountCents: ..., 
    notes: ..., 
  };
  mutation.mutate(closeCashSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ sessionId: ..., countedAmountCents: ..., notes: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(closeCashSessionVars, options);

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

## RecoverPlatformAdministrator
You can execute the `RecoverPlatformAdministrator` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRecoverPlatformAdministrator(options?: useDataConnectMutationOptions<RecoverPlatformAdministratorData, FirebaseError, void>): UseDataConnectMutationResult<RecoverPlatformAdministratorData, undefined>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRecoverPlatformAdministrator(dc: DataConnect, options?: useDataConnectMutationOptions<RecoverPlatformAdministratorData, FirebaseError, void>): UseDataConnectMutationResult<RecoverPlatformAdministratorData, undefined>;
```

### Variables
The `RecoverPlatformAdministrator` Mutation has no variables.
### Return Type
Recall that calling the `RecoverPlatformAdministrator` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RecoverPlatformAdministrator` Mutation is of type `RecoverPlatformAdministratorData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RecoverPlatformAdministratorData {
  _execute?: number | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RecoverPlatformAdministrator`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@insightpad/dataconnect';
import { useRecoverPlatformAdministrator } from '@insightpad/dataconnect/react'

export default function RecoverPlatformAdministratorComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRecoverPlatformAdministrator();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRecoverPlatformAdministrator(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRecoverPlatformAdministrator(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRecoverPlatformAdministrator(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since this Mutation accepts no variables, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(undefined, options);

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

