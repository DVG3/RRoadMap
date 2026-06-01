import { useState } from 'react';

export default function DropboxModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: () => void }) {
  const [clientId, setClientId] = useState(localStorage.getItem('dropbox_client_id') || '');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('dropbox_client_secret') || ''); // <-- THÊM STATE NÀY
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('dropbox_refresh_token') || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!clientId.trim() || !clientSecret.trim() || !refreshToken.trim()) return;
    localStorage.setItem('dropbox_client_id', clientId.trim());
    localStorage.setItem('dropbox_client_secret', clientSecret.trim()); // <-- LƯU VÀO TRÌNH DUYỆT
    localStorage.setItem('dropbox_refresh_token', refreshToken.trim());
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
        <h2 className="font-bold text-xl mb-2 text-blue-600 flex items-center gap-2">
          ☁️ Kết nối Dropbox (Vĩnh viễn)
        </h2>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Nhập <strong>App Key</strong>, <strong>App Secret</strong> và <strong>Refresh Token</strong>.
        </p>
        
        <label className="text-xs font-bold text-gray-700">App Key (Client ID):</label>
        <input 
          type="text" 
          value={clientId} 
          onChange={e => setClientId(e.target.value)}
          placeholder="Ví dụ: slx123..."
          className="w-full border border-gray-300 p-2 rounded text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <label className="text-xs font-bold text-gray-700">App Secret (Client Secret):</label>
        <input 
          type="password" 
          value={clientSecret} 
          onChange={e => setClientSecret(e.target.value)}
          placeholder="Nhập App Secret..."
          className="w-full border border-gray-300 p-2 rounded text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <label className="text-xs font-bold text-gray-700">Refresh Token:</label>
        <input 
          type="password" 
          value={refreshToken} 
          onChange={e => setRefreshToken(e.target.value)}
          placeholder="Nhập Refresh Token..."
          className="w-full border border-gray-300 p-2 rounded text-sm mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded font-semibold">Đóng</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow">
            Lưu & Đồng bộ
          </button>
        </div>
      </div>
    </div>
  );
}