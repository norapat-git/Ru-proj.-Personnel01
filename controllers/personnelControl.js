("use strict");

const personnelSearchController = require("./personnel/personnelSearchController");
const personnelManageController = require("./personnel/personnelManageController");
const personnelMasterController = require("./personnel/personnelMasterController");

const PersonnelController = {
  // Search controller
  searchPersonnel: personnelSearchController.searchPersonnel,

  // Manage controllers Insert Update Delete
  insertPersonnel: personnelManageController.insertPersonnel,
  updatePersonnel: personnelManageController.updatePersonnel,
  deletePersonnel: personnelManageController.deletePersonnel,

  // Master / Dropdown data controllers
  getFaculties: personnelMasterController.getFaculties,
  getPrenames: personnelMasterController.getPrenames,
  getPersonTypes: personnelMasterController.getPersonTypes,
  getFundTypes: personnelMasterController.getFundTypes,
  getProjectTypes: personnelMasterController.getProjectTypes,
  getSourceMoneyTypes: personnelMasterController.getSourceMoneyTypes,
};

module.exports = PersonnelController;
