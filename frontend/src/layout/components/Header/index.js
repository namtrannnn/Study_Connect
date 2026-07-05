import React, { useRef, useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { TiHomeOutline } from 'react-icons/ti';
import { FaRegUser } from 'react-icons/fa6';
// icon
import { AiFillHome } from 'react-icons/ai';
import { BsSun } from 'react-icons/bs';
import ReactLoading from 'react-loading';
import { IoMoonOutline } from 'react-icons/io5';
import { AiOutlineLogin } from 'react-icons/ai';

import logo from '../../../assets/logo-slime.png';

import { IoSearchSharp } from 'react-icons/io5';
import { SiMessenger } from 'react-icons/si';
import { MdAdminPanelSettings } from 'react-icons/md';
import { FaUserFriends } from 'react-icons/fa';

import { useDispatch, useSelector } from 'react-redux';

import config from '../../../config';

import Dropdown from './dropdown';
// components
// import { useAppContext } from "../../context/useContext.js";
// import { Dropdown, ItemsList } from "../";

// hocks
// import useDebounce from "../../hooks/useDebounce";
// import useOnClickOutside from "../../hooks/useOnClickOutside";

import { TOGGLE_THEME } from '../../../redux/themeSlice';
function Header({ user }) {
    // console.log("user", user);
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme?.theme);
    // text state
    const [text, setText] = useState('');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleToggleTheme = () => {
        const newTheme = theme === 'dark' ? null : 'dark';
        dispatch(TOGGLE_THEME(newTheme));
    };
    // when people stop typing(delay 500ms), then will call api
    //   const textDebounce = useDebounce(text, 500);
    // receive data from useEffect
    const [listSearchResult, setListSearchResult] = useState([]);
    // list empty
    const [isEmpty, setIsEmpty] = useState(false);
    // loading
    const [loading] = useState(false);

    const searchRef = useRef();
    //   useOnClickOutside(searchRef, () => clearListResult());

    // useEffect(() => {
    //     if (textDebounce) {
    //         searchPeople();
    //     }
    // }, [textDebounce]);

    // const searchPeople = async () => {
    //     setLoading(true);
    //     if (!text) {
    //         return;
    //     }
    //     try {
    //         const { data } = await autoFetch.get(`/api/auth/search-user/${text}`);
    //         if (data.search.length === 0) {
    //             setIsEmpty(true);
    //             setListSearchResult([]);
    //         } else {
    //             setIsEmpty(false);
    //             setListSearchResult(data.search);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }
    //     setLoading(false);
    // };

    // const menuListLogged = useMemo(() => {
    //     const list = [
    //         {
    //             text: "#c96c88",
    //             hover: "#c24269",
    //             bgAfter: "#c24269",
    //             link: "/",
    //             icon: <AiFillHome />,
    //             className: "dashboard",
    //         },
    //         {
    //             text: "#26A69A",
    //             hover: "#00897B",
    //             bgAfter: "#26A69A",
    //             link: "/messenger",
    //             icon: <SiMessenger className='text-[22px] ' />,
    //             className: "messenger",
    //         },
    //     ];

    //     if (user.role === "Admin") {
    //         list.push({
    //             text: "#607D8B",
    //             hover: "#455A64",
    //             bgAfter: "#607D8B",
    //             link: "/admin",
    //             icon: <MdAdminPanelSettings className='text-[28px] ' />,
    //             className: "admin",
    //         });
    //     }
    //     return list;
    // }, [user.role]);

    // const navMenuLogged = () => {
    //     return menuListLogged.map((v) => (
    //         <div
    //             className={`w-full ${user.role !== "Admin" ? "px-[10%]" : ""
    //                 } + ${v.className} `}
    //             key={"navlink" + v.link}>
    //             <NavLink
    //                 to={v.link}
    //                 className={`relative bg-inherit text-[${v.text}] py-2 md:py-2.5 my-1 mx-1 shrink-1 w-full flex justify-center hover:text-[${v.hover}] hover:bg-[#EBEDF0] rounded-[10px] text-[25px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-[${v.bgAfter}] after:opacity-0 after:bottom-0 -['Admin-page']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-[#d2d5d7] `}
    //                 role='button'>
    //                 {v.icon}
    //             </NavLink>
    //         </div>
    //     ));
    // };
    // console.log(document.documentElement.classList.contains("dark"));

    // console.log(document.documentElement.classList.contains("dark"));

    const menuListLogged = useMemo(() => {
        const list = [
            {
                text: '#c96c88',
                hover: '#c24269',
                bgAfter: '#c24269',
                link: config.routes.dashboard,
                icon: <AiFillHome />,
                className: 'dashboard',
            },
            {
                text: '#c96c88',
                hover: '#c24269',
                bgAfter: '#c24269',
                link: config.routes.friends,
                icon: <FaUserFriends />,
                className: 'dashboard',
            },
            {
                text: '#26A69A',
                hover: '#00897B',
                bgAfter: '#26A69A',
                link: config.routes.messenger,
                icon: <SiMessenger className="text-[22px] " />,
                className: 'messenger',
            },
        ];

        if (user?.role === 'Admin') {
            list.push({
                text: '#607D8B',
                hover: '#455A64',
                bgAfter: '#607D8B',
                link: '/admin',
                icon: <MdAdminPanelSettings className="text-[28px] " />,
                className: 'admin',
            });
        }
        return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const navMenuLogged = () => {
        return menuListLogged.map((v) => (
            <div
                className={`w-full ${user.role !== 'Admin' ? 'px-[10%]' : ''} + ${v.className} `}
                key={'navlink' + v.link}
            >
                <NavLink
                    to={v.link}
                    className={`relative bg-inherit text-[${v.text}] py-2 md:py-2.5 my-1 mx-1 shrink-1 w-full flex justify-center hover:text-[${v.hover}] hover:bg-[#EBEDF0] rounded-[10px] text-[25px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-[${v.bgAfter}] after:opacity-0 after:bottom-0 -['Admin-page']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-[#d2d5d7] `}
                    role="button"
                >
                    {v.icon}
                </NavLink>
            </div>
        ));
    };
    return (
        <header className="flex fixed top-0 w-screen bg-white px-1 sm:px-2 md:px-4 z-[100] items-center dark:bg-bg-header-d transition-50 dark:text-[#DDDFE3] border-b-[#8a8a8a] py-1 ">
            <div className="flex items-center min-w-[33%] " style={{ flex: '1 1 auto' }}>
                <NavLink to={config.routes.home} role="button">
                    <img src={logo} alt="logo" className="w-[30px] md:w-[48px] h-auto " />
                </NavLink>
                {/* search */}
                {user && (
                    <div className="flex items-center border overflow-hidden border-black/40 dark:bg-[#4E4F50] dark:text-[#b9bbbe] w-[190px] md:w-[240px] h-auto md:h-[40px] rounded-full px-1 ml-2 ">
                        <IoSearchSharp className="text-16px md:text-[20px] mx-1" />
                        <div ref={searchRef} className="h-full flex items-center flex-1 pr-2">
                            <input
                                type="text"
                                className="text-[15px] flex-1 border-none bg-inherit outline-none focus:ring-0 focus:border-0 font-normal dark:placeholder:text-[#b1b2b5] dark:text-[#cecfd2] "
                                placeholder="Tìm kiếm..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />

                            <div className="scroll-bar absolute max-h-[300px] rounded-[7px] w-[250px] overflow-y-auto overflow-x-hidden top-[60px] translate-x-[-10px] ">
                                {(isEmpty || listSearchResult.length > 0) && (
                                    <div className=" box-shadow">
                                        {isEmpty && (
                                            <div className="w-full text-center border dark:border-white/20 box-shadow dark:bg-[#2E2F30] rounded-[7px] py-6 ">
                                                No user found!
                                            </div>
                                        )}
                                        {/* {listSearchResult.length > 0 && (
                      <ItemsList
                        dataSource={listSearchResult}
                        searchInNav={true}
                        user={user}
                        clearList={clearListResult}
                      />
                    )} */}
                                    </div>
                                )}
                            </div>
                        </div>
                        {loading && <ReactLoading type="spinningBubbles" width={20} height={20} color="#7d838c" />}
                    </div>
                )}
            </div>

            <ul
                className="hidden md:flex  items-center justify-between text-white dark:text-[#B8BBBF] text-[25px] min-w-[33%] "
                style={{ flex: '1 1 auto' }}
            >
                {user ? (
                    navMenuLogged()
                ) : (
                    <>
                        <NavLink
                            to={config.routes.home}
                            className={({ isActive }) =>
                                `relative bg-inherit text-[#65686c] py-2 md:py-2.5 my-1 mx-1 shrink-1 w-full flex justify-center hover:text-blue-600 hover:bg-[#EBEDF0] rounded-[10px] text-[23px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-blue-600 after:text-blue-500 after:opacity-0 after:bottom-0 -['Home']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-blue-500 ${
                                    isActive ? 'text-blue-600 after:opacity-100 dark:text-blue-500' : 'text-[#65686c]'
                                }`
                            }
                            role="button"
                        >
                            <TiHomeOutline />
                        </NavLink>
                        <NavLink
                            to={config.routes.login}
                            className={({ isActive }) =>
                                `relative bg-inherit text-[#65686c] py-2 md:py-2.5 my-1 mx-1 shrink-1 w-full flex justify-center hover:text-blue-600 hover:bg-[#EBEDF0] rounded-[10px] text-[23px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-blue-600 after:text-blue-500 after:opacity-0 after:bottom-0 -['Home']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-blue-500 ${
                                    isActive ? 'text-blue-600 after:opacity-100 dark:text-blue-500' : 'text-[#65686c]'
                                }`
                            }
                            role="button"
                        >
                            <AiOutlineLogin />
                        </NavLink>
                        <NavLink
                            to={config.routes.register}
                            className={({ isActive }) =>
                                `relative bg-inherit text-[#65686c] py-2 md:py-2.5 my-1 mx-1 shrink-1 w-full flex justify-center hover:text-blue-600 hover:bg-[#EBEDF0] rounded-[10px] text-[23px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-blue-600 after:text-blue-500 after:opacity-0 after:bottom-0 -['Home']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-blue-500 ${
                                    isActive ? 'text-blue-600 after:opacity-100 dark:text-blue-500' : 'text-[#65686c]'
                                }`
                            }
                            role="button"
                        >
                            <FaRegUser />
                        </NavLink>
                    </>
                )}
            </ul>

            <div
                className="flex items-center justify-end min-w-[33%] gap-x-1 sm:gap-x-2 md:gap-x-3 "
                style={{ flex: '1 1 auto' }}
            >
                <div className="flex gap-x-5 items-center">
                    {/* {user && (
            <div className="text-sm md:text-md font-semibold border pl-3 md:pr-5 py-[5px] rounded-l-full translate-x-[16px] bg-[#3F51B5] text-white dark:bg-[#3A3A3A] dark:border-white/30 hidden md:flex ">
              {user.fullName}
            </div>
          )} */}
                    <Dropdown user={user} theme={theme} />
                </div>
                <div
                    className="flex items-center p-1 w-[55px] h-[30px] rounded-full border-2 cursor-pointer border-black/70 dark:bg-[#3A3B3C] bg-[#333]/10 dark:border-[#929292] relative "
                    onClick={handleToggleTheme}
                >
                    <BsSun className="absolute left-1.5 text-[20px] text-black/80 font-extrabold transition-50 dark:translate-x-[15px] dark:opacity-0" />
                    <IoMoonOutline className="absolute text-[20px] right-1 font-extrabold text-white transition-50 dark:translate-x-0 translate-x-[-15px] opacity-0 dark:opacity-[1]" />
                </div>
            </div>
        </header>
    );
}

export default Header;
