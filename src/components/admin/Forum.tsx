import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    MessageSquare,
    Search,
    Plus,
    TrendingUp,
    Clock,
    Eye,
    MessageCircle,
    Filter,
    Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { forumService, Topic, Category } from '../../services/forumService';
import { toast } from 'sonner';

interface ForumProps {
    organizationId: string;
    currentUserId?: string;
    onTopicClick: (topicId: string) => void;
    onNewTopicClick: () => void;
}

export function Forum({ organizationId, currentUserId, onTopicClick, onNewTopicClick }: ForumProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
    const [activeTab, setActiveTab] = useState('all');

    const [topics, setTopics] = useState<Topic[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTopics: 0,
        totalReplies: 0,
        activeToday: 0,
        resolved: 0
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadTopics();
    }, [searchQuery, selectedCategory, sortBy, activeTab]);

    const loadCategories = async () => {
        try {
            const data = await forumService.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast.error('Не вдалося завантажити категорії');
        }
    };

    const loadTopics = async () => {
        setIsLoading(true);
        try {
            const status = activeTab === 'all' ? undefined : activeTab;
            const response = await forumService.getTopics({
                search: searchQuery,
                category: selectedCategory,
                sort_by: sortBy,
                status: status
            });
            setTopics(response.data);

            // Update stats based on current view (simplified for now)
            setStats({
                totalTopics: response.total,
                totalReplies: response.data.reduce((sum, t) => sum + t.posts_count, 0),
                activeToday: response.data.filter(t => new Date(t.last_activity_at).toDateString() === new Date().toDateString()).length,
                resolved: response.data.filter(t => t.is_resolved).length
            });
        } catch (error) {
            console.error('Failed to load topics:', error);
            toast.error('Не вдалося завантажити теми');
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryColor = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.color || 'bg-gray-100 text-gray-700';
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="mb-2">Форум адміністраторів</h1>
                <p className="text-gray-600">
                    Обговорюйте питання, діліться досвідом та отримуйте допомогу від інших адміністраторів
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Всього тем</p>
                                <p className="text-2xl mt-1">{stats.totalTopics}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Відповідей</p>
                                <p className="text-2xl mt-1">{stats.totalReplies}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Активні сьогодні</p>
                                <p className="text-2xl mt-1">{stats.activeToday}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Вирішено</p>
                                <p className="text-2xl mt-1">{stats.resolved}</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Шукати теми, питання..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-56">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всі категорії</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Нові спочатку</SelectItem>
                                <SelectItem value="popular">Популярні</SelectItem>
                                <SelectItem value="unanswered">Без відповідей</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={onNewTopicClick}>
                            <Plus className="w-4 h-4 mr-2" />
                            Нова тема
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Topics List */}
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="all">Всі теми</TabsTrigger>
                            <TabsTrigger value="unresolved">Невирішені</TabsTrigger>
                            <TabsTrigger value="resolved">Вирішені</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : topics.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Теми не знайдені</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Спробуйте змінити критерії пошуку або створити нову тему
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topics.map((topic) => (
                                        <div
                                            key={topic.id}
                                            onClick={() => onTopicClick(String(topic.id))}
                                            className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <Avatar className="mt-1">
                                                    <AvatarFallback className={
                                                        topic.user.rank === 'Система'
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200'
                                                    }>
                                                        {topic.user.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {topic.is_pinned && (
                                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                                                                    Закріплено
                                                                </Badge>
                                                            )}
                                                            <Badge className={getCategoryColor(topic.category.name)}>
                                                                {topic.category.name}
                                                            </Badge>
                                                            {topic.is_resolved && (
                                                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                                    Вирішено
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <h3 className="mb-1 hover:text-indigo-600 transition-colors">
                                                        {topic.title}
                                                    </h3>

                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {topic.content}
                                                    </p>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <span>{topic.user.name}</span>
                                                                <span>•</span>
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>{formatDate(topic.last_activity_at)}</span>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1">
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    <span>{topic.posts_count}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Eye className="w-4 h-4" />
                                                                    <span>{topic.views_count}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-1">
                                                            {topic.tags?.map((tag, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    );
}
