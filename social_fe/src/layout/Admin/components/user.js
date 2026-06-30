import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@mui/material/Pagination";
import ReactLoading from "react-loading";
// components
import Table from "./Table/table.admin";

const Users = ({ convertDate, countUsers }) => {
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(15);

  const [page, setPage] = useState(1);
  // list all users
  const [listUser, setListUser] = useState([]);
  // numbers of all users
  const [totalUser, setTotalUser] = useState(0);

  useEffect(() => {
    // fake data thay cho API
    const fakeUsers = [
      {
        _id: "1",
        image: { url: "https://i.pravatar.cc/150?img=1" },
        name: "Alice Johnson",
        email: "alice@example.com",
        follower: [1, 2],
        following: [3],
        createdAt: "2025-07-01T10:00:00Z",
      },
      {
        _id: "2",
        image: { url: "https://i.pravatar.cc/150?img=2" },
        name: "Bob Smith",
        email: "bob@example.com",
        follower: [2],
        following: [1, 3],
        createdAt: "2025-07-02T15:00:00Z",
      },
      {
        _id: "3",
        image: { url: "https://i.pravatar.cc/150?img=3" },
        name: "Charlie Brown",
        email: "charlie@example.com",
        follower: [],
        following: [1],
        createdAt: "2025-07-03T08:00:00Z",
      },
      {
        _id: "4",
        image: { url: "https://i.pravatar.cc/150?img=4" },
        name: "Daisy Ridley",
        email: "daisy@example.com",
        follower: [1, 3],
        following: [],
        createdAt: "2025-07-03T17:00:00Z",
      },
      {
        _id: "5",
        image: { url: "https://i.pravatar.cc/150?img=5" },
        name: "Ethan Hunt",
        email: "ethan@example.com",
        follower: [],
        following: [],
        createdAt: "2025-07-04T09:00:00Z",
      },
    ];

    setListUser(fakeUsers);
    setTotalUser(fakeUsers.length);
    countUsers(fakeUsers.length);
  }, [page, perPage]);

  //   const getAllUsers = async () => {
  //     setLoading(true);
  //     try {
  //       const { data } = await autoFetch.get(
  //         `/api/auth/all-users?page=${page}&perPage=${perPage}`
  //       );
  //       setTotalUser(data.numberUsers);
  //       setListUser(data.users);
  //       countUsers(data.numberUsers);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //     setLoading(false);
  //   };

  const fields = [
    "no",
    "avatar",
    "name",
    "email",
    "postNumber",
    "follower",
    "following",
    "date",
  ];
  // titles of head table
  const titles = [
    "No",
    "Avatar",
    "Name",
    "Email",
    "Posts",
    "Follower",
    "Following",
    "Date",
  ];

  const data = useMemo(() => {
    return listUser.map((v, index) => {
      return {
        // @ts-ignore
        id: v._id,
        no: index + (page - 1) * perPage + 1,
        // @ts-ignore
        avatar: v.image?.url,
        // @ts-ignore
        name: v.name,
        // @ts-ignore
        email: v.email,
        postNumber: "n/a",
        // @ts-ignore
        follower: v.follower?.length,
        // @ts-ignore
        following: v.following?.length,
        // @ts-ignore
        date: convertDate(v.createdAt),
      };
    });
  }, [listUser, fields]);

  const listCenterTd = React.useMemo(
    () => ["postNumber", "no", "follower", "following"],
    []
  );
  const listCenterHead = React.useMemo(
    () => ["No", "Email", "Posts", "Follower", "Following", "Date"],
    []
  );

  return (
    <div className="w-full h-full px-1">
      <div className="w-full flex justify-between items-center px-1 md:pr-10 py-1 ">
        <div className="font-bold text-xl "> User </div>
        <div className="flex items-center gap-x-1 ">
          {loading && (
            <ReactLoading type="spin" width={20} height={20} color="#7d838c" />
          )}
          <div>
            <select
              id="countries"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-[70px] py-1 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value));
              }}
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
            </select>
          </div>

          <Pagination
            count={(totalUser - (totalUser % perPage)) / perPage + 1}
            page={page}
            variant="outlined"
            onChange={(setOneState, page) => {
              setPage(page);
            }}
          />
        </div>
      </div>
      <div className="w-full h-full  ">
        <Table
          titles={titles}
          fields={fields}
          data={data}
          listCenterHead={listCenterHead}
          listCenterTd={listCenterTd}
          className="sky"
          typeTable="users"
        />
      </div>
    </div>
  );
};

export default Users;
