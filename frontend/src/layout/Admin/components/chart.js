// import React, { useEffect, useMemo, useState } from "react";
// import { LineChart } from "./lineChart";

// const Chart = ({ convertDate }) => {

//   const [loadingPosts, setLoadingPosts] = useState(false);
//   const [loadingUsers, setLoadingUsers] = useState(false);

//   const [dataPosts, setDataPosts] = useState([]);
//   const [dataUsers, setDataUsers] = useState([]);

//  useEffect(() => {
//   const fakeUsers = [
//     { createdAt: "2025-07-01T10:00:00Z" },
//     { createdAt: "2025-07-02T15:00:00Z" },
//     { createdAt: "2025-07-02T17:30:00Z" },
//     { createdAt: "2025-07-03T08:00:00Z" },
//   ];

//   const fakePosts = [
//     { createdAt: "2025-07-01T11:00:00Z" },
//     { createdAt: "2025-07-03T09:00:00Z" },
//     { createdAt: "2025-07-03T11:00:00Z" },
//   ];

//   setDataUsers(fakeUsers);
//   setDataPosts(fakePosts);
// }, []);

// //   const getAllUsers = async () => {
// //     setLoadingUsers(true);
// //     try {
// //       const { data } = await autoFetch.get(
// //         `/api/auth/all-users?page=${1}&perPage=${9999}`
// //       );
// //       setDataUsers(data.users);
// //     } catch (error) {
// //       console.log(error);
// //     }
// //     setLoadingUsers(false);
// //   };

// //   const getAllPosts = async () => {
// //     setLoadingPosts(true);
// //     try {
// //       const { data } = await autoFetch.get(
// //         `/api/post/all-posts?page=${1}&perPage=${9999}`
// //       );
// //       setDataPosts(data.posts);
// //     } catch (error) {
// //       console.log(error);
// //     }
// //     setLoadingPosts(false);
// //   };

// //   const datasetPosts = useMemo(() => {
// //     const data = [];
// //     dataPosts.forEach((v) => {
// //       // @ts-ignore
// //       const x = convertDate(v.createdAt);
// //       const index = data.find((v) => v.x === x);
// //       if (!index) {
// //         data.push({ x: x, y: 1 });
// //       } else {
// //         data[data.length - 1].y += 1;
// //       }
// //     });
// //     return data;
// //   }, [dataPosts]);

// //   const datasetUser = useMemo(() => {
// //     const data = [];
// //     dataUsers.forEach((v) => {
// //       // @ts-ignore
// //       const x = convertDate(v.createdAt);
// //       const index = data.find((v) => v.x === x);
// //       if (!index) {
// //         data.push({ x: x, y: 1 });
// //       } else {
// //         data[data.length - 1].y += 1;
// //       }
// //     });
// //     return data;
// //   }, [dataUsers]);

// //   const datasets = [
// //     {
// //       label: loadingPosts ? "Loading..." : "Posts",
// //       data: datasetPosts,
// //       borderColor: "rgb(75, 192, 192)",
// //       tension: 0.3,
// //       borderWidth: 1,
// //       pointBorderWidth: 0,
// //       pointHoverBorderWidth: 3,
// //       pointHoverRadius: 3,
// //       pointHitRadius: 5,
// //       pointRadius: 0,
// //       pointBackgroundColor: "rgb(75, 192, 192)",
// //     },
// //     {
// //       label: loadingUsers ? "Loading..." : "Users",
// //       data: datasetUser,
// //       borderColor: "#1565C0",
// //       tension: 0.3,
// //       borderWidth: 1,
// //       pointBorderWidth: 0,
// //       pointHoverBorderWidth: 3,
// //       pointHoverRadius: 3,
// //       pointHitRadius: 5,
// //       pointRadius: 0,
// //       pointBackgroundColor: "#1565C0",
// //     },
// //   ];

//   const option = {
//     legend: {
//       display: true,
//     },
//     plugins: {
//       tooltip: {
//         callbacks: {
//           title: (contents) => {
//             const arrTitle = [];
//             const contentLength = contents.length;
//             contents.forEach((v, index) => {
//               arrTitle.push(v.dataset.label);
//               arrTitle.push(v.raw.y);
//               arrTitle.push(v.raw.x);
//               if (index < contentLength - 1) {
//                 arrTitle.push("----------------");
//               }
//             });
//             return arrTitle;
//           },
//           label: () => "",
//         },
//       },
//     },
//     scales: {
//       x: {
//         type: "time",
//         time: {
//           unit: "week",
//           displayFormats: {
//             week: "DD/MM",
//           },
//         },
//         grid: { display: false },

//         title: {
//           display: true,
//           text: "Time",
//         },
//       },
//       y: {
//         grid: { display: false },

//         title: {
//           display: true,
//           text: "Quantity",
//         },
//       },
//     },
//     borderColor: "red",
//   };

//   return (
//     <div className="w-full h-full flex items-center justify-center  ">
//       <div className="w-full md:w-[60%] h-full ">
//         <LineChart datasets={datasets} option={option} />
//       </div>
//     </div>
//   );
// };

// export default Chart;

//  <div className="col-span-1 row-span-2 grid grid-rows-2 gap-y-5 p-5 ">
//             <div className="w-full row-span-1 h-full rounded-lg bg-sky-600 dark:bg-[#242526] flex flex-col items-center justify-center py-4 sm:py-0 ">
//               <div className="text-white text-[24px] font-bold ">
//                 Total users
//               </div>
//               <div className="text-white text-[60px] leading-[60px] font-extrabold ">
//                 {totalUser}
//               </div>
//             </div>
//             <div className="w-full row-span-1 h-full rounded-lg bg-[#009688] dark:bg-[#242526] flex flex-col items-center justify-center py-4 sm:py-0 ">
//               <div className="text-white text-[24px] font-bold ">
//                 Total posts
//               </div>
//               <div className="text-white text-[60px] leading-[60px] font-extrabold ">
//                 {totalPost}
//               </div>
//             </div>
//           </div>

import React, { useEffect, useMemo, useState } from "react";
import LineChart from "./lineChart";

const Chart = ({ convertDate }) => {
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [dataPosts, setDataPosts] = useState([]);
  const [dataUsers, setDataUsers] = useState([]);

  useEffect(() => {
    const fakeUsers = [
      { createdAt: "2025-07-01T10:00:00Z" },
      { createdAt: "2025-07-02T15:00:00Z" },
      { createdAt: "2025-07-02T17:30:00Z" },
      { createdAt: "2025-07-03T08:00:00Z" },
    ];

    const fakePosts = [
      { createdAt: "2025-07-01T11:00:00Z" },
      { createdAt: "2025-07-03T09:00:00Z" },
      { createdAt: "2025-07-03T11:00:00Z" },
    ];

    setDataUsers(fakeUsers);
    setDataPosts(fakePosts);
  }, []);

  const datasetPosts = useMemo(() => {
    const data = [];
    dataPosts.forEach((v) => {
      const x = convertDate(v.createdAt);
      const index = data.find((d) => d.x === x);
      if (!index) {
        data.push({ x: x, y: 1 });
      } else {
        data.find((d) => d.x === x).y += 1;
      }
    });
    return data;
  }, [dataPosts]);

  const datasetUser = useMemo(() => {
    const data = [];
    dataUsers.forEach((v) => {
      const x = convertDate(v.createdAt);
      const index = data.find((d) => d.x === x);
      if (!index) {
        data.push({ x: x, y: 1 });
      } else {
        data.find((d) => d.x === x).y += 1;
      }
    });
    return data;
  }, [dataUsers]);

  const datasets = [
    {
      label: loadingPosts ? "Loading..." : "Posts",
      data: datasetPosts,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.3,
      borderWidth: 1,
      pointBorderWidth: 0,
      pointHoverBorderWidth: 3,
      pointHoverRadius: 3,
      pointHitRadius: 5,
      pointRadius: 0,
      pointBackgroundColor: "rgb(75, 192, 192)",
    },
    {
      label: loadingUsers ? "Loading..." : "Users",
      data: datasetUser,
      borderColor: "#1565C0",
      tension: 0.3,
      borderWidth: 1,
      pointBorderWidth: 0,
      pointHoverBorderWidth: 3,
      pointHoverRadius: 3,
      pointHitRadius: 5,
      pointRadius: 0,
      pointBackgroundColor: "#1565C0",
    },
  ];

  const option = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (contents) => {
            const arrTitle = [];
            const contentLength = contents.length;
            contents.forEach((v, index) => {
              arrTitle.push(`${v.dataset.label}:`);
              arrTitle.push(`Số lượng: ${v.raw.y}`);
              arrTitle.push(`Ngày: ${v.raw.x}`);
              if (index < contentLength - 1) arrTitle.push("----------------");
            });
            return arrTitle;
          },
          label: () => "",
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          displayFormats: {
            day: "DD/MM",
          },
        },
        grid: { display: false },
        title: {
          display: true,
          text: "Thời gian",
        },
      },
      y: {
        grid: { display: false },
        title: {
          display: true,
          text: "Số lượng",
        },
      },
    },
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full md:w-[60%] h-full">
        <LineChart datasets={datasets} option={option} />
      </div>
    </div>
  );
};

export default Chart;
