/**
 * ฟังก์ชันสำหรับส่งออกข้อมูลเป็นไฟล์ CSV (รองรับภาษาไทย)
 * @param {Array} data - ข้อมูลในรูปแบบ Array of Objects
 * @param {string} fileName - ชื่อไฟล์ที่ต้องการ (ไม่ต้องใส่นามสกุล)
 */
export const exportToCSV = (data, fileName = 'ExportData') => {
    try {
        if (!data || data.length === 0) {
            console.error('No data to export');
            return false;
        }

        // 1. สร้าง Worksheet จากข้อมูล JSON
        const ws = XLSX.utils.json_to_sheet(data);

        // 2. แปลง Worksheet เป็น CSV String
        const csv = XLSX.utils.sheet_to_csv(ws);

        // 3. จัดการเรื่องภาษาไทย (เพิ่ม UTF-8 BOM) 
        // เพื่อให้ Excel เปิดไฟล์ CSV แล้วไม่เป็นภาษาต่างดาว
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], {
            type: "text/csv;charset=utf-8;"
        });

        // 4. สร้าง Link สำหรับ Download
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute("download", fullFileName);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (error) {
        console.error('CSV Export Error:', error);
        throw error;
    }
};

/**
 * ฟังก์ชันสำหรับส่งออกข้อมูลเป็นไฟล์ Excel (เก็บไว้เผื่อเลือกใช้)
 */
export const exportToExcel = (data, fileName = 'ExportData', sheetName = 'Sheet1') => {
    try {
        if (!data || data.length === 0) return false;
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fullFileName);
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        throw error;
    }
};
