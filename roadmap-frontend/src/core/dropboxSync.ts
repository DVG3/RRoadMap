import { Dropbox } from 'dropbox';

// HÀM MỚI: Tự động quản lý vòng đời 4h của Token
// CẬP NHẬT HÀM getDbx
const getDbx = () => {
  const clientId = localStorage.getItem('dropbox_client_id');
  const clientSecret = localStorage.getItem('dropbox_client_secret'); // <-- THÊM DÒNG NÀY
  const refreshToken = localStorage.getItem('dropbox_refresh_token');
  
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Chưa cấu hình đủ Dropbox API!');
  
  // SDK sẽ dùng 3 thông số này để tự động lấy Access Token mới mỗi khi cần
  return new Dropbox({ 
    clientId: clientId, 
    clientSecret: clientSecret, // <-- THÊM DÒNG NÀY
    refreshToken: refreshToken 
  });
};

// ... (Các hàm syncToDropbox, loadFromDropbox, listFilesFromDropbox... bên dưới giữ y nguyên)

// 1. ĐẨY DỮ LIỆU LÊN (LƯU)
export const syncToDropbox = async (filename: string, dataToSave: any) => {
  try {
    const dbx = getDbx();
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const fileBlob = new Blob([jsonString], { type: 'application/json' });
    await dbx.filesUpload({ path: `/${filename}`, contents: fileBlob as any, mode: { '.tag': 'overwrite' } });
    return true;
  } catch (error) {
    console.error('Lỗi khi lưu lên Dropbox:', error);
    return false;
  }
};

// 2. KÉO DỮ LIỆU VỀ (TẢI)
export const loadFromDropbox = async (filename: string) => {
  try {
    const dbx = getDbx();
    const response = await dbx.filesDownload({ path: `/${filename}` });
    const blob = (response.result as any).fileBlob;
    if (!blob) return null;
    return JSON.parse(await blob.text());
  } catch (error: any) {
    return null;
  }
};

// 3. LẤY DANH SÁCH FILE JSON
export const listFilesFromDropbox = async () => {
  try {
    const dbx = getDbx();
    const response = await dbx.filesListFolder({ path: '' });
    return response.result.entries
      .filter(entry => entry.name.endsWith('.json'))
      .map(entry => entry.name);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file:', error);
    return [];
  }
};

// 4. XÓA FILE
export const deleteFromDropbox = async (filename: string) => {
  try {
    const dbx = getDbx();
    await dbx.filesDeleteV2({ path: `/${filename}` });
    return true;
  } catch (error) {
    console.error('Lỗi xóa file:', error);
    return false;
  }
};

// 5. ĐỔI TÊN FILE
export const renameOnDropbox = async (oldName: string, newName: string) => {
  try {
    const dbx = getDbx();
    await dbx.filesMoveV2({ from_path: `/${oldName}`, to_path: `/${newName}` });
    return true;
  } catch (error) {
    console.error('Lỗi đổi tên file:', error);
    return false;
  }
};