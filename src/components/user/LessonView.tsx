import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getGroupById, fetchGroupModule, fetchLesson } from '@/services/groups';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, FileText, Eye } from 'lucide-react';
import { SecureFileViewer } from '../common/SecureFileViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { BackendFile } from '@/types/backend';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

interface LessonViewProps {
  groupId: number;
  moduleId: number;
  lessonId: number;
  onNavigateToGroups?: () => void;
  onNavigateToGroup?: () => void;
  onNavigateToModule?: () => void;
}

export function LessonView({
  groupId,
  moduleId,
  lessonId,
  onNavigateToGroups,
  onNavigateToGroup,
  onNavigateToModule = () => {
    console.log('Navigate to module', moduleId);
  },
}: LessonViewProps) {
  const {
    data: group,
    isLoading: isGroupLoading,
    isError: isGroupError,
    error: groupError,
  } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroupById(groupId),
    enabled: Number.isFinite(groupId),
  });

  const {
    data: module,
    isLoading: isModuleLoading,
    isError: isModuleError,
    error: moduleError,
  } = useQuery({
    queryKey: ['group', groupId, 'modules', moduleId],
    queryFn: () => fetchGroupModule(groupId, moduleId),
    enabled: Number.isFinite(groupId) && Number.isFinite(moduleId),
  });

  const {
    data: lesson,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['group', groupId, 'modules', moduleId, 'lessons', lessonId],
    queryFn: () => fetchLesson(groupId, moduleId, lessonId),
    enabled: Number.isFinite(groupId) && Number.isFinite(moduleId) && Number.isFinite(lessonId),
  });

  const files = useMemo(() => lesson?.files ?? [], [lesson]);
  const [selectedFile, setSelectedFile] = useState<BackendFile | null>(null);

  const handleViewFile = (file: BackendFile) => {
    setSelectedFile(file);
  };

  const isViewable = (mimetype: string) => {
    return mimetype === 'application/pdf' || mimetype.startsWith('video/');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {onNavigateToGroups ? (
              <BreadcrumbLink
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateToGroups?.();
                }}
              >
                Мої групи навчання
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Мої групи навчання</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {onNavigateToGroup ? (
              <BreadcrumbLink
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateToGroup?.();
                }}
              >
                {group?.name ?? `Група #${groupId}`}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{group?.name ?? `Група #${groupId}`}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {onNavigateToModule ? (
              <BreadcrumbLink
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onNavigateToModule?.();
                }}
              >
                {module?.title ?? `Модуль #${moduleId}`}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{module?.title ?? `Модуль #${moduleId}`}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson?.title ?? 'Урок'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : lesson ? (
            <div>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.material && (
                <p className="text-sm text-gray-600 mt-2">
                  {lesson.material.slice(0, 160)}{lesson.material.length > 160 ? '…' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Дані уроку недоступні.</div>
          )}
        </CardHeader>
      </Card>

      {(isError || isGroupError || isModuleError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не вдалося завантажити урок.{' '}
            {error instanceof Error
              ? error.message
              : groupError instanceof Error
                ? groupError.message
                : moduleError instanceof Error
                  ? moduleError.message
                  : 'Спробуйте пізніше.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Матеріали уроку</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || isModuleLoading || isGroupLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : lesson?.material ? (
            <div className="prose max-w-none whitespace-pre-wrap">
              {lesson.material}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Матеріали відсутні.</p>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Прикріплені файли ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {file.mimetype}
                      </div>
                    </div>
                  </div>

                  {isViewable(file.mimetype) ? (
                    <button
                      onClick={() => handleViewFile(file)}
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Переглянути
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400 italic">
                      Перегляд недоступний
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="!fixed !inset-0 !max-w-none !w-full !h-full !max-h-none !translate-x-0 !translate-y-0 !rounded-none !border-none p-0 gap-0 flex flex-col bg-gray-50 overflow-hidden z-50">
          <DialogHeader className="p-4 border-b bg-white shrink-0">
            <DialogTitle>{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="w-full relative" style={{ height: 'calc(100vh - 65px)' }}>
              <SecureFileViewer
                lessonId={lessonId}
                fileId={selectedFile.id}
                fileType={selectedFile.mimetype === 'application/pdf' ? 'pdf' : 'video'}
                fileName={selectedFile.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
