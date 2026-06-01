import { Group, Panel, Separator } from 'react-resizable-panels';
import { useRoadmapStore } from '../core/store';
import { PropertiesRegistry } from '../registry';

export default function RightSidebar() {
  const { nodes, tags } = useRoadmapStore();
  const selectedNode = nodes.find((n) => n.selected);

  // LOGIC TỔNG HỢP RESULTS TỪ TOÀN BỘ BẢN ĐỒ
  const allResults = nodes.flatMap(node => {
    if (!node.data?.results || node.data.results.length === 0) return [];
    
    // Tìm các tag của node này để lấy màu
    const nodeTagObjects = tags.filter(t => (node.data.tags || []).includes(t.id));

    return node.data.results
      .filter((res: string) => res.trim() !== '') // Bỏ qua dòng trống
      .map((res: string) => ({
        taskId: node.id,
        taskTitle: node.data.title || 'Untitled',
        status: node.data.status,
        link: res,
        tags: nodeTagObjects
      }));
  });

  return (
    <div className="h-full bg-white border-l flex flex-col shadow-lg">
      <Group orientation="vertical">
        {/* NỬA TRÊN: PROPERTIES PANEL */}
        <Panel defaultSize={55} minSize={30} className="p-4 overflow-y-auto">
          {!selectedNode ? (
            <div className="text-gray-400 text-sm text-center mt-10">Bấm vào node để xem thuộc tính.</div>
          ) : (
            (() => {
              const PropertiesComponent = PropertiesRegistry[selectedNode.type as keyof typeof PropertiesRegistry];
              return PropertiesComponent ? <PropertiesComponent node={selectedNode} /> : <div className="text-red-500">Chưa có UI.</div>;
            })()
          )}
        </Panel>
        
        <Separator className="h-1.5 bg-gray-200 hover:bg-blue-400 cursor-row-resize transition-colors" />
        
        {/* NỬA DƯỚI: RESULTS AGGREGATION */}
        <Panel defaultSize={45} minSize={20} className="p-4 bg-gray-50 overflow-y-auto flex flex-col gap-3">
          <h3 className="font-bold text-gray-800 border-b pb-2 uppercase tracking-wide text-sm flex justify-between items-center">
            Tổng hợp Results
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{allResults.length} mục</span>
          </h3>

          {allResults.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center mt-5">Chưa có kết quả nào trên bản đồ.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allResults.map((item, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-gray-200 shadow-sm text-xs flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 truncate">{item.taskTitle}</span>
                    {item.status === 'done' && <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded">✓ Xong</span>}
                  </div>
                  
                  {/* Hiển thị Link dạng bấm được */}
                  <a 
                    href={item.link.startsWith('http') ? item.link : `https://${item.link}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {item.link}
                  </a>

                  {/* Hiển thị Tags của task đó */}
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.tags.map((t: any) => (
                        <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </Group>
    </div>
  );
}