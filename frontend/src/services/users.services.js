import httpRequest from "../config/axios";

export const getNotFriends = async (query) => {
  try {
    const res = await httpRequest.get("/users/not-friend");
    return res.data;
  } catch (error) {}
};

export const getAcceptFriends = async (query) => {
  try {
    const res = await httpRequest.get("/users/accept");
    return res.data;
  } catch (error) {}
};

export const getRequestFriends = async (query) => {
  try {
    const res = await httpRequest.get("/users/request");
    return res.data;
  } catch (error) {}
};

export const getListFriends = async (query) => {
  try {
    const res = await httpRequest.get("/users/friends");
    return res.data;
  } catch (error) {}
};
