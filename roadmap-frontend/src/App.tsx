import { useEffect, useState, useRef } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { ReactFlowProvider } from 'reactflow';
import Whiteboard from './components/Whiteboard';
import RightSidebar from './components/RightSidebar';
import LeftSidebar from './components/LeftSidebar';
import SearchBar from './components/SearchBar';
import CalendarBoard from './components/CalendarBoard';
import DropboxModal from './components/DropboxModal';
import { useRoadmapStore } from './core/store';
// CẬP NHẬT IMPORT NÀY
import { syncToDropbox, loadFromDropbox, listFilesFromDropbox } from './core/dropboxSync';

function App() {
  const { addNode, viewMode, setViewMode, nodes, edges, tags, loadRoadmap, currentFile, setCurrentFile, setRoadmapFiles, isSyncing, setIsSyncing, undo, redo } = useRoadmapStore(); // Lấy thêm undo, redo
  
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
const handleExportLocal = () => {
    const dataToSave = { nodes, edges, tags };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile || 'roadmap.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target?.result as string);
        loadRoadmap(parsedData);
        // Tùy chọn: Tự động đẩy file mới import lên Dropbox luôn
        syncToDropbox(currentFile, parsedData);
      } catch (error) {
        alert("File JSON không hợp lệ!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const fetchCloudData = async () => {
    if (!localStorage.getItem('dropbox_token')) {
      setShowTokenModal(true); return;
    }
    
    setIsSyncing(true);
    
    // BƯỚC 1: Lấy danh sách file JSON từ Dropbox
    const files = await listFilesFromDropbox();
    let activeFile = currentFile;

    if (files.length > 0) {
      setRoadmapFiles(files);
      if (!files.includes(currentFile)) {
        activeFile = files[0]; // Nếu file current không tồn tại, mở file đầu tiên tìm được
        setCurrentFile(activeFile);
      }
    } else {
      setRoadmapFiles([activeFile]); // Nếu thư mục Dropbox trống, giữ file mặc định
    }
    
    // BƯỚC 2: Tải dữ liệu của File hiện tại
    const data = await loadFromDropbox(activeFile);
    if (data) {
      loadRoadmap(data);
      setLastSync(new Date().toLocaleTimeString());
    }
    setIsSyncing(false);
  };

  useEffect(() => { fetchCloudData(); }, []);

  const handleSync = async () => {
    if (!localStorage.getItem('dropbox_token')) { setShowTokenModal(true); return; }
    setIsSyncing(true);
    
    // Cập nhật hàm gọi sync để truyền tên file hiện hành
    const success = await syncToDropbox(currentFile, { nodes, edges, tags });
    
    if (success) {
      setLastSync(new Date().toLocaleTimeString());
    } else {
      alert("Đồng bộ thất bại, hãy kiểm tra lại Access Token!");
      setShowTokenModal(true);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bắt Ctrl + S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSync();
      }
      // Bắt Ctrl + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Bắt Ctrl + Y hoặc Ctrl + Shift + Z (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, tags, currentFile]);
  // ... (Phần render UI ở dưới của App.tsx giữ nguyên y như cũ)
 
  return (
    <ReactFlowProvider>
      <DropboxModal 
        isOpen={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
        onSave={() => fetchCloudData()} // <--- Bỏ chữ token đi, chỉ gọi fetchCloudData()
      />

      <div className="w-screen h-screen flex flex-col bg-gray-100 overflow-hidden">
        
        {/* Topbar */}
        <div className="h-14 shrink-0 bg-gray-900 text-white flex items-center px-4 justify-between z-10 shadow-md">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-xl tracking-tight">RoadMap<span className="text-blue-400">Room</span></h1>
            
            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded">
              <SearchBar />
              <button onClick={() => setViewMode(viewMode === 'board' ? 'calendar' : 'board')} className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors tooltip">
                {viewMode === 'board' ? '📅 Lịch' : '🗺️ Bảng'}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
             {/* Khu vực trạng thái Đồng bộ */}
             <div className="flex items-center gap-1 border-r border-gray-600 pr-3 mr-1">
               <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-700 px-2 py-1.5 rounded hover:bg-gray-600 transition-colors tooltip" title="Tải file JSON từ máy">
                 📥 Import
               </button>
               <input type="file" ref={fileInputRef} onChange={handleImportLocal} accept=".json" className="hidden" />
               
               <button onClick={handleExportLocal} className="text-xs bg-gray-700 px-2 py-1.5 rounded hover:bg-gray-600 transition-colors tooltip" title="Lưu file JSON về máy">
                 📤 Export
               </button>
             </div>
             <div className="flex items-center gap-3 border-r border-gray-600 pr-3 mr-1">
               {isSyncing ? (
                 <span className="text-xs text-yellow-400 animate-pulse font-semibold">🔄 Đang đồng bộ...</span>
               ) : (
                 <span className="text-[10px] text-gray-400">Lưu lần cuối: {lastSync || 'Chưa lưu'}</span>
               )}
               
               <button onClick={handleSync} className="text-xs bg-emerald-600 px-3 py-1.5 rounded font-bold hover:bg-emerald-500 shadow transition-colors" title="Hoặc nhấn Ctrl+S">
                 ☁️ Sync (Ctrl+S)
               </button>
               
               {/* Nút cài đặt Token */}
               <button onClick={() => setShowTokenModal(true)} className="text-lg opacity-60 hover:opacity-100" title="Cài đặt Dropbox Token">
                 ⚙️
               </button>
             </div>

            <button onClick={() => addNode({ id: `note-${Date.now()}`, type: 'note', position: { x: 100, y: 100 }, data: { color: '#fef08a' } })} className="bg-yellow-600 px-3 py-1.5 rounded font-semibold text-xs hover:bg-yellow-500 shadow">📝 Note</button>
            <button onClick={() => addNode({ id: `reroute-${Date.now()}`, type: 'reroute', position: { x: 150, y: 150 }, data: {} })} className="bg-gray-600 px-3 py-1.5 rounded font-semibold text-xs hover:bg-gray-500 shadow">⏺ Chốt</button>
            {/* Nếu nút Task và Group của bạn vẫn còn ở hàm cũ thì chèn vào đây */}
          </div>
        </div>
// ...
        {/* Main Layout */}
        <div className="flex-1 h-full">
          <Group orientation="horizontal">
            <Panel defaultSize={18} minSize={12}><LeftSidebar /></Panel>
            <Separator className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />
            
            {/* RENDER DỰA TRÊN VIEW MODE */}
            <Panel defaultSize={62} minSize={30}>
              {viewMode === 'board' ? (
                <Whiteboard />
              ) : (
                <CalendarBoard/>
              )}
            </Panel>
            
            <Separator className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors" />
            <Panel defaultSize={20} minSize={15}><RightSidebar /></Panel>
          </Group>
        </div>

      </div>
    </ReactFlowProvider>
  );
}

export default App;