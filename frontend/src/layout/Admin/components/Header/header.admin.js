import React, { useRef, useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

// icon
import { AiFillHome } from 'react-icons/ai';
import { BsSun } from 'react-icons/bs';
import ReactLoading from 'react-loading';
import { IoMoonOutline } from 'react-icons/io5';

import { IoSearchSharp } from 'react-icons/io5';
import { SiMessenger } from 'react-icons/si';
import { RiSpaceShipFill } from 'react-icons/ri';
import { MdAdminPanelSettings } from 'react-icons/md';
import { BsFillSunFill, BsMoon } from 'react-icons/bs';
import { CiHeart, CiStar, CiRead, CiUnread } from 'react-icons/ci';
import { FaHeart, FaStar } from 'react-icons/fa';

import { TOGGLE_THEME } from '../../../../redux/themeSlice';
import { useDispatch, useSelector } from 'react-redux';

import config from '../../../../config';

import Dropdown from './dropdown.admin';

// hocks
// import useOnClickOutside from "../../hooks/useOnClickOutside";

function Header({ user }) {
    // console.log("user", user);
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme?.theme);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const handleToggleTheme = () => {
        const newTheme = theme === 'dark' ? '' : 'dark';
        dispatch(TOGGLE_THEME(newTheme));
    };

    //   useOnClickOutside(searchRef, () => clearListResult());

    // useEffect(() => {
    //     if (textDebounce) {
    //         searchPeople();
    //     }
    // }, [textDebounce]);

    const menuListLogged = useMemo(() => {
        const list = [
            {
                text: '#26A69A',
                hover: '#00897B',
                bgAfter: '#26A69A',
                link: '/messenger',
                icon: <SiMessenger className="text-[22px] " />,
                className: 'messenger',
            },
        ];

        return list;
    }, [user?.role]);

    const navMenuLogged = () => {
        return menuListLogged.map((v) => (
            <div className={` ${user.role !== 'Admin' ? '' : ''} + ${v.className} `} key={'navlink' + v.link}>
                <NavLink
                    to={v.link}
                    className={`relative bg-inherit text-[${v.text}] w-10 h-10 rounded-full shrink-1 flex justify-center items-center hover:text-[${v.hover}] hover:bg-[#EBEDF0] text-[25px] transition-20 after:content-[''] after:absolute after:h-[3px] after:w-[70%] after:left-[15%] after:bg-[${v.bgAfter}] after:opacity-0 after:bottom-0 -['Admin-page']  before:rounded-lg dark:bg-inherit before:opacity-0 dark:text-[#B8BBBF] dark:hover:bg-[#3A3B3C] dark:hover:text-[#d2d5d7] `}
                    role="button"
                >
                    {v.icon}
                </NavLink>
            </div>
        ));
    };
    return (
        <header className="flex fixed top-0 left-0 w-screen bg-[#f9fafb] px-1 sm:px-2 md:px-4 z-[100] items-center dark:bg-bg-header-d transition-50 dark:text-[#DDDFE3] border-b-[#8a8a8a] py-2 ">
            <div
                className="flex items-center justify-end min-w-[33%] gap-x-1 sm:gap-x-2 md:gap-x-3 "
                style={{ flex: '1 1 auto' }}
            >
                <div className="flex gap-x-1 items-center">
                    {/* {user && (
            <div className="text-sm md:text-md font-semibold border pl-3 md:pr-5 py-[5px] rounded-l-full translate-x-[16px] bg-[#3F51B5] text-white dark:bg-[#3A3A3A] dark:border-white/30 hidden md:flex ">
              {user.fullName}
            </div>
          )} */}
                    {navMenuLogged()}
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
