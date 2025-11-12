import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom-v5-compat';

interface ExamCardProps {
  exam: {
    id: number;
    title: string;
    description?: string;
    duration: number;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
  };
  groupId: number;
}

export function ExamCard({ exam, groupId }: ExamCardProps) {
  const navigate = useNavigate();
  
  const handleStartExam = () => {
    navigate(`/groups/${groupId}/exams/${exam.id}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{exam.title}</CardTitle>
            {exam.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {exam.description}
              </p>
            )}
          </div>
          <Badge variant={exam.status === 'active' ? 'default' : 'secondary'}>
            {exam.status === 'active' ? 'Активний' : 'Неактивний'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              <span>{exam.duration} хв</span>
            </div>
            {exam.start_date && exam.end_date && (
              <div className="flex items-center text-muted-foreground">
                <FileText className="w-4 h-4 mr-1" />
                <span>
                  {format(new Date(exam.start_date), 'dd.MM.yyyy HH:mm', {
                    locale: uk,
                  })}
                  {' - '}
                  {format(new Date(exam.end_date), 'dd.MM.yyyy HH:mm', {
                    locale: uk,
                  })}
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleStartExam}
            disabled={exam.status !== 'active'}
          >
            Почати екзамен
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
