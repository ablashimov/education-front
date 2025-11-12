import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Calendar, Clock, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { fetchAssignedExam, createExamInstance, fetchAllAssignedExams } from '@/services/exams'

interface ExamViewProps {
    groupId: number;
    assignmentId: number;
    groupName?: string;
    onStartAttempt: (examInstanceId: number) => void;
    onViewResults: () => void;
}

export function ExamView ({ groupId, assignmentId, groupName, onStartAttempt, onViewResults }: ExamViewProps) {
    // First, get the assignment to find the correct groupId
    const {
        data: assignment,
        isLoading: isAssignmentLoading,
        isError: isAssignmentError,
        error: assignmentError,
    } = useQuery({
        queryKey: ['assigned-exam', assignmentId],
        queryFn: async () => {
            // Try to get assignment from all exams first to find the correct groupId
            const allAssignments = await fetchAllAssignedExams()
            const foundAssignment = allAssignments.find(a => a.id === assignmentId)
            if (!foundAssignment) {
                throw new Error('Assignment not found')
            }
            return foundAssignment
        },
        enabled: Number.isFinite(assignmentId),
    })

    // Then fetch the detailed assignment data using the correct groupId
    const {
        data: detailedAssignment,
        isLoading: isDetailLoading,
        isError: isDetailError,
        error: detailError,
        refetch,
    } = useQuery({
        queryKey: ['group', assignment?.group_id, 'assigned-exams', assignmentId],
        queryFn: () => fetchAssignedExam(assignment!.group_id!, assignmentId),
        enabled: Number.isFinite(assignmentId) && !!assignment?.group_id,
    })

    const isLoading = isAssignmentLoading || isDetailLoading
    const isError = isAssignmentError || isDetailError
    const error = assignmentError || detailError
    const finalAssignment = detailedAssignment || assignment
    const startAttempt = useMutation({
        mutationFn: async () => {
            const correctGroupId = finalAssignment?.group_id ?? groupId
            const instance = await createExamInstance(correctGroupId, assignmentId)
            return { instance }
        },
        onSuccess: ({ instance }) => {
            onStartAttempt(instance.id)
            void refetch()
        },
    })

    const exam = useMemo(() => finalAssignment?.exam ?? null, [finalAssignment])
    const instances = useMemo(() => finalAssignment?.instances ?? [], [finalAssignment])
    const passingScore = useMemo(() => {
        if (!exam?.config || typeof exam.config !== 'object') {
            return null
        }
        const config = exam.config as Record<string, unknown>
        const candidate = config.passing_score ?? config.passingScore
        if (typeof candidate === 'number') {
            return candidate
        }
        const numeric = Number(candidate)
        return Number.isFinite(numeric) ? numeric : null
    }, [exam])

    const canShowStartButton = useMemo(() => {
        const slug = finalAssignment?.result?.slug
        const attemptsAllowed = finalAssignment?.attempts_allowed ?? 0
        if (slug === 'assigned' && instances.length === 0) return true
        if (slug === 'in_work' && instances.length < attemptsAllowed) return true
        if (slug === 'checking') return false // Не позволять новую попытку при проверке
        return false
    }, [finalAssignment, instances])

    const isDisabled = useMemo(() => {
        if (startAttempt.isPending) return true
        const attemptsAllowed = finalAssignment?.attempts_allowed
        const used = instances.length
        const attemptsExhausted = attemptsAllowed != null ? used >= attemptsAllowed : false
        const now = new Date()
        const startsAt = finalAssignment?.start_at ? new Date(finalAssignment.start_at) : null
        const endsAt = finalAssignment?.end_at ? new Date(finalAssignment.end_at) : null
        const beforeWindow = startsAt ? now < startsAt : false
        const afterWindow = endsAt ? now > endsAt : false
        if (attemptsExhausted || beforeWindow || afterWindow) return true
        const slug = finalAssignment?.result?.slug
        if (slug === 'checking') return true // Блокировать при проверке
        if (slug === 'in_work' && instances.length > 0) {
            const lastInstance = instances[instances.length - 1]
            if (lastInstance.attempt?.answers?.length === 0) return true
        }
        return false
    }, [startAttempt.isPending, finalAssignment, instances])

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded"/>
                            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"/>
                        </div>
                    ) : exam ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white"/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-2xl">{exam.title}</CardTitle>
                                    <CardDescription>{groupName ?? ''}</CardDescription>
                                </div>
                            </div>
                            {exam.description && <p className="text-gray-600">{exam.description}</p>}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span>{finalAssignment?.start_at ? new Date(finalAssignment.start_at).toLocaleString() : '—'}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Доступний до</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-4 h-4 text-gray-500"/>
                                        <span>{finalAssignment?.end_at ? new Date(finalAssignment.end_at).toLocaleString() : '—'}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Тривалість</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-4 h-4 text-gray-500"/>
                                        <span>{exam.time_limit ? `${exam.time_limit} хвилин` : '—'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="secondary">Дозволено спроб: {finalAssignment?.attempts_allowed ?? '—'}</Badge>
                                {passingScore !== null && <Badge>Прохідний бал: {passingScore}%</Badge>}
                                {finalAssignment?.is_control && <Badge variant="destructive">Контрольний</Badge>}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">Дані екзамену недоступні.</div>
                    )}
                </CardHeader>
            </Card>

            {isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertDescription>
                        Не вдалося завантажити інформацію про екзамен. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {canShowStartButton ?
                            (
                                <Button onClick={() => startAttempt.mutate()} disabled={isDisabled}>
                                    {startAttempt.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Розпочати спробу
                                </Button>
                            )
                            : (
                                finalAssignment?.result?.slug === 'checking' ? (
                                    <div className="text-sm text-gray-500 whitespace-nowrap">
                                        Екзамен на перевірці. Результати будуть доступні після завершення перевірки.
                                    </div>
                                ) : instances.some((instance: any) => {
                                    const latestAttempt = instance.attempt
                                    return latestAttempt && !latestAttempt.submitted_at && latestAttempt.elapsed_seconds === null
                                }) ? (
                                    <div className="text-sm text-gray-500">
                                        У вас є незавершена спроба. Продовжте її нижче.
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">
                                        Усі спроби завершені. Перегляньте результати нижче.
                                    </div>
                                )
                            )}
                        <div className="text-sm text-gray-500">
                            {instances.length > 0 && `Використано спроб: ${instances.length}`}
                        </div>
                    </div>

                    {instances.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={onViewResults}
                            className="w-auto"
                        >
                            Переглянути результати
                        </Button>
                    )}
                </div>

                <h3 className="text-xl font-semibold">Історія спроб</h3>
                {instances.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4"/>
                        <AlertDescription>Спроб ще не було.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        {instances.map((instance: any) => {
                            const latestAttempt = instance.attempt
                            const canContinue = latestAttempt && !latestAttempt.submitted_at && latestAttempt.elapsed_seconds === null
                            const isCompleted = latestAttempt && latestAttempt.submitted_at
                            const buttonText = canContinue ? 'Продовжити' : (isCompleted ? 'Переглянути результати' : 'Переглянути')
                            const buttonAction = () => {
                                console.log('Starting attempt with:', { instanceId: instance.id, attemptId: latestAttempt?.id })
                                // Always pass instance.id as examInstanceId
                                onStartAttempt(instance.id)
                            }

                            return (
                                <Card key={instance.id}>
                                    <CardContent className="p-6 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-medium">Спроба #{instance.attempt_number ?? instance.id}</h4>
                                                <div className="text-sm text-gray-500">
                                                    Початок: {instance.start_at ? new Date(instance.start_at).toLocaleString() : '—'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Завершення: {instance.end_at ? new Date(instance.end_at).toLocaleString() : '—'}
                                                </div>
                                                {latestAttempt && (
                                                    <div className="text-sm text-gray-500">
                                                        Статус: {latestAttempt.submitted_at ? 'Завершено' : 'В процесі'}
                                                        {isCompleted && latestAttempt.score !== null && (
                                                            <span className="ml-2">
                                Результат: {latestAttempt.score} балів
                              </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="outline" onClick={buttonAction}>
                                                {buttonText}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
