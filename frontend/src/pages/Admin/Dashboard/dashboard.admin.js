import {
  icGlassBag,
  icGlassUser,
  icGlassBuy,
  icGlassMessage,
} from "../../../utils/glass";

import { Grid } from "@mui/material";

import { background1 } from "../../../utils/background";

const listItem = [
  {
    image: icGlassBag,
    icon: "icon",
    percent: "23%",
    text: "Weekly sales",
    count: "714K",
    color: "#042174",
    backgroundImage:
      "linear-gradient(135deg, rgba(208, 236, 254, 0.48), rgba(115, 186, 251, 0.48))",
  },
  {
    image: icGlassUser,
    icon: "icon",
    percent: "23%",
    text: "New users",
    count: "1.35m",
    color: "#27097a",
    backgroundImage:
      "linear-gradient(135deg, rgba(239, 214 ,255, 0.48), rgba(198 ,132 ,255, 0.48))",
  },
  {
    image: icGlassBuy,
    icon: "icon",
    percent: "23%",
    text: "Posts",
    count: "1M",
    color: "#7A4100",
    backgroundImage:
      "linear-gradient(135deg, rgba(255 ,245 ,204, 0.48), rgba( 255, 214, 102, 0.48))",
  },
  {
    image: icGlassMessage,
    icon: "icon",
    percent: "23%",
    text: "Messages",
    count: "200",
    color: "#7A0916",
    backgroundImage:
      "linear-gradient(135deg, rgba(255, 233, 213, 0.48), rgba(255, 172, 130, 0.48))",
  },
];

function Dashboard() {
  return (
    <div className="flex flex-col">
      <h4 className="text-2xl mt-5 mb-7">Bảng phân tích</h4>
      <Grid container spacing="24px">
        {listItem.map((item, i) => (
          <Grid
            item
            key={i}
            xs={12}
            sm={6}
            md={3}
            className={`relative p-6 rounded-2xl overflow-hidden z-10`}
            style={{
              color: item.color,
              backgroundImage: item.backgroundImage,
            }}
          >
            <div className="w-[48px] h-[48px] mb-6">
              <img
                src={item.image}
                alt="icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-[16px] right-[16px] flex items-center gap-x-1">
              <span>{item.icon}</span>
              <span>{item.percent}</span>
            </div>
            <div className="flex flex-wrap items-end justify-end">
              <div className="min-w-[115px]">
                <div className="mb-2 text-sm">{item.text}</div>
                <div className="text-3xl font-semibold">{item.count}</div>
              </div>
              <div className="w-[84px] h-[56px] rounded-xl relative">
                okeeeeeeeee
              </div>
            </div>
            <span
              className="w-[240px] h-[240px] opacity-[0.24] absolute top-0 left-[-20px] z-[-1]"
              style={{
                WebkitMaskImage: `url(${background1})`,
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                WebkitMaskSize: "contain",
                backgroundColor: "currentColor",
              }}
            ></span>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default Dashboard;
