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
    // Get current time in the selected timezone
    const timezone = campaignData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    const now = new Date()

    if (campaignData.scheduleType === 'now') {
      // Shade all time from now through campaign end date
      if (campaignData.campaignEndDate) {
        const startTime = now.toISOString()
        const endTime = `${campaignData.campaignEndDate}T23:59:59`

        events.push({
          id: 'send-now-period',
          title: '',
          start: startTime,
          end: endTime,
          display: 'background',
          backgroundColor: '#dcfce7', // light green
          className: 'send-now-period'
        })
      }
    } else if (campaignData.scheduleType === 'later') {
      // Shade all time from campaign start date through campaign end date, but not before current time
      if (campaignData.campaignStartDate && campaignData.campaignEndDate) {
        // Parse dates in the selected timezone
        const campaignStart = new Date(`${campaignData.campaignStartDate}T00:00:00`)
        const campaignEnd = new Date(`${campaignData.campaignEndDate}T23:59:59`)

        // Use the later of campaign start time or current time
        const effectiveStart = campaignStart > now ? campaignStart : now

        if (effectiveStart <= campaignEnd) {
          events.push({
            id: 'scheduled-send-period',
            title: '',
            start: effectiveStart.toISOString(),
            end: campaignEnd.toISOString(),
            display: 'background',
            backgroundColor: '#dcfce7', // light green
            className: 'scheduled-send-period'
          })
        }
      }
    } else if (campaignData.scheduleType === 'windows' && campaignData.sendingWindows.length > 0) {
      // Show sending windows as background events, but not before current time
      campaignData.sendingWindows.forEach((window, index) => {
        if (window.startDate && window.startTime && window.endDate && window.endTime) {
          const windowStart = new Date(`${window.startDate}T${window.startTime}`)
          const windowEnd = new Date(`${window.endDate}T${window.endTime}`)

          // Use the later of window start time or current time
          const effectiveStart = windowStart > now ? windowStart : now

          // Only create event if there's still time remaining after current time
          if (effectiveStart < windowEnd) {
            events.push({
              id: `window-${index}`,
              title: '',
              start: effectiveStart.toISOString(),
              end: windowEnd.toISOString(),
              display: 'background',
              backgroundColor: '#3b82f6', // blue
              className: 'sending-window-available'
            })
          }
        }
      })
    } else if (campaignData.scheduleType === 'weekday') {
      // Show weekday-based windows for all weeks from campaign start to end date
      if (campaignData.campaignStartDate && campaignData.campaignEndDate) {
        // Parse dates in the selected timezone
        const startDate = new Date(campaignData.campaignStartDate + 'T00:00:00')
        const endDate = new Date(campaignData.campaignEndDate + 'T23:59:59')

        // Generate events for each day between start and end dates
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()]
          const dayWindows = campaignData.weekdayWindows[dayName as keyof typeof campaignData.weekdayWindows]

          if (campaignData.weekdayEnabled[dayName as keyof typeof campaignData.weekdayEnabled] && Array.isArray(dayWindows)) {
            dayWindows.forEach((window, index) => {
              if (window.startTime && window.endTime) {
                // Validate that end time is after start time
                const startTimeMinutes = window.startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0)
                const endTimeMinutes = window.endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0)

                if (endTimeMinutes <= startTimeMinutes) {
                  // Skip invalid time ranges (end time before or equal to start time)
                  return
                }

                // Use local date string to avoid timezone issues
                const year = currentDate.getFullYear()
                const month = String(currentDate.getMonth() + 1).padStart(2, '0')
                const day = String(currentDate.getDate()).padStart(2, '0')
                const dateStr = `${year}-${month}-${day}`

                const windowStart = new Date(`${dateStr}T${window.startTime}`)
                const windowEnd = new Date(`${dateStr}T${window.endTime}`)

                // Use the later of window start time or current time
                const effectiveStart = windowStart > now ? windowStart : now

                // Only create event if there's still time remaining after current time
                if (effectiveStart < windowEnd) {
                  events.push({
                    id: `${dayName}-${dateStr}-${index}`,
                    title: '',
                    start: effectiveStart.toISOString(),
                    end: windowEnd.toISOString(),
                    display: 'background',
                    backgroundColor: '#3b82f6', // blue
                    className: 'weekday-window-available'
                  })
                }
              }
            })
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
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
        height="auto"
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