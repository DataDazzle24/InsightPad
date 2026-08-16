import { BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables, GetCurrentUserData, GetCurrentUserAccessData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useBootstrapNavigationCatalog(options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;
export function useBootstrapNavigationCatalog(dc: DataConnect, options?: useDataConnectMutationOptions<BootstrapNavigationCatalogData, FirebaseError, BootstrapNavigationCatalogVariables>): UseDataConnectMutationResult<BootstrapNavigationCatalogData, BootstrapNavigationCatalogVariables>;

export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useGetCurrentUserAccess(options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
export function useGetCurrentUserAccess(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
