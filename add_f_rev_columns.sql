-- ============================================================
-- Migration: เพิ่ม 4 columns สถานะการรับเงิน ใน PERSON_PAYROLL_OUT
-- Run Date  : 2026-08-13
-- ============================================================

-- ตารางหลัก PERSON_PAYROLL_OUT
ALTER TABLE PERSON_PAYROLL_OUT ADD F_REV_SALARY      CHAR(1);
ALTER TABLE PERSON_PAYROLL_OUT ADD F_REV_POS_MONEY   CHAR(1);
ALTER TABLE PERSON_PAYROLL_OUT ADD F_REV_PAY_EX      CHAR(1);
ALTER TABLE PERSON_PAYROLL_OUT ADD F_TOTAL_INCOME    CHAR(1);

-- หมายเหตุ: ค่าที่ถูกต้องคือ 'Y' (ใช่) หรือ 'N' (ไม่ใช่) หรือ NULL (ยังไม่ระบุ)
COMMENT ON COLUMN PERSON_PAYROLL_OUT.F_REV_SALARY     IS 'สถานะการรับเงินเดือน (Y=รับ, N=ไม่รับ)';
COMMENT ON COLUMN PERSON_PAYROLL_OUT.F_REV_POS_MONEY  IS 'สถานะการรับเงินประจำตำแหน่ง (Y=รับ, N=ไม่รับ)';
COMMENT ON COLUMN PERSON_PAYROLL_OUT.F_REV_PAY_EX     IS 'สถานะการรับเงินประจำตำแหน่งผู้บริหาร (Y=รับ, N=ไม่รับ)';
COMMENT ON COLUMN PERSON_PAYROLL_OUT.F_TOTAL_INCOME   IS 'สถานะการรับเงินรายได้ทั้งหมด (Y=รับ, N=ไม่รับ)';

COMMIT;
