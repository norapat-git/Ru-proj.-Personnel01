export interface PersonnelDataResult {
  PER_CITIZEN_ID: string;
  TYPE_CODE: number;
  TYPE_NAME: string;
  PER_SLIP_ID: string;
  PER_POS_ID: number;
  PRE_CODE: number;
  PRE_NAME: string;
  PER_NAME_TH: string;
  PER_NAME_EN: string;
  PER_MIDDLE_NAME_EN?: string;
  PER_TAX_ID: string;
  PER_PVDF_APP: string;
  PER_PVDF_APP_D: string;
  PER_PVDF_QUIT: number | null;
  PER_PVDF_QUIT_D: string;
  PER_FUND_TYPE: number;
  PER_SAVE_RATE: number;
  PER_SSO_PAYMENT: number;
  PER_FUND_TEACHER: number;
  PER_FUND_ASSTEACHER: number;
  PER_SSO_ID: string;
  PER_PASSPORT_NO: string;
  PER_PASSPORT_START_D: string;
  PER_PASSPORT_EXPIRE_D: string;
  POSC_NAME: string;
  PER_FAC_C: number;
  FAC_NAME: string;
  PER_SALARY: number;
  PER_HOLD_SALARY: number;
  CREATED_DATE: string;
  CREATED_BY: string;
  UPDATED_DATE: string;
  UPDATED_BY: string;
  FULL_NAME_TH?: string;
  FUND_NAME?: string;
  FAC_NAME2?: string;
  PER_SOURCE_MONEY?: number | null;
  PER_POSITION_MONEY?: number | null;
  PER_POSITION_PAY?: number | null;
  PER_POSITION_MONEY_EX?: number | null;
  PER_POSITION_PAY_EX?: number | null;
  PER_PROJECT?: number | null;
  PRO_NAME?: string | null;
  SM_NAME?: string | null;
  NOTE_PVD?: string | null;
  NOTE_DEL?: string | null;
  F_REV_SALARY?: string | null;       // สถานะการรับเงินเดือน (Y/N)
  F_REV_POS_MONEY?: string | null;    // สถานะการรับเงินประจำตำแหน่ง (Y/N)
  F_REV_PAY_EX?: string | null;       // สถานะการรับเงินประจำตำแหน่งผู้บริหาร (Y/N)
  F_TOTAL_INCOME?: string | null;     // สถานะการรับเงินรายได้ทั้งหมด (Y/N)
}

export interface PersonnelInsertInput {
  perCitizenId: string;
  typeCode: number | null;
  typeName: string;
  perSlipId: string;
  perPosId: number | null;
  preCode: number | null;
  preName: string;
  perNameTh: string;
  perFirstNameTh?: string;
  perLastNameTh?: string;
  perNameEn: string;
  perFirstNameEn: string;
  perMiddleNameEn: string;
  perLastNameEn: string;
  perTaxId: string;
  perPvdfApp: string;
  perPvdfAppD: string | null;
  perPvdfQuit: number | null;
  perPvdfQuitD: string | null;
  perFundType: number | null;
  perSaveRate: number | null;
  perSsoPayment: number | null;
  perFundTeacher: number | null;
  perFundAssteacher: number | null;
  perSsoId: string;
  perPassportNo: string;
  perPassportStartD: string | null;
  perPassportExpireD: string | null;
  poscName: string;
  perFacC: number | null;
  facName: string;
  perSalary: number | null;
  perHoldSalary: number | null;
  perSourceMoney?: number | null;
  perPositionMoney?: number | null;
  perPositionPay?: number | null;
  perPositionMoneyEx?: number | null;
  perPositionPayEx?: number | null;
  perProject?: number | null;
  notePvd?: string | null;
  noteDel?: string | null;
  fRevSalary?: string | null;       // F_REV_SALARY (Y/N)
  fRevPosMoney?: string | null;     // F_REV_POS_MONEY (Y/N)
  fRevPayEx?: string | null;        // F_REV_PAY_EX (Y/N)
  fTotalIncome?: string | null;     // F_TOTAL_INCOME (Y/N)
}

//คำนำหน้าชื่อ 
export interface PrenameOption {
  preCode: number;
  preName: string;
  preName2?: string;
  preNameEn?: string;
  preNameIdcard?: string;
}

//คณะ/หน่วยงาน
export interface FacultyOption {
  facCode: number;
  facName: string;
  facName2?: string;
}

//ประเภทบุคลากร 
export interface PersonTypeOption {
  typeCode: number;
  typeName: string;
  typeName2?: string;
}

//ประเภทกองทุน
export interface FundTypeOption {
  fundCode: number;
  fundName: string;
}

//ประเภทโครงการ
export interface ProjectTypeOption {
  proCode: number;
  proName: string;
}

//แหล่งเงิน
export interface SourceMoneyOption {
  smCode: number;
  smName: string;
}



