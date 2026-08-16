import { getCurrentUserRef, getCurrentUserAccessRef, connectorConfig } from '../../esm/index.esm.js';
import { CallerSdkTypeEnum } from 'firebase/data-connect';
import { useDataConnectQuery, validateReactArgs } from '@tanstack-query-firebase/react/data-connect';


export function useGetCurrentUser(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = getCurrentUserRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}

export function useGetCurrentUserAccess(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts } = validateReactArgs(connectorConfig, dcOrOptions, options);
  const ref = getCurrentUserAccessRef(dcInstance);
  return useDataConnectQuery(ref, inputOpts, CallerSdkTypeEnum.GeneratedReact);
}