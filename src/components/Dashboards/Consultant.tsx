import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Button, LogTimeModal } from '../ui'
import Text from '../base/Text'
import { Clock, Calendar, DollarSign, Activity } from 'lucide-react'
import View from '../base/View'
import { Themestore } from '../../data/Themestore'
import { Authstore } from '../../data/Authstore'
import { taskService } from '../../services'
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Line, Legend, Bar, BarChart, LineChart } from 'recharts'

interface StatCardI {
    label: string
    value: string
    caption: string
    icon: ReactNode
}

export const StatCardUI = (props: StatCardI) => {
    const { current } = Themestore()
    return (
        <View bg='fg' className='p-4 flex-1'>
            <div className='flex items-center justify-between'>
                <Text>{props?.label}</Text>
                <View bg='bg' className='p-3 rounded-full flex items-center justify-center' style={{ color: current?.brand?.primary ?? current?.system?.dark }}>
                    {props?.icon}
                </View>
            </div>
            <Text style={{ fontSize: "1.2vw" }} className='mt-2'>{props?.value}</Text>
            <Text variant='sm' className='opacity-50'>{props?.caption}</Text>
        </View>
    )
}

const chartTickStyle = { fontSize: 12 }

/** Tooltip that keeps each series' bar color for its label (no whiteish default text). */
function BillableTooltip({
    active,
    payload,
    label,
    contentStyle,
}: {
    active?: boolean
    payload?: readonly { name: string; value: number; color: string }[]
    label?: string | number
    contentStyle: React.CSSProperties
}) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ ...contentStyle, padding: '8px 12px' }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>{String(label ?? '')}</div>
            {payload.map((entry) => (
                <div key={entry.name} style={{ color: entry.color ?? contentStyle.color, fontSize: contentStyle.fontSize }}>
                    {entry.name} : {entry.value}
                </div>
            ))}
        </div>
    )
}

const Consultant = () => {
    const { current, mode } = Themestore()
    const [logTimeOpen, setLogTimeOpen] = useState(false)
    const dark = current?.system?.dark
    const gridColor = dark ? `${dark}40` : 'rgba(0,0,0,0.08)'
    const primary = current?.brand?.primary ?? '#682308'
    const chartSecondary = current?.brand?.secondary ?? '#FF9600'
    const chartPrimary = mode === 'dark' ? chartSecondary : primary
    const nonBillableFill = mode === 'dark' ? '#b8740a' : chartSecondary
    const tooltipContentStyle = {
        fontSize: 13,
        backgroundColor: current?.system?.foreground ?? '#fff',
        border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
        borderRadius: 4,
        color: dark,
    }
    const tooltipCursor =
        mode === 'dark'
            ? { fill: dark ? `${dark}18` : 'rgba(255,255,255,0.06)', stroke: current?.system?.border ?? 'rgba(255,255,255,0.08)' }
            : { fill: 'rgba(0,0,0,0.04)', stroke: current?.system?.border ?? 'rgba(0,0,0,0.1)' }
    const tickProps = dark ? { fill: dark } : undefined

    const { user } = Authstore()
    const [tasks, setTasks] = useState<{ id: string; createdAt?: string; title?: string }[]>([])

    const loadTasks = useCallback(async () => {
        if (!user?.id) return
        try {
            const list = await taskService.listByOwner(user.id)
            setTasks(list)
        } catch {
            setTasks([])
        }
    }, [user?.id])

    useEffect(() => {
        loadTasks()
    }, [loadTasks])

    const oneDay = 24 * 60 * 60 * 1000
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const weekStart = todayStart - new Date().getDay() * oneDay
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime()
    const lastMonthEnd = monthStart - 1

    const stats = useMemo(() => {
        const toNum = (d: string | undefined) => (d ? new Date(d).getTime() : 0)
        const todayCount = tasks.filter((t) => toNum(t.createdAt) >= todayStart).length
        const weekCount = tasks.filter((t) => toNum(t.createdAt) >= weekStart).length
        const monthCount = tasks.filter((t) => toNum(t.createdAt) >= monthStart).length
        const lastMonthCount = tasks.filter((t) => {
            const tms = toNum(t.createdAt)
            return tms >= lastMonthStart && tms <= lastMonthEnd
        }).length
        return [
            { label: 'Tasks Today', value: String(todayCount), caption: 'Logged today', icon: <Clock size={17} /> },
            { label: 'Tasks This Week', value: String(weekCount), caption: 'Logged this week', icon: <Activity size={17} /> },
            { label: 'Tasks This Month', value: String(monthCount), caption: 'Logged this month', icon: <Calendar size={17} /> },
            { label: 'Last Month', value: String(lastMonthCount), caption: 'Tasks last month', icon: <DollarSign size={17} /> },
        ]
    }, [tasks])

    const weeklyHours = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekStartMs = new Date().setDate(new Date().getDate() - new Date().getDay()) as number
        return days.map((day, i) => {
            const dayStart = weekStartMs + i * oneDay
            const dayEnd = dayStart + oneDay
            const count = tasks.filter((t) => {
                const tms = t.createdAt ? new Date(t.createdAt).getTime() : 0
                return tms >= dayStart && tms < dayEnd
            }).length
            return { day, hours: count }
        })
    }, [tasks])

    const billableData = useMemo(() => {
        const weeks: { name: string; billable: number; nonBillable: number }[] = []
        for (let w = 3; w >= 0; w--) {
            const d = new Date()
            d.setDate(d.getDate() - d.getDay() - w * 7)
            const weekStartMs = d.getTime()
            const weekEndMs = weekStartMs + 7 * oneDay
            const inWeek = tasks.filter((t) => {
                const tms = t.createdAt ? new Date(t.createdAt).getTime() : 0
                return tms >= weekStartMs && tms < weekEndMs
            })
            weeks.push({
                name: `Week ${4 - w}`,
                billable: inWeek.length,
                nonBillable: 0,
            })
        }
        return weeks
    }, [tasks])

    return (
        <>

            {/* greeting and action btn  */}
            <div className='flex items-center justify-between'>
                <div className='mt-4'>
                    <Text className='font-semibold flex gap-1'>Hello, <Text color='primary'>{user?.name ?? 'there'}</Text></Text>
                    <Text variant='sm'>Welcome back to your dashboard</Text>
                </div>
                <Button label='log time' onClick={() => setLogTimeOpen(true)} />
            </div>

            {/* stat cards  */}
            <div className='flex flex-wrap gap-2 mt-4'>
                {stats?.map((s, i) => (<StatCardUI {...s} key={i} />))}
            </div>

            {/* graphs  */}
            {/* graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">

                {/* Weekly Hours Line Chart */}
                <View bg="fg" className="p-4">
                    <Text className="mb-4 font-semibold">Weekly Hours</Text>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            style={{ fontSize: ".9vw" }}
                            data={weeklyHours}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="day" tick={{ ...chartTickStyle, ...tickProps }} />
                            <YAxis tick={{ ...chartTickStyle, ...tickProps }} />
                            <Tooltip contentStyle={tooltipContentStyle} cursor={tooltipCursor} />
                            <Line
                                type="monotone"
                                dataKey="hours"
                                stroke={current?.brand?.secondary ?? '#FF9600'}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </View>

                {/* Billable vs Non-Billable */}
                <View bg="fg" className="p-4">
                    <Text className="mb-4 font-semibold">Billable vs Non-Billable</Text>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart style={{ fontSize: ".9vw" }} data={billableData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" tick={{ ...chartTickStyle, ...tickProps }} />
                            <YAxis tick={{ ...chartTickStyle, ...tickProps }} />
                            <Tooltip
                                content={(props) => <BillableTooltip {...props} contentStyle={tooltipContentStyle} />}
                                contentStyle={tooltipContentStyle}
                                cursor={tooltipCursor}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, color: dark }} />

                            <Bar
                                dataKey="billable"
                                fill={chartPrimary}
                                radius={[4, 4, 0, 0]}
                                activeBar={{ opacity: 0.9, stroke: chartSecondary, strokeWidth: 1 }}
                            />
                            <Bar
                                dataKey="nonBillable"
                                fill={nonBillableFill}
                                radius={[4, 4, 0, 0]}
                                activeBar={{ opacity: 0.9, stroke: chartPrimary, strokeWidth: 1 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </View>

            </div>

            <LogTimeModal open={logTimeOpen} onClose={() => setLogTimeOpen(false)} />
        </>
    )
}

export default Consultant