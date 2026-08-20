var oracledb = require("oracledb");

const ModelInsert = require("../../models/db/InsertModel.js");
const ModelUpdate = require("../../models/db/UpDateModel");
const ModelDelete = require("../../models/db/DeleteModel");
const DbTx = require("../../models/db/DbTxModel");
const { formatDateBind, parseNum, parseStr, parseStrBytes } = require("./personnelHelper");

const personnelManageController = {
  // func save ข้อมูล
  async insertPersonnel(req, res) {
    try {
      console.log("Insert Req Body:", req.body);
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
        perSourceMoney,
        perPositionMoney,
        perPositionPay,
        perPositionMoneyEx,
        perPositionPayEx,
        perProject,
        fRevSalary,
        fRevPosMoney,
        fRevPayEx,
        fTotalIncome,
      } = req.body;

      const rawNotePvd = req.body?.notePvd || req.body?.NOTE_PVD || req.body?.note_pvd || null;
      const finalNotePvd = parseStrBytes(rawNotePvd, 20);
      const actionUser = parseStr(req.decoded?.client_id || req.body?.createdBy || req.body?.CREATED_BY || 'SYSTEM', 50);

      console.log(
        `[Backend] กำลังทำคำสั่งบันทึกข้อมูลแบบรายละเอียดเข้าตาราง PERSON_PAYROLL_OUT (ผู้ทำรายการ: ${actionUser})`,
      );

      const sql = `
        INSERT INTO PERSON_PAYROLL_OUT (
          PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
          PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
          PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
          PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
          FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
          PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
          F_REV_SALARY, F_REV_POS_MONEY, F_REV_PAY_EX, F_TOTAL_INCOME,
          CREATED_DATE, CREATED_BY
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
          :facName, :perSalary, :perHoldSalary, :perSourceMoney,
          :perPositionMoney, :perPositionPay, :perPositionMoneyEx, :perPositionPayEx, :perProject,
          :fRevSalary, :fRevPosMoney, :fRevPayEx, :fTotalIncome,
          SYSDATE, :createdBy
        )
      `;

      const binds = {
        perCitizenId: parseStr(perCitizenId, 13),
        typeCode: parseNum(typeCode),
        typeName: parseStr(typeName, 100),
        perSlipId: parseStr(perSlipId, 6),
        perPosId: parseNum(perPosId),
        preCode: parseNum(preCode),
        preName: parseStr(preName, 30),
        perNameTh: parseStr(perNameTh, 100),
        perNameEn: parseStr(perNameEn, 100),
        perTaxId: parseStr(perTaxId, 20),
        perPvdfApp: parseStr(perPvdfApp, 1),
        perPvdfAppD: formatDateBind(perPvdfAppD),
        perPvdfQuit: parseStr(perPvdfQuit, 1),
        perPvdfQuitD: formatDateBind(perPvdfQuitD),
        perFundType: parseNum(perFundType),
        perSaveRate: parseNum(perSaveRate),
        perSsoPayment: parseNum(perSsoPayment),
        perFundTeacher: parseNum(perFundTeacher),
        perFundAssteacher: parseNum(perFundAssteacher),
        perSsoId: parseStr(perSsoId, 20),
        perPassportNo: parseStr(perPassportNo, 15),
        perPassportStartD: formatDateBind(perPassportStartD),
        perPassportExpireD: formatDateBind(perPassportExpireD),
        poscName: parseStr(poscName, 100),
        perFacC: parseNum(perFacC),
        facName: parseStr(facName, 80),
        perSalary: parseNum(perSalary),
        perHoldSalary: parseNum(perHoldSalary),
        perSourceMoney: parseNum(perSourceMoney),
        perPositionMoney: parseNum(perPositionMoney),
        perPositionPay: parseNum(perPositionPay),
        perPositionMoneyEx: parseNum(perPositionMoneyEx),
        perPositionPayEx: parseNum(perPositionPayEx),
        perProject: parseNum(perProject),
        fRevSalary: parseStr(fRevSalary || 'N', 1),
        fRevPosMoney: parseStr(fRevPosMoney || 'N', 1),
        fRevPayEx: parseStr(fRevPayEx || 'N', 1),
        fTotalIncome: parseStr(fTotalIncome || 'N', 1),
        createdBy: actionUser,
      };

      console.log("SQL Binds:", binds);
      const isSuccess = await ModelInsert.insertdb(res, sql, binds);

      if (isSuccess) {
        // หากผู้ใช้ระบุ notePvd ในแบบฟอร์ม ให้บันทึกลงตารางประวัติ UPD_HIST ด้วย
        if (finalNotePvd) {
          try {
            const sqlHist = `
              INSERT INTO PERSON_PAYROLL_OUT_UPD_HIST (
                PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
                PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
                PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
                PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
                FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
                PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
                CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
                NOTE_PVD, HIST_BY, FLAG
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
                :facName, :perSalary, :perHoldSalary, :perSourceMoney,
                :perPositionMoney, :perPositionPay, :perPositionMoneyEx, :perPositionPayEx, :perProject,
                SYSDATE, :createdBy, SYSDATE, :createdBy,
                :notePvd, :histBy, 'I'
              )
            `;
            await ModelInsert.insertdb(res, sqlHist, { ...binds, notePvd: finalNotePvd, histBy: actionUser });
          } catch (histErr) {
            console.error("Insert Hist NotePvd error:", histErr);
          }
        }

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
        perSourceMoney,
        perPositionMoney,
        perPositionPay,
        perPositionMoneyEx,
        perPositionPayEx,
        perProject,
        fRevSalary,
        fRevPosMoney,
        fRevPayEx,
        fTotalIncome,
        notePvd,
        NOTE_PVD,
        originalCitizenId,
        originalPassportNo,
      } = req.body;

      const rawNotePvd = req.body?.notePvd || req.body?.NOTE_PVD || req.body?.note_pvd || null;
      const finalNotePvd = parseStrBytes(rawNotePvd, 20);

      const sanitizeId = (val) => (val && val !== 'null' && val !== 'undefined') ? val : null;
      const targetCitizenId = sanitizeId(originalCitizenId) || sanitizeId(perCitizenId);
      const targetPassportNo = sanitizeId(originalPassportNo) || sanitizeId(perPassportNo);
      const actionUser = parseStr(req.decoded?.client_id || req.body?.updatedBy || req.body?.UPDATED_BY || 'SYSTEM', 50);

      if (!targetCitizenId && !targetPassportNo) {
        return res.status(400).json({ success: false, message: "Invalid input data: perCitizenId or perPassportNo is required to identify the record" });
      }

      console.log(
        `[Backend] กำลังแก้ไขข้อมูลบุคลากร คีย์หลักเดิม CitizenID: ${targetCitizenId || 'null'}, PassportNo: ${targetPassportNo || 'null'} (ผู้แก้ไข: ${actionUser})`,
      );

      const result = await DbTx.withTransaction(async (connection) => {
        //บันทึกข้อมูลเดิมลงในตารางประวัติ Backup พร้อม NOTE_PVD
        const sqlBackup = `
          INSERT INTO PERSON_PAYROLL_OUT_UPD_HIST (
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
            PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
            CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            NOTE_PVD, HIST_BY, FLAG
          )
          SELECT 
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
            PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
            CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            :notePvd, :histBy, 'U'
          FROM PERSON_PAYROLL_OUT 
          WHERE (PER_CITIZEN_ID IS NOT NULL AND TRIM(PER_CITIZEN_ID) = TRIM(:targetCitizenId))
             OR (PER_CITIZEN_ID IS NULL AND UPPER(TRIM(PER_PASSPORT_NO)) = UPPER(TRIM(:targetPassportNo)))
        `;

        const resultBackup = await connection.execute(
          sqlBackup,
          { 
            targetCitizenId: targetCitizenId || null,
            targetPassportNo: targetPassportNo || null,
            notePvd: finalNotePvd,
            histBy: actionUser
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
            PER_SOURCE_MONEY = :perSourceMoney,
            PER_POSITION_MONEY = :perPositionMoney,
            PER_POSITION_PAY = :perPositionPay,
            PER_POSITION_MONEY_EX = :perPositionMoneyEx,
            PER_POSITION_PAY_EX = :perPositionPayEx,
            PER_PROJECT = :perProject,
            F_REV_SALARY = :fRevSalary,
            F_REV_POS_MONEY = :fRevPosMoney,
            F_REV_PAY_EX = :fRevPayEx,
            F_TOTAL_INCOME = :fTotalIncome,
            UPDATED_DATE = SYSDATE, UPDATED_BY = :updatedBy
          WHERE (PER_CITIZEN_ID IS NOT NULL AND TRIM(PER_CITIZEN_ID) = TRIM(:targetCitizenId))
             OR (PER_CITIZEN_ID IS NULL AND UPPER(TRIM(PER_PASSPORT_NO)) = UPPER(TRIM(:targetPassportNo)))
        `;

        const bindsUpdate = {
          perCitizenId: parseStr(perCitizenId, 13),
          typeCode: parseNum(typeCode),
          typeName: parseStr(typeName, 100),
          perSlipId: parseStr(perSlipId, 6),
          perPosId: parseNum(perPosId),
          preCode: parseNum(preCode),
          preName: parseStr(preName, 30),
          perNameTh: parseStr(perNameTh, 100),
          perNameEn: parseStr(perNameEn, 100),
          perTaxId: parseStr(perTaxId, 20),
          perPvdfApp: parseStr(perPvdfApp, 1),
          perPvdfAppD: formatDateBind(perPvdfAppD),
          perPvdfQuit: parseStr(perPvdfQuit, 1),
          perPvdfQuitD: formatDateBind(perPvdfQuitD),
          perFundType: parseNum(perFundType),
          perSaveRate: parseNum(perSaveRate),
          perSsoPayment: parseNum(perSsoPayment),
          perFundTeacher: parseNum(perFundTeacher),
          perFundAssteacher: parseNum(perFundAssteacher),
          perSsoId: parseStr(perSsoId, 20),
          perPassportNo: parseStr(perPassportNo, 15),
          perPassportStartD: formatDateBind(perPassportStartD),
          perPassportExpireD: formatDateBind(perPassportExpireD),
          poscName: parseStr(poscName, 100),
          perFacC: parseNum(perFacC),
          facName: parseStr(facName, 80),
          perSalary: parseNum(perSalary),
          perHoldSalary: parseNum(perHoldSalary),
          perSourceMoney: parseNum(perSourceMoney),
          perPositionMoney: parseNum(perPositionMoney),
          perPositionPay: parseNum(perPositionPay),
          perPositionMoneyEx: parseNum(perPositionMoneyEx),
          perPositionPayEx: parseNum(perPositionPayEx),
          perProject: parseNum(perProject),
          fRevSalary: parseStr(fRevSalary || 'N', 1),
          fRevPosMoney: parseStr(fRevPosMoney || 'N', 1),
          fRevPayEx: parseStr(fRevPayEx || 'N', 1),
          fTotalIncome: parseStr(fTotalIncome || 'N', 1),
          targetCitizenId: targetCitizenId || null,
          targetPassportNo: targetPassportNo || null,
          updatedBy: actionUser,
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

  // Delete!
  async deletePersonnel(req, res) {
    try {
      const { id } = req.params; // ดักรับรหัส ID ท้ายลิงก์ URL
      const noteDel = req.body?.noteDel || req.body?.NOTE_DEL || req.query?.noteDel || req.query?.NOTE_DEL || null;

      console.log(
        `[Backend] กำลังลบข้อมูลบุคลากรออกจากระบบ เลขบัตรประชาชน/พาสปอร์ต: ${id} (ใช้ Transaction Backup)`,
      );

      if (!id || id === 'null' || id === 'undefined') {
        return res.status(400).json({ success: false, message: "Invalid input data: id is required" });
      }

      if (!noteDel || !String(noteDel).trim()) {
        return res.status(400).json({ success: false, message: "กรุณาระบุหมายเหตุการลบข้อมูล (NOTE_DEL)" });
      }

      const finalNoteDel = String(noteDel).trim().substring(0, 20);
      const actionUser = parseStr(req.decoded?.client_id || req.body?.updatedBy || req.body?.UPDATED_BY || req.query?.updatedBy || 'SYSTEM', 50);

      const result = await DbTx.withTransaction(async (connection) => {
        //บันทึกข้อมูลที่จะลบลงในตารางประวัติ Backup พร้อม NOTE_DEL
        const sqlBackup = `
          INSERT INTO PERSON_PAYROLL_OUT_DEL_HIST (
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
            PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
            CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            NOTE_DEL, HIST_BY, FLAG
          )
          SELECT 
            PER_CITIZEN_ID, TYPE_CODE, TYPE_NAME, PER_SLIP_ID, PER_POS_ID, PRE_CODE, PRE_NAME,
            PER_NAME_TH, PER_NAME_EN, PER_TAX_ID, PER_PVDF_APP, PER_PVDF_APP_D, PER_PVDF_QUIT, PER_PVDF_QUIT_D,
            PER_FUND_TYPE, PER_SAVE_RATE, PER_SSO_PAYMENT, PER_FUND_TEACHER, PER_FUND_ASSTEACHER, PER_SSO_ID,
            PER_PASSPORT_NO, PER_PASSPORT_START_D, PER_PASSPORT_EXPIRE_D, POSC_NAME, PER_FAC_C,
            FAC_NAME, PER_SALARY, PER_HOLD_SALARY, PER_SOURCE_MONEY,
            PER_POSITION_MONEY, PER_POSITION_PAY, PER_POSITION_MONEY_EX, PER_POSITION_PAY_EX, PER_PROJECT,
            CREATED_DATE, CREATED_BY, UPDATED_DATE, UPDATED_BY,
            :noteDel, :histBy, 'D'
          FROM PERSON_PAYROLL_OUT 
          WHERE (PER_CITIZEN_ID IS NOT NULL AND TRIM(PER_CITIZEN_ID) = TRIM(:targetId))
             OR (PER_CITIZEN_ID IS NULL AND UPPER(TRIM(PER_PASSPORT_NO)) = UPPER(TRIM(:targetId)))
        `;

        const resultBackup = await connection.execute(
          sqlBackup,
          { targetId: id, noteDel: finalNoteDel, histBy: actionUser },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultBackup) {
          throw new Error("ไม่สามารถบันทึกประวัติ Backup ก่อนการลบข้อมูลได้");
        }

        // ลบข้อมูลจริงออกจากตารางหลัก
        const sqlDelete = `
          DELETE FROM PERSON_PAYROLL_OUT 
          WHERE (PER_CITIZEN_ID IS NOT NULL AND TRIM(PER_CITIZEN_ID) = TRIM(:targetId))
             OR (PER_CITIZEN_ID IS NULL AND UPPER(TRIM(PER_PASSPORT_NO)) = UPPER(TRIM(:targetId)))
        `;
        const resultDelete = await connection.execute(
          sqlDelete,
          { targetId: id },
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

module.exports = personnelManageController;
