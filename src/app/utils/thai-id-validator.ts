/**
 * ฟังก์ชันสำหรับตรวจสอบความถูกต้องของเลขประจำตัวประชาชนไทย 13 หลัก
 * ตามหลักการคำนวณ Checksum มาตรฐานของสำนักบริหารการทะเบียน กรมการปกครอง
 * 
 * @param idcardno เลขบัตรประชาชน 13 หลัก
 * @returns boolean true หากเลขบัตรประชาชนถูกต้องตามสูตร, false หากไม่ถูกต้อง
 */
export function validateIDCard(idcardno: string | null | undefined): boolean {
  if (!idcardno) {
    return false;
  }

  const cleanId = String(idcardno).trim();

  // ตรวจสอบความยาว 13 หลัก
  if (cleanId.length !== 13) {
    return false;
  }

  // ตรวจสอบว่าต้องเป็นตัวเลขล้วน 13 หลัก
  const isDigit = /^[0-9]{13}$/.test(cleanId);
  if (!isDigit) {
    return false;
  }

  // สูตรคำนวณผลรวมถ่วงน้ำหนัก 12 หลักแรก: sum = sum(d_i * (13 - i))
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }

  // คำนวณ Checksum หลักที่ 13: (11 - (sum % 11)) % 10
  const checksum = (11 - (sum % 11)) % 10;
  const lastDigit = parseInt(cleanId.charAt(12), 10);

  return checksum === lastDigit;
}
