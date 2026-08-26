const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'app',
  service: 'insightpad',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

const bootstrapSalesChannelsNavigationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BootstrapSalesChannelsNavigation', inputVars);
}
bootstrapSalesChannelsNavigationRef.operationName = 'BootstrapSalesChannelsNavigation';
exports.bootstrapSalesChannelsNavigationRef = bootstrapSalesChannelsNavigationRef;

exports.bootstrapSalesChannelsNavigation = function bootstrapSalesChannelsNavigation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(bootstrapSalesChannelsNavigationRef(dcInstance, inputVars));
}
;

const bootstrapNavigationCatalogRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'BootstrapNavigationCatalog', inputVars);
}
bootstrapNavigationCatalogRef.operationName = 'BootstrapNavigationCatalog';
exports.bootstrapNavigationCatalogRef = bootstrapNavigationCatalogRef;

exports.bootstrapNavigationCatalog = function bootstrapNavigationCatalog(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(bootstrapNavigationCatalogRef(dcInstance, inputVars));
}
;

const createCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategory', inputVars);
}
createCategoryRef.operationName = 'CreateCategory';
exports.createCategoryRef = createCategoryRef;

exports.createCategory = function createCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCategoryRef(dcInstance, inputVars));
}
;

const updateCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateCategory', inputVars);
}
updateCategoryRef.operationName = 'UpdateCategory';
exports.updateCategoryRef = updateCategoryRef;

exports.updateCategory = function updateCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateCategoryRef(dcInstance, inputVars));
}
;

const archiveCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveCategory', inputVars);
}
archiveCategoryRef.operationName = 'ArchiveCategory';
exports.archiveCategoryRef = archiveCategoryRef;

exports.archiveCategory = function archiveCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveCategoryRef(dcInstance, inputVars));
}
;

const createSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSubcategory', inputVars);
}
createSubcategoryRef.operationName = 'CreateSubcategory';
exports.createSubcategoryRef = createSubcategoryRef;

exports.createSubcategory = function createSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSubcategoryRef(dcInstance, inputVars));
}
;

const updateSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSubcategory', inputVars);
}
updateSubcategoryRef.operationName = 'UpdateSubcategory';
exports.updateSubcategoryRef = updateSubcategoryRef;

exports.updateSubcategory = function updateSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSubcategoryRef(dcInstance, inputVars));
}
;

const archiveSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveSubcategory', inputVars);
}
archiveSubcategoryRef.operationName = 'ArchiveSubcategory';
exports.archiveSubcategoryRef = archiveSubcategoryRef;

exports.archiveSubcategory = function archiveSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveSubcategoryRef(dcInstance, inputVars));
}
;

const restoreCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreCategory', inputVars);
}
restoreCategoryRef.operationName = 'RestoreCategory';
exports.restoreCategoryRef = restoreCategoryRef;

exports.restoreCategory = function restoreCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreCategoryRef(dcInstance, inputVars));
}
;

const restoreSubcategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RestoreSubcategory', inputVars);
}
restoreSubcategoryRef.operationName = 'RestoreSubcategory';
exports.restoreSubcategoryRef = restoreSubcategoryRef;

exports.restoreSubcategory = function restoreSubcategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(restoreSubcategoryRef(dcInstance, inputVars));
}
;

const createCategoriesBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateCategoriesBatch', inputVars);
}
createCategoriesBatchRef.operationName = 'CreateCategoriesBatch';
exports.createCategoriesBatchRef = createCategoriesBatchRef;

exports.createCategoriesBatch = function createCategoriesBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createCategoriesBatchRef(dcInstance, inputVars));
}
;

const createSubcategoriesBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSubcategoriesBatch', inputVars);
}
createSubcategoriesBatchRef.operationName = 'CreateSubcategoriesBatch';
exports.createSubcategoriesBatchRef = createSubcategoriesBatchRef;

exports.createSubcategoriesBatch = function createSubcategoriesBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSubcategoriesBatchRef(dcInstance, inputVars));
}
;

const saveBranchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveBranch', inputVars);
}
saveBranchRef.operationName = 'SaveBranch';
exports.saveBranchRef = saveBranchRef;

exports.saveBranch = function saveBranch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveBranchRef(dcInstance, inputVars));
}
;

const setBranchStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetBranchStatus', inputVars);
}
setBranchStatusRef.operationName = 'SetBranchStatus';
exports.setBranchStatusRef = setBranchStatusRef;

exports.setBranchStatus = function setBranchStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setBranchStatusRef(dcInstance, inputVars));
}
;

const saveSupplierRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveSupplier', inputVars);
}
saveSupplierRef.operationName = 'SaveSupplier';
exports.saveSupplierRef = saveSupplierRef;

exports.saveSupplier = function saveSupplier(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveSupplierRef(dcInstance, inputVars));
}
;

const setSupplierStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSupplierStatus', inputVars);
}
setSupplierStatusRef.operationName = 'SetSupplierStatus';
exports.setSupplierStatusRef = setSupplierStatusRef;

exports.setSupplierStatus = function setSupplierStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSupplierStatusRef(dcInstance, inputVars));
}
;

const saveCustomerRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveCustomer', inputVars);
}
saveCustomerRef.operationName = 'SaveCustomer';
exports.saveCustomerRef = saveCustomerRef;

exports.saveCustomer = function saveCustomer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveCustomerRef(dcInstance, inputVars));
}
;

const setCustomerStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCustomerStatus', inputVars);
}
setCustomerStatusRef.operationName = 'SetCustomerStatus';
exports.setCustomerStatusRef = setCustomerStatusRef;

exports.setCustomerStatus = function setCustomerStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCustomerStatusRef(dcInstance, inputVars));
}
;

const saveProductRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveProduct', inputVars);
}
saveProductRef.operationName = 'SaveProduct';
exports.saveProductRef = saveProductRef;

exports.saveProduct = function saveProduct(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveProductRef(dcInstance, inputVars));
}
;

const setProductStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetProductStatus', inputVars);
}
setProductStatusRef.operationName = 'SetProductStatus';
exports.setProductStatusRef = setProductStatusRef;

exports.setProductStatus = function setProductStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setProductStatusRef(dcInstance, inputVars));
}
;

const saveProductComponentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveProductComponents', inputVars);
}
saveProductComponentsRef.operationName = 'SaveProductComponents';
exports.saveProductComponentsRef = saveProductComponentsRef;

exports.saveProductComponents = function saveProductComponents(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveProductComponentsRef(dcInstance, inputVars));
}
;

const savePromotionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SavePromotion', inputVars);
}
savePromotionRef.operationName = 'SavePromotion';
exports.savePromotionRef = savePromotionRef;

exports.savePromotion = function savePromotion(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(savePromotionRef(dcInstance, inputVars));
}
;

const setPromotionStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPromotionStatus', inputVars);
}
setPromotionStatusRef.operationName = 'SetPromotionStatus';
exports.setPromotionStatusRef = setPromotionStatusRef;

exports.setPromotionStatus = function setPromotionStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPromotionStatusRef(dcInstance, inputVars));
}
;

const setCategoriesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCategoriesStatusBatch', inputVars);
}
setCategoriesStatusBatchRef.operationName = 'SetCategoriesStatusBatch';
exports.setCategoriesStatusBatchRef = setCategoriesStatusBatchRef;

exports.setCategoriesStatusBatch = function setCategoriesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCategoriesStatusBatchRef(dcInstance, inputVars));
}
;

const setSubcategoriesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSubcategoriesStatusBatch', inputVars);
}
setSubcategoriesStatusBatchRef.operationName = 'SetSubcategoriesStatusBatch';
exports.setSubcategoriesStatusBatchRef = setSubcategoriesStatusBatchRef;

exports.setSubcategoriesStatusBatch = function setSubcategoriesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSubcategoriesStatusBatchRef(dcInstance, inputVars));
}
;

const setBranchesStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetBranchesStatusBatch', inputVars);
}
setBranchesStatusBatchRef.operationName = 'SetBranchesStatusBatch';
exports.setBranchesStatusBatchRef = setBranchesStatusBatchRef;

exports.setBranchesStatusBatch = function setBranchesStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setBranchesStatusBatchRef(dcInstance, inputVars));
}
;

const setSuppliersStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetSuppliersStatusBatch', inputVars);
}
setSuppliersStatusBatchRef.operationName = 'SetSuppliersStatusBatch';
exports.setSuppliersStatusBatchRef = setSuppliersStatusBatchRef;

exports.setSuppliersStatusBatch = function setSuppliersStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setSuppliersStatusBatchRef(dcInstance, inputVars));
}
;

const setCustomersStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetCustomersStatusBatch', inputVars);
}
setCustomersStatusBatchRef.operationName = 'SetCustomersStatusBatch';
exports.setCustomersStatusBatchRef = setCustomersStatusBatchRef;

exports.setCustomersStatusBatch = function setCustomersStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setCustomersStatusBatchRef(dcInstance, inputVars));
}
;

const setProductsStatusBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetProductsStatusBatch', inputVars);
}
setProductsStatusBatchRef.operationName = 'SetProductsStatusBatch';
exports.setProductsStatusBatchRef = setProductsStatusBatchRef;

exports.setProductsStatusBatch = function setProductsStatusBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setProductsStatusBatchRef(dcInstance, inputVars));
}
;

const ensureSalesDefaultsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'EnsureSalesDefaults');
}
ensureSalesDefaultsRef.operationName = 'EnsureSalesDefaults';
exports.ensureSalesDefaultsRef = ensureSalesDefaultsRef;

exports.ensureSalesDefaults = function ensureSalesDefaults(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(ensureSalesDefaultsRef(dcInstance, inputVars));
}
;

const postSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostSale', inputVars);
}
postSaleRef.operationName = 'PostSale';
exports.postSaleRef = postSaleRef;

exports.postSale = function postSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postSaleRef(dcInstance, inputVars));
}
;

const cancelSaleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CancelSale', inputVars);
}
cancelSaleRef.operationName = 'CancelSale';
exports.cancelSaleRef = cancelSaleRef;

exports.cancelSale = function cancelSale(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(cancelSaleRef(dcInstance, inputVars));
}
;

const createPlatformTenantRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePlatformTenant', inputVars);
}
createPlatformTenantRef.operationName = 'CreatePlatformTenant';
exports.createPlatformTenantRef = createPlatformTenantRef;

exports.createPlatformTenant = function createPlatformTenant(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createPlatformTenantRef(dcInstance, inputVars));
}
;

const setPlatformTenantStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformTenantStatus', inputVars);
}
setPlatformTenantStatusRef.operationName = 'SetPlatformTenantStatus';
exports.setPlatformTenantStatusRef = setPlatformTenantStatusRef;

exports.setPlatformTenantStatus = function setPlatformTenantStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformTenantStatusRef(dcInstance, inputVars));
}
;

const linkPlatformUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'LinkPlatformUser', inputVars);
}
linkPlatformUserRef.operationName = 'LinkPlatformUser';
exports.linkPlatformUserRef = linkPlatformUserRef;

exports.linkPlatformUser = function linkPlatformUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(linkPlatformUserRef(dcInstance, inputVars));
}
;

const setPlatformUserStatusRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformUserStatus', inputVars);
}
setPlatformUserStatusRef.operationName = 'SetPlatformUserStatus';
exports.setPlatformUserStatusRef = setPlatformUserStatusRef;

exports.setPlatformUserStatus = function setPlatformUserStatus(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformUserStatusRef(dcInstance, inputVars));
}
;

const setPlatformRolePermissionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SetPlatformRolePermission', inputVars);
}
setPlatformRolePermissionRef.operationName = 'SetPlatformRolePermission';
exports.setPlatformRolePermissionRef = setPlatformRolePermissionRef;

exports.setPlatformRolePermission = function setPlatformRolePermission(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(setPlatformRolePermissionRef(dcInstance, inputVars));
}
;

const postStockAdjustmentRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostStockAdjustment', inputVars);
}
postStockAdjustmentRef.operationName = 'PostStockAdjustment';
exports.postStockAdjustmentRef = postStockAdjustmentRef;

exports.postStockAdjustment = function postStockAdjustment(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postStockAdjustmentRef(dcInstance, inputVars));
}
;

const postStockTransferRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'PostStockTransfer', inputVars);
}
postStockTransferRef.operationName = 'PostStockTransfer';
exports.postStockTransferRef = postStockTransferRef;

exports.postStockTransfer = function postStockTransfer(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(postStockTransferRef(dcInstance, inputVars));
}
;

const saveStockBatchRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SaveStockBatch', inputVars);
}
saveStockBatchRef.operationName = 'SaveStockBatch';
exports.saveStockBatchRef = saveStockBatchRef;

exports.saveStockBatch = function saveStockBatch(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(saveStockBatchRef(dcInstance, inputVars));
}
;

const reverseStockOperationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReverseStockOperation', inputVars);
}
reverseStockOperationRef.operationName = 'ReverseStockOperation';
exports.reverseStockOperationRef = reverseStockOperationRef;

exports.reverseStockOperation = function reverseStockOperation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(reverseStockOperationRef(dcInstance, inputVars));
}
;

const openCashSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'OpenCashSession', inputVars);
}
openCashSessionRef.operationName = 'OpenCashSession';
exports.openCashSessionRef = openCashSessionRef;

exports.openCashSession = function openCashSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(openCashSessionRef(dcInstance, inputVars));
}
;

const registerCashMovementRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RegisterCashMovement', inputVars);
}
registerCashMovementRef.operationName = 'RegisterCashMovement';
exports.registerCashMovementRef = registerCashMovementRef;

exports.registerCashMovement = function registerCashMovement(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(registerCashMovementRef(dcInstance, inputVars));
}
;

const claimDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ClaimDeviceSession', inputVars);
}
claimDeviceSessionRef.operationName = 'ClaimDeviceSession';
exports.claimDeviceSessionRef = claimDeviceSessionRef;

exports.claimDeviceSession = function claimDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(claimDeviceSessionRef(dcInstance, inputVars));
}
;

const touchDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'TouchDeviceSession', inputVars);
}
touchDeviceSessionRef.operationName = 'TouchDeviceSession';
exports.touchDeviceSessionRef = touchDeviceSessionRef;

exports.touchDeviceSession = function touchDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(touchDeviceSessionRef(dcInstance, inputVars));
}
;

const releaseDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ReleaseDeviceSession', inputVars);
}
releaseDeviceSessionRef.operationName = 'ReleaseDeviceSession';
exports.releaseDeviceSessionRef = releaseDeviceSessionRef;

exports.releaseDeviceSession = function releaseDeviceSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(releaseDeviceSessionRef(dcInstance, inputVars));
}
;

const createSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSalesChannelConnection', inputVars);
}
createSalesChannelConnectionRef.operationName = 'CreateSalesChannelConnection';
exports.createSalesChannelConnectionRef = createSalesChannelConnectionRef;

exports.createSalesChannelConnection = function createSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSalesChannelConnectionRef(dcInstance, inputVars));
}
;

const updateSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateSalesChannelConnection', inputVars);
}
updateSalesChannelConnectionRef.operationName = 'UpdateSalesChannelConnection';
exports.updateSalesChannelConnectionRef = updateSalesChannelConnectionRef;

exports.updateSalesChannelConnection = function updateSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateSalesChannelConnectionRef(dcInstance, inputVars));
}
;

const archiveSalesChannelConnectionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ArchiveSalesChannelConnection', inputVars);
}
archiveSalesChannelConnectionRef.operationName = 'ArchiveSalesChannelConnection';
exports.archiveSalesChannelConnectionRef = archiveSalesChannelConnectionRef;

exports.archiveSalesChannelConnection = function archiveSalesChannelConnection(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(archiveSalesChannelConnectionRef(dcInstance, inputVars));
}
;

const closeCashSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CloseCashSession', inputVars);
}
closeCashSessionRef.operationName = 'CloseCashSession';
exports.closeCashSessionRef = closeCashSessionRef;

exports.closeCashSession = function closeCashSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(closeCashSessionRef(dcInstance, inputVars));
}
;

const getCurrentUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentUser');
}
getCurrentUserRef.operationName = 'GetCurrentUser';
exports.getCurrentUserRef = getCurrentUserRef;

exports.getCurrentUser = function getCurrentUser(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCurrentUserRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getCurrentUserAccessRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCurrentUserAccess');
}
getCurrentUserAccessRef.operationName = 'GetCurrentUserAccess';
exports.getCurrentUserAccessRef = getCurrentUserAccessRef;

exports.getCurrentUserAccess = function getCurrentUserAccess(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCurrentUserAccessRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const validateDeviceSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ValidateDeviceSession', inputVars);
}
validateDeviceSessionRef.operationName = 'ValidateDeviceSession';
exports.validateDeviceSessionRef = validateDeviceSessionRef;

exports.validateDeviceSession = function validateDeviceSession(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(validateDeviceSessionRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const salesChannelWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SalesChannelWorkspace', inputVars);
}
salesChannelWorkspaceRef.operationName = 'SalesChannelWorkspace';
exports.salesChannelWorkspaceRef = salesChannelWorkspaceRef;

exports.salesChannelWorkspace = function salesChannelWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(salesChannelWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const salesWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SalesWorkspace', inputVars);
}
salesWorkspaceRef.operationName = 'SalesWorkspace';
exports.salesWorkspaceRef = salesWorkspaceRef;

exports.salesWorkspace = function salesWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(salesWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listSalesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSales', inputVars);
}
listSalesRef.operationName = 'ListSales';
exports.listSalesRef = listSalesRef;

exports.listSales = function listSales(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSalesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const saleDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'SaleDetails', inputVars);
}
saleDetailsRef.operationName = 'SaleDetails';
exports.saleDetailsRef = saleDetailsRef;

exports.saleDetails = function saleDetails(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(saleDetailsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCategoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCategories', inputVars);
}
listCategoriesRef.operationName = 'ListCategories';
exports.listCategoriesRef = listCategoriesRef;

exports.listCategories = function listCategories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCategoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listSubcategoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSubcategories', inputVars);
}
listSubcategoriesRef.operationName = 'ListSubcategories';
exports.listSubcategoriesRef = listSubcategoriesRef;

exports.listSubcategories = function listSubcategories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSubcategoriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const categoryOptionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'CategoryOptions', inputVars);
}
categoryOptionsRef.operationName = 'CategoryOptions';
exports.categoryOptionsRef = categoryOptionsRef;

exports.categoryOptions = function categoryOptions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(categoryOptionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listBranchesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBranches', inputVars);
}
listBranchesRef.operationName = 'ListBranches';
exports.listBranchesRef = listBranchesRef;

exports.listBranches = function listBranches(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listBranchesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listSuppliersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSuppliers', inputVars);
}
listSuppliersRef.operationName = 'ListSuppliers';
exports.listSuppliersRef = listSuppliersRef;

exports.listSuppliers = function listSuppliers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listSuppliersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listCustomersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListCustomers', inputVars);
}
listCustomersRef.operationName = 'ListCustomers';
exports.listCustomersRef = listCustomersRef;

exports.listCustomers = function listCustomers(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listCustomersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listProductsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProducts', inputVars);
}
listProductsRef.operationName = 'ListProducts';
exports.listProductsRef = listProductsRef;

exports.listProducts = function listProducts(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listProductsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const registrationOptionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'RegistrationOptions', inputVars);
}
registrationOptionsRef.operationName = 'RegistrationOptions';
exports.registrationOptionsRef = registrationOptionsRef;

exports.registrationOptions = function registrationOptions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, false);
  return executeQuery(registrationOptionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const productComponentsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ProductComponents', inputVars);
}
productComponentsRef.operationName = 'ProductComponents';
exports.productComponentsRef = productComponentsRef;

exports.productComponents = function productComponents(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(productComponentsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const productPromotionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ProductPromotions', inputVars);
}
productPromotionsRef.operationName = 'ProductPromotions';
exports.productPromotionsRef = productPromotionsRef;

exports.productPromotions = function productPromotions(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(productPromotionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const platformAdminWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'PlatformAdminWorkspace', inputVars);
}
platformAdminWorkspaceRef.operationName = 'PlatformAdminWorkspace';
exports.platformAdminWorkspaceRef = platformAdminWorkspaceRef;

exports.platformAdminWorkspace = function platformAdminWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(platformAdminWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const stockWorkspaceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'StockWorkspace', inputVars);
}
stockWorkspaceRef.operationName = 'StockWorkspace';
exports.stockWorkspaceRef = stockWorkspaceRef;

exports.stockWorkspace = function stockWorkspace(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(stockWorkspaceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const dailyProfitDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'DailyProfitDashboard', inputVars);
}
dailyProfitDashboardRef.operationName = 'DailyProfitDashboard';
exports.dailyProfitDashboardRef = dailyProfitDashboardRef;

exports.dailyProfitDashboard = function dailyProfitDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(dailyProfitDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const stockOperationDetailsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'StockOperationDetails', inputVars);
}
stockOperationDetailsRef.operationName = 'StockOperationDetails';
exports.stockOperationDetailsRef = stockOperationDetailsRef;

exports.stockOperationDetails = function stockOperationDetails(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(stockOperationDetailsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const financialIndicatorsDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'FinancialIndicatorsDashboard', inputVars);
}
financialIndicatorsDashboardRef.operationName = 'FinancialIndicatorsDashboard';
exports.financialIndicatorsDashboardRef = financialIndicatorsDashboardRef;

exports.financialIndicatorsDashboard = function financialIndicatorsDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(financialIndicatorsDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const operationalAnalyticsDashboardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'OperationalAnalyticsDashboard', inputVars);
}
operationalAnalyticsDashboardRef.operationName = 'OperationalAnalyticsDashboard';
exports.operationalAnalyticsDashboardRef = operationalAnalyticsDashboardRef;

exports.operationalAnalyticsDashboard = function operationalAnalyticsDashboard(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(operationalAnalyticsDashboardRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const recoverPlatformAdministratorRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'RecoverPlatformAdministrator');
}
recoverPlatformAdministratorRef.operationName = 'RecoverPlatformAdministrator';
exports.recoverPlatformAdministratorRef = recoverPlatformAdministratorRef;

exports.recoverPlatformAdministrator = function recoverPlatformAdministrator(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(recoverPlatformAdministratorRef(dcInstance, inputVars));
}
;
