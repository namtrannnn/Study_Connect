import {
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Typography,
  IconButton,
  Box,
  Chip,
  tableCellClasses,
  styled,
} from "@mui/material";
import { useSelector } from "react-redux";
import { MdOutlineFilterList } from "react-icons/md";
import { useMemo } from "react";

export default function CustomTables({
  fields,
  titles,
  data,
  listCenterHead,
  listCenterTd,
  typeTable = "",
}) {
  const { theme } = useSelector((state) => state.theme);

  const StyledTableCell = useMemo(
    () =>
      styled(TableCell)(({ theme }) => {
        return {
          [`&.${tableCellClasses.head}`]: {
            backgroundColor:
              theme.palette.mode === "light" ? "#f4f6f8" : "#000",
            color: theme.palette.mode === "light" ? "#637381" : "#000",
            fontWeight: "bold",
          },
          [`&.${tableCellClasses.body}`]: {
            padding: "6px 16px",
          },
        };
      }),
    []
  );
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));
  const fieldsArr = useMemo(
    () => (typeTable !== "posts" ? titles : [...titles, "action"]),
    [typeTable, titles]
  );

  const contentTd = (row, v) => {
    // {/* checkbox */}
    if (v === "checkbox") {
      return (
        <label className="relative inline-block w-[16px] h-[16px]">
          <input
            type="checkbox"
            className="appearance-none peer cursor-pointer w-full h-full rounded-[4px] border border-gray-400 checked:bg-blue-600 focus:outline-none focus:border-blue-600  transition-colors"
          />
          <svg
            className="w-[10px] h-[10px] absolute top-[5px] left-[3px] text-white opacity-0 scale-0 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-200 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </label>
      );
    }

    if (v === "avatar") {
      return (
        <Avatar
          src={row[v]}
          alt=""
          className="border dark:border-white/50 border-black/50 cursor-pointer "
        />
      );
    }
    if (v === "status") {
      return (
        <span
          className="m-w-6 h-6 inline-flex items-center justify-center rounded-md whitespace-nowrap px-[6px] text-[#118D57] font-semibold text-sm"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.16)",
          }}
        >
          {row[v]}
        </span>
      );
    }
    return row[v];
  };

  return (
    <div className="transition-20">
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "12px",
          boxShadow: "0 0 5px 0px rgba(99, 99, 99, 0.2)",
        }}
      >
        <div className="px-6 py-6 flex items-center justify-between">
          <input
            placeholder="Search user..."
            className="md:w-[360px] w-[200px] px-4 py-3 rounded-md border border-gray-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
          />
          <div className="text-[18px] md:text-[24px] text-gray-500">
            <MdOutlineFilterList />
          </div>
        </div>

        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              {fieldsArr.map((v, index) => (
                <StyledTableCell
                  key={index + "titleTable" + v}
                  align={listCenterHead.includes(v) ? "center" : "left"}
                >
                  {v === "Checkbox" ? (
                    // checkbox
                    <label className="relative inline-block w-[16px] h-[16px]">
                      <input
                        type="checkbox"
                        className="appearance-none peer cursor-pointer w-full h-full rounded-[4px] border border-gray-400 checked:bg-blue-600 focus:outline-none focus:border-blue-600  transition-colors"
                      />
                      <svg
                        className="w-[10px] h-[10px] absolute top-[5px] left-[3px] text-white opacity-0 scale-0 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-200 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </label>
                  ) : (
                    v
                  )}
                  {/* {v} */}
                </StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => {
              return (
                <StyledTableRow
                  key={row.name + "th" + idx}
                  className="cursor-pointer "
                  // onClick
                >
                  {fields.map((v, index) => (
                    <StyledTableCell
                      key={`rowElement-No` + row[v] + titles[index]}
                      component={!index ? "th" : "td"}
                      scope={!index ? "row" : undefined}
                      align={listCenterTd.includes(v) ? "center" : "left"}
                      className="text-ellipsis max-w-md flex items-center justify-center "
                      // onClick={() => {
                      //   if ((v === "content" || v === "image") && row.image) {
                      //     navigate(`/post/information/${row.id}`);
                      //   }
                      //   if (v === "avatar" || v === "name") {
                      //     navigate(`/profile/${row.userId}`);
                      //   }
                      // }}
                    >
                      {contentTd(row, v)}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
