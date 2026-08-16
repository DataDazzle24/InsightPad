import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'app',
  service: 'insightpad',
  location: 'southamerica-east1'
};
export const bootstrapNavigationCatalogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BootstrapNavigationCatalog', inputVars);
}
bootstrapNavigationCatalogRef.operationName = 'BootstrapNavigationCatalog';

export function bootstrapNavigationCatalog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(bootstrapNavigationCatalogRef(dcInstance, inputVars));
}

export const getCurrentUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentUser');
}
getCurrentUserRef.operationName = 'GetCurrentUser';

export function getCurrentUser(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCurrentUserRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const getCurrentUserAccessRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentUserAccess');
}
getCurrentUserAccessRef.operationName = 'GetCurrentUserAccess';

export function getCurrentUserAccess(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCurrentUserAccessRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

