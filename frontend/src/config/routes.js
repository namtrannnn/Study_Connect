export const routes = {
    home: '/',

    login: '/dang-nhap',
    register: '/dang-ky',

    dashboard: '/trang-chu',

    post: '/posts/create',

    // friend
    friends: '/ban-be',
    friendsSuggest: '/ban-be/goi-y',
    friendsAccept: '/ban-be/yeu-cau',
    friendsList: '/ban-be/danh-sach-ban-be',

    // chat
    messenger: '/messenger',

    // user
    profile: '/profile/:username?',
    search: '/search',

    // admin
    admin_root: '/admin',
    admin: '/admin/dashboard',
    admin_users: '/admin/users',
    admin_posts: '/admin/posts',
    admin_comments: '/admin/comments',
    admin_reports: '/admin/reports',
    admin_hashtags: '/admin/hashtags',
    admin_analytics: '/admin/analytics',
    admin_logs: '/admin/logs',
};
