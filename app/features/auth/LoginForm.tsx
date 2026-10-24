"use client";

import { Form, Formik, Field } from "formik";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { getAuthenticatedUsername } from "@/app/actions/user";
import { Button } from "@/app/components/atoms";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const [notice, setNotice] = useState("");
  const router = useRouter();

  function validate(values: LoginValues) {
    const errors: Partial<Record<keyof LoginValues, string>> = {};
    const email = values.email.trim();

    if (!email) {
      errors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email chưa đúng định dạng.";
    }

    if (!values.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }

    return errors;
  }

  return (
    <Formik<LoginValues>
      initialValues={{ email: "", password: "" }}
      onSubmit={async (values, helpers) => {
        setNotice("");
        try {
          const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
          });

          if (!result || result.error) {
            setNotice("Email hoặc mật khẩu không chính xác.");
            return;
          }

          const username = await getAuthenticatedUsername();
          if (!username) {
            setNotice("Đăng nhập thành công nhưng không thể tải thông tin tài khoản.");
            return;
          }

          router.replace(`/u/${encodeURIComponent(username)}/board`);
          router.refresh();
        } catch (cause: unknown) {
          console.error("Sign-in request failed.", cause);
          setNotice("Không thể đăng nhập lúc này. Vui lòng thử lại sau.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
      validate={validate}
    >
      {({ errors, isSubmitting, touched }) => (
        <Form className="space-y-5" noValidate>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <Field
              autoComplete="email"
              className={`w-full rounded-lg border px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
                touched.email && errors.email ? "border-red-400" : "border-slate-300"
              }`}
              id="email"
              name="email"
              placeholder="ten@congty.com"
              type="email"
              aria-describedby={touched.email && errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(touched.email && errors.email)}
            />
            {touched.email && errors.email && (
              <p className="mt-1.5 text-xs text-red-600" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                Mật khẩu
              </label>
              <span className="text-xs font-medium text-slate-400">Quên mật khẩu?</span>
            </div>
            <Field
              autoComplete="current-password"
              className={`w-full rounded-lg border px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${
                touched.password && errors.password ? "border-red-400" : "border-slate-300"
              }`}
              id="password"
              name="password"
              placeholder="Nhập mật khẩu"
              type="password"
              aria-describedby={touched.password && errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(touched.password && errors.password)}
            />
            {touched.password && errors.password && (
              <p className="mt-1.5 text-xs text-red-600" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          <Button className="w-full rounded-lg py-3" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
          </Button>

          <div aria-live="polite" className="min-h-5 text-center text-sm text-slate-600">
            {notice}
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium text-slate-400">HOẶC</span>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            onClick={() => setNotice("Đăng nhập bằng Google chưa được cấu hình.")}
            type="button"
          >
            <GoogleIcon />
            Tiếp tục với Google
          </button>
        </Form>
      )}
    </Formik>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48">
      <path
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
        fill="#4285F4"
      />
      <path
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z"
        fill="#34A853"
      />
      <path
        d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 18l6.9-5.3Z"
        fill="#FBBC05"
      />
      <path
        d="M24 12.1c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}
