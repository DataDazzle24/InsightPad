import { BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables, CreateCategoryData, CreateCategoryVariables, UpdateCategoryData, UpdateCategoryVariables, ArchiveCategoryData, ArchiveCategoryVariables, CreateSubcategoryData, CreateSubcategoryVariables, UpdateSubcategoryData, UpdateSubcategoryVariables, ArchiveSubcategoryData, ArchiveSubcategoryVariables, RestoreCategoryData, RestoreCategoryVariables, RestoreSubcategoryData, RestoreSubcategoryVariables, GetCurrentUserData, GetCurrentUserAccessData, ListCategoriesData, ListCategoriesVariables, ListSubcategoriesData, ListSubcategoriesVariables, CategoryOptionsData } from '../';
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

export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useGetCurrentUserAccess(options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
export function useGetCurrentUserAccess(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;

export function useListCategories(vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
export function useListCategories(dc: DataConnect, vars: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;

export function useListSubcategories(vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;
export function useListSubcategories(dc: DataConnect, vars: ListSubcategoriesVariables, options?: useDataConnectQueryOptions<ListSubcategoriesData>): UseDataConnectQueryResult<ListSubcategoriesData, ListSubcategoriesVariables>;

export function useCategoryOptions(options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, undefined>;
export function useCategoryOptions(dc: DataConnect, options?: useDataConnectQueryOptions<CategoryOptionsData>): UseDataConnectQueryResult<CategoryOptionsData, undefined>;
