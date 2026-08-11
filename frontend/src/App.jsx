import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Fragment, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    registerPresenceSocketEvents,
    unregisterPresenceSocketEvents,
    resetPresenceState,
} from './sockets/presence.socket';
import { useDispatch, useSelector } from 'react-redux';

import DefaultLayoutAdmin from './layout/Admin/index';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { publicRoute, privateRoute } from './Routes';

import Cookies from 'js-cookie';
import { connectSocket, disconnectSocket } from './config/socket';
import { registerFriendSocketEvents, unregisterFriendSocketEvents } from './sockets/friend.socket';
function App() {
    const dark = useSelector((state) => state.theme?.theme);
    const user = useSelector((state) => state.user?.infoUser);
    const dispatch = useDispatch();
    useEffect(() => {
        const token = Cookies.get('accessToken');

        if (token && user?._id) {
            connectSocket();

            registerFriendSocketEvents();
            registerPresenceSocketEvents(dispatch);
        }

        if (!token || !user?._id) {
            unregisterFriendSocketEvents();
            unregisterPresenceSocketEvents();
            resetPresenceState(dispatch);
            disconnectSocket();
        }

        return () => {
            unregisterFriendSocketEvents();
            unregisterPresenceSocketEvents();
        };
    }, [user?._id, dispatch]);

    return (
        <Router>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={dark ? 'dark' : 'light'}
            />

            <div className="app">
                <Routes>
                    {publicRoute.map((route, index) => {
                        let Layout = Fragment;
                        const Page = route.component;
                        const ProtectedRoute = route.protected || Fragment;

                        if (route.layout) {
                            Layout = route.layout;
                        } else if (route.layout === null) {
                            Layout = Fragment;
                        }

                        const layoutProps = route.layoutProps || {};

                        return (
                            <Route
                                key={index}
                                path={route.path}
                                element={
                                    <Layout {...layoutProps}>
                                        <ProtectedRoute>
                                            <Page />
                                        </ProtectedRoute>
                                    </Layout>
                                }
                            >
                                {route.children?.map((child, childIndex) => {
                                    const ChildComponent = child.component;

                                    return <Route key={childIndex} path={child.path} element={<ChildComponent />} />;
                                })}
                            </Route>
                        );
                    })}

                    {privateRoute.map((route, index) => {

                        let Layout = DefaultLayoutAdmin;
                        const Page = route.component;

                        if (route.layout) {
                            Layout = route.layout;
                        } else if (route.layout === null) {
                            Layout = Fragment;
                        }

                        return (
                            <Route
                                key={index}
                                path={route.path}
                                element={
                                    <AdminProtectedRoute>
                                        <Layout>
                                            <Page />
                                        </Layout>
                                    </AdminProtectedRoute>
                                }
                            />
                        );
                    })}

                </Routes>
            </div>
        </Router>
    );
}

export default App;
