# เอกสารอธิบายระบบ Loading State, Skeleton Loading และ Auth Guard
**ระบบบริหารจัดการบุคลากรรับฝาก (RU Personnel System)**  
**วันที่:** 19 สิงหาคม 2026

---

## 1. ภาพรวมของระบบ (Overview)

ระบบประกอบด้วย 4 กลไกหลัก:
1. **ป้องกันการกดย้ำ (Double Submit Protection):** ป้องกันการกดบันทึก, ค้นหา หรือลบข้อมูลซ้ำขณะประมวลผล
2. **Skeleton Loading (ตารางจำลอง Shimmer):** แสดงโครงร่างตารางพร้อม animation แสงวิ่งขณะรอผลการค้นหาจากฐานข้อมูล
3. **การโหลดข้อมูลคู่ขนาน (Parallel Fetching):** ดึงข้อมูลตัวเลือก Dropdowns ทั้งหมดพร้อมกันเพื่อความรวดเร็ว
4. **การตรวจสิทธิ์ (Auth Guard):** ตรวจสอบ Token ก่อนเข้าใช้งานหน้าจอ หากไม่มีจะส่งกลับเว็บหลัก

---

## 2. การจัดการสถานะ (State Management)

ใช้ **Angular Signals** ผ่าน `PersonnelService` (`src/app/services/services.ts`):

```typescript
export class PersonnelService {
  // สถานะโหลด: true = กำลังทำงาน, false = พร้อมใช้งาน
  isLoadingSignal = signal<boolean>(false);

  // ข้อความแสดงสถานะบน Banner
  loadingMessageSignal = signal<string>('กำลังโหลดข้อมูลบุคลากร...');
}
```

---

## 3. การทำงานในแต่ละส่วน

### 3.1 Skeleton Table Loading (`PersonnelResult`)
* **ไฟล์:** `src/app/personnel-result/personnel-result.html`, `src/styles.css`
* **หลักการทำงาน:**
  - เมื่อผู้ใช้กดค้นหาข้อมูลหรือกดแสดงบุคลากรทุกคน (`isLoading() === true`)
  - หน้าจอจะแสดงโครงร่างตารางจำลอง 5 แถว พร้อมช่องกรองด้านบน โดยมีแสง Shimmer วิ่งนุ่มนวล
  - เมื่อข้อมูลจาก Oracle DB มาถึง โครงร่าง Skeleton จะสลับเป็นข้อมูลจริงทันทีโดยไม่กระตุก

```html
@if (isLoading()) {
  <!-- Skeleton Table Loading State -->
  <div class="skeleton-table-wrapper">
    <div class="skeleton-toolbar">
      <div class="skeleton-shimmer skeleton-input-box"></div>
      <div class="skeleton-shimmer skeleton-count-box"></div>
    </div>
    <div class="table-responsive">
      <table class="personnel-table skeleton-table-content">
        ...
      </table>
    </div>
  </div>
} @else if (personnelList().length > 0) {
  <!-- ตารางข้อมูลจริง -->
}
```

---

### 3.2 บันทึกและแก้ไขข้อมูล (`PersonnelForm.saveData`)
* **ไฟล์:** `src/app/personnel-form/personnel-form.ts`
* **หลักการทำงาน:**
  1. ตรวจสอบ `if (this.isLoading()) return;` เพื่อหยุดหากมีการกดซ้ำ
  2. ตั้งค่า `loadingMessageSignal` และเปิด `isLoadingSignal.set(true)`
  3. บล็อคปุ่มบันทึก/ยกเลิกด้วย `[disabled]="isLoading()"` และแสดง Spinner
  4. เมื่อบันทึกสำเร็จ อัปเดตข้อมูลเข้า `personnelListSignal` ทันที
  5. ปิดสถานะใน `finally { this.personnelService.isLoadingSignal.set(false); }`

```typescript
async saveData() {
  if (this.isLoading()) return; // ป้องกันการกดซ้ำ

  if (!this.validateForm()) {
    this.showMessage('error', 'กรุณากรอกข้อมูลในช่องบังคับ (*) ให้ครบถ้วน');
    return;
  }

  this.personnelService.loadingMessageSignal.set(
    this.isEditMode ? 'กำลังบันทึกการแก้ไขข้อมูล...' : 'กำลังบันทึกข้อมูลเข้าระบบ...'
  );
  this.personnelService.isLoadingSignal.set(true);

  try {
    if (this.isEditMode) {
      const response = await this.personnelService.updatePersonnel(payload);
      if (response && response.success) {
        this.updateLocalList(payload);
        this.showMessage('success', 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว');
      }
    } else {
      const response = await this.personnelService.insertPersonnel(payload);
      if (response && response.success) {
        this.showMessage('success', 'บันทึกข้อมูลเข้าระบบเรียบร้อยแล้ว');
      }
    }
  } catch (err) {
    this.showMessage('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  } finally {
    this.personnelService.isLoadingSignal.set(false);
  }
}
```

---

### 3.3 โหลดตัวเลือก Dropdowns แบบคู่ขนาน (`ngOnInit`)
* **ไฟล์:** `src/app/personnel-form/personnel-form.ts`
* **หลักการทำงาน:**
  - ใช้ `Promise.all([...])` ดึงข้อมูลตัวเลือก 6 ชุด (คณะ, คำนำหน้า, ประเภทบุคลากร, กองทุน, โครงการ, แหล่งเงิน) พร้อมกันในรอบเดียว
  - ใช้ `isLoadingOptions` ล็อค Dropdown ไม่ให้เลือกก่อนข้อมูลจะพร้อม

```typescript
async ngOnInit(): Promise<void> {
  this.isLoadingOptions.set(true);
  try {
    const [facRes, preRes, typeRes, fundRes, projRes, moneyRes] = await Promise.all([
      this.personnelService.getFaculties(),
      this.personnelService.getPrenames(),
      this.personnelService.getPersonTypes(),
      this.personnelService.getFundTypes(),
      this.personnelService.getProjectTypes(),
      this.personnelService.getSourceMoneyTypes(),
    ]);
    // กำหนดค่าตัวเลือกเข้า Dropdowns
  } finally {
    this.isLoadingOptions.set(false);
  }
}
```

---

### 3.4 ค้นหาและแสดงข้อมูล (`PersonnelSearch`)
* **ไฟล์:** `src/app/personnel-search/personnel-search.ts`
* **หลักการทำงาน:** ฟังก์ชัน `onSearchSubmit()` และ `loadAllPersonnel()` จะเปิด `hasSearchedSignal.set(true)` และ `isLoadingSignal.set(true)` เพื่อแสดง Skeleton Table ทันทีขณะดึงข้อมูลจากฐานข้อมูล

---

### 3.5 ยืนยันการลบข้อมูล (`PersonnelResult.confirmDelete`)
* **ไฟล์:** `src/app/personnel-result/personnel-result.ts`
* **หลักการทำงาน:** ล็อคปุ่มใน Modal และแสดง Spinner บนปุ่มลบขณะส่งคำสั่งไปยัง API

---

### 3.6 จัดการ Token หมดอายุอัตโนมัติ (HTTP 401 Interceptor)
* **ไฟล์:** `src/app/app.config.ts`
* **หลักการทำงาน:** เมื่อเจอสถานะ 401 Unauthorized ระบบจะขอ Token ใหม่และ Retry คำสั่งเดิมให้อัตโนมัติในโหมดพัฒนา

---

## 4. ระบบแกะค่า JWT Token หน้าบ้าน (JWT Decode)

หน้าบ้านสามารถถอดรหัส Payload จาก JWT Token ใน `localStorage` เพื่อดึงเลขบัตรประชาชน (`client_id` / Secret ID) และวันหมดอายุออกมาใช้งานได้

### ฟังก์ชันที่เพิ่มใน `src/app/services/services.ts`
1. **`decodeToken(token?: string)`**: ถอดรหัส Payload ออกมาเป็น Object `{ client_id, iat, exp }` (รองรับอักขระ UTF-8)
2. **`getCurrentCitizenId()`**: ดึงค่า `client_id` (เลขบัตรประชาชนของผู้ใช้ที่ล็อกอิน) ออกมาใช้งานทันที
3. **`isTokenExpired(token?: string)`**: เช็คว่า Token หมดอายุแล้วหรือยังโดยเทียบกับเวลาปัจจุบัน

```typescript
// ตัวอย่างการเรียกใช้ใน Component
const citizenId = this.personnelService.getCurrentCitizenId();
console.log('เลขบัตรประชาชนผู้ใช้งาน:', citizenId);

// ตรวจสอบวันหมดอายุ
const isExpired = this.personnelService.isTokenExpired();
```

---

## 5. ระบบ Auth Guard (ตรวจสอบสิทธิ์จากเว็บหลัก)

ระบบนี้เป็น Sub-module ภายในเว็บหลักของมหาวิทยาลัย ผู้ใช้ต้องล็อกอินผ่านเว็บหลักก่อนแล้วจึงเข้าใช้งานหน้านี้

### ลำดับการตรวจสอบ (`src/app/guards/auth.guard.ts`)
1. **ตรวจจาก URL Parameter (`?token=...`):** ดึง Token ที่เว็บหลักส่งมา บันทึกลง `localStorage` และอนุญาตให้เข้าใช้งาน
2. **ตรวจจาก `localStorage`:** หากเคยมี Token อยู่แล้ว อนุญาตให้เข้าใช้งาน
3. **หากไม่มี Token:**
   - **โหมด Production:** ดีดกลับไปยังหน้า Login ของเว็บหลักมหาวิทยาลัย (`environment.portalLoginUrl`)
   - **โหมด Development:** อนุญาตผ่านเพื่อพัฒนาต่อได้

```typescript
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  // Token จาก URL
  const urlToken = route.queryParams['token'];
  if (urlToken) {
    localStorage.setItem('token', urlToken);
    return true;
  }

  // Token จาก localStorage
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    return true;
  }

  // ไม่พบ Token
  if (environment.production) {
    window.location.href = environment.portalLoginUrl;
    return false;
  } else {
    return true;
  }
};
```

---

## 5. ตารางสรุปจุดควบคุม

| จุดควบคุม | ฟังก์ชัน | สถานะ UI ขณะประมวลผล | การป้องกัน |
| :--- | :--- | :--- | :--- |
| **ค้นหาข้อมูล / แสดงทุกคน** | `PersonnelSearch` | แสดง Skeleton Table Shimmer | หน้าจอไม่กระตุก ลดเวลารอคอย |
| **บันทึก/แก้ไขข้อมูล** | `PersonnelForm.saveData` | ปุ่มแสดง Spinner + Banner บน | ป้องกันข้อมูลซ้ำซ้อน |
| **ลบข้อมูล** | `PersonnelResult.confirmDelete` | ล็อค Modal + Spinner บนปุ่มลบ | ป้องกันลบซ้ำ |
| **โหลด Dropdowns** | `PersonnelForm.ngOnInit` | ปิดการเลือกจนกว่าข้อมูลพร้อม | ป้องกันเลือกข้อมูลที่ยังไม่สมบูรณ์ |
| **ตรวจสิทธิ์เข้าใช้** | `authGuard` | ดีดกลับเว็บหลักหากไม่มี Token | ป้องกันเข้าถึงโดยไม่ล็อกอิน |
