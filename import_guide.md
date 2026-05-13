# วิธีใช้งานระบบ Import CSV / Excel 📂

เราได้สร้างไฟล์ `src/lib/import.js` ขึ้นมาเพื่อช่วยให้คุณสามารถนำเข้าข้อมูลจากไฟล์ CSV หรือ Excel ได้ง่ายขึ้น โดยใช้ไลบรารี **XLSX (SheetJS)** ที่มีอยู่ในระบบอยู่แล้ว

---

## 1. วิธีนำเข้าฟังก์ชันไปใช้ (Import)

คุณสามารถดึงฟังก์ชันไปใช้ในไฟล์ `.js` ของคุณได้ดังนี้:

```javascript
import { importCSV, selectAndImportFile } from '../../lib/import.js';
```

---

## 2. ตัวอย่างการใช้งานแบบที่ 1: ใช้ร่วมกับ `<input type="file">`

เหมาะสำหรับกรณีที่คุณมีปุ่มเลือกไฟล์อยู่ในหน้า HTML แล้ว

### HTML:
```html
<input type="file" id="csvFileInput" accept=".csv, .xlsx" class="hidden">
<button id="importBtn" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors">
    นำเข้าข้อมูล
</button>
```

### JavaScript:
```javascript
import { importCSV } from '../../lib/import.js';

const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('csvFileInput');

// เมื่อคลิกปุ่ม ให้ไปคลิก input file ที่ซ่อนอยู่
importBtn.addEventListener('click', () => fileInput.click());

// เมื่อมีการเลือกไฟล์
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // เรียกใช้ฟังก์ชันนำเข้า
            const data = await importCSV(file);
            console.log('ข้อมูลที่นำเข้าได้:', data);
            
            // ตัวอย่าง: นำข้อมูลไปใช้งานต่อ
            if (data.length > 0) {
                alert(`นำเข้าข้อมูลสำเร็จ! พบข้อมูลทั้งหมด ${data.length} แถว`);
                
                // คุณสามารถนำ data ไปวน Loop เพื่อบันทึกลง Supabase ได้ที่นี่
                /*
                const { error } = await supabase
                    .from('your_table')
                    .insert(data);
                */
            } else {
                alert('ไม่พบข้อมูลในไฟล์');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            // ล้างค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้
            fileInput.value = '';
        }
    }
});
```

---

## 3. ตัวอย่างการใช้งานแบบที่ 2: ใช้ฟังก์ชันทางลัด (Shortcut)

เหมาะสำหรับกรณีที่ต้องการให้กดปุ่มแล้วเปิดหน้าต่างเลือกไฟล์ทันทีโดยไม่ต้องเขียน HTML input เองในไฟล์ HTML

### JavaScript:
```javascript
import { selectAndImportFile } from '../../lib/import.js';

const quickImportBtn = document.getElementById('quickImportBtn');

quickImportBtn.addEventListener('click', async () => {
    try {
        const data = await selectAndImportFile();
        if (data && data.length > 0) {
            console.log('ข้อมูลที่ได้:', data);
            alert('โหลดข้อมูลสำเร็จ!');
        }
    } catch (error) {
        console.error('Import Error:', error);
        alert('การนำเข้าล้มเหลว');
    }
});
```

---

## 4. ข้อแนะนำในการเตรียมไฟล์

1.  **แถวแรก (Header):** แถวแรกของไฟล์ต้องเป็นชื่อคอลัมน์ (เช่น name, email, student_id) เพราะระบบจะนำชื่อเหล่านี้มาเป็น Key ใน Object
2.  **ประเภทไฟล์:** รองรับ `.csv`, `.xlsx` และ `.xls`
3.  **ภาษาไทย:** รองรับภาษาไทย 100% ไม่ว่าจะเป็นไฟล์ที่ Save จาก Excel หรือ Google Sheets
4.  **โครงสร้างข้อมูลที่ได้:**
    ```json
    [
      { "name": "สมชาย", "email": "somchai@test.com" },
      { "name": "สมศรี", "email": "somsri@test.com" }
    ]
    ```

---

> [!TIP]
> เพื่อความปลอดภัย ควรทำการ Validate ข้อมูลใน `data` ก่อนส่งขึ้น Database เสมอ เพื่อเช็คว่าคอลัมน์ที่จำเป็น (Required fields) มีข้อมูลครบถ้วนหรือไม่
