import { useState } from 'react';

import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLoading } from 'react-icons/ai';
import { CiMail } from 'react-icons/ci';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

import { LOGIN } from '../../redux/userSlice';
import bgLoginDark from '../../assets/bg-login-Photoroom.png';
import iconGG from '../../assets/icon-gg.png';
import iconGithub from '../../assets/icon-github.png';
import iconFB from '../../assets/icon-fb.png';
import bg3 from '../../assets/2076.jpg';
import config from '../../config';
import * as UserService from '../../services/user.services';

import Header from '../../layout/components/Header';

const schema = yup.object({
    email: yup.string().email('Email không hợp lệ').required('Bắt buộc nhập'),
    password: yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Bắt buộc nhập'),
});

const Login = () => {
    const dark = useSelector((state) => state.theme?.theme);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });
    const [eye, setEye] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleOnSubmit = async (data) => {
        setLoading(true);

        try {
            const res = await UserService.login(data);

            if (res?.code === 200) {
                Cookies.set('accessToken', res.token, {
                    expires: 7,
                    path: '/',
                });

                dispatch(LOGIN(res.user));

                toast.success(res.message);
                navigate(config.routes.dashboard);
            } else {
                toast.error(res?.message || 'Đăng nhập thất bại!');
            }
        } catch (error) {
            toast.error(error?.message || 'Đăng nhập thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <div
                className="pt-12 bg-[#d9d0cb] h-screen w-screen flex items-center relative transition-50 "
                style={{
                    backgroundImage: !dark ? 'none' : `url(${bg3})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* form */}
                <div className="w-full md:w-[80%] mx-auto flex items-center justify-center  md:justify-between z-[1] md:mt-4 ">
                    <div className="bg-[#ede6e0] dark:bg-[#3a3a3a]/70 dark:text-white/70 w-[90%] md:w-auto px-[20px] md:px-[50px] py-[30px] md:py-[40px] rounded-3xl ">
                        <h2 className="text-orange text-center font-bold text-[20px] md:text-[34px]">Đăng nhập</h2>
                        <form className="mt-[8px] md:mt-[20px] " onSubmit={handleSubmit(handleOnSubmit)}>
                            <div>
                                <div className="text-sm md:text-[16px] mb-2">Email</div>
                                <div className="flex items-center relative">
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="input-login"
                                        placeholder="User@gmail.com"
                                        disabled={loading}
                                    />
                                    <CiMail className="text-black/60 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40" />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1 font-medium">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="mt-[25px]">
                                <div className="text-sm md:text-[16px] mb-2">Mật khẩu</div>
                                <div className="flex items-center relative">
                                    <input
                                        {...register('password')}
                                        type={eye ? 'text' : 'password'}
                                        className="input-login"
                                        placeholder="Nhập mật khẩu..."
                                        disabled={loading}
                                    />
                                    {eye ? (
                                        <AiOutlineEye
                                            className="text-black/20 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                            onClick={() => setEye(!eye)}
                                        />
                                    ) : (
                                        <AiOutlineEyeInvisible
                                            className="text-black/60 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                            onClick={() => setEye(!eye)}
                                        />
                                    )}
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1 font-medium">{errors.password.message}</p>
                                )}
                            </div>
                            <div className="mt-[12px] md:mt-[17px] text-[13px] cursor-pointer font-normal flex justify-between items-center ">
                                <Link className="text-[12px] md:text-[14px] hover:underline" to="/forget-password">
                                    Quên mật khẩu
                                </Link>
                                <div className="flex items-center gap-x-1">
                                    <span className="text-[12px] md:text-[14px]">Nhớ</span>
                                    <input
                                        type="checkbox"
                                        className="rounded-[4px] ring-[#F25019] checked:bg-[#F25019]"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                className={`mt-[20px] md:mt-[20px] w-full font-weight text-[20px] md:text-xl bg-[#F25019] text-white py-[8px] md:py-[10px] rounded-[5px] flex items-center justify-center `}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <AiOutlineLoading className="animate-spin size-5 font-bold" /> : 'Đăng nhập'}
                            </button>
                        </form>
                        <div className="mt-[15px] md:mt-[20px] font-normal text-[13px] text-center ">
                            Hoặc đăng nhập với
                        </div>
                        <div className="mt-[8px] md:mt-[12px] flex items-center justify-between  gap-x-[11px] shrink-1 ">
                            <div className="icon-login" role="button">
                                <img
                                    src={iconGG}
                                    alt="icon-google"
                                    className=" w-[19px] md:w-[24px] h-auto rounded-full"
                                />
                            </div>
                            <div className="icon-login" role="button">
                                <img
                                    src={iconFB}
                                    alt="icon-facebook"
                                    className=" w-[19px] md:w-[24px] h-auto bg-white rounded-full"
                                />
                            </div>
                            <div className="icon-login" role="button">
                                <img
                                    src={iconGithub}
                                    alt="icon-github"
                                    className=" w-[19px] md:w-[24px] h-auto bg-white rounded-full"
                                />
                            </div>
                        </div>
                        <div className="mt-[8px] md:mt-[16px] text-[13px] md:text-[15px] text-center ">
                            <span className="font-normal block md:inline ">Nếu bạn chưa có tài khoản? </span>
                            <Link
                                to={config.routes.register}
                                role="button"
                                className="hover:scale-110 text-[16px] font-medium "
                            >
                                Đăng ký miễn phí
                            </Link>
                        </div>
                    </div>
                    <img
                        src={bgLoginDark}
                        alt="chicken"
                        className="w-[50%] h-auto object-cover hidden md:inline dark:fly"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
