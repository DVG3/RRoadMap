import { useState } from 'react';
import { useRoadmapStore } from '../core/store';
import { deleteFromDropbox, renameOnDropbox, loadFromDropbox, syncToDropbox } from '../core/dropboxSync';

export default function LeftSidebar() {
  const { nodes, edges, tags, addTag, deleteTag, currentFile, setCurrentFile, roadmapFiles, setRoadmapFiles, clearBoard, loadRoadmap, setIsSyncing } = useRoadmapStore();
  const [newTagName, setNewTagName] = useState('');
  
  // State phục vụ việc Rename
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // 1. CHUYỂN FILE (Auto-save file cũ, load file mới)
  const handleSwitchRoadmap = async (filename: string) => {
    if (filename === currentFile) return;
    setIsSyncing(true);
    // Tự động lưu bản đồ hiện tại trước khi thoát
    await syncToDropbox(currentFile, { nodes, edges, tags });
    // Tải bản đồ mới
    clearBoard();
    setCurrentFile(filename);
    const data = await loadFromDropbox(filename);
    if (data) loadRoadmap(data);
    setIsSyncing(false);
  };

  // 2. TẠO FILE MỚI
  const handleCreateRoadmap = async () => {
    const name = prompt("Nhập tên Roadmap mới:");
    if (!name) return;
    const filename = name.endsWith('.json') ? name : `${name}.json`;
    if (roadmapFiles.includes(filename)) {
      alert("Tên file đã tồn tại!"); return;
    }
    setIsSyncing(true);
    await syncToDropbox(currentFile, { nodes, edges, tags }); // Lưu file hiện tại
    clearBoard(); // Xóa bảng trắng
    setCurrentFile(filename);
    setRoadmapFiles([...roadmapFiles, filename]);
    await syncToDropbox(filename, { nodes: [], edges: [], tags: [] }); // Tạo file mới trên Dropbox
    setIsSyncing(false);
  };

  // 3. XÓA FILE
  const handleDeleteRoadmap = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn "${filename}" khỏi Dropbox?`)) return;
    
    setIsSyncing(true);
    const success = await deleteFromDropbox(filename);
    if (success) {
      const newFiles = roadmapFiles.filter(f => f !== filename);
      setRoadmapFiles(newFiles);
      
      // Nếu lỡ xóa trúng file đang mở
      if (filename === currentFile) {
        if (newFiles.length > 0) {
          handleSwitchRoadmap(newFiles[0]); // Chuyển sang file đầu tiên còn lại
        } else {
          const defaultName = 'roadmap.json';
          setRoadmapFiles([defaultName]);
          setCurrentFile(defaultName);
          clearBoard();
          await syncToDropbox(defaultName, { nodes: [], edges: [], tags: [] });
        }
      }
    }
    setIsSyncing(false);
  };

  // 4. ĐỔI TÊN FILE
  const handleRenameSubmit = async (oldName: string) => {
    if (!editName.trim() || editName === oldName.replace('.json', '')) {
      setEditingFile(null); return;
    }
    const newName = `${editName.trim()}.json`;
    if (roadmapFiles.includes(newName)) {
      alert("Tên file đã tồn tại!"); return;
    }

    setIsSyncing(true);
    const success = await renameOnDropbox(oldName, newName);
    if (success) {
      setRoadmapFiles(roadmapFiles.map(f => f === oldName ? newName : f));
      if (currentFile === oldName) setCurrentFile(newName);
    }
    setEditingFile(null);
    setIsSyncing(false);
  };

  // Tag CRUD (Giữ nguyên)
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    addTag({ id: `tag-${Date.now()}`, name: newTagName, color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') });
    setNewTagName('');
  };

  return (
    <div className="h-full flex flex-col bg-white border-r dark:bg-gray-900 dark:border-gray-700">
      {/* QUẢN LÝ ROADMAP (FILES) */}
      <div className="flex-1 p-4 overflow-y-auto border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider dark:text-gray-300">Roadmaps trong Room</h3>
          <button onClick={handleCreateRoadmap} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200 shadow-sm dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800">+ Mới</button>
        </div>
        
        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
          {roadmapFiles.map(file => {
            const isActive = file === currentFile;
            const isEditing = editingFile === file;

            return (
              <li 
                key={file} 
                onClick={() => !isEditing && handleSwitchRoadmap(file)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                {isEditing ? (
                  <input 
                    autoFocus
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleRenameSubmit(file)}
                    onKeyDown={e => e.key === 'Enter' && handleRenameSubmit(file)}
                    className="flex-1 px-1 py-0.5 border border-blue-400 rounded text-xs outline-none dark:bg-gray-800 dark:text-gray-200"
                  />
                ) : (
                  <div className="flex items-center gap-2 truncate flex-1 pr-2">
                    <span>{isActive ? '📂' : '📁'}</span>
                    <span className="truncate">{file.replace('.json', '')}</span>
                  </div>
                )}
                
                {!isEditing && (
                  <div className="hidden group-hover:flex gap-1 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingFile(file); setEditName(file.replace('.json', '')); }}
                      className="text-gray-400 hover:text-blue-600 px-1 dark:hover:text-blue-400" title="Đổi tên"
                    >✏️</button>
                    <button 
                      onClick={(e) => handleDeleteRoadmap(file, e)}
                      className="text-gray-400 hover:text-red-600 px-1 dark:hover:text-red-400" title="Xóa"
                    >🗑️</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
        <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider dark:text-gray-300">Quản lý Tags</h3>
        <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
          <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="Tên tag mới..." className="flex-1 border rounded px-2 py-1 text-sm focus:outline-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
          <button type="submit" className="bg-gray-800 text-white px-2 py-1 rounded text-sm hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500">+</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-1 bg-white border rounded-full px-2 py-1 shadow-sm text-xs group dark:bg-gray-700 dark:border-gray-600">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
              <span className="font-medium text-gray-700 dark:text-gray-200">{tag.name}</span>
              <button onClick={() => deleteTag(tag.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1 transition-opacity dark:hover:text-red-400">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}