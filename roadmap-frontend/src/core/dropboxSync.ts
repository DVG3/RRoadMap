import { Dropbox } from 'dropbox';

const TOKEN_KEY = 'dropbox_access_token';
const EXPIRY_KEY = 'dropbox_token_expires_at';

const getAccessToken = async (): Promise<string> => {
  const cached = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRY_KEY);
  if (cached && expiresAt && Date.now() < Number(expiresAt)) {
    return cached;
  }

  const clientId = localStorage.getItem('dropbox_client_id');
  const clientSecret = localStorage.getItem('dropbox_client_secret');
  const refreshToken = localStorage.getItem('dropbox_refresh_token');
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Chưa cấu hình đủ Dropbox API!');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) throw new Error(`Dropbox token refresh failed: ${res.status}`);

  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (data.expires_in - 60) * 1000));
  return data.access_token;
};

const getDbx = async () => {
  const accessToken = await getAccessToken();
  return new Dropbox({ accessToken });
};

export const syncToDropbox = async (filename: string, dataToSave: any) => {
  try {
    const dbx = await getDbx();
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const fileBlob = new Blob([jsonString], { type: 'application/json' });
    await dbx.filesUpload({ path: `/${filename}`, contents: fileBlob as any, mode: { '.tag': 'overwrite' } });
    return true;
  } catch (error) {
    console.error('Lỗi khi lưu lên Dropbox:', error);
    return false;
  }
};

export const loadFromDropbox = async (filename: string) => {
  try {
    const dbx = await getDbx();
    const response = await dbx.filesDownload({ path: `/${filename}` });
    const blob = (response.result as any).fileBlob;
    if (!blob) return null;
    return JSON.parse(await blob.text());
  } catch (error: any) {
    console.error('Lỗi tải từ Dropbox:', error);
    throw error;
  }
};

export const listFilesFromDropbox = async () => {
  try {
    const dbx = await getDbx();
    const response = await dbx.filesListFolder({ path: '' });
    return response.result.entries
      .filter(entry => entry.name.endsWith('.json'))
      .map(entry => entry.name);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách file:', error);
    return [];
  }
};

export const deleteFromDropbox = async (filename: string) => {
  try {
    const dbx = await getDbx();
    await dbx.filesDeleteV2({ path: `/${filename}` });
    return true;
  } catch (error) {
    console.error('Lỗi xóa file:', error);
    return false;
  }
};

export const renameOnDropbox = async (oldName: string, newName: string) => {
  try {
    const dbx = await getDbx();
    await dbx.filesMoveV2({ from_path: `/${oldName}`, to_path: `/${newName}` });
    return true;
  } catch (error) {
    console.error('Lỗi đổi tên file:', error);
    return false;
  }
};
