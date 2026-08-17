const ModelSelect = require("../../models/db/SelectModel");

const personnelMasterController = {
  // Get all faculties for dropdown
  async getFaculties(req, res) {
    try {
      const sql = `SELECT FAC_CODE, FAC_NAME, FAC_NAME2 FROM FACULTY_CODE ORDER BY FAC_CODE ASC`;
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลคณะได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getFaculties Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // Get all prenames for dropdown
  async getPrenames(req, res) {
    try {
      const sql = `SELECT PRE_CODE, PRE_NAME, PRE_NAME2, PRE_NAME_EN, PRE_NAME_IDCARD FROM NORAPAT.PRENAME_CODE ORDER BY PRE_CODE ASC`;
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลคำนำหน้าชื่อได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getPrenames Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // Get all person types for dropdown
  async getPersonTypes(req, res) {
    try {
      const sql = `SELECT TYPE_CODE, TYPE_NAME, TYPE_NAME2 FROM NORAPAT.PERSONTYPE ORDER BY TYPE_CODE ASC`;
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลประเภทบุคลากรได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getPersonTypes Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // Get all fund types for dropdown 
  async getFundTypes(req, res) {
    try {
      const sql = `SELECT FUND_CODE, FUND_NAME FROM NORAPAT.FUND_TYPE ORDER BY FUND_CODE ASC`;
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลประเภทกองทุนได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getFundTypes Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // Get all project types for dropdown
  async getProjectTypes(req, res) {
    try {
      const sql = `SELECT PRO_CODE, PRO_NAME FROM NORAPAT.PROJECT_TYPE ORDER BY PRO_CODE ASC`;
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลประเภทโครงการได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getProjectTypes Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // Get all source money types for dropdown
  async getSourceMoneyTypes(req, res) {
    try {
      const sql = `SELECT SM_CODE, SM_NAME FROM NORAPAT.SOURCE_MONEY ORDER BY SM_CODE ASC`;
      console.log("getSourceMoneyTypes Sql: ", sql);
      const result = await ModelSelect.findAll(res, sql, {});
      if (result === null) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลแหล่งเงินได้" });
      }
      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("getSourceMoneyTypes Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },
};

module.exports = personnelMasterController;
