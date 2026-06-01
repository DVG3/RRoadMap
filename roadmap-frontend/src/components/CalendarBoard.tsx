import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useRoadmapStore } from '../core/store';

const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

export default function CalendarBoard() {
  const { nodes, updateNodeData, updateNodeConfig } = useRoadmapStore();
  const [date, setDate] = useState(new Date());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const tasks = nodes.filter(n => n.type === 'task');
  const scheduledTasks = tasks.filter(t => t.data?.startDate && t.data?.endDate);
  const unscheduledTasks = tasks.filter(t => !t.data?.startDate || !t.data?.endDate);

  const events = scheduledTasks.map(t => ({
    id: t.id,
    title: t.data.title || 'Untitled Task',
    start: new Date(t.data.startDate),
    end: new Date(t.data.endDate),
    allDay: true,
    node: t,
  }));

  const resizeEvent = ({ event, start, end }: any) => {
    updateNodeData(event.id, { startDate: start.toISOString(), endDate: end.toISOString() });
  };

  const moveEvent = ({ event, start, end }: any) => {
    updateNodeData(event.id, { startDate: start.toISOString(), endDate: end.toISOString() });
  };

  const handleSelectEvent = (event: any) => {
    nodes.forEach(n => {
      if (n.selected !== (n.id === event.id)) {
        updateNodeConfig(n.id, { selected: n.id === event.id });
      }
    });
  };

  const handleSelectUnscheduled = (nodeId: string) => {
    nodes.forEach(n => {
      if (n.selected !== (n.id === nodeId)) {
        updateNodeConfig(n.id, { selected: n.id === nodeId });
      }
    });
  };

  const onDropFromOutside = useCallback(
    ({ start, end }: any) => {
      if (draggedNodeId) {
        updateNodeData(draggedNodeId, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        setDraggedNodeId(null);
      }
    },
    [draggedNodeId, updateNodeData]
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  return (
    <div className="flex h-full w-full bg-white dark:bg-gray-900">
      <div className="w-64 border-r bg-gray-50 flex flex-col shrink-0 shadow-inner dark:bg-gray-800 dark:border-gray-700">
        <div className="p-3 bg-gray-200 font-bold text-sm text-gray-700 uppercase tracking-wide border-b border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
          Chưa xếp lịch
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {unscheduledTasks.map(t => (
            <div
              key={t.id}
              draggable
              onDragStart={() => setDraggedNodeId(t.id)}
              onClick={() => handleSelectUnscheduled(t.id)}
              className="p-2 bg-white border-2 border-gray-200 rounded shadow-sm cursor-grab active:cursor-grabbing text-sm font-semibold hover:border-blue-400 transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              style={{ borderLeftColor: t.data.color || '#3b82f6', borderLeftWidth: '4px' }}
            >
              {t.data.title || 'Untitled Task'}
            </div>
          ))}
          {unscheduledTasks.length === 0 && (
             <div className="text-xs text-gray-400 text-center mt-4 dark:text-gray-500">Không còn task nào trống.</div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden h-full">
        <DnDCalendar
          localizer={localizer}
          events={events}
          date={date}
          onNavigate={handleNavigate}
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
          components={{
            event: ({ event }: any) => (
              <div className="rbc-event-content flex items-center gap-1">
                <span className="truncate flex-1">{event.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateNodeData(event.id, { startDate: null, endDate: null });
                  }}
                  className="unschedule-btn"
                  title="Bỏ xếp lịch"
                >✕</button>
              </div>
            ),
          }}
          eventPropGetter={(event: any) => ({
            style: { 
              backgroundColor: event.node.data.color || '#3b82f6', 
              color: '#1f2937',
              fontWeight: 'bold',
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: '12px',
              padding: '2px 4px',
            }
          })}
          dayPropGetter={(date: Date) => {
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
              return { className: 'rbc-today-custom' };
            }
            return {};
          }}
        />
      </div>
    </div>
  );
}