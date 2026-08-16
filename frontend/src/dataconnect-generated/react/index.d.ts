import { GetCurrentUserData, GetCurrentUserAccessData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetCurrentUser(options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;
export function useGetCurrentUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserData>): UseDataConnectQueryResult<GetCurrentUserData, undefined>;

export function useGetCurrentUserAccess(options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
export function useGetCurrentUserAccess(dc: DataConnect, options?: useDataConnectQueryOptions<GetCurrentUserAccessData>): UseDataConnectQueryResult<GetCurrentUserAccessData, undefined>;
