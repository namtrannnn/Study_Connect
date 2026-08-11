import error_route from "../../assets/error_route.png";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const ErrorPage = ({ title = "PAGE NOT FOUND", subTitle = "", code = "404" }) => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen flex items-center justify-center flex-col font-[Exo] text-slate-900 relative z-[1] p-6 text-center select-none">
      <img
        src={error_route}
        alt="Error background"
        className="w-full h-full object-cover absolute left-0 top-0 z-[-1] brightness-90"
      />

      <div className="flex flex-col items-center max-w-lg bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-2xl space-y-4">
        {code === "403" && (
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/20 text-rose-600 border border-rose-500/30 animate-bounce">
            <ShieldAlert className="h-8 w-8" />
          </div>
        )}

        <div className="font-extrabold text-2xl tracking-tight text-slate-900">
          {title}
        </div>

        {subTitle && (
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            {subTitle}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-3 text-sm pt-2">
          <button
            type="button"
            className="py-2.5 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
            onClick={() => {
              navigate("/");
            }}
          >
            Trở về Trang chủ
          </button>
          <button
            type="button"
            className="py-2.5 px-6 font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-2xl transition-all duration-200 active:scale-95"
            onClick={() => {
              navigate(-1);
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
