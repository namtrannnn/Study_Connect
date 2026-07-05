import { Menu, Transition, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Fragment } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { IoHomeOutline } from 'react-icons/io5';

//icon
import { AiOutlineSetting, AiOutlineMenu } from 'react-icons/ai';
import { IoIosLogOut } from 'react-icons/io';
import { toast } from 'react-toastify';

import { MdAdminPanelSettings } from 'react-icons/md';
// components
import { useDispatch } from 'react-redux';
import { LOGOUT } from '../../../../redux/userSlice';
import config from '../../../../config';

export default function Dropdown({ user, theme }) {
    // console.log(user);
    const dispatch = useDispatch();
    const navigation = useNavigate();
    let drop = [];
    let dropForMdScreen = [];

    if (user) {
        if (user?.role === 'Admin') {
            dropForMdScreen.push({
                text: 'Admin-page',
                bgColor: '#607D8B',
                icon: <MdAdminPanelSettings className="w-5 h-5 mr-2" aria-hidden="true" />,
                href: '/admin',
            });
        }
        drop = [
            {
                text: 'Trang chủ',
                bgColor: '#795548',
                icon: <IoHomeOutline className="w-5 h-5 mr-2" aria-hidden="true" />,
                href: '/dash-board',
            },
            {
                text: 'Chỉnh sửa hồ sơ',
                bgColor: '#795548',
                icon: <AiOutlineSetting className="w-5 h-5 mr-2" aria-hidden="true" />,
                href: '/update-profile',
            },
            {
                text: 'Đăng xuất',
                bgColor: '#546E7A',
                icon: <IoIosLogOut className="w-5 h-5 mr-2" aria-hidden="true" />,
                href: '/login',
            },
        ];
    }

    const handleLogout = async () => {
        await dispatch(LOGOUT());
        navigation(config.routes.home);
    };

    return (
        <Menu as="div" className={`w-10 h-10 flex items-center relative`}>
            <MenuButton className="flex items-center justify-center w-full h-full rounded-full md:hover:bg-black/10">
                {user ? (
                    <img
                        src={user.avatar}
                        alt="avatar"
                        className="rounded-full border-black/40 border w-full h-full object-cover pl-[3px] pt- p-[2px] shrink-0 "
                    />
                ) : (
                    <AiOutlineMenu className="text-20px " />
                )}
            </MenuButton>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <MenuItems
                    className={`absolute right-0 w-[300px] mt-80 pb-1 origin-top-right bg-white/90 text-black dark:bg-[#252728] divide-y divide-gray-100 rounded-md dark:ring-0 dark:ring-black ring-opacity-5 focus:outline-none ${
                        theme ? '' : 'shadow-post'
                    }`}
                >
                    <div
                        className={`${user ? 'translate-y-[70px]' : 'translate-y-0'} ${
                            user?.role === 'Admin' && 'translate-y-[85px]'
                        } md:translate-y-0 `}
                    >
                        <div
                            className={`mx-2 my-3 ${
                                theme ? 'shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'shadow-rounded'
                            } rounded-md overflow-hidden dark:bg-[#252728]`}
                        >
                            <MenuItem>
                                {({ active }) => (
                                    <NavLink
                                        to={config.routes}
                                        className={`${
                                            active && 'bg-white/10'
                                        } group flex rounded-md items-center w-full px-2 py-2 text-sm font-semibold tracking-wide`}
                                    >
                                        <img
                                            src={user.avatar}
                                            alt="avatar"
                                            className="rounded-full border-black/40 dark:border-white/30 border w-[40px] h-[40px] object-cover p-[2px] mr-2 shrink-0 "
                                        />
                                        {user.fullName}
                                    </NavLink>
                                )}
                            </MenuItem>
                            <div className="h-[1px] dark:bg-white/30  bg-black w-[90%] mx-auto my-1"></div>
                            <div
                                className="my-3 mx-auto dark:bg-white/25 dark:text-white/90  w-[90%] h-[30px] md:h-[36px] rounded-md flex items-center justify-center bg-black/5 "
                                onClick={() => toast('This function is updating')}
                            >
                                Xem tất cả trang cá nhân
                            </div>
                        </div>
                        {/* <div className={`md:hidden px-1 py-1 dark:bg-[#3A3A3A] `}></div> */}

                        {drop.map((item, index) => (
                            <div className={`px-1 dark:bg-[#252728] dark:text-white/90`} key={index}>
                                <MenuItem>
                                    {({ active }) => (
                                        <button
                                            to={item.href}
                                            className={`${
                                                active ? 'bg-white/10' : ''
                                            } group flex rounded-md items-center w-full px-2 py-3 text-sm font-semibold tracking-wide hover:bg-black/5 dark:hover:bg-white/5 transition-20 `}
                                            onClick={() => {
                                                if (item.text === 'Đăng xuất') {
                                                    if (window.confirm('Confirm logout?')) {
                                                        handleLogout();
                                                    }
                                                }
                                            }}
                                        >
                                            <span>{item.icon}</span>

                                            {item.text}
                                        </button>
                                    )}
                                </MenuItem>
                            </div>
                        ))}
                    </div>
                </MenuItems>
            </Transition>
        </Menu>
    );
}
