import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";

import Chart from "./components/chart";
import User from "./components/user";
import Posts from "./components/posts";

import Sidebar from "./components/slider";
import Header from "./components/Header/header.admin";

const drawerWidth = 300;

const Admin = ({ children }) => {
  const { theme } = useSelector((state) => state.theme);
  const user = useSelector((state) => state.user.infoUser);

  const darkTheme = createTheme({
    palette: {
      mode: theme ? "dark" : "light",
    },
    typography: {
      fontFamily: [
        "Quicksand",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(","),
    },
  });

  /**
   * @input string || date. Ex : Sat Jul 16 2022 19:07:55 GMT+0700
   * @return string. Ex: 16-07-2022
   */
  const convertDate = (time) => {
    const date = new Date(time);
    const yyyy = date.getFullYear();
    const mm = date.getMonth() + 1;
    const dd = date.getDate();
    return `${yyyy}-${mm >= 10 ? mm : "0" + mm}-${dd >= 10 ? dd : "0" + dd}`;
  };
  const [open, setOpen] = useState(true);
  const toggleDrawer = () => setOpen((prev) => !prev);
  return (
    <ThemeProvider theme={darkTheme}>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          user={user}
          open={open}
          toggleDrawer={toggleDrawer}
          drawerWidth={drawerWidth}
        />

        {/* Main content */}
        <div
          className="transition-all duration-300 min-h-screen"
          style={{
            marginLeft: open ? `0px` : `-300px`,
            width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
          }}
        >
          <Header user={user} />
          <main
            className="w-full mx-auto bg-[#f9fafb] pt-[60px] h-full px-11"
            style={{
              flex: "1 1 auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Admin;
