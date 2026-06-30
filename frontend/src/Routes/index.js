//config
import config from '../config';
import Error from '../pages/Error';
import ProtectedRoute from '../components/ProtectedRoute';

import Home from '../pages/Home';
import Login from '../pages/Auth/login';
import Register from '../pages/Auth/register';

// [LAYOUT]
import StudyConnectLayout from '../layout/StudyConnectLayout';

// dashboard
import DashboardPage from '../pages/Dashboard';

// messenger
import MessengerLayout from '../layout/Messenger/MessengerLayout';
import Messenger from '../pages/Messenger/Messenger';

// friend
import Friends from '../pages/Friends/FriendsPage';

// user
import ProfilePage from '../pages/User/ProfilePage';

// admin
import AdminDashboard from '../pages/Admin/Dashboard/dashboard.admin';
import AdminUsers from '../pages/Admin/Users/users.admin';
import AdminPosts from '../pages/Admin/Post/posts.admin';

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
            contentClassName: 'max-w-5xl',
            mainId: 'profile-scroll-container',
        },
    },

    {
        path: config.routes.friends,
        component: Friends,
        layout: StudyConnectLayout,
        protected: ProtectedRoute,
        layoutProps: {
            showSuggest: true,
            contentClassName: 'max-w-[900px]',
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
    { path: config.routes.admin, component: AdminDashboard },
    { path: config.routes.admin_users, component: AdminUsers },
    { path: config.routes.admin_posts, component: AdminPosts },
];

export { publicRoute, privateRoute };
