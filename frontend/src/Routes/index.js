import config from '../config';

// pages
import Home from '../pages/Home';

import DashboardPage from '../pages/Dashboard';
import PostPage from '../pages/Post';

import Login from '../pages/Auth/login';
import Register from '../pages/Auth/register';

// friend
import Friends from '../pages/Friends/FriendsPage';

// chat
import Messenger from '../pages/Messenger/Messenger';

// user
import ProfilePage from '../pages/User/ProfilePage';

// Layout
import StudyConnectLayout from '../layout/StudyConnectLayout';
import MessengerLayout from '../layout/Messenger/MessengerLayout';

// Protection
import ProtectedRoute from '../components/ProtectedRoute';

import Error from '../pages/Error';

// admin pages
import AdminDashboard from '../pages/Admin/Dashboard/dashboard.admin';
import AdminUsers from '../pages/Admin/Users/users.admin';
import AdminPosts from '../pages/Admin/Post/posts.admin';
import AdminComments from '../pages/Admin/Comments/comments.admin';
import AdminReports from '../pages/Admin/Reports/reports.admin';
import AdminHashtags from '../pages/Admin/Hashtags/hashtags.admin';
import AdminAnalytics from '../pages/Admin/Analytics/analytics.admin';
import AdminLogs from '../pages/Admin/Logs/logs.admin';

const publicRoute = [
    { path: config.routes.home, component: Home, layout: null },
    { path: config.routes.login, component: Login, layout: null },
    { path: config.routes.register, component: Register, layout: null },

    {
        path: config.routes.profile,
        component: ProfilePage,
        layout: StudyConnectLayout,
        protected: ProtectedRoute,
        layoutProps: {
            showSuggest: false,
            contentClassName: 'max-w-[680px]',
            mainId: 'profile-scroll-container',
        },
    },

    {
        path: config.routes.friends,
        component: Friends,
        layout: StudyConnectLayout,
        protected: ProtectedRoute,
        layoutProps: {
            showSuggest: false,
            contentClassName: 'max-w-5xl',
            mainId: 'friends-scroll-container',
        },
    },

    {
        path: config.routes.dashboard,
        component: DashboardPage,
        layout: StudyConnectLayout,
        protected: ProtectedRoute,
        layoutProps: {
            showSuggest: true,
            contentClassName: 'max-w-[680px]',
            mainId: 'dashboard-scroll-container',
        },
    },

    {
        path: config.routes.messenger,
        component: Messenger,
        layout: MessengerLayout,
        protected: ProtectedRoute,
    },

    { path: '*', component: Error, layout: null },
];

const privateRoute = [
    { path: config.routes.admin_root, component: AdminDashboard },
    { path: config.routes.admin, component: AdminDashboard },
    { path: config.routes.admin_users, component: AdminUsers },
    { path: config.routes.admin_posts, component: AdminPosts },
    { path: config.routes.admin_comments, component: AdminComments },
    { path: config.routes.admin_reports, component: AdminReports },
    { path: config.routes.admin_hashtags, component: AdminHashtags },
    { path: config.routes.admin_analytics, component: AdminAnalytics },
    { path: config.routes.admin_logs, component: AdminLogs },
];

export { publicRoute, privateRoute };
