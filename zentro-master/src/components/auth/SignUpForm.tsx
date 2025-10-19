import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import { ReloadIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Validation schema for email step
const emailSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email обязателен")
    .email("Введите корректный email"),
});

// Validation schema for registration step
const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("Имя обязательно")
    .matches(/^[A-Za-zА-Яа-яЁё\s-]+$/, "Имя должно содержать только буквы")
    .max(50, "Имя слишком длинное"),
  lastName: yup
    .string()
    .required("Фамилия обязательна")
    .matches(/^[A-Za-zА-Яа-яЁё\s-]+$/, "Фамилия должна содержать только буквы")
    .max(50, "Фамилия слишком длинная"),
  password: yup
    .string()
    .required("Пароль обязателен")
    .min(8, "Пароль должен быть не менее 8 символов")
    .matches(/[a-z]/, "Должна быть хотя бы одна строчная буква")
    .matches(/[A-Z]/, "Должна быть хотя бы одна заглавная буква")
    .matches(/\d/, "Должна быть хотя бы одна цифра")
    .matches(/[@$!%*?&/#^()+\-]/, "Должен быть хотя бы один спецсимвол"),
  verificationCode: yup
    .string()
    .required("Код подтверждения обязателен")
    .length(6, "Код должен содержать 6 цифр")
    .matches(/^\d+$/, "Код должен содержать только цифры"),
});

export default function SignUpForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<"email" | "register">("email");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [serverError, setServerError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form for email step
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isValid: isEmailValid },
    reset: resetEmailForm,
  } = useForm({
    resolver: yupResolver(emailSchema),
    mode: "onChange",
  });

  // Form for registration step
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset: resetRegisterForm,
    setValue,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      verificationCode: "",
    },
  });

  const passwordValue = useWatch({ control, name: "password" });

  // Countdown timer for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const passwordRules = [
    { id: 1, label: "Минимум 8 символов", isValid: (val: string) => val?.length >= 8 },
    { id: 2, label: "Строчная буква", isValid: (val: string) => /[a-z]/.test(val || "") },
    { id: 3, label: "Заглавная буква", isValid: (val: string) => /[A-Z]/.test(val || "") },
    { id: 4, label: "Цифра", isValid: (val: string) => /\d/.test(val || "") },
    { id: 5, label: "Спецсимвол (@$!%*?&/#^()+-)", isValid: (val: string) => /[@$!%*?&/#^()+\-]/.test(val || "") },
  ];

  // Send verification code with improved error handling
  const handleSendCode = async (data: { email: string }) => {
    try {
      setIsSendingCode(true);
      setServerError("");

      const res = await fetch("http://localhost:4000/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Ошибка при отправке кода");
      }

      setEmailForVerification(data.email);
      resetRegisterForm();
      setCurrentStep("register");
      setResendTimer(60); // 1 minute cooldown
    } catch (err: any) {
      setServerError(err.message || "Ошибка соединения с сервером");
      console.error("Send code error:", err);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      setIsSendingCode(true);
      setServerError("");

      const res = await fetch("http://localhost:4000/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForVerification }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Ошибка при отправке кода");
      }

      setResendTimer(60); // Reset cooldown
    } catch (err: any) {
      setServerError(err.message || "Ошибка соединения с сервером");
      console.error("Resend code error:", err);
    } finally {
      setIsSendingCode(false);
    }
  };

  // Complete registration with proper error handling
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setServerError("");

      const response = await fetch("http://localhost:4000/api/auth/verify-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: emailForVerification.toLowerCase().trim(),
          password: data.password,
          verificationCode: data.verificationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed. Please try again.");
      }

      // Show success and redirect after delay
      setShowSuccess(true);
      setTimeout(() => navigate("/signin"), 2000);
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setServerError(err.message || "Ошибка при регистрации");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render email step
  if (currentStep === "email") {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
        <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Назад к панели
          </Link>
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Регистрация
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Введите ваш email для получения кода подтверждения
              </p>
            </div>

            {serverError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {serverError}
              </div>
            )}

            <form onSubmit={handleEmailSubmit(handleSendCode)}>
              <div className="space-y-5">
                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="Введите email"
                    {...registerEmail("email")}
                    autoFocus
                  />
                  {emailErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{emailErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSendingCode || !isEmailValid}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingCode ? (
                      <>
                        <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Отправка кода...
                      </>
                    ) : (
                      "Получить код"
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Уже есть аккаунт?{" "}
                <Link 
                  to="/signin" 
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Войти
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render registration step
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <button
          onClick={() => {
            setCurrentStep("email");
            setServerError("");
          }}
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Назад
        </button>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Завершение регистрации
            </h1>
            <div className="p-3 mb-3 text-sm text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300">
              Код отправлен на: <span className="font-medium">{emailForVerification}</span>
              <button
                onClick={handleResendCode}
                disabled={resendTimer > 0 || isSendingCode}
                className="ml-2 text-brand-500 hover:text-brand-600 disabled:text-gray-400"
              >
                {resendTimer > 0 ? `Отправить снова (${resendTimer}с)` : "Отправить снова"}
              </button>
            </div>
          </div>

          {showSuccess && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
              🎉 Регистрация прошла успешно! Перенаправляем вас на страницу входа...
            </div>
          )}

          {serverError && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Verification Code - Fixed: Now properly empty */}
              <div>
                <Label>Код подтверждения*</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Введите 6-значный код"
                  {...register("verificationCode")}
                  autoFocus
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.verificationCode.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Имя<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Введите имя"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label>Фамилия<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    placeholder="Введите фамилию"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Пароль<span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    placeholder="Введите пароль"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}

                <ul className="mt-3 space-y-2 text-sm">
                  {passwordRules.map((rule) => (
                    <li key={rule.id} className="flex items-center gap-2">
                      <Checkbox
                        className="w-4 h-4"
                        checked={rule.isValid(passwordValue || "")}
                        disabled
                      />
                      <span className={rule.isValid(passwordValue || "") ? "text-green-600" : "text-gray-500"}>
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-checkbox"
                  checked={true}
                  readOnly
                  className="w-5 h-5 mt-0.5"
                />
                <label htmlFor="terms-checkbox" className="text-sm font-normal text-gray-800 dark:text-white">
                  Регистрируясь, вы соглашаетесь с условиями использования и политикой конфиденциальности
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    "Завершить регистрацию"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}