import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { BookOpen, Calendar, FileText, Play } from 'lucide-react';

interface Training {
  id: string;
  courseName: string;
  description: string;
  progress: number;
  status: 'in-progress' | 'completed' | 'not-started';
  startDate: string;
  endDate: string;
  materials: number;
  completedMaterials: number;
}

export function MyTrainings() {
  const [trainings] = useState<Training[]>([
    {
      id: '1',
      courseName: 'Керівництво та лідерство',
      description: 'Розвиток навичок керівника та лідера команди',
      progress: 65,
      status: 'in-progress',
      startDate: '2024-10-01',
      endDate: '2024-11-30',
      materials: 12,
      completedMaterials: 8
    },
    {
      id: '2',
      courseName: 'Управління проектами',
      description: 'Основи управління проектами за методологією Agile',
      progress: 100,
      status: 'completed',
      startDate: '2024-08-01',
      endDate: '2024-09-30',
      materials: 10,
      completedMaterials: 10
    },
    {
      id: '3',
      courseName: 'Ефективна комунікація',
      description: 'Розвиток навичок ділового спілкування',
      progress: 0,
      status: 'not-started',
      startDate: '2024-11-01',
      endDate: '2024-12-15',
      materials: 8,
      completedMaterials: 0
    }
  ]);

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <Badge variant="default">Завершено</Badge>;
    }
    if (status === 'in-progress') {
      return <Badge variant="secondary">В процесі</Badge>;
    }
    return <Badge variant="outline">Не розпочато</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Моє навчання</CardTitle>
          <CardDescription>
            Курси, на які ви зараховані як адміністратор
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {trainings.map((training) => (
              <Card key={training.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    {getStatusBadge(training.status)}
                  </div>
                  <CardTitle className="mt-2">{training.courseName}</CardTitle>
                  <CardDescription>{training.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Прогрес</span>
                      <span>{training.progress}%</span>
                    </div>
                    <Progress value={training.progress} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{training.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{training.completedMaterials}/{training.materials} матеріалів</span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    {training.status === 'not-started' ? 'Розпочати' : 'Продовжити'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
