# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useBootstrapSalesChannelOrderIndexes, useBootstrapSalesChannelsNavigation, useBootstrapSalesChannelsNavigationV2, useBootstrapNavigationCatalog, useCreateCategory, useUpdateCategory, useArchiveCategory, useCreateSubcategory, useUpdateSubcategory, useArchiveSubcategory } from '@insightpad/dataconnect/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useBootstrapSalesChannelOrderIndexes();

const { data, isPending, isSuccess, isError, error } = useBootstrapSalesChannelsNavigation(bootstrapSalesChannelsNavigationVars);

const { data, isPending, isSuccess, isError, error } = useBootstrapSalesChannelsNavigationV2();

const { data, isPending, isSuccess, isError, error } = useBootstrapNavigationCatalog(bootstrapNavigationCatalogVars);

const { data, isPending, isSuccess, isError, error } = useCreateCategory(createCategoryVars);

const { data, isPending, isSuccess, isError, error } = useUpdateCategory(updateCategoryVars);

const { data, isPending, isSuccess, isError, error } = useArchiveCategory(archiveCategoryVars);

const { data, isPending, isSuccess, isError, error } = useCreateSubcategory(createSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSubcategory(updateSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useArchiveSubcategory(archiveSubcategoryVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { bootstrapSalesChannelOrderIndexes, bootstrapSalesChannelsNavigation, bootstrapSalesChannelsNavigationV2, bootstrapNavigationCatalog, createCategory, updateCategory, archiveCategory, createSubcategory, updateSubcategory, archiveSubcategory } from '@insightpad/dataconnect';


// Operation BootstrapSalesChannelOrderIndexes: 
const { data } = await BootstrapSalesChannelOrderIndexes(dataConnect);

// Operation BootstrapSalesChannelsNavigation:  For variables, look at type BootstrapSalesChannelsNavigationVars in ../index.d.ts
const { data } = await BootstrapSalesChannelsNavigation(dataConnect, bootstrapSalesChannelsNavigationVars);

// Operation BootstrapSalesChannelsNavigationV2: 
const { data } = await BootstrapSalesChannelsNavigationV2(dataConnect);

// Operation BootstrapNavigationCatalog:  For variables, look at type BootstrapNavigationCatalogVars in ../index.d.ts
const { data } = await BootstrapNavigationCatalog(dataConnect, bootstrapNavigationCatalogVars);

// Operation CreateCategory:  For variables, look at type CreateCategoryVars in ../index.d.ts
const { data } = await CreateCategory(dataConnect, createCategoryVars);

// Operation UpdateCategory:  For variables, look at type UpdateCategoryVars in ../index.d.ts
const { data } = await UpdateCategory(dataConnect, updateCategoryVars);

// Operation ArchiveCategory:  For variables, look at type ArchiveCategoryVars in ../index.d.ts
const { data } = await ArchiveCategory(dataConnect, archiveCategoryVars);

// Operation CreateSubcategory:  For variables, look at type CreateSubcategoryVars in ../index.d.ts
const { data } = await CreateSubcategory(dataConnect, createSubcategoryVars);

// Operation UpdateSubcategory:  For variables, look at type UpdateSubcategoryVars in ../index.d.ts
const { data } = await UpdateSubcategory(dataConnect, updateSubcategoryVars);

// Operation ArchiveSubcategory:  For variables, look at type ArchiveSubcategoryVars in ../index.d.ts
const { data } = await ArchiveSubcategory(dataConnect, archiveSubcategoryVars);


```