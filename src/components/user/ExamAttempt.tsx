import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { fetchExamInstance, submitExamAttempt } from '@/services/exams';
import { ExamResultView } from './ExamResultView';

interface Answer {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface Question {
  id: string;
  questionNumber: number;
  text: string;
  answers: Answer[];
  type: string;
  selectedValue?: string | string[];
  correctAnswerId?: string;
}

interface ExamAttemptProps {
   examInstanceId: number;
   onComplete: () => void;
}

export function ExamAttempt({ examInstanceId, onComplete }: ExamAttemptProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

   const {
     data: examInstance,
     isLoading,
     isError,
     error,
     refetch,
   } = useQuery({
     queryKey: ['exam-instance', examInstanceId],
     queryFn: () => fetchExamInstance(examInstanceId),
     enabled: !!examInstanceId,
   });

   // Get attemptId from the instance
   const finalAttemptId = (examInstance as any)?.attempt?.id ? String((examInstance as any).attempt.id) : undefined;

  // Перевіряємо, чи є відповіді в спробі (означає, що це завершена спроба)
  const hasAnswers = !!(examInstance as any)?.attempt?.answers?.length;
  const isCompletedAttempt = hasAnswers && !!(examInstance as any)?.attempt?.submitted_at;

  // Calculate elapsed time from started_at
  useEffect(() => {
    if (examInstance && (examInstance as any)?.attempt?.started_at && !isCompletedAttempt) {
      const startedAt = new Date((examInstance as any).attempt.started_at);
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [examInstance, isCompletedAttempt]);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});

  const questions = useMemo<Question[]>(() => {
    if (!examInstance?.questions) return [];








      // Shuffle questions if randomize_questions is enabled
      let shuffledQuestions = [...examInstance.questions];
      if ((examInstance as any).exam?.config?.randomize_questions) {
        shuffledQuestions = shuffledQuestions.sort(() => Math.random() - 0.5);
      }

      return shuffledQuestions.map((question, index) => {
        const questionId = question.id.toString();

        // Shuffle answers for each question
        let shuffledAnswers = question.choices ? Object.entries(question.choices).map(([key, choice]) => ({
          id: (choice as any).id,
          text: (choice as any).text,
          isCorrect: (choice as any).scoring === 1,
        })) : [];

        // Always shuffle answers for randomization
        shuffledAnswers = shuffledAnswers.sort(() => Math.random() - 0.5);

        return {
          id: questionId,
          questionNumber: index + 1,
          text: question.text,
          type: question.question_type?.slug || 'odinokij_vybir',
          answers: shuffledAnswers,
          selectedValue: selectedAnswers[questionId],
          correctAnswerId: undefined,
        };
      });
  }, [examInstance, selectedAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => {
    if (q.type === 'vybir_poslidovnosti') {
      // For sequence questions, require all answers to be selected
      return (q.selectedValue as string[])?.length === q.answers.length;
    }
    return q.selectedValue;
  }).length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} год ${minutes} хв ${secs} сек`;
    }
    if (minutes > 0) {
      return `${minutes} хв ${secs} сек`;
    }
    return `${secs} сек`;
  };

  const handleAnswerSelect = (value: string | string[]) => {
    if (!currentQuestion) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Check if current question is answered (for sequence questions, all answers must be selected)
      const currentQuestion = questions[currentQuestionIndex];
      const isAnswered = currentQuestion?.type === 'vybir_poslidovnosti'
        ? (currentQuestion.selectedValue as string[])?.length === currentQuestion.answers.length
        : !!currentQuestion?.selectedValue;

      if (!isAnswered) {
        return; // Don't proceed if current question is not fully answered
      }

      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!finalAttemptId) {
      return;
    }

    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, value]) => {
        const question = questions.find(q => q.id === questionId);
        if (question?.type === 'napisati_vidpovid') {
          return {
            question_id: parseInt(questionId),
            text: value as string
          };
        } else {
          return {
            question_id: parseInt(questionId),
            choice_ids: Array.isArray(value) ? value.map(v => parseInt(v)) : [parseInt(value as string)]
          };
        }
      });

      await submitExamAttempt(examInstance!.id, parseInt(finalAttemptId), { answers });
      // Оновлюємо дані після відправки відповідей
      await refetch();
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      // Handle error - maybe show a toast or alert
    }
  };

  const calculateResults = () => {
    // Якщо є відповіді з API (після submit), використовуємо їх для підрахунку
    if (isSubmitted && (examInstance as any)?.attempt?.answers) {
      const answers = (examInstance as any).attempt.answers;
      const correct = answers.filter((answer: any) => answer.is_correct).length;
      const total = answers.length;
      const percentage = Math.round((correct / total) * 100);
      return { correct, total, percentage };
    }

    // Для нових спроб рахуємо на основі відповідей користувача
    const correct = questions.filter(q => q.selectedValue === q.correctAnswerId).length;
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
              <CardTitle>Завантаження екзамену...</CardTitle>
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
            Не вдалося завантажити екзамен. {error instanceof Error ? error.message : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (isCompletedAttempt) {
    // Якщо це завершена спроба з відповідями, перенаправляємо на ExamResultView
    return <ExamResultView attemptId={finalAttemptId!} examInstanceId={examInstanceId!} onComplete={onComplete} />;
  }

  if (isSubmitted) {
    const results = calculateResults();
    const isPassed = results.percentage >= 75;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isPassed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isPassed ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <CardTitle className="text-2xl mb-2">
                {isPassed ? 'Екзамен здано!' : 'Екзамен не здано'}
              </CardTitle>
              <p className="text-gray-600">
                {isPassed
                  ? 'Вітаємо! Ви успішно склали екзамен.'
                  : 'На жаль, ви не набрали достатньо балів. Спробуйте ще раз.'}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{results.correct}/{results.total}</div>
                <div className="text-sm text-gray-600">Правильних відповідей</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl mb-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {results.percentage}%
                </div>
                <div className="text-sm text-gray-600">Результат</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">75%</div>
                <div className="text-sm text-gray-600">Прохідний бал</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onComplete} className="flex-1">
                Повернутися до екзамену
              </Button>
              <Button onClick={async () => {
                // Після здачі екзамену оновлюємо дані та переходимо до перегляду результатів
                await refetch(); // Оновлюємо дані екзамену, щоб отримати answers
                setIsSubmitted(false); // Знімаємо стан submitted, щоб відобразити ExamResultView
              }} className="flex-1">
                Переглянути результати
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Питання не знайдені або ще завантажуються.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Практичний іспит - Спроба 2</CardTitle>
            <div className="flex items-center gap-2 text-red-600">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatElapsedTime(elapsedTime)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Питання {currentQuestionIndex + 1} з {totalQuestions}</span>
              <span>{answeredQuestions} відповіли</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Питання {currentQuestion.questionNumber}
          </CardTitle>
          <p className="text-lg mt-2">{currentQuestion.text}</p>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'napisati_vidpovid' ? (
            <Textarea
              placeholder="Введіть вашу відповідь..."
              value={(currentQuestion.selectedValue as string) || ''}
              onChange={(e) => handleAnswerSelect(e.target.value)}
              className="min-h-[120px]"
            />
          ) : currentQuestion.type === 'mnozhinnyj_vybir' ? (
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const selectedValues = currentQuestion.selectedValue as string[] || [];
                const isSelected = selectedValues.includes(answer.id);
                return (
                  <div
                    key={answer.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter(v => v !== answer.id)
                        : [...selectedValues, answer.id];
                      handleAnswerSelect(newValues);
                    }}
                  >
                    <Checkbox checked={isSelected} />
                    <Label className="flex-1 cursor-pointer">
                      {answer.text}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : currentQuestion.type === 'vybir_poslidovnosti' ? (
            <div className="space-y-3">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Оберіть варіанти в правильному порядку:</p>
                <div className="flex flex-wrap gap-2">
                  {(currentQuestion.selectedValue as string[] || []).map((answerId, index) => {
                    const answer = currentQuestion.answers.find(a => a.id === answerId);
                    return (
                      <div key={answerId} className="flex items-center gap-2 bg-indigo-100 px-3 py-1 rounded-lg">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="text-sm">{answer?.text}</span>
                        <button
                          onClick={() => {
                            const newValues = (currentQuestion.selectedValue as string[]).filter(v => v !== answerId);
                            handleAnswerSelect(newValues);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                {currentQuestion.answers
                  .filter(answer => !(currentQuestion.selectedValue as string[] || []).includes(answer.id))
                  .map((answer) => (
                    <button
                      key={answer.id}
                      onClick={() => {
                        const newValues = [...(currentQuestion.selectedValue as string[] || []), answer.id];
                        handleAnswerSelect(newValues);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      {answer.text}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <RadioGroup
              value={currentQuestion.selectedValue as string}
              onValueChange={(value) => handleAnswerSelect(value)}
            >
              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      currentQuestion.selectedValue === answer.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(answer.id)}
                  >
                    <RadioGroupItem value={answer.id} id={answer.id} />
                    <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                      {answer.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {answeredQuestions < totalQuestions && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ви відповіли на {answeredQuestions} з {totalQuestions} питань. Переконайтеся, що відповіли на всі питання перед завершенням.
            {currentQuestion?.type === 'vybir_poslidovnosti' && (currentQuestion.selectedValue as string[])?.length !== currentQuestion.answers.length && (
              <div className="mt-2 text-sm">
                Для питань типу "вибір послідовності" потрібно вибрати всі варіанти відповідей.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Попереднє питання
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                currentQuestion?.type === 'vybir_poslidovnosti'
                  ? (currentQuestion.selectedValue as string[])?.length !== currentQuestion.answers.length
                  : !currentQuestion?.selectedValue
              }
            >
              Наступне питання
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={answeredQuestions < totalQuestions}>
              Завершити екзамен
            </Button>
          )}
        </div>
      </div>

      {/* Навігація по питаннях */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Навігація по питаннях</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  index === currentQuestionIndex
                    ? 'border-indigo-500 bg-indigo-50'
                    : question.type === 'vybir_poslidovnosti'
                    ? (question.selectedValue as string[])?.length === question.answers.length
                      ? 'border-green-300 bg-green-50'
                      : 'border-yellow-300 bg-yellow-50'
                    : question.selectedValue
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div>{question.questionNumber}</div>
                  {question.type === 'vybir_poslidovnosti' ? (
                    (question.selectedValue as string[])?.length === question.answers.length ? (
                      <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-600" />
                    ) : (question.selectedValue as string[])?.length > 0 ? (
                      <div className="w-4 h-4 mx-auto mt-1 text-yellow-600 text-xs font-bold">
                        {(question.selectedValue as string[]).length}/{question.answers.length}
                      </div>
                    ) : null
                  ) : question.selectedValue && (
                    <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
