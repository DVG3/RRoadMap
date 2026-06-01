import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useRoadmapStore } from '../core/store';

// Cấu hình ngôn ngữ Tiếng Việt cho Lịch
const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Tuần bắt đầu vào Thứ 2
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export default function CalendarBoard() {
  const { nodes, updateNodeData, updateNodeConfig } = useRoadmapStore();
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Lọc lấy các Task Node
  const tasks = nodes.filter(n => n.type === 'task');
  
  // Phân loại: Có ngày tháng vs Chưa có ngày tháng
  const scheduledTasks = tasks.filter(t => t.data?.startDate && t.data?.endDate);
  const unscheduledTasks = tasks.filter(t => !t.data?.startDate || !t.data?.endDate);

  // Chuyển đổi định dạng Task thành Event của Calendar
  const events = scheduledTasks.map(t => ({
    id: t.id,
    title: t.data.title || 'Untitled Task',
    start: new Date(t.data.startDate),
    end: new Date(t.data.endDate),
    allDay: true, // App Roadmap thường xài All-day cho dễ nhìn
    node: t // Lưu trữ ref của Node gốc để lấy màu/tags
  }));

  // Xử lý khi kéo giãn Event trên Lịch (Đổi Start/End date)
  const resizeEvent = ({ event, start, end }: any) => {
    updateNodeData(event.id, { startDate: start.toISOString(), endDate: end.toISOString() });
  };

  // Xử lý khi dời Event sang ngày khác
  const moveEvent = ({ event, start, end }: any) => {
    updateNodeData(event.id, { startDate: start.toISOString(), endDate: end.toISOString() });
  };

  // Xử lý khi Click vào Event -> Hiển thị Properties ở Sidebar phải
  const handleSelectEvent = (event: any) => {
    nodes.forEach(n => updateNodeConfig(n.id, { selected: n.id === event.id }));
  };

  // Xử lý khi thả Task từ Cột Backlog vào trong Lịch
  const onDropFromOutside = useCallback(
    ({ start, end }: any) => {
      if (draggedNodeId) {
        updateNodeData(draggedNodeId, {
          startDate: start.toISOString(),
          // Mặc định thả vào 1 ngày thì start và end giống nhau
          endDate: end.toISOString()

        });
        setDraggedNodeId(null);
      }
    },
    [draggedNodeId, updateNodeData]
  );

  return (
    <div className="flex h-full w-full bg-white">
      {/* CỘT TRÁI: UNSCHEDULED TASKS (BACKLOG) */}
      <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0 shadow-inner">
        <div className="p-3 bg-gray-200 font-bold text-sm text-gray-700 uppercase tracking-wide border-b border-gray-300">
          Chưa xếp lịch
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {unscheduledTasks.map(t => (
            <div
              key={t.id}
              draggable
              onDragStart={() => setDraggedNodeId(t.id)}
              className="p-2 bg-white border-2 border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing text-sm font-semibold hover:border-blue-400 transition-colors"
              style={{ borderLeftColor: t.data.color || '#3b82f6', borderLeftWidth: '4px' }}
            >
              {t.data.title || 'Untitled Task'}
            </div>
          ))}
          {unscheduledTasks.length === 0 && (
             <div className="text-xs text-gray-400 text-center mt-4">Không còn task nào trống.</div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: BẢN ĐỒ LỊCH */}
      <div className="flex-1 p-4 overflow-hidden h-full">
        <DnDCalendar
          localizer={localizer}
          events={events}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          onSelectEvent={handleSelectEvent}
          onDropFromOutside={onDropFromOutside}
          resizable
          selectable
          defaultView="month"
          views={['month', 'week']}
          style={{ height: '100%' }}
          culture="vi"
          messages={{
             next: "Tiếp", previous: "Trước", today: "Hôm nay", month: "Tháng", week: "Tuần", day: "Ngày", showMore: (total) => `+ Xem thêm (${total})`
          }}
          // Đổi màu nền event dựa vào màu gốc của Node Task
          eventPropGetter={(event: any) => ({
            style: { 
              backgroundColor: event.node.data.color || '#3b82f6', 
              color: '#1f2937', // Text tối màu để dễ đọc
              fontWeight: 'bold',
              border: '1px solid rgba(0,0,0,0.1)'
            }
          })}
        />
      </div>
    </div>
  );
}