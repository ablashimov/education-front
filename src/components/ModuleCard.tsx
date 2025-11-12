import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Progress } from '@/components/ui/progress';

import type { Module } from '@/services/courses';

interface ModuleCardProps {
  module: Module;
  groupId: number;
}

export function ModuleCard({ module, groupId }: ModuleCardProps) {
  const navigate = useNavigate();
  const progress = Math.round((module.completed_lessons / module.lessons_count) * 100) || 0;
  
  const handleOpenModule = () => {
    navigate(`/groups/${groupId}/modules/${module.id}`);
  };

  const isCompleted = progress === 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {module.order}. {module.title}
            </CardTitle>
            {module.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {module.description}
              </p>
            )}
          </div>
          <Badge variant={isCompleted ? 'default' : 'secondary'}>
            {isCompleted ? 'Завершено' : 'В процесі'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-1" />
              <span>
                {module.completed_lessons} з {module.lessons_count} занять
              </span>
            </div>
            {module.start_date && module.end_date && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                <span>
                  {format(new Date(module.start_date), 'dd.MM.yyyy', {
                    locale: uk,
                  })}{' '}
                  -{' '}
                  {format(new Date(module.end_date), 'dd.MM.yyyy', {
                    locale: uk,
                  })}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Прогрес</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <Button 
            onClick={handleOpenModule}
            variant="outline"
            className="w-full"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {isCompleted ? 'Переглянути матеріали' : 'Продовжити навчання'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
