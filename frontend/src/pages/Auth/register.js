import { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLoading } from 'react-icons/ai';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';

import rocket from '../../assets/rocket.png';
import bgEarthDark from '../../assets/bg-earth-dark.jpg';
import bgRegister2 from '../../assets/bg-register-2.jpg';
import theSun from '../../assets/the-sun.png';
import theMoon from '../../assets/the-moon.png';
import config from '../../config';
import Header from '../../layout/components/Header';

import * as UserService from '../../services/user.services';

const schema = yup.object({
    fullName: yup.string().required('Bắt buộc nhập'),
    email: yup.string().email('Email không hợp lệ').required('Bắt buộc nhập'),
    password: yup.string().min(8, 'Mật khẩu ít nhất 8 ký tự').required('Bắt buộc nhập'),
    rePassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Mật khẩu không trùng khớp')
        .required('Bắt buộc nhập'),
});

const Register = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const navigate = useNavigate();
    const theme = useSelector((state) => state.theme?.theme);
    const [eye, setEye] = useState(false);
    const [reEye, setReEye] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleOnSubmit = async (data) => {
        setLoading(true);

        try {
            const { rePassword, ...submitData } = data;

            const res = await UserService.register(submitData);

            if (res?.code === 200) {
                toast.success(res.message);
                navigate(config.routes.login);
            } else {
                toast.error(res?.message || 'Đăng ký thất bại!');
            }
        } catch (error) {
            toast.error(error?.message || 'Đăng ký thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <div
                className={`h-screen w-screen flex items-center relative transition-50 overflow-hidden md:grid-cols-3 `}
                style={{
                    backgroundImage: !theme ? `url(${bgRegister2})` : `url(${bgEarthDark})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* image background */}
                <div className="hidden md:flex h-full items-center justify-center relative transition-50">
                    <img
                        src={!theme ? theSun : theMoon}
                        alt="theSun"
                        className="absolute left-0 top-[5%] w-[60%] h-auto object-cover z-10"
                    />
                    <img src={rocket} alt="rocket" className="w-[70%] h-auto object-contain z-10" />
                </div>
                {/* form */}
                <div className="flex w-full h-auto items-center justify-center z-10">
                    <div className="bg-[#1e3a8a]/80 mx-[5%] md:mx-0 w-full mt-[60px] dark:bg-[#3a3a3a]/80 text-white/90 dark:text-white/70 md:w-auto px-[20px] md:px-[40px] py-[15px] sm:py-[30px] md:py-[30px] rounded-3xl transition-50 ">
                        <div className="text-center mb-[18px] text-xl sm:text-2xl md:text-[30px] text-[#38bdf8] dark:text-[#38bdf8]/80 font-extrabold ">
                            Đăng ký
                        </div>
                        <form
                            className="mt-[13px] sm:mt-[15px] md:mt-[20px] font-bold "
                            onSubmit={handleSubmit(handleOnSubmit)}
                        >
                            {/* name and email */}
                            <div className="grid grid-cols-1 gap-y-2 md:gap-y-3 ">
                                <div className="col-span-1">
                                    <div className="text-sm md:text-[16px] mb-1 md:mb-2 font-medium">Họ tên</div>
                                    <input
                                        {...register('fullName')}
                                        disabled={loading}
                                        type="text"
                                        className="input-register"
                                        placeholder="Trần Nhật Nam"
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-sm mt-1 font-medium">
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-1">
                                    <div className="text-sm md:text-[16px] mb-1 md:mb-2 font-medium">Email</div>
                                    <input
                                        {...register('email')}
                                        disabled={loading}
                                        type="email"
                                        className=" input-register"
                                        placeholder="nam@gmail.com"
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-sm mt-1 font-medium">{errors.email.message}</p>
                                    )}
                                </div>
                                {/* password and confirm password */}
                                <div className="col-span-1">
                                    <div className="text-sm md:text-[16px] mb-1 md:mb-2 font-medium">Mật khẩu</div>
                                    <div className="flex items-center relative">
                                        <input
                                            {...register('password')}
                                            disabled={loading}
                                            type={eye ? 'text' : 'password'}
                                            className=" input-register "
                                            placeholder="Password"
                                        />

                                        {eye ? (
                                            <AiOutlineEye
                                                className="text-black/20 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                                onClick={() => setEye(!eye)}
                                            />
                                        ) : (
                                            <AiOutlineEyeInvisible
                                                className="text-black/20 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                                onClick={() => setEye(!eye)}
                                            />
                                        )}
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-sm mt-[2px] font-medium">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>
                                {/* Confirm password */}
                                <div className="col-span-1">
                                    <div className=" text-sm md:text-[16px] mb-1 md:mb-2 font-medium">
                                        Nhập lại mật khẩu
                                    </div>
                                    <div className="flex items-center relative">
                                        <input
                                            {...register('rePassword')}
                                            disabled={loading}
                                            type={reEye ? 'text' : 'password'}
                                            className=" input-register "
                                            placeholder="Password"
                                        />
                                        {reEye ? (
                                            <AiOutlineEye
                                                className="text-black/20 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                                onClick={() => setReEye(!reEye)}
                                            />
                                        ) : (
                                            <AiOutlineEyeInvisible
                                                className="text-black/20 text-[20px] absolute right-2 cursor-pointer h-full dark:text-white/40"
                                                onClick={() => setReEye(!reEye)}
                                            />
                                        )}
                                    </div>
                                    {errors.rePassword && (
                                        <p className="text-red-500 text-sm mt-[2px] font-medium">
                                            {errors.rePassword.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-[8px] md:mt-[10px] text-[15px] font-normal flex justify-between items-center ">
                                <Link to="/forget-password">Forget password?</Link>
                            </div>
                            <button
                                className={`flex justify-center align-center mt-[12px] mx-auto md:mt-[15px] w-full border-none font-semibold text-[20px] md:text-xl text-white bg-[#1e3a8a] hover:bg-sky-500 dark:bg-[#60a5fa]/80 dark:hover:bg-[#60a5fa] dark:hover:text-white py-[8px] md:py-[10px] rounded-[5px] transition-50 `}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <AiOutlineLoading className="animate-spin size-5 font-bold" /> : 'Đăng ký'}
                            </button>
                        </form>

                        <div className="mt-[8px] md:mt-[10px] text-[13px] md:text-[15px] text-center ">
                            <span className="block md:inline font-normal">Nếu bạn đã có tài khoản, </span>
                            <Link to={config.routes.login} className="font-medium text-[15x] ">
                                hãy đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
