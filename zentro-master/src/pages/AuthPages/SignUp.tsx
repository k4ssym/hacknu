import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="ZAMAN.AI ML"
        description="ZAMAN.AI ML"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
