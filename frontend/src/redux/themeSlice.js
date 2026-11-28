import { createSlice } from "@reduxjs/toolkit";

const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem("dark");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed === "dark" || parsed === true) return "dark";
    return null;
  } catch {
    return null;
  }
};

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    theme: getSavedTheme(),
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
