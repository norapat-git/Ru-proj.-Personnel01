Personnel Management System

ระบบจัดการข้อมูลบุคลากร(สถาบันภาษา) 


Backend 

Port เริ่มต้น: 4000 (กำหนดใน .env)

การตั้งค่า (.env)
  PORT=4000
  NODE_ORACLEDB_USER=ชื่อ user ฐานข้อมูล
  NODE_ORACLEDB_PASSWORD=รหัสผ่าน
  NODE_ORACLEDB_CONNECTIONSTRING=localhost:1521/xe
  NODE_ORACLEDB_POOLALIAS=ชื่อ pool alias

ไฟล์ที่กำหนด path ของ API แต่ละตัว

frontend-route.js (path prefix /api/service/frontend)

  POST   /sign                    - ออก sign token
  POST   /verify                  - ตรวจสอบ token
  POST   /counter_control1        - ระบบ counter มี auth
  POST   /counter_control2        - ระบบ counter ไม่มี auth
  GET    /personnel/search        - ค้นหาข้อมูลบุคลากร
  POST   /personnel/insert        - บันทึกข้อมูลบุคลากรใหม่
  PUT    /personnel/update        - แก้ไขข้อมูลบุคลากร
  DELETE /personnel/delete/:id    - ลบข้อมูลบุคลากร
  GET    /personnel/faculties     - ดึงรายชื่อคณะ


Controllers (api/backend-oracle-model/controllers)

personnelControl.js

ไฟล์หลักของระบบบุคลากร

  searchPersonnel  - ค้นหาบุคลากรจากตาราง PERSON_PAYROLL_OUT รองรับค้นหาด้วย idCard, passport, ssoId, nameTh, nameEn
  insertPersonnel  - บันทึกข้อมูลบุคลากรใหม่เข้าตาราง PERSON_PAYROLL_OUT
  updatePersonnel  - แก้ไขข้อมูลบุคลากร โดย Backup ข้อมูลเดิมไว้ในตาราง PERSON_PAYROLL_OUT_UPD_HIST ก่อนทำการ update ผ่าน Transaction
  deletePersonnel  - ลบข้อมูลบุคลากร โดย Backup ข้อมูลเดิมไว้ในตาราง PERSON_PAYROLL_OUT_DEL_HIST ก่อนทำการ delete ผ่าน Transaction
  getFaculties     - ดึงรายชื่อคณะทั้งหมดจากตาราง FACULTY_CODE สำหรับใช้ใน dropdown


Frontend (ru-front)

Port เริ่มต้น: 4200

Components (ru-front/src/app)

  PersonnelSearch  (personnel-search)   - ช่องค้นหาบุคลากร รองรับค้นหาด้วยบัตรประชาชน, passport, ประกันสังคม, ชื่อ-นามสกุล
  PersonnelResult  (personnel-result)   - แสดงผลการค้นหาเป็นตาราง มีปุ่มแก้ไขและลบในแต่ละแถว
  PersonnelForm    (personnel-form)     - ฟอร์มสำหรับบันทึกหรือแก้ไขข้อมูลบุคลากร รองรับทั้งโหมดเพิ่มใหม่และโหมดแก้ไข
  NationalityToggle (nationality-toggle) - ปุ่ม toggle สลับระหว่าง ไทย/ต่างชาติ เพื่อเปลี่ยนฟิลด์ในฟอร์มและเงื่อนไขการค้นหา

Functions ใน PersonnelSearch (personnel-search.ts)

  constructor      - ตั้ง effect เพื่อรีเซ็ต filter และ keyword อัตโนมัติเมื่อสัญชาติเปลี่ยน
  onSearchSubmit   - รวม keyword แล้วเรียก service เพื่อค้นหาบุคลากร อัปเดต signal ผลลัพธ์

Functions ใน PersonnelForm (personnel-form.ts)

  ngOnInit         - โหลดรายชื่อคณะจาก API และถ้ามีข้อมูลสำหรับแก้ไข ให้หยอดข้อมูลเดิมเข้าฟอร์มอัตโนมัติ
  onFacultySelect  - เมื่อเลือกคณะ ให้ดึง FAC_CODE ไปเก็บใน perFacC โดยอัตโนมัติ
  onPreCodeSelect  - เมื่อเลือกคำนำหน้าชื่อ ให้ map รหัสไปเป็นชื่อ เช่น 1 = นาย, 2 = นางสาว
  onNumberInput    - บังคับให้กรอกเฉพาะตัวเลข และจำกัดความยาวสูงสุด
  onDecimalInput   - บังคับให้กรอกตัวเลขทศนิยม จำกัดทศนิยม 2 ตำแหน่ง
  validateForm     - ตรวจสอบฟิลด์บังคับก่อน save ถ้าไม่ผ่านจะ highlight field ที่ผิดพลาด
  showMessage      - แสดง banner แจ้งผลลัพธ์ success ปิดฟอร์ม error แสดง inline ในฟอร์ม
  saveData         - ถ้าเป็น edit mode เรียก update ถ้าเป็น mode ใหม่เรียก insert
  cancelForm       - ปิดฟอร์ม ส่ง event กลับไปยัง parent component
  ngOnDestroy      - ล้างค่า editingPersonnel signal เมื่อ component ถูกทำลาย

Service (ru-front/src/app/services/personnel.ts)

Signals

  personnelListSignal      - เก็บรายชื่อบุคลากรที่ค้นหาได้ ส่งต่อให้ PersonnelResult แสดงผล
  hasSearchedSignal        - บอกว่าเคยค้นหาแล้วหรือยัง สำหรับแสดงหรือซ่อนตาราง
  currentModeSignal        - บอกว่าตอนนี้แสดงหน้า result หรือหน้า form
  editingPersonnel         - เก็บข้อมูลที่กำลังแก้ไข ส่งต่อให้ PersonnelForm โหลดข้อมูลเดิม
  staffNationalitySignal   - สัญชาติของบุคลากร thai/inter ใช้สลับ UI และเงื่อนไขฟอร์ม
  notificationSignal       - ข้อความแจ้งเตือน toast หลังจาก save/update สำเร็จ

Functions

  searchPersonnel   - เรียก GET /personnel/search
  insertPersonnel   - เรียก POST /personnel/insert
  updatePersonnel   - เรียก PUT /personnel/update
  deletePersonnel   - เรียก DELETE /personnel/delete/:id
  getFaculties      - เรียก GET /personnel/faculties


ตารางฐานข้อมูล Oracle ที่เกี่ยวข้อง

  PERSON_PAYROLL_OUT          - ตารางหลักเก็บข้อมูลบุคลากร
  PERSON_PAYROLL_OUT_UPD_HIST - ตาราง backup เก็บข้อมูลก่อนการแก้ไข
  PERSON_PAYROLL_OUT_DEL_HIST - ตาราง backup เก็บข้อมูลก่อนการลบ
  FACULTY_CODE                - ตารางรายชื่อคณะ
  PRENAME_CODE                - ตารางคำนำหน้าชื่อ
  PERSONTYPE                  - ตารางประเภทบุคลากร
  FUND_TYPE                   - ตารางประเภทกองทุน
