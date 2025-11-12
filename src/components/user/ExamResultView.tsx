import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { fetchExamInstance } from '@/services/exams';

interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean | null;
}

interface Question {
  id: string;
  questionNumber: number;
  text: string;
  answers: Answer[];
  selectedAnswerId?: string;
  correctAnswerId?: string;
  isCorrect?: boolean;
}

interface ExamResultViewProps {
  attemptId: string;
  examInstanceId: number;
  onComplete: () => void;
}

export function ExamResultView({ attemptId, examInstanceId, onComplete }: ExamResultViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const {
    data: examInstance,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['exam-instance', examInstanceId],
    queryFn: () => fetchExamInstance(examInstanceId),
    enabled: !!examInstanceId,
  });
    console.log(examInstanceId, attemptId)
  const questions = useMemo<Question[]>(() => {
    if (!examInstance?.questions) return [];

    return examInstance.questions.map((question, index) => {
      // Знаходимо відповідь користувача для цього питання
      const userAnswer = (examInstance as any)?.attempt?.answers?.find((a: any) => a.question_id === question.id);

      // Отримуємо всі правильні відповіді з choices
      const correctAnswerIds: string[] = [];
      if (userAnswer?.question?.choices) {
        userAnswer.question.choices.forEach((choice: any) => {
          if (choice.correct) {
            correctAnswerIds.push(choice.id.toString());
          }
        });
      }

      // Отримуємо вибрані користувачем відповіді
      const selectedAnswerIds: string[] = [];
      if (userAnswer?.user_choices) {
        userAnswer.user_choices.forEach((choice: any) => {
          selectedAnswerIds.push(choice.question_choice_id.toString());
        });
      }

      return {
        id: question.id.toString(),
        questionNumber: index + 1,
        text: question.text,
        answers: userAnswer?.question?.choices ? userAnswer.question.choices.map((choice: any) => ({
          id: choice.id.toString(),
          text: choice.text,
          isCorrect: choice.correct,
        })) : [],
        selectedAnswerId: selectedAnswerIds.length > 0 ? selectedAnswerIds.join(',') : undefined,
        correctAnswerId: correctAnswerIds.length > 0 ? correctAnswerIds.join(',') : undefined,
        isCorrect: userAnswer?.is_correct ?? null,
      };
    });
  }, [examInstance]);

  const totalQuestions = questions.length;

  const calculateResults = () => {
    const correct = questions.filter(q => q.isCorrect === true).length;
    const percentage = Math.round((correct / totalQuestions) * 100);
    return { correct, total: totalQuestions, percentage };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <CardTitle>Завантаження результатів...</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити результати. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const results = calculateResults();
  const hasCheckingAnswers = questions.some(q => q.isCorrect === null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={onComplete} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Результати екзамену</h1>
      </div>

      {hasCheckingAnswers && (
        <Card>
          <CardHeader>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-100">
                <AlertCircle className="w-10 h-10 text-gray-600" />
              </div>
              <CardTitle className="text-2xl mb-2">Екзамен на перевірці</CardTitle>
              <p className="text-gray-600">
                Ваші відповіді перевіряються. Результати будуть доступні після завершення перевірки.
              </p>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">{results.correct}/{results.total}</div>
              <div className="text-sm text-gray-600">Правильних відповідей</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl mb-1 ${hasCheckingAnswers ? 'text-gray-600' : ''}`}>
                {results.percentage}%
              </div>
              <div className="text-sm text-gray-600">Результат</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">75%</div>
              <div className="text-sm text-gray-600">Прохідний бал</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальний перегляд відповідей */}
      <div className="space-y-4">
        <h3 className="text-xl">Детальний перегляд відповідей</h3>
        {questions.map((question) => {
          const isCorrect = question.isCorrect;
          const isChecking = question.isCorrect === null;
          const selectedIds = question.selectedAnswerId?.split(',') || [];
          const correctIds = question.correctAnswerId?.split(',') || [];

          return (
            <Card key={question.id} className={
              isChecking ? 'border-gray-200 bg-gray-50/50' :
              isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
            }>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isChecking ? 'bg-gray-100 text-gray-600' :
                    isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {isChecking ? <AlertCircle className="w-5 h-5" /> :
                     isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Питання {question.questionNumber}
                    </CardTitle>
                    <p>{question.text}</p>
                    {isChecking && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Відповідь на перевірці
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.answers.map((answer) => {
                    const isSelected = selectedIds.includes(answer.id);
                    const isCorrectAnswer = answer.isCorrect;

                    return (
                      <div
                        key={answer.id}
                        className={`p-3 rounded-lg border ${
                          isChecking ? 'bg-gray-50 border-gray-200' :
                          isCorrectAnswer ? 'bg-green-100 border-green-300' :
                          isSelected && !isCorrectAnswer ? 'bg-red-100 border-red-300' :
                          'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecking ? (
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                          ) : (
                            <>
                              {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                            </>
                          )}
                          <span className={isChecking ? 'text-gray-500' : ''}>{answer.text}</span>
                          {isSelected && (
                            <Badge variant="outline" className="ml-auto">Ваша відповідь</Badge>
                          )}
                          {isCorrectAnswer && !isChecking && (
                            <Badge variant="default" className="ml-auto bg-green-600">Правильна відповідь</Badge>
                          )}
                          {isChecking && (
                            <Badge variant="secondary" className="ml-auto">На перевірці</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
