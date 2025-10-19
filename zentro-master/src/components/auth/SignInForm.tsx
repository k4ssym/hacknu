import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon, ReloadIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";

type SignInStep = "credentials" | "verification";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [currentStep, setCurrentStep] = useState<SignInStep>("credentials");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSendingCode(true);
      setError("");

      // First verify credentials
      const verifyResponse = await fetch("http://localhost:4000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          password: password.trim(),
          requestVerification: true // Add this flag to your backend
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      // Then request verification code
      const codeResponse = await fetch("http://localhost:4000/api/auth/send-login-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!codeResponse.ok) {
        throw new Error("Failed to send verification code");
      }

      setCurrentStep("verification");
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      console.error("Error:", err);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4000/api/auth/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          password: password.trim(),
          verificationCode: verificationCode.trim()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Verification failed");
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      setIsSendingCode(true);
      setError("");

      const response = await fetch("http://localhost:4000/api/auth/send-login-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend code");
      }

      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsSendingCode(false);
    }
  };

  if (currentStep === "verification") {
    return (
      <div className="flex flex-col flex-1">
        <div className="w-full max-w-md pt-10 mx-auto">
          <button
            onClick={() => setCurrentStep("credentials")}
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
                Подтверждение входа
              </h1>
              <div className="p-3 mb-3 text-sm text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-300">
                Код отправлен на: <span className="font-medium">{email}</span>
                <button
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || isSendingCode}
                  className="ml-2 text-brand-500 hover:text-brand-600 disabled:text-gray-400"
                >
                  {resendTimer > 0 ? `Отправить снова (${resendTimer}с)` : "Отправить снова"}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Код подтверждения <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Введите 6-значный код"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="sm"
                    disabled={isSubmitting || !verificationCode}
                  >
                    {isSubmitting ? (
                      <>
                        <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      "Подтвердить вход"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
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
              Вход в аккаунт
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Введите ваш email и пароль для входа
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <form onSubmit={handleSendVerificationCode}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Label>
                    Пароль <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Запомнить меня
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Забыли пароль?
                  </Link>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="sm"
                    disabled={isSendingCode || !email || !password}
                  >
                    {isSendingCode ? (
                      <>
                        <ReloadIcon className="w-4 h-4 mr-2 animate-spin" />
                        Отправка кода...
                      </>
                    ) : (
                      "Продолжить"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Ещё нет аккаунта?{" "}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}