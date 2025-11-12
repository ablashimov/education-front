import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamResults } from './ExamResults';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedExam } from '@/services/exams';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, FileText, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { BackendExamAssignment } from '@/types/backend';

interface ExamDetailsProps {
  groupId: number;
  assignedExamId: number;
  groupName: string;
  onBack: () => void;
}

export function ExamDetails({ groupId, assignedExamId, groupName, onBack }: ExamDetailsProps) {
  const [activeTab, setActiveTab] = useState('results');
  
  const {
    data: assignment = {} as BackendExamAssignment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['group', groupId, 'assigned-exams', assignedExamId],
    queryFn: () => fetchAssignedExam(groupId, assignedExamId),
    enabled: Number.isFinite(groupId) && Number.isFinite(assignedExamId),
  });

  // Log the data when it's loaded
  useEffect(() => {
    if (assignment) {
      console.log('Fetched exam assignment:', assignment);
    }
  }, [assignment]);

  const exam = useMemo(() => assignment?.exam ?? null, [assignment]);
  const passingScore = useMemo(() => {
    try {
      if (!exam?.config) return null;
      
      // Handle both string and object config
      const config = typeof exam.config === 'string' 
        ? JSON.parse(exam.config) 
        : exam.config;
      
      if (typeof config !== 'object' || config === null) return null;
      
      const candidate = 'passing_score' in config ? config.passing_score : 
                      'passingScore' in config ? config.passingScore : null;
      
      if (typeof candidate === 'number') return candidate;
      if (typeof candidate === 'string') {
        const numeric = Number(candidate);
        return Number.isFinite(numeric) ? numeric : null;
      }
      return null;
    } catch (e) {
      console.error('Error parsing passing score:', e);
      return null;
    }
  }, [exam]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Деталі екзамену</h2>
          <p className="text-muted-foreground">Група: {groupName}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списку
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="exam">Екзамен</TabsTrigger>
          <TabsTrigger value="results">Результати</TabsTrigger>
        </TabsList>

        <TabsContent value="exam" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Не вдалося завантажити інформацію про екзамен. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
              </p>
            </div>
          ) : exam ? (
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{exam.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{groupName}</p>
                    </div>
                  </div>
                  {exam.description && <p className="text-gray-600">{exam.description}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Початок</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {assignment?.start_at 
                            ? format(new Date(assignment.start_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) 
                            : 'Не вказано'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Закінчення</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {assignment?.end_at 
                            ? format(new Date(assignment.end_at), 'dd.MM.yyyy, HH:mm', { locale: uk }) 
                            : 'Не вказано'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Тривалість</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{exam.time_limit ? `${exam.time_limit} хвилин` : 'Необмежено'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Дозволено спроб: {assignment?.attempts_allowed ?? 'Необмежено'}
                    </Badge>
                    {passingScore !== null && (
                      <Badge variant="outline">
                        Прохідний бал: {passingScore}%
                      </Badge>
                    )}
                    {assignment?.is_control && (
                      <Badge variant="destructive">Контрольний екзамен</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-700">Інформація про екзамен недоступна</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="pt-4">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Test button clicked');
                console.log('Group ID:', groupId);
                console.log('Assigned Exam ID:', assignedExamId);
              }}
            >
              Тестовий запит
            </Button>
          </div>
          <ExamResults 
            groupId={groupId} 
            assignedExamId={assignedExamId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
