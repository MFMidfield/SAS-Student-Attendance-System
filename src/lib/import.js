/**
 * ฟังก์ชันสำหรับนำเข้าข้อมูลจากไฟล์ CSV หรือ Excel
 * @param {File} file - ไฟล์ที่ได้จาก <input type="file">
 * @returns {Promise<Array>} - ข้อมูลในรูปแบบ Array of Objects
 */
export const importCSV = (file) => {
    return new Promise((resolve, reject) => {
        try {
            if (!file) {
                reject(new Error('ไม่พบไฟล์ที่ต้องการนำเข้า'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // ดึงชื่อ Sheet แรกออกมา
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // แปลงข้อมูลใน Sheet เป็น JSON (Array of Objects)
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1, // ใช้แถวแรกเป็น Header อัตโนมัติถ้าไม่ระบุ
                        defval: "" // ค่าเริ่มต้นสำหรับช่องว่าง
                    });

                    // ถ้าใช้ header: 1 จะได้ Array of Arrays
                    // เราจะแปลงให้เป็น Array of Objects เพื่อให้ใช้งานง่ายขึ้น
                    if (jsonData.length > 0) {
                        const headers = jsonData[0];
                        const rows = jsonData.slice(1);
                        
                        const formattedData = rows.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index];
                            });
                            return obj;
                        });

                        resolve(formattedData);
                    } else {
                        resolve([]);
                    }
                } catch (err) {
                    reject(new Error('เกิดข้อผิดพลาดในการอ่านข้อมูลในไฟล์: ' + err.message));
                }
            };

            reader.onerror = (err) => {
                reject(new Error('เกิดข้อผิดพลาดในการโหลดไฟล์: ' + err.message));
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * ฟังก์ชันสำหรับช่วยเลือกไฟล์และอ่านข้อมูลทันที (Helper function)
 * @returns {Promise<Array>}
 */
export const selectAndImportFile = () => {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const data = await importCSV(file);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            }
        };
        
        input.click();
    });
};
