import InputText from "../../components/utils/inputText";
import { FormProvider, useForm } from "react-hook-form";
import { verificationCodeConfig } from "../../components/config/formConfig";
import { Navigate } from "react-router";
import { useAuth, useAuthentication } from "../../components/Auth";
import { pages } from "../../components/utils/PageDirection";

export default function ConfirmUser() {
  const auth = useAuth();
  const authMethods = useAuthentication();

  const methods = useForm({
    mode: "all",
    defaultValues: {
      confirmationCode: "",
    },
  });

  if (auth.user) {
    if (auth.user.verified) return <Navigate to={pages.form} />;
  } else {
    return <Navigate to={pages.auth.login} />;
  }


  const onSubmit = methods.handleSubmit((data) => {
    authMethods.verifyUserCode(data.confirmationCode);
  });

  return (
    <div className="user-confirmation-form">
      <h1 className="text-center">User confirmation</h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...verificationCodeConfig} />
          <br />
          <div className="submit btn text-center">
            <button onClick={onSubmit}>Submit</button>
          </div>
        </form>
      </FormProvider>
      <button onClick={authMethods.resendVerificationCode}>
        Resend confirmation code
      </button>
    </div>
  );
}
