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
    profile: '/profile/:userId?',
    search: '/search',

    // admin
    admin: '/admin/dashboard',
    admin_users: '/admin/users',
    admin_posts: '/admin/posts',
};
