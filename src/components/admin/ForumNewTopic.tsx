import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Send, Tag, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { forumService, Category } from '../../services/forumService';

interface ForumNewTopicProps {
    organizationId: string;
    currentUserId?: string;
    onBack: () => void;
    onSubmit: (topicId: string) => void;
}

const suggestedTags = [
    'екзамени',
    'налаштування',
    'користувачі',
    'імпорт',
    'звіти',
    'аналітика',
    'модулі',
    'групи',
    'мотивація',
    'активність',
    'помилка',
    'питання'
];

export function ForumNewTopic({ organizationId, currentUserId, onBack, onSubmit }: ForumNewTopicProps) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await forumService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast.error('Не вдалося завантажити категорії');
        }
    };

    const handleAddTag = (tag: string) => {
        const normalizedTag = tag.toLowerCase().trim();
        if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 5) {
            setTags([...tags, normalizedTag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        // Validation
        const newErrors: Record<string, string> = {};

        if (!title.trim()) {
            newErrors.title = 'Заголовок є обов\'язковим';
        } else if (title.length < 10) {
            newErrors.title = 'Заголовок має містити принаймні 10 символів';
        }

        if (!category) {
            newErrors.category = 'Оберіть категорію';
        }

        if (!content.trim()) {
            newErrors.content = 'Опис є обов\'язковим';
        } else if (content.length < 20) {
            newErrors.content = 'Опис має містити принаймні 20 символів';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const newTopic = await forumService.createTopic({
                title,
                content,
                category,
                tags
            });
            toast.success('Тема успішно створена!', { duration: 4000 });
            onSubmit(String(newTopic.id));
        } catch (error: any) {
            console.error('Failed to create topic:', error);

            // Extract backend validation errors
            if (error.validationErrors) {
                const backendErrors: Record<string, string> = {};
                for (const [field, messages] of Object.entries(error.validationErrors)) {
                    if (Array.isArray(messages) && messages.length > 0) {
                        backendErrors[field] = messages[0];
                    }
                }
                setErrors(backendErrors);
                toast.error('Перевірте помилки валідації', { duration: 4000 });
            } else {
                toast.error(error.message || 'Не вдалося створити тему', { duration: 4000 });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад до форуму
                </Button>

                <h1 className="mb-2">Створити нову тему</h1>
                <p className="text-gray-600">
                    Поділіться питанням, ідеєю або розпочніть обговорення з іншими адміністраторами
                </p>
            </div>

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Перш ніж створювати нову тему, перевірте чи не обговорювалась вона раніше.
                    Використовуйте пошук для перевірки існуючих тем.
                </AlertDescription>
            </Alert>

            {/* Form */}
            <div className="grid gap-6">
                {/* Title */}
                <Card>
                    <CardHeader>
                        <CardTitle>Заголовок</CardTitle>
                        <CardDescription>
                            Напишіть чіткий та зрозумілий заголовок, який описує вашу тему
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="Наприклад: Як налаштувати автоматичне нагадування для студентів?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={errors.title ? 'border-red-500' : ''}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-2">{errors.title}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            {title.length} символів (мінімум 10)
                        </p>
                    </CardContent>
                </Card>

                {/* Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>Категорія</CardTitle>
                        <CardDescription>
                            Оберіть найбільш підходящу категорію для вашої теми
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Оберіть категорію..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        <div>
                                            <div>{cat.name}</div>
                                            <div className="text-xs text-gray-500">{cat.description}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-red-600 mt-2">{errors.category}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Опис</CardTitle>
                        <CardDescription>
                            Детально опишіть вашу тему. Чим більше деталей ви надасте, тим легше буде іншим вам допомогти
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Розкажіть докладніше про вашу тему...&#10;&#10;Ви можете включити:&#10;- Детальний опис проблеми або питання&#10;- Кроки які ви вже виконали&#10;- Що ви очікуєте отримати&#10;- Додаткову інформацію яка може бути корисною"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                            className={`resize-none ${errors.content ? 'border-red-500' : ''}`}
                        />
                        {errors.content && (
                            <p className="text-sm text-red-600 mt-2">{errors.content}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            {content.length} символів (мінімум 20)
                        </p>
                    </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                    <CardHeader>
                        <CardTitle>Теги</CardTitle>
                        <CardDescription>
                            Додайте до 5 тегів для покращення пошуку вашої теми (необов'язково)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Current tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="pr-1">
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Tag input */}
                        {tags.length < 5 && (
                            <div>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            placeholder="Введіть тег та натисніть Enter"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTag(tagInput);
                                                }
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleAddTag(tagInput)}
                                        disabled={!tagInput.trim()}
                                    >
                                        Додати
                                    </Button>
                                </div>

                                {/* Suggested tags */}
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">Популярні теги:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedTags
                                            .filter(tag => !tags.includes(tag))
                                            .slice(0, 10)
                                            .map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-gray-100"
                                                    onClick={() => handleAddTag(tag)}
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tags.length >= 5 && (
                            <p className="text-sm text-gray-500">
                                Досягнуто максимальної кількості тегів (5)
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Guidelines */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Рекомендації</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Перевірте орфографію та граматику перед публікацією</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Будьте конкретними та надавайте достатньо деталей</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Використовуйте ввічливий та професійний тон</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Якщо задаєте питання, опишіть що ви вже спробували</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Пам'ятайте позначити найкращу відповідь як рішення</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
                        Скасувати
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Публікується...' : 'Опублікувати тему'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
