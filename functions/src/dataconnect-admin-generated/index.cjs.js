const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'app',
  serviceId: 'insightpad',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

function verifySalesChannelOrderConstraints(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('VerifySalesChannelOrderConstraints', undefined, inputOpts);
}
exports.verifySalesChannelOrderConstraints = verifySalesChannelOrderConstraints;

function bootstrapSalesChannelsNavigation(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('BootstrapSalesChannelsNavigation', inputVars, inputOpts);
}
exports.bootstrapSalesChannelsNavigation = bootstrapSalesChannelsNavigation;

function bootstrapSalesChannelsNavigationV2(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('BootstrapSalesChannelsNavigationV2', undefined, inputOpts);
}
exports.bootstrapSalesChannelsNavigationV2 = bootstrapSalesChannelsNavigationV2;

function bootstrapNavigationCatalog(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('BootstrapNavigationCatalog', inputVars, inputOpts);
}
exports.bootstrapNavigationCatalog = bootstrapNavigationCatalog;

function createCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateCategory', inputVars, inputOpts);
}
exports.createCategory = createCategory;

function updateCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateCategory', inputVars, inputOpts);
}
exports.updateCategory = updateCategory;

function archiveCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ArchiveCategory', inputVars, inputOpts);
}
exports.archiveCategory = archiveCategory;

function createSubcategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateSubcategory', inputVars, inputOpts);
}
exports.createSubcategory = createSubcategory;

function updateSubcategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateSubcategory', inputVars, inputOpts);
}
exports.updateSubcategory = updateSubcategory;

function archiveSubcategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ArchiveSubcategory', inputVars, inputOpts);
}
exports.archiveSubcategory = archiveSubcategory;

function restoreCategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RestoreCategory', inputVars, inputOpts);
}
exports.restoreCategory = restoreCategory;

function restoreSubcategory(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RestoreSubcategory', inputVars, inputOpts);
}
exports.restoreSubcategory = restoreSubcategory;

function createCategoriesBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateCategoriesBatch', inputVars, inputOpts);
}
exports.createCategoriesBatch = createCategoriesBatch;

function createSubcategoriesBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateSubcategoriesBatch', inputVars, inputOpts);
}
exports.createSubcategoriesBatch = createSubcategoriesBatch;

function saveBranch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveBranch', inputVars, inputOpts);
}
exports.saveBranch = saveBranch;

function setBranchStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetBranchStatus', inputVars, inputOpts);
}
exports.setBranchStatus = setBranchStatus;

function saveSupplier(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveSupplier', inputVars, inputOpts);
}
exports.saveSupplier = saveSupplier;

function setSupplierStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetSupplierStatus', inputVars, inputOpts);
}
exports.setSupplierStatus = setSupplierStatus;

function saveCustomer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveCustomer', inputVars, inputOpts);
}
exports.saveCustomer = saveCustomer;

function setCustomerStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetCustomerStatus', inputVars, inputOpts);
}
exports.setCustomerStatus = setCustomerStatus;

function saveProduct(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveProduct', inputVars, inputOpts);
}
exports.saveProduct = saveProduct;

function setProductStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetProductStatus', inputVars, inputOpts);
}
exports.setProductStatus = setProductStatus;

function saveProductComponents(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveProductComponents', inputVars, inputOpts);
}
exports.saveProductComponents = saveProductComponents;

function savePromotion(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SavePromotion', inputVars, inputOpts);
}
exports.savePromotion = savePromotion;

function setPromotionStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetPromotionStatus', inputVars, inputOpts);
}
exports.setPromotionStatus = setPromotionStatus;

function setCategoriesStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetCategoriesStatusBatch', inputVars, inputOpts);
}
exports.setCategoriesStatusBatch = setCategoriesStatusBatch;

function setSubcategoriesStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetSubcategoriesStatusBatch', inputVars, inputOpts);
}
exports.setSubcategoriesStatusBatch = setSubcategoriesStatusBatch;

function setBranchesStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetBranchesStatusBatch', inputVars, inputOpts);
}
exports.setBranchesStatusBatch = setBranchesStatusBatch;

function setSuppliersStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetSuppliersStatusBatch', inputVars, inputOpts);
}
exports.setSuppliersStatusBatch = setSuppliersStatusBatch;

function setCustomersStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetCustomersStatusBatch', inputVars, inputOpts);
}
exports.setCustomersStatusBatch = setCustomersStatusBatch;

function setProductsStatusBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetProductsStatusBatch', inputVars, inputOpts);
}
exports.setProductsStatusBatch = setProductsStatusBatch;

function ensureSalesDefaults(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('EnsureSalesDefaults', undefined, inputOpts);
}
exports.ensureSalesDefaults = ensureSalesDefaults;

function postSale(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('PostSale', inputVars, inputOpts);
}
exports.postSale = postSale;

function cancelSale(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CancelSale', inputVars, inputOpts);
}
exports.cancelSale = cancelSale;

function createPlatformTenant(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreatePlatformTenant', inputVars, inputOpts);
}
exports.createPlatformTenant = createPlatformTenant;

function updatePlatformTenant(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdatePlatformTenant', inputVars, inputOpts);
}
exports.updatePlatformTenant = updatePlatformTenant;

function setPlatformTenantStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetPlatformTenantStatus', inputVars, inputOpts);
}
exports.setPlatformTenantStatus = setPlatformTenantStatus;

function linkPlatformUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('LinkPlatformUser', inputVars, inputOpts);
}
exports.linkPlatformUser = linkPlatformUser;

function setPlatformUserStatus(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetPlatformUserStatus', inputVars, inputOpts);
}
exports.setPlatformUserStatus = setPlatformUserStatus;

function setPlatformRolePermission(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SetPlatformRolePermission', inputVars, inputOpts);
}
exports.setPlatformRolePermission = setPlatformRolePermission;

function createPlatformInvoice(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreatePlatformInvoice', inputVars, inputOpts);
}
exports.createPlatformInvoice = createPlatformInvoice;

function updatePlatformInvoice(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdatePlatformInvoice', inputVars, inputOpts);
}
exports.updatePlatformInvoice = updatePlatformInvoice;

function voidPlatformInvoice(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('VoidPlatformInvoice', inputVars, inputOpts);
}
exports.voidPlatformInvoice = voidPlatformInvoice;

function settlePlatformInvoice(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SettlePlatformInvoice', inputVars, inputOpts);
}
exports.settlePlatformInvoice = settlePlatformInvoice;

function reversePlatformPayment(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ReversePlatformPayment', inputVars, inputOpts);
}
exports.reversePlatformPayment = reversePlatformPayment;

function postStockAdjustment(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('PostStockAdjustment', inputVars, inputOpts);
}
exports.postStockAdjustment = postStockAdjustment;

function postStockTransfer(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('PostStockTransfer', inputVars, inputOpts);
}
exports.postStockTransfer = postStockTransfer;

function saveStockBatch(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SaveStockBatch', inputVars, inputOpts);
}
exports.saveStockBatch = saveStockBatch;

function reverseStockOperation(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ReverseStockOperation', inputVars, inputOpts);
}
exports.reverseStockOperation = reverseStockOperation;

function openCashSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('OpenCashSession', inputVars, inputOpts);
}
exports.openCashSession = openCashSession;

function registerCashMovement(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RegisterCashMovement', inputVars, inputOpts);
}
exports.registerCashMovement = registerCashMovement;

function claimDeviceSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ClaimDeviceSession', inputVars, inputOpts);
}
exports.claimDeviceSession = claimDeviceSession;

function touchDeviceSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('TouchDeviceSession', inputVars, inputOpts);
}
exports.touchDeviceSession = touchDeviceSession;

function releaseDeviceSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ReleaseDeviceSession', inputVars, inputOpts);
}
exports.releaseDeviceSession = releaseDeviceSession;

function createSalesChannelConnection(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateSalesChannelConnection', inputVars, inputOpts);
}
exports.createSalesChannelConnection = createSalesChannelConnection;

function updateSalesChannelConnection(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateSalesChannelConnection', inputVars, inputOpts);
}
exports.updateSalesChannelConnection = updateSalesChannelConnection;

function archiveSalesChannelConnection(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ArchiveSalesChannelConnection', inputVars, inputOpts);
}
exports.archiveSalesChannelConnection = archiveSalesChannelConnection;

function createSalesChannelProductMapping(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateSalesChannelProductMapping', inputVars, inputOpts);
}
exports.createSalesChannelProductMapping = createSalesChannelProductMapping;

function updateSalesChannelProductMapping(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('UpdateSalesChannelProductMapping', inputVars, inputOpts);
}
exports.updateSalesChannelProductMapping = updateSalesChannelProductMapping;

function archiveSalesChannelProductMapping(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('ArchiveSalesChannelProductMapping', inputVars, inputOpts);
}
exports.archiveSalesChannelProductMapping = archiveSalesChannelProductMapping;

function queueSalesChannelOrderAction(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('QueueSalesChannelOrderAction', inputVars, inputOpts);
}
exports.queueSalesChannelOrderAction = queueSalesChannelOrderAction;

function retrySalesChannelCommand(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RetrySalesChannelCommand', inputVars, inputOpts);
}
exports.retrySalesChannelCommand = retrySalesChannelCommand;

function requestSalesChannelSync(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RequestSalesChannelSync', inputVars, inputOpts);
}
exports.requestSalesChannelSync = requestSalesChannelSync;

function requestSalesChannelAuthorization(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('RequestSalesChannelAuthorization', inputVars, inputOpts);
}
exports.requestSalesChannelAuthorization = requestSalesChannelAuthorization;

function systemClaimSalesChannelWork(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemClaimSalesChannelWork', inputVars, inputOpts);
}
exports.systemClaimSalesChannelWork = systemClaimSalesChannelWork;

function systemUpdateSalesChannelConnection(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemUpdateSalesChannelConnection', inputVars, inputOpts);
}
exports.systemUpdateSalesChannelConnection = systemUpdateSalesChannelConnection;

function systemRegisterSalesChannelEvent(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemRegisterSalesChannelEvent', inputVars, inputOpts);
}
exports.systemRegisterSalesChannelEvent = systemRegisterSalesChannelEvent;

function systemRecordSalesChannelEventResult(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemRecordSalesChannelEventResult', inputVars, inputOpts);
}
exports.systemRecordSalesChannelEventResult = systemRecordSalesChannelEventResult;

function systemIngestSalesChannelOrder(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemIngestSalesChannelOrder', inputVars, inputOpts);
}
exports.systemIngestSalesChannelOrder = systemIngestSalesChannelOrder;

function systemApplySalesChannelOrderEvent(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemApplySalesChannelOrderEvent', inputVars, inputOpts);
}
exports.systemApplySalesChannelOrderEvent = systemApplySalesChannelOrderEvent;

function systemQueueDueSalesChannelSyncJobs(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemQueueDueSalesChannelSyncJobs', inputVars, inputOpts);
}
exports.systemQueueDueSalesChannelSyncJobs = systemQueueDueSalesChannelSyncJobs;

function systemPurgeExpiredSalesChannelPayloads(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemPurgeExpiredSalesChannelPayloads', inputVars, inputOpts);
}
exports.systemPurgeExpiredSalesChannelPayloads = systemPurgeExpiredSalesChannelPayloads;

function systemRecordSalesChannelCommandResult(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemRecordSalesChannelCommandResult', inputVars, inputOpts);
}
exports.systemRecordSalesChannelCommandResult = systemRecordSalesChannelCommandResult;

function systemRecordSalesChannelSyncResult(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemRecordSalesChannelSyncResult', inputVars, inputOpts);
}
exports.systemRecordSalesChannelSyncResult = systemRecordSalesChannelSyncResult;

function systemRecordSalesChannelMappingResult(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('SystemRecordSalesChannelMappingResult', inputVars, inputOpts);
}
exports.systemRecordSalesChannelMappingResult = systemRecordSalesChannelMappingResult;

function closeCashSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CloseCashSession', inputVars, inputOpts);
}
exports.closeCashSession = closeCashSession;

function getCurrentUser(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetCurrentUser', undefined, inputOpts);
}
exports.getCurrentUser = getCurrentUser;

function getCurrentUserAccess(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('GetCurrentUserAccess', undefined, inputOpts);
}
exports.getCurrentUserAccess = getCurrentUserAccess;

function validateDeviceSession(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ValidateDeviceSession', inputVars, inputOpts);
}
exports.validateDeviceSession = validateDeviceSession;

function salesChannelOptions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelOptions', inputVars, inputOpts);
}
exports.salesChannelOptions = salesChannelOptions;

function salesChannelConnectionsV2(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelConnectionsV2', inputVars, inputOpts);
}
exports.salesChannelConnectionsV2 = salesChannelConnectionsV2;

function salesChannelProductMappingsV2(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelProductMappingsV2', inputVars, inputOpts);
}
exports.salesChannelProductMappingsV2 = salesChannelProductMappingsV2;

function salesChannelProductOptions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelProductOptions', inputVars, inputOpts);
}
exports.salesChannelProductOptions = salesChannelProductOptions;

function salesChannelOperations(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelOperations', inputVars, inputOpts);
}
exports.salesChannelOperations = salesChannelOperations;

function systemSalesChannelWorkQueue(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SystemSalesChannelWorkQueue', inputVars, inputOpts);
}
exports.systemSalesChannelWorkQueue = systemSalesChannelWorkQueue;

function systemIfoodConnectionsForPolling(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SystemIfoodConnectionsForPolling', inputVars, inputOpts);
}
exports.systemIfoodConnectionsForPolling = systemIfoodConnectionsForPolling;

function systemIfoodConnectionByMerchant(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SystemIfoodConnectionByMerchant', inputVars, inputOpts);
}
exports.systemIfoodConnectionByMerchant = systemIfoodConnectionByMerchant;

function systemSalesChannelMappingsForSync(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SystemSalesChannelMappingsForSync', inputVars, inputOpts);
}
exports.systemSalesChannelMappingsForSync = systemSalesChannelMappingsForSync;

function salesChannelOrdersV2(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelOrdersV2', inputVars, inputOpts);
}
exports.salesChannelOrdersV2 = salesChannelOrdersV2;

function salesChannelWorkspace(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelWorkspace', inputVars, inputOpts);
}
exports.salesChannelWorkspace = salesChannelWorkspace;

function salesChannelOrders(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesChannelOrders', inputVars, inputOpts);
}
exports.salesChannelOrders = salesChannelOrders;

function latestPendingSalesChannelOrder(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('LatestPendingSalesChannelOrder', inputVars, inputOpts);
}
exports.latestPendingSalesChannelOrder = latestPendingSalesChannelOrder;

function salesWorkspace(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SalesWorkspace', inputVars, inputOpts);
}
exports.salesWorkspace = salesWorkspace;

function listSales(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListSales', inputVars, inputOpts);
}
exports.listSales = listSales;

function saleDetails(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('SaleDetails', inputVars, inputOpts);
}
exports.saleDetails = saleDetails;

function listCategories(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListCategories', inputVars, inputOpts);
}
exports.listCategories = listCategories;

function listSubcategories(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListSubcategories', inputVars, inputOpts);
}
exports.listSubcategories = listSubcategories;

function categoryOptions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('CategoryOptions', inputVars, inputOpts);
}
exports.categoryOptions = categoryOptions;

function listBranches(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListBranches', inputVars, inputOpts);
}
exports.listBranches = listBranches;

function listSuppliers(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListSuppliers', inputVars, inputOpts);
}
exports.listSuppliers = listSuppliers;

function listCustomers(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListCustomers', inputVars, inputOpts);
}
exports.listCustomers = listCustomers;

function listProducts(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListProducts', inputVars, inputOpts);
}
exports.listProducts = listProducts;

function registrationOptions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, false);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('RegistrationOptions', inputVars, inputOpts);
}
exports.registrationOptions = registrationOptions;

function productComponents(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ProductComponents', inputVars, inputOpts);
}
exports.productComponents = productComponents;

function productPromotions(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ProductPromotions', inputVars, inputOpts);
}
exports.productPromotions = productPromotions;

function platformAdminWorkspace(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('PlatformAdminWorkspace', inputVars, inputOpts);
}
exports.platformAdminWorkspace = platformAdminWorkspace;

function platformBillingWorkspace(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('PlatformBillingWorkspace', inputVars, inputOpts);
}
exports.platformBillingWorkspace = platformBillingWorkspace;

function platformBillingWorkspaceV2(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('PlatformBillingWorkspaceV2', inputVars, inputOpts);
}
exports.platformBillingWorkspaceV2 = platformBillingWorkspaceV2;

function stockWorkspace(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('StockWorkspace', inputVars, inputOpts);
}
exports.stockWorkspace = stockWorkspace;

function dailyProfitDashboard(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('DailyProfitDashboard', inputVars, inputOpts);
}
exports.dailyProfitDashboard = dailyProfitDashboard;

function stockOperationDetails(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('StockOperationDetails', inputVars, inputOpts);
}
exports.stockOperationDetails = stockOperationDetails;

function financialIndicatorsDashboard(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('FinancialIndicatorsDashboard', inputVars, inputOpts);
}
exports.financialIndicatorsDashboard = financialIndicatorsDashboard;

function operationalAnalyticsDashboard(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('OperationalAnalyticsDashboard', inputVars, inputOpts);
}
exports.operationalAnalyticsDashboard = operationalAnalyticsDashboard;
