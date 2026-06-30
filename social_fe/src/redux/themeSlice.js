import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    theme: JSON.parse(localStorage.getItem("dark")) || null,
  },
  reducers: {
    TOGGLE_THEME: (state, action) => {
      localStorage.setItem("dark", JSON.stringify(action.payload));
      state.theme = action.payload;
    },
  },
});

export const { TOGGLE_THEME } = themeSlice.actions;
export default themeSlice.reducer;
