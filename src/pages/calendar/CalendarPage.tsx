import { useEffect, useState } from 'react'
import Text from '../../components/base/Text'
import { Card } from '../../components/ui'
import { calendarService } from '../../services'
import { Authstore } from '../../data/Authstore'
import type { CalendarEvent } from '../../types'

const CalendarPage = () => {
  const { user } = Authstore()
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    if (!user?.id) return
    calendarService.listByUser(user.id).then(setEvents)
  }, [user?.id])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return (
    <div className="space-y-6">
      <Text variant="xl" className="font-medium">
        Calendar
      </Text>
      <Text variant="md" className="opacity-80">
        Your task schedules, planning blocks, and milestone deadlines.
      </Text>
      <Card title="Upcoming events">
        <ul className="space-y-3">
          {events.length === 0 ? (
            <Text variant="sm" className="opacity-70">
              No events yet.
            </Text>
          ) : (
            events.map((e) => (
              <li key={e.id} className="flex justify-between items-start">
                <div>
                  <Text variant="md">{e.title}</Text>
                  <Text variant="sm" className="opacity-70">
                    {e.type.replace(/_/g, ' ')}
                  </Text>
                </div>
                <Text variant="sm">{formatTime(e.start)}</Text>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}

export default CalendarPage
