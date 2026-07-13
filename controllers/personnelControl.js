var oracledb = require("oracledb");

const ModelSelect = require("../models/db/SelectModel");
const ModelInsert = require("../models/db/InsertModel.js");
const ModelUpdate = require("../models/db/UpDateModel");
const ModelDelete = require("../models/db/DeleteModel");
const DbTx = require("../models/db/DbTxModel");

("use strict");
Error.stackTraceLimit = 50;

const PersonnelController = {
  // sec1(search) - sec3(result)
  async searchPersonnel(req, res) {
    try {
      const { type, keyword } = req.query;
      console.log(
        `[Backend] ค้นหาข้อมูลบุคลากรละเอียด 33 ฟิลด์ ฟิลด์: ${type} คำค้นหา: ${keyword}`,
      );

      let sql = `
        SELECT 
          p.PER_CITIZEN_ID, p.TYPE_CODE, p.TYPE_NAME, p.PER_SLIP_ID, p.PER_POS_ID, 
          p.PRE_CODE, p.PRE_NAME, p.PER_NAME_TH, p.PER_NAME_EN, p.PER_TAX_ID, 
          p.PER_PVDF_APP, p.PER_PVDF_APP_D, p.PER_PVDF_QUIT, p.PER_PVDF_QUIT_D, 
          p.PER_FUND_TYPE, p.PER_SAVE_RATE, p.PER_SSO_PAYMENT, p.PER_FUND_TEACHER, 
          p.PER_FUND_ASSTEACHER, p.PER_SSO_ID, p.PER_PASSPORT_NO, p.PER_PASSPORT_START_D, 
          p.PER_PASSPORT_EXPIRE_D, p.POSC_NAME, p.PER_FAC_C, 
          p.FAC_NAME, p.PER_SALARY, p.PER_HOLD_SALARY, p.CREATED_DATE, 
          p.CREATED_BY, p.UPDATED_DATE, p.UPDATED_BY,
          pre.PRE_NAME || p.PER_NAME_TH AS FULL_NAME_TH,
          fund.FUND_NAME
        FROM PERSON_PAYROLL_OUT p
        LEFT JOIN PRENAME_CODE pre ON p.PRE_CODE = pre.PRE_CODE
        LEFT JOIN PERSONTYPE t ON p.TYPE_CODE = t.TYPE_CODE
        LEFT JOIN FACULTY_CODE f ON p.PER_FAC_C = f.FAC_CODE
        LEFT JOIN FUND_TYPE fund ON p.PER_FUND_TYPE = fund.FUND_CODE
      `;

      const binds = {};

      if (type && keyword && keyword.trim() !== "") {
        if (type === "idCard") {
          sql += ` WHERE p.PER_CITIZEN_ID LIKE :keyword`;
          binds.keyword = `%${keyword}%`;
        } else if (type === "passport") {
          sql += ` WHERE p.PER_PASSPORT_NO LIKE :keyword`;
          binds.keyword = `%${keyword}%`;
        } else if (type === "ssoId") {
          sql += ` WHERE p.PER_SSO_ID LIKE :keyword`;
          binds.keyword = `%${keyword}%`;
        } else if (type === "nameTh") {
          sql += ` WHERE p.PER_NAME_TH LIKE :keyword`;
          binds.keyword = `%${keyword}%`;
        } else if (type === "nameEn") {
          // ค้นหาชื่อ ENG
          sql += ` WHERE p.PER_NAME_EN LIKE :keyword`;
          binds.keyword = `%${keyword}%`;
        }
      }

      sql += ` ORDER BY p.PER_NAME_TH ASC`;

      // รันคำสั่งคิวรี
      const result = await ModelSelect.findAll(res, sql, binds);

      if (result === null) {
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

  //func save ข้อมูล
  async insertPersonnel(req, res) {
    try {
      const {
        perCitizenId,
        typeCode,
        typeName,
        perSlipId,
        perPosId,
        preCode,
        preName,
        perNameTh,
        perNameEn,
        perTaxId,
        perPvdfApp,
        perPvdfAppD,
        perPvdfQuit,
        perPvdfQuitD,
        perFundType,
        perSaveRate,
        perSsoPayment,
        perFundTeacher,
        perFundAssteacher,
        perSsoId,
        perPassportNo,
        perPassportStartD,
        perPassportExpireD,
        poscName,
        perFacC,
        facName,
        perSalary,
        perHoldSalary,
      } = req.body;

      console.log(
        `[Backend] กำลังทำคำสั่งบันทึกข้อมูลแบบละเอียดเข้าตาราง PERSON_PAYROLL_OUT`,
      );

      const sql = `
        INSERT INTO PERSON_PAYROLL_OUT (
          PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
          PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
          PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
          PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
          FAC_NAME, PER_SALARY, PER_HOLD_SALARY, CREATED_DATE, CREATED_BY
        ) VALUES (
          :perCitizenId, :typeCode, :typeName, :perSlipId, :perPosId, :preCode, :preName,
          :perNameTh, :perNameEn, :perTaxId, :perPvdfApp, 
          TO_DATE(:perPvdfAppD, 'YYYY-MM-DD'), 
          :perPvdfQuit, 
          TO_DATE(:perPvdfQuitD, 'YYYY-MM-DD'),
          :perFundType, :perSaveRate, :perSsoPayment, :perFundTeacher, :perFundAssteacher, :perSsoId,
          :perPassportNo, 
          TO_DATE(:perPassportStartD, 'YYYY-MM-DD'), 
          TO_DATE(:perPassportExpireD, 'YYYY-MM-DD'), 
          :poscName, :perFacC,
          :facName, :perSalary, :perHoldSalary, SYSDATE, 'ANGULAR_FULL_SYSTEM'
        )
      `;

      const binds = {
        perCitizenId,
        typeCode,
        typeName,
        perSlipId,
        perPosId,
        preCode,
        preName,
        perNameTh,
        perNameEn,
        perTaxId,
        perPvdfApp,
        perPvdfAppD: perPvdfAppD || null,
        perPvdfQuit,
        perPvdfQuitD: perPvdfQuitD || null,
        perFundType,
        perSaveRate,
        perSsoPayment,
        perFundTeacher,
        perFundAssteacher,
        perSsoId,
        perPassportNo,
        perPassportStartD: perPassportStartD || null,
        perPassportExpireD: perPassportExpireD || null,
        poscName,
        perFacC,
        facName,
        perSalary,
        perHoldSalary,
      };

      console.log("SQL Binds:", binds);
      const isSuccess = await ModelInsert.insertdb(res, sql, binds);

      if (isSuccess) {
        return res.status(201).json({
          success: true,
          message: "บันทึกข้อมูลบุคลากรเข้าสู่ระบบฐานข้อมูลสถาบันเรียบร้อยแล้ว",
        });
      } else {
        if (!res.headersSent) {
          return res.status(400).json({
            success: false,
            message: "ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลอีกครั้ง",
          });
        }
      }
    } catch (error) {
      console.error("Insert Full API Unexpected Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, txt: error.message });
      }
    }
  },

  // update info
  async updatePersonnel(req, res) {
    try {
      const {
        perCitizenId,
        typeCode,
        typeName,
        perSlipId,
        perPosId,
        preCode,
        preName,
        perNameTh,
        perNameEn,
        perMiddleNameEn,
        perTaxId,
        perPvdfApp,
        perPvdfAppD,
        perPvdfQuit,
        perPvdfQuitD,
        perFundType,
        perSaveRate,
        perSsoPayment,
        perFundTeacher,
        perFundAssteacher,
        perSsoId,
        perPassportNo,
        perPassportStartD,
        perPassportExpireD,
        poscName,
        perFacC,
        facName,
        perSalary,
        perHoldSalary,
        originalCitizenId,
        originalPassportNo,
      } = req.body;

      // ระบุคีย์ข้อมูลเดิมที่ใช้ค้นหาแถวเพื่อทำการแก้ไขและแบ็กอัป (กรองคำว่า 'null' / 'undefined' ออก)
      const sanitizeId = (val) => (val && val !== 'null' && val !== 'undefined') ? val : null;
      const targetCitizenId = sanitizeId(originalCitizenId) || sanitizeId(perCitizenId);
      const targetPassportNo = sanitizeId(originalPassportNo) || sanitizeId(perPassportNo);

      if (!targetCitizenId && !targetPassportNo) {
        return res.status(400).json({ success: false, message: "Invalid input data: perCitizenId or perPassportNo is required to identify the record" });
      }

      console.log(
        `[Backend] กำลังแก้ไขข้อมูลบุคลากร คีย์หลักเดิม CitizenID: ${targetCitizenId || 'null'}, PassportNo: ${targetPassportNo || 'null'} (ใช้ Transaction Backup)`,
      );

      const result = await DbTx.withTransaction(async (connection) => {
        //บันทึกข้อมูลเดิมลงในตารางประวัติ Backup
        const sqlBackup = `
          INSERT INTO PERSON_PAYROLL_OUT_UPD_HIST (
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            HIST_BY, FLAG
          )
          SELECT 
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            'ANGULAR_UPDATE_SYSTEM', 'U'
          FROM PERSON_PAYROLL_OUT 
          WHERE (PER_CITIZEN_ID IS NOT NULL AND PER_CITIZEN_ID = :targetCitizenId)
             OR (PER_CITIZEN_ID IS NULL AND PER_PASSPORT_NO = :targetPassportNo)
        `;

        const resultBackup = await connection.execute(
          sqlBackup,
          { 
            targetCitizenId: targetCitizenId || null,
            targetPassportNo: targetPassportNo || null
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultBackup) {
          throw new Error("ไม่สามารถบันทึกประวัติ Backup ก่อนการแก้ไขข้อมูลได้");
        }

        // อัปเดตข้อมูลหลักในตารางหลัก
        const sqlUpdate = `
          UPDATE PERSON_PAYROLL_OUT 
          SET 
            PER_CITIZEN_ID = :perCitizenId, TYPE_CODE = :typeCode, TYPE_NAME = :typeName, PER_SLIP_ID = :perSlipId, 
            PER_POS_ID = :perPosId, PRE_CODE = :preCode, PRE_NAME = :preName,
            PER_NAME_TH = :perNameTh, PER_NAME_EN = :perNameEn, PER_TAX_ID = :perTaxId, 
            PER_PVDF_APP = :perPvdfApp, PER_PVDF_APP_D = TO_DATE(:perPvdfAppD, 'YYYY-MM-DD'), 
            PER_PVDF_QUIT = :perPvdfQuit, PER_PVDF_QUIT_D = TO_DATE(:perPvdfQuitD, 'YYYY-MM-DD'),
            PER_FUND_TYPE = :perFundType, PER_SAVE_RATE = :perSaveRate, PER_SSO_PAYMENT = :perSsoPayment, 
            PER_FUND_TEACHER = :perFundTeacher, PER_FUND_ASSTEACHER = :perFundAssteacher, PER_SSO_ID = :perSsoId,
            PER_PASSPORT_NO = :perPassportNo, 
            PER_PASSPORT_START_D = TO_DATE(:perPassportStartD, 'YYYY-MM-DD'), 
            PER_PASSPORT_EXPIRE_D = TO_DATE(:perPassportExpireD, 'YYYY-MM-DD'), 
            POSC_NAME = :poscName, PER_FAC_C = :perFacC,
            FAC_NAME = :facName, PER_SALARY = :perSalary, PER_HOLD_SALARY = :perHoldSalary,
            UPDATED_DATE = SYSDATE, UPDATED_BY = 'ANGULAR_UPDATE_SYSTEM'
          WHERE (PER_CITIZEN_ID IS NOT NULL AND PER_CITIZEN_ID = :targetCitizenId)
             OR (PER_CITIZEN_ID IS NULL AND PER_PASSPORT_NO = :targetPassportNo)
        `;

        const bindsUpdate = {
          perCitizenId: perCitizenId || null,
          typeCode,
          typeName,
          perSlipId,
          perPosId,
          preCode,
          preName,
          perNameTh,
          perNameEn,
          perTaxId,
          perPvdfApp,
          perPvdfAppD: perPvdfAppD || null,
          perPvdfQuit,
          perPvdfQuitD: perPvdfQuitD || null,
          perFundType,
          perSaveRate,
          perSsoPayment,
          perFundTeacher,
          perFundAssteacher,
          perSsoId,
          perPassportNo,
          perPassportStartD: perPassportStartD || null,
          perPassportExpireD: perPassportExpireD || null,
          poscName,
          perFacC,
          facName,
          perSalary,
          perHoldSalary,
          targetCitizenId: targetCitizenId || null,
          targetPassportNo: targetPassportNo || null,
        };

        const resultUpdate = await connection.execute(
          sqlUpdate,
          bindsUpdate,
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultUpdate || resultUpdate.rowsAffected === 0) {
          throw new Error("ไม่สามารถแก้ไขข้อมูลได้ หรือไม่พบข้อมูลตามที่ระบุ");
        }

        return {
          success: true,
          message: "แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว"
        };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Update API Unexpected System Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },

  // Get all faculties for dropdown
  async getFaculties(req, res) {
    try {
      const sql = `SELECT FAC_CODE, FAC_NAME FROM FACULTY_CODE ORDER BY FAC_CODE ASC`;
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

  // Delete!
  async deletePersonnel(req, res) {
    try {
      const { id } = req.params; // ดักรับรหัส ID ท้ายลิงก์ URL
      console.log(
        `[Backend] กำลังลบข้อมูลบุคลากรออกจากระบบ เลขบัตรประชาชน/พาสปอร์ต: ${id} (ใช้ Transaction Backup)`,
      );

      if (!id || id === 'null' || id === 'undefined') {
        return res.status(400).json({ success: false, message: "Invalid input data: id is required" });
      }

      const result = await DbTx.withTransaction(async (connection) => {

        //บันทึกข้อมูลที่จะลบลงในตารางประวัติ Backup
        const sqlBackup = `
          INSERT INTO PERSON_PAYROLL_OUT_DEL_HIST (
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            HIST_BY, FLAG
          )
          SELECT 
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            'ANGULAR_DELETE_SYSTEM', 'D'
          FROM PERSON_PAYROLL_OUT 
          WHERE PER_CITIZEN_ID = :id OR (PER_CITIZEN_ID IS NULL AND PER_PASSPORT_NO = :id)
        `;

        const resultBackup = await connection.execute(
          sqlBackup,
          { id },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultBackup) {
          throw new Error("ไม่สามารถบันทึกประวัติ Backup ก่อนการลบข้อมูลได้");
        }

        // ลบข้อมูลจริงออกจากตารางหลัก
        const sqlDelete = `
          DELETE FROM PERSON_PAYROLL_OUT 
          WHERE PER_CITIZEN_ID = :id OR (PER_CITIZEN_ID IS NULL AND PER_PASSPORT_NO = :id)
        `;
        const resultDelete = await connection.execute(
          sqlDelete,
          { id },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultDelete || resultDelete.rowsAffected === 0) {
          throw new Error("ไม่สามารถลบข้อมูลได้หรือไม่พบรหัสบัตรประชาชน/รหัสพาสปอร์ตนี้ในระบบ");
        }

        return {
          success: true,
          message: "ลบข้อมูลบุคลากรออกจากระบบสำเร็จ"
        };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Delete API Unexpected Error:", error);
      return res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
  },
};

module.exports = PersonnelController;
