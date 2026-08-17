# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useBootstrapNavigationCatalog, useCreateCategory, useUpdateCategory, useArchiveCategory, useCreateSubcategory, useUpdateSubcategory, useArchiveSubcategory, useRestoreCategory, useRestoreSubcategory, useSaveBranch } from '@insightpad/dataconnect/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useBootstrapNavigationCatalog(bootstrapNavigationCatalogVars);

const { data, isPending, isSuccess, isError, error } = useCreateCategory(createCategoryVars);

const { data, isPending, isSuccess, isError, error } = useUpdateCategory(updateCategoryVars);

const { data, isPending, isSuccess, isError, error } = useArchiveCategory(archiveCategoryVars);

const { data, isPending, isSuccess, isError, error } = useCreateSubcategory(createSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSubcategory(updateSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useArchiveSubcategory(archiveSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useRestoreCategory(restoreCategoryVars);

const { data, isPending, isSuccess, isError, error } = useRestoreSubcategory(restoreSubcategoryVars);

const { data, isPending, isSuccess, isError, error } = useSaveBranch(saveBranchVars);

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
import { bootstrapNavigationCatalog, createCategory, updateCategory, archiveCategory, createSubcategory, updateSubcategory, archiveSubcategory, restoreCategory, restoreSubcategory, saveBranch } from '@insightpad/dataconnect';


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

// Operation RestoreCategory:  For variables, look at type RestoreCategoryVars in ../index.d.ts
const { data } = await RestoreCategory(dataConnect, restoreCategoryVars);

// Operation RestoreSubcategory:  For variables, look at type RestoreSubcategoryVars in ../index.d.ts
const { data } = await RestoreSubcategory(dataConnect, restoreSubcategoryVars);

// Operation SaveBranch:  For variables, look at type SaveBranchVars in ../index.d.ts
const { data } = await SaveBranch(dataConnect, saveBranchVars);


```