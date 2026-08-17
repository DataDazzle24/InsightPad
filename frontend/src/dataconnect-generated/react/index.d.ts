import { BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables, CreateCategoryData, CreateCategoryVariables, UpdateCategoryData, UpdateCategoryVariables, ArchiveCategoryData, ArchiveCategoryVariables, CreateSubcategoryData, CreateSubcategoryVariables, UpdateSubcategoryData, UpdateSubcategoryVariables, ArchiveSubcategoryData, ArchiveSubcategoryVariables, RestoreCategoryData, RestoreCategoryVariables, RestoreSubcategoryData, RestoreSubcategoryVariables, CreateCategoriesBatchData, CreateCategoriesBatchVariables, CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables, SaveBranchData, SaveBranchVariables, SetBranchStatusData, SetBranchStatusVariables, SaveSupplierData, SaveSupplierVariables, SetSupplierStatusData, SetSupplierStatusVariables, SaveCustomerData, SaveCustomerVariables, SetCustomerStatusData, SetCustomerStatusVariables, SaveProductData, SaveProductVariables, SetProductStatusData, SetProductStatusVariables, SaveProductComponentsData, SaveProductComponentsVariables, SavePromotionData, SavePromotionVariables, SetPromotionStatusData, SetPromotionStatusVariables, SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables, SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables, SetBranchesStatusBatchData, SetBranchesStatusBatchVariables, SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables, SetCustomersStatusBatchData, SetCustomersStatusBatchVariables, SetProductsStatusBatchData, SetProductsStatusBatchVariables, GetCurrentUserData, GetCurrentUserAccessData, ListCategoriesData, ListCategoriesVariables, ListSubcategoriesData, ListSubcategoriesVariables, CategoryOptionsData, CategoryOptionsVariables, ListBranchesData, ListBranchesVariables, ListSuppliersData, ListSuppliersVariables, ListCustomersData, ListCustomersVariables, ListProductsData, ListProductsVariables, RegistrationOptionsData, RegistrationOptionsVariables, ProductComponentsData, ProductComponentsVariables, ProductPromotionsData, ProductPromotionsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useBootstrapNavigationCatalog(options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
export function useBootstrapNavigationCatalog(dc: DataConnect, options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;

export function useCreateCategory(options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;
export function useCreateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoryData, FirebaseError, CreateCategoryVariables>): UseDataConnectMutationResult<CreateCategoryData, CreateCategoryVariables>;

export function useUpdateCategory(options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;
export function useUpdateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;

export function useArchiveCategory(options?: useDataConnectMutationOptions<ArchiveCategoryData, FirebaseError, ArchiveCategoryVariables>): UseDataConnectMutationResult<ArchiveCategoryData, ArchiveCategoryVariables>;
export function useArchiveCategory(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveCategoryData, FirebaseError, ArchiveCategoryVariables>): UseDataConnectMutationResult<ArchiveCategoryData, ArchiveCategoryVariables>;

export function useCreateSubcategory(options?: useDataConnectMutationOptions<CreateSubcategoryData, FirebaseError, CreateSubcategoryVariables>): UseDataConnectMutationResult<CreateSubcategoryData, CreateSubcategoryVariables>;
export function useCreateSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSubcategoryData, FirebaseError, CreateSubcategoryVariables>): UseDataConnectMutationResult<CreateSubcategoryData, CreateSubcategoryVariables>;

export function useUpdateSubcategory(options?: useDataConnectMutationOptions<UpdateSubcategoryData, FirebaseError, UpdateSubcategoryVariables>): UseDataConnectMutationResult<UpdateSubcategoryData, UpdateSubcategoryVariables>;
export function useUpdateSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSubcategoryData, FirebaseError, UpdateSubcategoryVariables>): UseDataConnectMutationResult<UpdateSubcategoryData, UpdateSubcategoryVariables>;

export function useArchiveSubcategory(options?: useDataConnectMutationOptions<ArchiveSubcategoryData, FirebaseError, ArchiveSubcategoryVariables>): UseDataConnectMutationResult<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;
export function useArchiveSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<ArchiveSubcategoryData, FirebaseError, ArchiveSubcategoryVariables>): UseDataConnectMutationResult<ArchiveSubcategoryData, ArchiveSubcategoryVariables>;

export function useRestoreCategory(options?: useDataConnectMutationOptions<RestoreCategoryData, FirebaseError, RestoreCategoryVariables>): UseDataConnectMutationResult<RestoreCategoryData, RestoreCategoryVariables>;
export function useRestoreCategory(dc: DataConnect, options?: useDataConnectMutationOptions<RestoreCategoryData, FirebaseError, RestoreCategoryVariables>): UseDataConnectMutationResult<RestoreCategoryData, RestoreCategoryVariables>;

export function useRestoreSubcategory(options?: useDataConnectMutationOptions<RestoreSubcategoryData, FirebaseError, RestoreSubcategoryVariables>): UseDataConnectMutationResult<RestoreSubcategoryData, RestoreSubcategoryVariables>;
export function useRestoreSubcategory(dc: DataConnect, options?: useDataConnectMutationOptions<RestoreSubcategoryData, FirebaseError, RestoreSubcategoryVariables>): UseDataConnectMutationResult<RestoreSubcategoryData, RestoreSubcategoryVariables>;

export function useCreateCategoriesBatch(options?: useDataConnectMutationOptions<CreateCategoriesBatchData, FirebaseError, CreateCategoriesBatchVariables>): UseDataConnectMutationResult<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;
export function useCreateCategoriesBatch(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCategoriesBatchData, FirebaseError, CreateCategoriesBatchVariables>): UseDataConnectMutationResult<CreateCategoriesBatchData, CreateCategoriesBatchVariables>;

export function useCreateSubcategoriesBatch(options?: useDataConnectMutationOptions<CreateSubcategoriesBatchData, FirebaseError, CreateSubcategoriesBatchVariables>): UseDataConnectMutationResult<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;
export function useCreateSubcategoriesBatch(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSubcategoriesBatchData, FirebaseError, CreateSubcategoriesBatchVariables>): UseDataConnectMutationResult<CreateSubcategoriesBatchData, CreateSubcategoriesBatchVariables>;

export function useSaveBranch(options?: useDataConnectMutationOptions<SaveBranchData, FirebaseError, SaveBranchVariables>): UseDataConnectMutationResult<SaveBranchData, SaveBranchVariables>;
export function useSaveBranch(dc: DataConnect, options?: useDataConnectMutationOptions<SaveBranchData, FirebaseError, SaveBranchVariables>): UseDataConnectMutationResult<SaveBranchData, SaveBranchVariables>;

export function useSetBranchStatus(options?: useDataConnectMutationOptions<SetBranchStatusData, FirebaseError, SetBranchStatusVariables>): UseDataConnectMutationResult<SetBranchStatusData, SetBranchStatusVariables>;
export function useSetBranchStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetBranchStatusData, FirebaseError, SetBranchStatusVariables>): UseDataConnectMutationResult<SetBranchStatusData, SetBranchStatusVariables>;

export function useSaveSupplier(options?: useDataConnectMutationOptions<SaveSupplierData, FirebaseError, SaveSupplierVariables>): UseDataConnectMutationResult<SaveSupplierData, SaveSupplierVariables>;
export function useSaveSupplier(dc: DataConnect, options?: useDataConnectMutationOptions<SaveSupplierData, FirebaseError, SaveSupplierVariables>): UseDataConnectMutationResult<SaveSupplierData, SaveSupplierVariables>;

export function useSetSupplierStatus(options?: useDataConnectMutationOptions<SetSupplierStatusData, FirebaseError, SetSupplierStatusVariables>): UseDataConnectMutationResult<SetSupplierStatusData, SetSupplierStatusVariables>;
export function useSetSupplierStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetSupplierStatusData, FirebaseError, SetSupplierStatusVariables>): UseDataConnectMutationResult<SetSupplierStatusData, SetSupplierStatusVariables>;

export function useSaveCustomer(options?: useDataConnectMutationOptions<SaveCustomerData, FirebaseError, SaveCustomerVariables>): UseDataConnectMutationResult<SaveCustomerData, SaveCustomerVariables>;
export function useSaveCustomer(dc: DataConnect, options?: useDataConnectMutationOptions<SaveCustomerData, FirebaseError, SaveCustomerVariables>): UseDataConnectMutationResult<SaveCustomerData, SaveCustomerVariables>;

export function useSetCustomerStatus(options?: useDataConnectMutationOptions<SetCustomerStatusData, FirebaseError, SetCustomerStatusVariables>): UseDataConnectMutationResult<SetCustomerStatusData, SetCustomerStatusVariables>;
export function useSetCustomerStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetCustomerStatusData, FirebaseError, SetCustomerStatusVariables>): UseDataConnectMutationResult<SetCustomerStatusData, SetCustomerStatusVariables>;

export function useSaveProduct(options?: useDataConnectMutationOptions<SaveProductData, FirebaseError, SaveProductVariables>): UseDataConnectMutationResult<SaveProductData, SaveProductVariables>;
export function useSaveProduct(dc: DataConnect, options?: useDataConnectMutationOptions<SaveProductData, FirebaseError, SaveProductVariables>): UseDataConnectMutationResult<SaveProductData, SaveProductVariables>;

export function useSetProductStatus(options?: useDataConnectMutationOptions<SetProductStatusData, FirebaseError, SetProductStatusVariables>): UseDataConnectMutationResult<SetProductStatusData, SetProductStatusVariables>;
export function useSetProductStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetProductStatusData, FirebaseError, SetProductStatusVariables>): UseDataConnectMutationResult<SetProductStatusData, SetProductStatusVariables>;

export function useSaveProductComponents(options?: useDataConnectMutationOptions<SaveProductComponentsData, FirebaseError, SaveProductComponentsVariables>): UseDataConnectMutationResult<SaveProductComponentsData, SaveProductComponentsVariables>;
export function useSaveProductComponents(dc: DataConnect, options?: useDataConnectMutationOptions<SaveProductComponentsData, FirebaseError, SaveProductComponentsVariables>): UseDataConnectMutationResult<SaveProductComponentsData, SaveProductComponentsVariables>;

export function useSavePromotion(options?: useDataConnectMutationOptions<SavePromotionData, FirebaseError, SavePromotionVariables>): UseDataConnectMutationResult<SavePromotionData, SavePromotionVariables>;
export function useSavePromotion(dc: DataConnect, options?: useDataConnectMutationOptions<SavePromotionData, FirebaseError, SavePromotionVariables>): UseDataConnectMutationResult<SavePromotionData, SavePromotionVariables>;

export function useSetPromotionStatus(options?: useDataConnectMutationOptions<SetPromotionStatusData, FirebaseError, SetPromotionStatusVariables>): UseDataConnectMutationResult<SetPromotionStatusData, SetPromotionStatusVariables>;
export function useSetPromotionStatus(dc: DataConnect, options?: useDataConnectMutationOptions<SetPromotionStatusData, FirebaseError, SetPromotionStatusVariables>): UseDataConnectMutationResult<SetPromotionStatusData, SetPromotionStatusVariables>;

export function useSetCategoriesStatusBatch(options?: useDataConnectMutationOptions<SetCategoriesStatusBatchData, FirebaseError, SetCategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;
export function useSetCategoriesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetCategoriesStatusBatchData, FirebaseError, SetCategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetCategoriesStatusBatchData, SetCategoriesStatusBatchVariables>;

export function useSetSubcategoriesStatusBatch(options?: useDataConnectMutationOptions<SetSubcategoriesStatusBatchData, FirebaseError, SetSubcategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;
export function useSetSubcategoriesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetSubcategoriesStatusBatchData, FirebaseError, SetSubcategoriesStatusBatchVariables>): UseDataConnectMutationResult<SetSubcategoriesStatusBatchData, SetSubcategoriesStatusBatchVariables>;

export function useSetBranchesStatusBatch(options?: useDataConnectMutationOptions<SetBranchesStatusBatchData, FirebaseError, SetBranchesStatusBatchVariables>): UseDataConnectMutationResult<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;
export function useSetBranchesStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetBranchesStatusBatchData, FirebaseError, SetBranchesStatusBatchVariables>): UseDataConnectMutationResult<SetBranchesStatusBatchData, SetBranchesStatusBatchVariables>;

export function useSetSuppliersStatusBatch(options?: useDataConnectMutationOptions<SetSuppliersStatusBatchData, FirebaseError, SetSuppliersStatusBatchVariables>): UseDataConnectMutationResult<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;
export function useSetSuppliersStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetSuppliersStatusBatchData, FirebaseError, SetSuppliersStatusBatchVariables>): UseDataConnectMutationResult<SetSuppliersStatusBatchData, SetSuppliersStatusBatchVariables>;

export function useSetCustomersStatusBatch(options?: useDataConnectMutationOptions<SetCustomersStatusBatchData, FirebaseError, SetCustomersStatusBatchVariables>): UseDataConnectMutationResult<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;
export function useSetCustomersStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetCustomersStatusBatchData, FirebaseError, SetCustomersStatusBatchVariables>): UseDataConnectMutationResult<SetCustomersStatusBatchData, SetCustomersStatusBatchVariables>;

export function useSetProductsStatusBatch(options?: useDataConnectMutationOptions<SetProductsStatusBatchData, FirebaseError, SetProductsStatusBatchVariables>): UseDataConnectMutationResult<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;
export function useSetProductsStatusBatch(dc: DataConnect, options?: useDataConnectMutationOptions<SetProductsStatusBatchData, FirebaseError, SetProductsStatusBatchVariables>): UseDataConnectMutationResult<SetProductsStatusBatchData, SetProductsStatusBatchVariables>;

export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useGetCurrentUserAccess(options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
export function useGetCurrentUserAccess(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;

export function useListCategories(vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
export function useListCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;

export function useListSubcategories(vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;
export function useListSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;

export function useCategoryOptions(vars?: CategoryOptionsVariables, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, CategoryOptionsVariables>;
export function useCategoryOptions(dc: DataConnect, vars?: CategoryOptionsVariables, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, CategoryOptionsVariables>;

export function useListBranches(vars: ListBranchesVariables, options?: useDataConnectQueryOptions<ListBranchesData>): UseDataConnectQueryResult<ListBranchesData, ListBranchesVariables>;
export function useListBranches(dc: DataConnect, vars: ListBranchesVariables, options?: useDataConnectQueryOptions<ListBranchesData>): UseDataConnectQueryResult<ListBranchesData, ListBranchesVariables>;

export function useListSuppliers(vars: ListSuppliersVariables, options?: useDataConnectQueryOptions<ListSuppliersData>): UseDataConnectQueryResult<ListSuppliersData, ListSuppliersVariables>;
export function useListSuppliers(dc: DataConnect, vars: ListSuppliersVariables, options?: useDataConnectQueryOptions<ListSuppliersData>): UseDataConnectQueryResult<ListSuppliersData, ListSuppliersVariables>;

export function useListCustomers(vars: ListCustomersVariables, options?: useDataConnectQueryOptions<ListCustomersData>): UseDataConnectQueryResult<ListCustomersData, ListCustomersVariables>;
export function useListCustomers(dc: DataConnect, vars: ListCustomersVariables, options?: useDataConnectQueryOptions<ListCustomersData>): UseDataConnectQueryResult<ListCustomersData, ListCustomersVariables>;

export function useListProducts(vars: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;
export function useListProducts(dc: DataConnect, vars: ListProductsVariables, options?: useDataConnectQueryOptions<ListProductsData>): UseDataConnectQueryResult<ListProductsData, ListProductsVariables>;

export function useRegistrationOptions(vars?: RegistrationOptionsVariables, options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, RegistrationOptionsVariables>;
export function useRegistrationOptions(dc: DataConnect, vars?: RegistrationOptionsVariables, options?: useDataConnectQueryOptions<RegistrationOptionsData>): UseDataConnectQueryResult<RegistrationOptionsData, RegistrationOptionsVariables>;

export function useProductComponents(vars: ProductComponentsVariables, options?: useDataConnectQueryOptions<ProductComponentsData>): UseDataConnectQueryResult<ProductComponentsData, ProductComponentsVariables>;
export function useProductComponents(dc: DataConnect, vars: ProductComponentsVariables, options?: useDataConnectQueryOptions<ProductComponentsData>): UseDataConnectQueryResult<ProductComponentsData, ProductComponentsVariables>;

export function useProductPromotions(vars: ProductPromotionsVariables, options?: useDataConnectQueryOptions<ProductPromotionsData>): UseDataConnectQueryResult<ProductPromotionsData, ProductPromotionsVariables>;
export function useProductPromotions(dc: DataConnect, vars: ProductPromotionsVariables, options?: useDataConnectQueryOptions<ProductPromotionsData>): UseDataConnectQueryResult<ProductPromotionsData, ProductPromotionsVariables>;
