import error_route from "../../assets/error_route.png";
import { useNavigate } from "react-router-dom";
const Error = () => {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col font-[Exo] text-black/90 relative z-[1]">
      <img
        src={error_route}
        alt="err"
        className="w-full h-full object-cover absolute left-0 top-0 z-[-1]"
      />
      <div className="font-bold text-[30px] ">PAGE NOT FOUND</div>
      <div className="mt-[15px] flex items-center justify-center gap-x-[23px] text-[20px] text-light ">
        {/* <div
          className="py-[5px] px-[28px] border border-black rounded-[5px] cursor-pointer hover:bg-black hover:text-white transition-50 "
          onClick={() => {
            navigate("/");
          }}
        >
          GO HOME
        </div> */}
        <div
          className="py-[5px] px-[28px] font-semibold border border-black rounded-[5px] cursor-pointer hover:bg-black hover:text-white transition-50 "
          onClick={() => {
            navigate(-1);
          }}
        >
          Quay lại
        </div>
      </div>
    </div>
  );
};

export default Error;
