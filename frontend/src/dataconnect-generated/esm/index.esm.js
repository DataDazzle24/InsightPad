import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'app',
  service: 'insightpad',
  location: 'southamerica-east1'
};
export const bootstrapSalesChannelsNavigationRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BootstrapSalesChannelsNavigation');
}
bootstrapSalesChannelsNavigationRef.operationName = 'BootstrapSalesChannelsNavigation';

export function bootstrapSalesChannelsNavigation(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(bootstrapSalesChannelsNavigationRef(dcInstance, inputVars));
}

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

export const createCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategory', inputVars);
}
createCategoryRef.operationName = 'CreateCategory';

export function createCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCategoryRef(dcInstance, inputVars));
}

export const updateCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCategory', inputVars);
}
updateCategoryRef.operationName = 'UpdateCategory';

export function updateCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateCategoryRef(dcInstance, inputVars));
}

export const archiveCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveCategory', inputVars);
}
archiveCategoryRef.operationName = 'ArchiveCategory';

export function archiveCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveCategoryRef(dcInstance, inputVars));
}

export const createSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSubcategory', inputVars);
}
createSubcategoryRef.operationName = 'CreateSubcategory';

export function createSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSubcategoryRef(dcInstance, inputVars));
}

export const updateSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSubcategory', inputVars);
}
updateSubcategoryRef.operationName = 'UpdateSubcategory';

export function updateSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSubcategoryRef(dcInstance, inputVars));
}

export const archiveSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveSubcategory', inputVars);
}
archiveSubcategoryRef.operationName = 'ArchiveSubcategory';

export function archiveSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveSubcategoryRef(dcInstance, inputVars));
}

export const restoreCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreCategory', inputVars);
}
restoreCategoryRef.operationName = 'RestoreCategory';

export function restoreCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreCategoryRef(dcInstance, inputVars));
}

export const restoreSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreSubcategory', inputVars);
}
restoreSubcategoryRef.operationName = 'RestoreSubcategory';

export function restoreSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreSubcategoryRef(dcInstance, inputVars));
}

export const createCategoriesBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategoriesBatch', inputVars);
}
createCategoriesBatchRef.operationName = 'CreateCategoriesBatch';

export function createCategoriesBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCategoriesBatchRef(dcInstance, inputVars));
}

export const createSubcategoriesBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSubcategoriesBatch', inputVars);
}
createSubcategoriesBatchRef.operationName = 'CreateSubcategoriesBatch';

export function createSubcategoriesBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSubcategoriesBatchRef(dcInstance, inputVars));
}

export const saveBranchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveBranch', inputVars);
}
saveBranchRef.operationName = 'SaveBranch';

export function saveBranch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveBranchRef(dcInstance, inputVars));
}

export const setBranchStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetBranchStatus', inputVars);
}
setBranchStatusRef.operationName = 'SetBranchStatus';

export function setBranchStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setBranchStatusRef(dcInstance, inputVars));
}

export const saveSupplierRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveSupplier', inputVars);
}
saveSupplierRef.operationName = 'SaveSupplier';

export function saveSupplier(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveSupplierRef(dcInstance, inputVars));
}

export const setSupplierStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSupplierStatus', inputVars);
}
setSupplierStatusRef.operationName = 'SetSupplierStatus';

export function setSupplierStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSupplierStatusRef(dcInstance, inputVars));
}

export const saveCustomerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCustomer', inputVars);
}
saveCustomerRef.operationName = 'SaveCustomer';

export function saveCustomer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCustomerRef(dcInstance, inputVars));
}

export const setCustomerStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCustomerStatus', inputVars);
}
setCustomerStatusRef.operationName = 'SetCustomerStatus';

export function setCustomerStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCustomerStatusRef(dcInstance, inputVars));
}

export const saveProductRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveProduct', inputVars);
}
saveProductRef.operationName = 'SaveProduct';

export function saveProduct(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveProductRef(dcInstance, inputVars));
}

export const setProductStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetProductStatus', inputVars);
}
setProductStatusRef.operationName = 'SetProductStatus';

export function setProductStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setProductStatusRef(dcInstance, inputVars));
}

export const saveProductComponentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveProductComponents', inputVars);
}
saveProductComponentsRef.operationName = 'SaveProductComponents';

export function saveProductComponents(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveProductComponentsRef(dcInstance, inputVars));
}

export const savePromotionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePromotion', inputVars);
}
savePromotionRef.operationName = 'SavePromotion';

export function savePromotion(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePromotionRef(dcInstance, inputVars));
}

export const setPromotionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPromotionStatus', inputVars);
}
setPromotionStatusRef.operationName = 'SetPromotionStatus';

export function setPromotionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPromotionStatusRef(dcInstance, inputVars));
}

export const setCategoriesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCategoriesStatusBatch', inputVars);
}
setCategoriesStatusBatchRef.operationName = 'SetCategoriesStatusBatch';

export function setCategoriesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCategoriesStatusBatchRef(dcInstance, inputVars));
}

export const setSubcategoriesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSubcategoriesStatusBatch', inputVars);
}
setSubcategoriesStatusBatchRef.operationName = 'SetSubcategoriesStatusBatch';

export function setSubcategoriesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSubcategoriesStatusBatchRef(dcInstance, inputVars));
}

export const setBranchesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetBranchesStatusBatch', inputVars);
}
setBranchesStatusBatchRef.operationName = 'SetBranchesStatusBatch';

export function setBranchesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setBranchesStatusBatchRef(dcInstance, inputVars));
}

export const setSuppliersStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSuppliersStatusBatch', inputVars);
}
setSuppliersStatusBatchRef.operationName = 'SetSuppliersStatusBatch';

export function setSuppliersStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSuppliersStatusBatchRef(dcInstance, inputVars));
}

export const setCustomersStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCustomersStatusBatch', inputVars);
}
setCustomersStatusBatchRef.operationName = 'SetCustomersStatusBatch';

export function setCustomersStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCustomersStatusBatchRef(dcInstance, inputVars));
}

export const setProductsStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetProductsStatusBatch', inputVars);
}
setProductsStatusBatchRef.operationName = 'SetProductsStatusBatch';

export function setProductsStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setProductsStatusBatchRef(dcInstance, inputVars));
}

export const ensureSalesDefaultsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnsureSalesDefaults');
}
ensureSalesDefaultsRef.operationName = 'EnsureSalesDefaults';

export function ensureSalesDefaults(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(ensureSalesDefaultsRef(dcInstance, inputVars));
}

export const postSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostSale', inputVars);
}
postSaleRef.operationName = 'PostSale';

export function postSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postSaleRef(dcInstance, inputVars));
}

export const cancelSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CancelSale', inputVars);
}
cancelSaleRef.operationName = 'CancelSale';

export function cancelSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(cancelSaleRef(dcInstance, inputVars));
}

export const createPlatformTenantRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePlatformTenant', inputVars);
}
createPlatformTenantRef.operationName = 'CreatePlatformTenant';

export function createPlatformTenant(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPlatformTenantRef(dcInstance, inputVars));
}

export const setPlatformTenantStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformTenantStatus', inputVars);
}
setPlatformTenantStatusRef.operationName = 'SetPlatformTenantStatus';

export function setPlatformTenantStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformTenantStatusRef(dcInstance, inputVars));
}

export const linkPlatformUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'LinkPlatformUser', inputVars);
}
linkPlatformUserRef.operationName = 'LinkPlatformUser';

export function linkPlatformUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(linkPlatformUserRef(dcInstance, inputVars));
}

export const setPlatformUserStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformUserStatus', inputVars);
}
setPlatformUserStatusRef.operationName = 'SetPlatformUserStatus';

export function setPlatformUserStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformUserStatusRef(dcInstance, inputVars));
}

export const setPlatformRolePermissionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformRolePermission', inputVars);
}
setPlatformRolePermissionRef.operationName = 'SetPlatformRolePermission';

export function setPlatformRolePermission(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformRolePermissionRef(dcInstance, inputVars));
}

export const postStockAdjustmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostStockAdjustment', inputVars);
}
postStockAdjustmentRef.operationName = 'PostStockAdjustment';

export function postStockAdjustment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postStockAdjustmentRef(dcInstance, inputVars));
}

export const postStockTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostStockTransfer', inputVars);
}
postStockTransferRef.operationName = 'PostStockTransfer';

export function postStockTransfer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postStockTransferRef(dcInstance, inputVars));
}

export const saveStockBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveStockBatch', inputVars);
}
saveStockBatchRef.operationName = 'SaveStockBatch';

export function saveStockBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveStockBatchRef(dcInstance, inputVars));
}

export const reverseStockOperationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReverseStockOperation', inputVars);
}
reverseStockOperationRef.operationName = 'ReverseStockOperation';

export function reverseStockOperation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(reverseStockOperationRef(dcInstance, inputVars));
}

export const openCashSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'OpenCashSession', inputVars);
}
openCashSessionRef.operationName = 'OpenCashSession';

export function openCashSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(openCashSessionRef(dcInstance, inputVars));
}

export const registerCashMovementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterCashMovement', inputVars);
}
registerCashMovementRef.operationName = 'RegisterCashMovement';

export function registerCashMovement(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerCashMovementRef(dcInstance, inputVars));
}

export const claimDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClaimDeviceSession', inputVars);
}
claimDeviceSessionRef.operationName = 'ClaimDeviceSession';

export function claimDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(claimDeviceSessionRef(dcInstance, inputVars));
}

export const touchDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TouchDeviceSession', inputVars);
}
touchDeviceSessionRef.operationName = 'TouchDeviceSession';

export function touchDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(touchDeviceSessionRef(dcInstance, inputVars));
}

export const releaseDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReleaseDeviceSession', inputVars);
}
releaseDeviceSessionRef.operationName = 'ReleaseDeviceSession';

export function releaseDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(releaseDeviceSessionRef(dcInstance, inputVars));
}

export const createSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSalesChannelConnection', inputVars);
}
createSalesChannelConnectionRef.operationName = 'CreateSalesChannelConnection';

export function createSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSalesChannelConnectionRef(dcInstance, inputVars));
}

export const updateSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSalesChannelConnection', inputVars);
}
updateSalesChannelConnectionRef.operationName = 'UpdateSalesChannelConnection';

export function updateSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSalesChannelConnectionRef(dcInstance, inputVars));
}

export const archiveSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveSalesChannelConnection', inputVars);
}
archiveSalesChannelConnectionRef.operationName = 'ArchiveSalesChannelConnection';

export function archiveSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveSalesChannelConnectionRef(dcInstance, inputVars));
}

export const closeCashSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CloseCashSession', inputVars);
}
closeCashSessionRef.operationName = 'CloseCashSession';

export function closeCashSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(closeCashSessionRef(dcInstance, inputVars));
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

export const validateDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ValidateDeviceSession', inputVars);
}
validateDeviceSessionRef.operationName = 'ValidateDeviceSession';

export function validateDeviceSession(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(validateDeviceSessionRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const salesChannelWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SalesChannelWorkspace', inputVars);
}
salesChannelWorkspaceRef.operationName = 'SalesChannelWorkspace';

export function salesChannelWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(salesChannelWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const salesWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SalesWorkspace', inputVars);
}
salesWorkspaceRef.operationName = 'SalesWorkspace';

export function salesWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(salesWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listSalesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSales', inputVars);
}
listSalesRef.operationName = 'ListSales';

export function listSales(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSalesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const saleDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SaleDetails', inputVars);
}
saleDetailsRef.operationName = 'SaleDetails';

export function saleDetails(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(saleDetailsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listCategoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCategories', inputVars);
}
listCategoriesRef.operationName = 'ListCategories';

export function listCategories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCategoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listSubcategoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSubcategories', inputVars);
}
listSubcategoriesRef.operationName = 'ListSubcategories';

export function listSubcategories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSubcategoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const categoryOptionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'CategoryOptions', inputVars);
}
categoryOptionsRef.operationName = 'CategoryOptions';

export function categoryOptions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(categoryOptionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listBranchesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBranches', inputVars);
}
listBranchesRef.operationName = 'ListBranches';

export function listBranches(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listBranchesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listSuppliersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSuppliers', inputVars);
}
listSuppliersRef.operationName = 'ListSuppliers';

export function listSuppliers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSuppliersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listCustomersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCustomers', inputVars);
}
listCustomersRef.operationName = 'ListCustomers';

export function listCustomers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCustomersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const listProductsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProducts', inputVars);
}
listProductsRef.operationName = 'ListProducts';

export function listProducts(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listProductsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const registrationOptionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'RegistrationOptions', inputVars);
}
registrationOptionsRef.operationName = 'RegistrationOptions';

export function registrationOptions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(registrationOptionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const productComponentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ProductComponents', inputVars);
}
productComponentsRef.operationName = 'ProductComponents';

export function productComponents(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(productComponentsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const productPromotionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ProductPromotions', inputVars);
}
productPromotionsRef.operationName = 'ProductPromotions';

export function productPromotions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(productPromotionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const platformAdminWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformAdminWorkspace', inputVars);
}
platformAdminWorkspaceRef.operationName = 'PlatformAdminWorkspace';

export function platformAdminWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(platformAdminWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const stockWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'StockWorkspace', inputVars);
}
stockWorkspaceRef.operationName = 'StockWorkspace';

export function stockWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(stockWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const dailyProfitDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'DailyProfitDashboard', inputVars);
}
dailyProfitDashboardRef.operationName = 'DailyProfitDashboard';

export function dailyProfitDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(dailyProfitDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const stockOperationDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'StockOperationDetails', inputVars);
}
stockOperationDetailsRef.operationName = 'StockOperationDetails';

export function stockOperationDetails(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(stockOperationDetailsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const financialIndicatorsDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'FinancialIndicatorsDashboard', inputVars);
}
financialIndicatorsDashboardRef.operationName = 'FinancialIndicatorsDashboard';

export function financialIndicatorsDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(financialIndicatorsDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const operationalAnalyticsDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'OperationalAnalyticsDashboard', inputVars);
}
operationalAnalyticsDashboardRef.operationName = 'OperationalAnalyticsDashboard';

export function operationalAnalyticsDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(operationalAnalyticsDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}

export const recoverPlatformAdministratorRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RecoverPlatformAdministrator');
}
recoverPlatformAdministratorRef.operationName = 'RecoverPlatformAdministrator';

export function recoverPlatformAdministrator(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(recoverPlatformAdministratorRef(dcInstance, inputVars));
}

