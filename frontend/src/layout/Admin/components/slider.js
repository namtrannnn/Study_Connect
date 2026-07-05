import { Drawer, List, IconButton, ListItem, Box } from "@mui/material";

import { NavLink } from "react-router-dom";

import { icAnalytics, icUser, icArticle } from "../../../utils/icons";

import logo from "../../../assets/logo-slime.png";
import config from "../../../config";

const menuItems = [
  { text: "Tổng quan", icon: icAnalytics, path: config.routes.admin },
  { text: "Người dùng", icon: icUser, path: config.routes.admin_users },
  {
    text: "Bài viết",
    icon: icArticle,
    path: config.routes.admin_posts,
  },
];

const Sidebar = ({ user, open, toggleDrawer, drawerWidth }) => {
  return (
    <Box>
      {/* Nút toggle */}
      <IconButton
        onClick={toggleDrawer}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 2000,
          color: "white",
        }}
      >
        oke
      </IconButton>
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#f9fafb",
            // backgroundColor: "#18191a",
            color: "white",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRight: "1px solid #919eab1f",
          },
        }}
      >
        {/* info User */}
        <div>
          <img
            src={logo}
            alt="logo"
            className="md:w-[60px] md:h-[60px] object-cover"
          />
          <div className="mt-2 mb-2 py-4 px-4 bg-[#919eab14] rounded-lg border-none flex items-center gap-x-2">
            <img
              src={user.avatar}
              alt="avatar"
              className="rounded-full border-black/40 border w-[36px] h-[36px] object-cover pl-[3px] pt- p-[2px] shrink-0 "
            />
            <div className="text-sm md:text-base font-semibold md:pr-5 text-black dark:bg-[#3A3A3A] dark:border-white/30 hidden md:flex ">
              {user.fullName}
            </div>
          </div>
        </div>
        <List>
          {menuItems.map((item, i) => (
            <ListItem key={i} disablePadding>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `w-full block rounded-md px-4 py-[10px] my-[2px] transition-20 ${
                    isActive
                      ? "bg-[#1877f229] hover:bg-[#1877f229] text-[#1877f2]"
                      : "text-[#637381] hover:bg-[#919eab14]"
                  }`
                }
              >
                <div className="flex items-center gap-x-4">
                  <div
                    className="w-[24px] h-[24px]"
                    style={{
                      WebkitMaskImage: `url(${item.icon})`,
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      WebkitMaskSize: "contain",
                      backgroundColor: "currentColor",
                    }}
                  />

                  <div className="font-medium text-sm md:text-base">
                    {item.text}
                  </div>
                </div>
              </NavLink>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
