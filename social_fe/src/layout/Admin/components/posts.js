// import React, { useEffect, useMemo, useState } from "react";
// import Pagination from "@mui/material/Pagination";
// // components
// import Table from "./table";
// import ReactLoading from "react-loading";
// import { toast } from "react-toastify";

// const Posts = ({ convertDate, countPosts }) => {
//   const [loading, setLoading] = useState(false);
//   const [perPage, setPerPage] = useState(15);

//   const [page, setPage] = useState(1);
//   // list all users
//   const [posts, setPosts] = useState([]);
//   // numbers of all users
//   const [postsCount, setPostsCount] = useState(0);

//   useEffect(() => {
//     const fakePosts = [
//       {
//         _id: "p1",
//         postedBy: {
//           _id: "u1",
//           name: "Trần Nhật Nam",
//           image: { url: "https://i.pravatar.cc/150?img=1" },
//         },
//         content: "Post đầu tiên của tui nè!",
//         image: { url: "https://picsum.photos/200" },
//         likes: ["u2", "u3"],
//         comments: [{}, {}, {}],
//         createdAt: "2025-07-03T10:00:00Z",
//       },
//       {
//         _id: "p2",
//         postedBy: {
//           _id: "u2",
//           name: "Linh cute",
//           image: { url: "https://i.pravatar.cc/150?img=2" },
//         },
//         content: "Bài post tâm trạng ngày mưa ☔",
//         image: { url: "https://picsum.photos/201" },
//         likes: ["u1"],
//         comments: [{}],
//         createdAt: "2025-07-02T14:00:00Z",
//       },
//     ];

//     setPosts(fakePosts);
//     setPostsCount(fakePosts.length);
//     countPosts(fakePosts.length);
//   }, []);

//   // const getAllPosts = async () => {
//   //     setLoading(true);
//   //     try {
//   //         const {data} = await autoFetch.get(
//   //             `/api/post/all-posts?page=${page}&perPage=${perPage}`
//   //         );
//   //         setPosts(data.posts);
//   //         setPostsCount(data.postsCount);
//   //         countPosts(data.postsCount);
//   //     } catch (error) {
//   //         console.log(error);
//   //     }
//   //     setLoading(false);
//   // };

//   // const deletePost = async (postId) => {
//   //     try {
//   //         const {data} = await autoFetch.delete(
//   //             `/api/post/admin/delete-post/${postId}`
//   //         );
//   //         toast("Delete post success!");
//   //         getAllPosts();
//   //     } catch (error) {
//   //         console.log(error);
//   //     }
//   // };

//   const fields = useMemo(
//     () => [
//       "no",
//       "avatar",
//       "name",
//       "content",
//       "image",
//       "likeCount",
//       "commentCount",
//       "date",
//     ],
//     []
//   );
//   // titles of head table
//   const titles = useMemo(
//     () => [
//       "No",
//       "Avatar",
//       "Name",
//       "Content",
//       "Image",
//       "Like",
//       "Comment",
//       "Date  ",
//     ],
//     []
//   );

//   const data = useMemo(() => {
//     return posts.map((v, index) => {
//       return {
//         // @ts-ignore
//         id: v._id,
//         no: index + (page - 1) * perPage + 1,
//         // @ts-ignore
//         avatar: v.postedBy?.image?.url,
//         // @ts-ignore
//         name: v.postedBy?.name,
//         // @ts-ignore
//         content: v.content,
//         // @ts-ignore
//         image: v.image?.url,
//         // @ts-ignore
//         likeCount: v.likes?.length,
//         // @ts-ignore
//         commentCount: v.comments?.length,
//         // @ts-ignore
//         date: convertDate(v.createdAt),
//         // @ts-ignore
//         userId: v.postedBy?._id,
//       };
//     });
//   }, [posts, fields]);

//   const listCenterTd = React.useMemo(
//     () => ["no", "commentCount", "likeCount"],
//     []
//   );
//   const listCenterHead = React.useMemo(
//     () => ["No", "Date", "Posts", "Image", "Like", "Comment"],
//     []
//   );

//   return (
//     <div className="w-full h-full px-1">
//       <div className="w-full flex justify-between items-center pr-10 py-1 ">
//         <div className="font-bold text-xl "> Posts </div>
//         <div className="flex items-center gap-x-1 ">
//           {loading && (
//             <ReactLoading type="spin" width={20} height={20} color="#7d838c" />
//           )}
//           <div>
//             <select
//               id="countries"
//               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500-500 focus:border-green-500 block w-[70px] py-1 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
//               value={perPage}
//               onChange={(e) => {
//                 setPerPage(parseInt(e.target.value));
//               }}
//             >
//               <option value={15}>15</option>
//               <option value={20}>20</option>
//               <option value={25}>25</option>
//             </select>
//           </div>
//           <Pagination
//             count={(postsCount - (postsCount % perPage)) / perPage + 1}
//             page={page}
//             variant="outlined"
//             onChange={(setOneState, page) => {
//               setPage(page);
//             }}
//           />
//         </div>
//       </div>
//       <div className="w-full h-full  ">
//         <Table
//           titles={titles}
//           fields={fields}
//           data={data}
//           listCenterHead={listCenterHead}
//           listCenterTd={listCenterTd}
//           bgHeadColor="#009688"
//           className="green"
//           typeTable="posts"
//           // deletePost={deletePost}
//         />
//       </div>
//     </div>
//   );
// };

// export default Posts;
