import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { CreateCampaignData, CalendarEvent } from '@/components/campaigns/types/campaign.types'

interface SendingScheduleCalendarProps {
  campaignData: CreateCampaignData
}

export function SendingScheduleCalendar({ campaignData }: SendingScheduleCalendarProps) {
  // Convert Schedule Send settings to calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = []

    if (campaignData.scheduleType === 'later' && campaignData.scheduledDate && campaignData.scheduledTime) {
      // This will be a regular event when we implement actual scheduling
      // For now, show it as a background event to indicate when sending will happen
      events.push({
        id: 'scheduled-send',
        title: '',
        start: `${campaignData.scheduledDate}T${campaignData.scheduledTime}`,
        end: `${campaignData.scheduledDate}T${campaignData.scheduledTime}`,
        display: 'background',
        backgroundColor: '#dcfce7', // light green
        className: 'scheduled-send-time'
      })
    } else if (campaignData.scheduleType === 'windows' && campaignData.sendingWindows.length > 0) {
      // Show sending windows as background events (available times)
      campaignData.sendingWindows.forEach((window, index) => {
        if (window.startDate && window.startTime && window.endDate && window.endTime) {
          events.push({
            id: `window-${index}`,
            title: '',
            start: `${window.startDate}T${window.startTime}`,
            end: `${window.endDate}T${window.endTime}`,
            display: 'background',
            backgroundColor: '#3b82f6', // blue with more opacity
            className: 'sending-window-available'
          })
        }
      })
    } else if (campaignData.scheduleType === 'weekday') {
      // Show weekday-based windows as background events
      const today = new Date()
      const currentWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())

      Object.entries(campaignData.weekdayWindows).forEach(([day, dayWindows]) => {
        if (campaignData.weekdayEnabled[day as keyof typeof campaignData.weekdayEnabled] && Array.isArray(dayWindows)) {
          const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day)

          dayWindows.forEach((window, index) => {
            if (window.startTime && window.endTime) {
              const windowDate = new Date(currentWeekStart)
              windowDate.setDate(currentWeekStart.getDate() + dayIndex)
              const dateStr = windowDate.toISOString().split('T')[0]

              events.push({
                id: `${day}-${index}`,
                title: '',
                start: `${dateStr}T${window.startTime}`,
                end: `${dateStr}T${window.endTime}`,
                display: 'background',
                backgroundColor: '#3b82f6', // blue
                className: 'weekday-window-available'
              })
            }
          })
        }
      })
    }

    return events
  }, [campaignData])

  return (
    <div className="calendar-wrapper" style={{ height: '100%', overflow: 'auto' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        initialView="timeGridWeek"
        editable={false}
        selectable={false}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        height="100%"
        nowIndicator={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        slotDuration="01:00:00"
        slotLabelInterval="02:00:00"
        eventDisplay="background"
      />
      <style jsx>{`
        :global(.fc-now-indicator-line) {
          border-color: #15803d !important;
          border-width: 2px !important;
        }
        :global(.fc-now-indicator-arrow) {
          border-top-color: #15803d !important;
          border-bottom-color: #15803d !important;
        }
        :global(.fc) {
          font-size: 0.7rem !important;
        }
        :global(.fc-toolbar) {
          font-size: 0.7rem !important;
        }
        :global(.fc-button) {
          font-size: 0.7rem !important;
          padding: 0.2rem 0.4rem !important;
        }
        :global(.fc-col-header-cell) {
          font-size: 0.7rem !important;
        }
        :global(.fc-timegrid-slot-label) {
          font-size: 0.7rem !important;
        }
        :global(.fc-toolbar-title) {
          font-size: 0.7rem !important;
        }
      `}</style>
    </div>
  )
}