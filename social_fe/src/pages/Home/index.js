import { useNavigate } from "react-router-dom";
// import { Nav } from "../components";
// import {useAppContext} from "../context/useContext";

import bgHome1 from "../../assets/bg-home-1.png";
import bgHome2 from "../../assets/bg-home-2.png";
import earth from "../../assets/bg-home-earth.jpg";
import darkBackground from "../../assets/bg-home-dark.jpg";
import Header from "../../layout/components/Header";

import { useSelector } from "react-redux";
import config from "../../config";

const Home = () => {
  const navigate = useNavigate();
  // const {dark} = useAppContext();
  const dark = useSelector((state) => state.theme?.theme);
  // console.log("darkk:", dark);
  return (
    <div>
      <Header />

      <div className="w-screen h-screen flex justify-between align-center overflow-hidden transition-50">
        {dark === "dark" && (
          <div
            style={{ backgroundImage: `url('${darkBackground}')` }}
            className="fixed w-full h-full bottom-0 left-0 opacity-70 wave object-contain"
          />
        )}

        <div className="relative left-12 top-[13vh] md:top-[19vh] z-10">
          <div className="text-[40px] sm:text-[60px] md:text-[80px] font-semibold text-[#210028] dark:text-sky-400">
            Welcome
            <div className="text-[15px] sm:text-[20px] md:text-[30px] text-pink-600 font-normal">
              “ Nơi câu chuyện của bạn bắt đầu lan toả. ”
            </div>
          </div>
          <div className="mt-7 md:w-[50%] pr-5 md:pr-0">
            <div className="text-[13px] sm:text-base md:text-[18px] text-gray-600 dark:text-gray-300 font-normal">
              Đây là nơi bạn viết nên những điều nhỏ bé trong cuộc sống, kết nối
              với những người đồng cảm, và để câu chuyện của mình lan toả theo
              cách riêng biệt nhất. Dù là một dòng suy nghĩ vu vơ hay những cảm
              xúc không thể nói thành lời, tất cả đều xứng đáng được lắng nghe
              và trân trọng.
            </div>
            <div className="flex gap-x-3 items-center justify-start mt-6 sm:mt-8 md:mt-10 ">
              <button
                className="btn-home boxed"
                onClick={() => {
                  navigate(config.routes.login);
                }}
              >
                Đăng nhập
              </button>
              <button
                className="btn-home boxed"
                onClick={() => {
                  navigate(config.routes.register);
                }}
              >
                Đăng kí
              </button>
            </div>
          </div>
        </div>
        <div className="relative w-[380px] md:w-[100%]">
          <img
            src={earth}
            alt="rocket"
            className="absolute left-0 rounded-tl-[50%] rounded-bl-[50%] top-[0] object-contain transition-50 z-10 opacity-[1] dark:opacity-0"
          />
          <img
            src={bgHome1}
            alt="rocket"
            className="absolute left-0 top-[55px] object-contain transition-50 z-10 dark:translate-x-[100%] dark:opacity-0"
          />
          <img
            src={bgHome2}
            alt="rocket"
            className="absolute top-[45px] object-contain transition-50 z-10 opacity-0 translate-x-[100%] dark:translate-x-[0] dark:opacity-[1]"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
