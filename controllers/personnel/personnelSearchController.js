const ModelSelect = require("../../models/db/SelectModel");

const personnelSearchController = {
  // sec1(search) - sec3(result)
  async searchPersonnel(req, res) {
    try {
      const type = req.query?.type || req.body?.type || null;
      const keyword = req.query?.keyword || req.body?.keyword || null;
      console.log(
        `[Backend] ค้นหาข้อมูลบุคลากรรายละเอียด 33 ฟิลด์ ฟิลด์: ${type} คำค้นหา: ${keyword}`,
      );

      let sql = `
        SELECT 
          p.PER_CITIZEN_ID, p.TYPE_CODE, p.TYPE_NAME, p.PER_SLIP_ID, p.PER_POS_ID, 
          p.PRE_CODE, p.PRE_NAME, p.PER_NAME_TH, p.PER_NAME_EN, p.PER_TAX_ID, 
          p.PER_PVDF_APP, p.PER_PVDF_APP_D, p.PER_PVDF_QUIT, p.PER_PVDF_QUIT_D, 
          p.PER_FUND_TYPE, p.PER_SAVE_RATE, p.PER_SSO_PAYMENT, p.PER_FUND_TEACHER, 
          p.PER_FUND_ASSTEACHER, p.PER_SSO_ID, p.PER_PASSPORT_NO, p.PER_PASSPORT_START_D, 
          p.PER_PASSPORT_EXPIRE_D, p.POSC_NAME, p.PER_FAC_C, 
          p.FAC_NAME, p.PER_SALARY, p.PER_HOLD_SALARY, p.PER_SOURCE_MONEY,
          p.PER_POSITION_MONEY, p.PER_POSITION_PAY, p.PER_POSITION_MONEY_EX, p.PER_POSITION_PAY_EX, p.PER_PROJECT,
          p.F_REV_SALARY, p.F_REV_POS_MONEY, p.F_REV_PAY_EX, p.F_TOTAL_INCOME,
          p.CREATED_DATE, p.CREATED_BY, p.UPDATED_DATE, p.UPDATED_BY,
          pre.PRE_NAME || p.PER_NAME_TH AS FULL_NAME_TH,
          fund.FUND_NAME,
          f.FAC_NAME2,
          proj.PRO_NAME,
          sm.SM_NAME
        FROM PERSON_PAYROLL_OUT p
        LEFT JOIN NORAPAT.PRENAME_CODE pre ON p.PRE_CODE = pre.PRE_CODE
        LEFT JOIN NORAPAT.PERSONTYPE t ON p.TYPE_CODE = t.TYPE_CODE
        LEFT JOIN FACULTY_CODE f ON p.PER_FAC_C = f.FAC_CODE
        LEFT JOIN NORAPAT.FUND_TYPE fund ON p.PER_FUND_TYPE = fund.FUND_CODE
        LEFT JOIN NORAPAT.PROJECT_TYPE proj ON p.PER_PROJECT = proj.PRO_CODE
        LEFT JOIN NORAPAT.SOURCE_MONEY sm ON p.PER_SOURCE_MONEY = sm.SM_CODE
      `;

      const binds = {};

      if (type && keyword && keyword.trim() !== "" && type !== "all" && keyword !== "all") {
        if (type === "idCard") {
          sql += ` WHERE p.PER_CITIZEN_ID = :keyword `;
          binds.keyword = keyword.trim();
        } else if (type === "passport") {
          sql += ` WHERE p.PER_PASSPORT_NO = :keyword `;
          binds.keyword = keyword.trim();
        } else if (type === "ssoId") {
          sql += ` WHERE p.PER_SSO_ID = :keyword `;
          binds.keyword = keyword.trim();
        } else if (type === "nameTh") {
          sql += ` WHERE p.PER_NAME_TH LIKE '%' || :keyword || '%' `;
          binds.keyword = keyword.trim();
        } else if (type === "nameEn") {
          sql += ` WHERE UPPER(p.PER_NAME_EN) LIKE '%' || UPPER(:keyword) || '%' `;
          binds.keyword = keyword.trim();
        }
      }

      sql += ` ORDER BY p.CREATED_DATE DESC`;

      // รันคำสั่งคิวรี
      const result = await ModelSelect.findAll(res, sql, binds);

      if (!result) {
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในคิวรีระบบฐานข้อมูล",
        });
      }

      const rows = result?.rows ?? [];
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error("Search API Unexpected Error:", error);
      return res.status(500).json({ success: false, txt: error.message });
    }
  },
};

module.exports = personnelSearchController;
