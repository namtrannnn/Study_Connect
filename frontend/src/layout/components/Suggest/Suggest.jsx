import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import {
    BookOpen,
    Code2,
    Flame,
    GraduationCap,
    HelpCircle,
    Lightbulb,
    MessageCircleQuestion,
    Rocket,
    TrendingUp,
    UserPlus,
    Users,
    Zap,
} from 'lucide-react';

import { getSuggestSummary } from '../../../services/suggest.services';
import { followUser } from '../../../services/friend.services';
import { toast } from 'react-toastify';

const topicIcons = {
    react: Code2,
    reactjs: Code2,
    node: Zap,
    nodejs: Zap,
    ai: Lightbulb,
    technology: Code2,
    education: GraduationCap,
    science: Lightbulb,
};

function SectionCard({ children, className = '' }) {
    return (
        <div
            className={`rounded-3xl border border-blue-100/80 bg-white/90 p-4 shadow-brand-soft backdrop-blur-xl transition dark:border-white/10 dark:bg-[#20232b]/90 ${className}`}
        >
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, title, action }) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-50 text-primary dark:bg-white/10 dark:text-brand-300">
                    <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">{title}</h3>
            </div>

            {action && (
                <button
                    type="button"
                    className="text-xs font-semibold text-primary transition hover:text-brand-700 dark:text-brand-300"
                >
                    {action}
                </button>
            )}
        </div>
    );
}

function EmptyText({ children = 'Chưa có dữ liệu' }) {
    return (
        <div className="rounded-2xl bg-gray-50 px-3 py-4 text-center text-xs font-medium text-gray-400 dark:bg-white/5 dark:text-gray-500">
            {children}
        </div>
    );
}

function SuggestSkeleton() {
    return (
        <div className="space-y-4 pb-6">
            {[1, 2, 3, 4].map((item) => (
                <div
                    key={item}
                    className="rounded-3xl border border-blue-100/80 bg-white/90 p-4 shadow-brand-soft dark:border-white/10 dark:bg-[#20232b]/90"
                >
                    <div className="mb-4 h-5 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="space-y-3">
                        <div className="h-10 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                        <div className="h-10 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                        <div className="h-10 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Suggest() {
    const [suggestData, setSuggestData] = useState({
        studyPartners: [],
        trendingTopics: [],
        featuredProjects: [],
        openQuestions: [],
        activeLearners: [],
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggest = async () => {
            try {
                setLoading(true);

                const res = await getSuggestSummary();

                setSuggestData({
                    studyPartners: res?.data?.studyPartners || [],
                    trendingTopics: res?.data?.trendingTopics || [],
                    featuredProjects: res?.data?.featuredProjects || [],
                    openQuestions: res?.data?.openQuestions || [],
                    activeLearners: res?.data?.activeLearners || [],
                });
            } catch (error) {
                console.log('Fetch suggest error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggest();
    }, []);

    const { studyPartners, trendingTopics, featuredProjects, openQuestions, activeLearners } = suggestData;

    if (loading) {
        return <SuggestSkeleton />;
    }

    return (
        <div className="space-y-4 pb-6">
            {/* Intro StudyConnect */}
            <div className="relative overflow-hidden rounded-[28px] bg-brand-gradient p-4 text-white shadow-brand">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-300/30 blur-2xl" />

                <div className="relative">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                        <Rocket className="h-5 w-5" />
                    </div>

                    <h2 className="text-base font-bold">StudyConnect Hub</h2>
                    <p className="mt-1 text-xs leading-5 text-white/85">
                        Kết nối bạn học, chia sẻ dự án và tìm câu trả lời nhanh hơn.
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-white/15 p-2 text-center backdrop-blur">
                            <div className="text-sm font-bold">{studyPartners.length}</div>
                            <div className="text-[10px] text-white/75">Bạn học</div>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-2 text-center backdrop-blur">
                            <div className="text-sm font-bold">{featuredProjects.length}</div>
                            <div className="text-[10px] text-white/75">Dự án</div>
                        </div>

                        <div className="rounded-2xl bg-white/15 p-2 text-center backdrop-blur">
                            <div className="text-sm font-bold">{openQuestions.length}</div>
                            <div className="text-[10px] text-white/75">Câu hỏi</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggested Study Partners */}
            <SectionCard>
                <SectionHeader icon={Users} title="Gợi ý học cùng" action="Xem tất cả" />

                {studyPartners.length === 0 ? (
                    <EmptyText>Chưa có gợi ý học cùng</EmptyText>
                ) : (
                    <div className="space-y-3">
                        {studyPartners.map((user) => (
                            <div
                                key={user._id}
                                className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-brand-50 dark:hover:bg-white/5"
                            >
                                <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-blue-100 dark:ring-white/10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <div className="cursor-pointer truncate text-sm font-bold text-gray-800 group-hover:text-primary dark:text-white">
                                        {user.name}
                                    </div>

                                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                        {user.role || 'Người học StudyConnect'}
                                    </div>

                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {(user.skills || []).slice(0, 2).map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-white/10 dark:text-brand-300"
                                            >
                                                {skill}
                                            </span>
                                        ))}

                                        {(!user.skills || user.skills.length === 0) && (
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-white/10 dark:text-brand-300">
                                                Study
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    className="h-9 w-9 shrink-0 rounded-2xl bg-primary p-0 text-white shadow-brand-soft hover:bg-brand-700"
                                    onClick={async () => {
                                        try {
                                            await followUser(user._id);
                                            toast.success(`Đã theo dõi ${user.name}`);
                                        } catch (e) {
                                            toast.error('Không thể theo dõi');
                                        }
                                    }}
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* Trending Topics */}
            <SectionCard>
                <SectionHeader icon={TrendingUp} title="Chủ đề nổi bật" action="Khám phá" />

                {trendingTopics.length === 0 ? (
                    <EmptyText>Chưa có chủ đề nổi bật</EmptyText>
                ) : (
                    <div className="space-y-2">
                        {trendingTopics.map((topic, index) => {
                            const key = String(topic.name || '').toLowerCase();
                            const Icon = topicIcons[key] || TrendingUp;

                            return (
                                <button
                                    key={topic.name}
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-brand-50 dark:hover:bg-white/5"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-50 text-primary dark:from-white/10 dark:to-white/5 dark:text-brand-300">
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold text-gray-800 dark:text-white">
                                            #{topic.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {topic.posts || 0} bài viết
                                        </div>
                                    </div>

                                    {index === 0 && (
                                        <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-500 dark:bg-orange-500/10">
                                            <Flame className="h-3 w-3" />
                                            Hot
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            {/* Featured Projects */}
            <SectionCard>
                <SectionHeader icon={Rocket} title="Dự án nổi bật" action="Xem thêm" />

                {featuredProjects.length === 0 ? (
                    <EmptyText>Chưa có dự án nổi bật</EmptyText>
                ) : (
                    <div className="space-y-3">
                        {featuredProjects.map((project) => (
                            <div
                                key={project._id}
                                className="rounded-3xl border border-blue-100 bg-brand-gradient-soft p-3 transition hover:-translate-y-0.5 hover:shadow-brand-soft dark:border-white/10 dark:bg-none dark:bg-white/5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-brand-soft">
                                        <BookOpen className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                                            {project.title}
                                        </h4>
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                            {project.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-1">
                                    {(project.techs || []).slice(0, 4).map((tech) => (
                                        <span
                                            key={tech}
                                            className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-primary shadow-sm dark:bg-white/10 dark:text-brand-300"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-3">
                                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                        <span>Tiến độ</span>
                                        <span>{project.progress || 0}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-brand-gradient"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* Open Questions */}
            <SectionCard>
                <SectionHeader icon={MessageCircleQuestion} title="Câu hỏi cần hỗ trợ" action="Trả lời" />

                {openQuestions.length === 0 ? (
                    <EmptyText>Chưa có câu hỏi cần hỗ trợ</EmptyText>
                ) : (
                    <div className="space-y-2">
                        {openQuestions.map((question) => (
                            <button
                                key={question._id}
                                type="button"
                                className="w-full rounded-2xl border border-transparent p-3 text-left transition hover:border-blue-100 hover:bg-brand-50 dark:hover:border-white/10 dark:hover:bg-white/5"
                            >
                                <div className="flex gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                                        <HelpCircle className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h4 className="line-clamp-2 text-sm font-bold leading-5 text-gray-800 dark:text-white">
                                            {question.title}
                                        </h4>

                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-brand-300">
                                                {question.tag}
                                            </span>
                                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                {question.answers || 0} trả lời
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </SectionCard>

            {/* Active Learners */}
            <SectionCard>
                <SectionHeader icon={GraduationCap} title="Bạn học đang hoạt động" />

                {activeLearners.length === 0 ? (
                    <EmptyText>Chưa có bạn học nào online</EmptyText>
                ) : (
                    <div className="space-y-1">
                        {activeLearners.map((user) => (
                            <button
                                key={user._id}
                                type="button"
                                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-brand-50 dark:hover:bg-white/5"
                            >
                                <div className="relative">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-[#20232b]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-bold text-gray-800 dark:text-white">
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-green-500">Đang học online</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
