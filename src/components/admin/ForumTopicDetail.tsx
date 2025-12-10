import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import {
    ArrowLeft,
    Clock,
    Eye,
    MessageCircle,
    ThumbsUp,
    CheckCircle2,
    Pin,
    MoreVertical,
    Send,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Alert, AlertDescription } from '../ui/alert';
import { forumService, Topic, Post } from '../../services/forumService';
import { toast } from 'sonner';

interface ForumTopicDetailProps {
    topicId: string;
    currentUserId?: string;
    onBack: () => void;
}

export function ForumTopicDetail({ topicId, currentUserId, onBack }: ForumTopicDetailProps) {
    const [topic, setTopic] = useState<Topic | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [newReply, setNewReply] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTopic();
    }, [topicId]);

    const loadTopic = async () => {
        setIsLoading(true);
        try {
            const data = await forumService.getTopic(topicId);
            setTopic(data.topic);
            setPosts(data.posts);
        } catch (error) {
            console.error('Failed to load topic:', error);
            toast.error('Не вдалося завантажити тему');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLikeTopic = async () => {
        if (!topic) return;
        try {
            const response = await forumService.like('topic', topic.id);
            setTopic(prev => prev ? ({
                ...prev,
                is_liked: response.liked,
                likes_count: response.likes_count
            }) : null);
        } catch (error) {
            toast.error('Не вдалося поставити лайк', { duration: 4000 });
        }
    };

    const handleLikeReply = async (postId: number) => {
        try {
            const response = await forumService.like('post', postId);
            setPosts(prev => prev.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        is_liked: response.liked,
                        likes_count: response.likes_count
                    };
                }
                return post;
            }));
        } catch (error) {
            toast.error('Не вдалося поставити лайк', { duration: 4000 });
        }
    };

    const handleSubmitReply = async () => {
        if (!newReply.trim() || !topic) return;

        setIsSubmitting(true);
        try {
            const newPost = await forumService.reply(String(topic.id), newReply);
            setPosts([...posts, newPost]);
            setNewReply('');
            toast.success('Відповідь додано', { duration: 4000 });
        } catch (error) {
            toast.error('Не вдалося додати відповідь', { duration: 4000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkAsSolution = async (postId: number) => {
        if (!topic) return;
        try {
            await forumService.resolve(String(topic.id), postId);

            setPosts(prev => prev.map(post => ({
                ...post,
                is_solution: post.id === postId
            })));

            setTopic(prev => prev ? ({
                ...prev,
                is_resolved: true
            }) : null);

            toast.success('Позначено як рішення', { duration: 4000 });
        } catch (error) {
            toast.error('Не вдалося позначити як рішення', { duration: 4000 });
        }
    };

    const getCategoryColor = (category: string) => {
        // This logic should ideally be shared or fetched from categories
        // For now, using a simple mapping or default
        return 'bg-gray-100 text-gray-700';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('uk-UA', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!topic) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Тему не знайдено</p>
                <Button onClick={onBack} className="mt-4">Назад до форуму</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад до форуму
                </Button>

                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {topic.is_pinned && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                    <Pin className="w-3 h-3 mr-1" />
                                    Закріплено
                                </Badge>
                            )}
                            <Badge className={topic.category.color}>
                                {topic.category.name}
                            </Badge>
                            {topic.is_resolved && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Вирішено
                                </Badge>
                            )}
                            {topic.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="outline">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        <h1 className="mb-3">{topic.title}</h1>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(topic.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{topic.views_count} переглядів</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{posts.length} відповідей</span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Pin className="w-4 h-4 mr-2" />
                                {topic.is_pinned ? 'Відкріпити тему' : 'Закріпити тему'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Позначити як вирішену
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Original Post */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <Avatar className="mt-1">
                            <AvatarFallback>{topic.user.name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{topic.user.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {topic.user.rank || 'Користувач'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(topic.created_at)}</p>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none mb-4">
                                <p className="whitespace-pre-wrap text-sm">{topic.content}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={topic.is_liked ? "default" : "outline"}
                                    size="sm"
                                    onClick={handleLikeTopic}
                                >
                                    <ThumbsUp className="w-4 h-4 mr-1" />
                                    {topic.likes_count}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Replies Section */}
            <div>
                <h2 className="mb-4">{posts.length} відповідей</h2>

                {topic.is_resolved && (
                    <Alert className="mb-4 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Це питання має прийняте рішення. Перегляньте відповіді з позначкою "Рішення".
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className={post.is_solution ? 'border-green-300 bg-green-50/30' : ''}>
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <Avatar className="mt-1">
                                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{post.user.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {post.user.rank || 'Користувач'}
                                                    </Badge>
                                                    {post.is_solution && (
                                                        <Badge className="bg-green-600 text-white text-xs">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Рішення
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">{formatDate(post.created_at)}</p>
                                            </div>

                                            {topic.user.id === Number(currentUserId) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsSolution(post.id)}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                    {post.is_solution ? 'Скасувати' : 'Позначити як рішення'}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="prose prose-sm max-w-none mb-4">
                                            <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={post.is_liked ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleLikeReply(post.id)}
                                            >
                                                <ThumbsUp className="w-4 h-4 mr-1" />
                                                {post.likes_count}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Reply Form */}
            <Card>
                <CardHeader>
                    <h3>Додати відповідь</h3>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Напишіть вашу відповідь..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            rows={6}
                            className="resize-none"
                        />

                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Будьте ввічливі та конструктивні у своїх відповідях
                            </p>

                            <Button
                                onClick={handleSubmitReply}
                                disabled={!newReply.trim() || isSubmitting}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Відправляється...' : 'Відправити відповідь'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
