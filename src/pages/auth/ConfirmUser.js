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
      <h1 className="mb-4 text-3xl tracking-tight font-extrabold text-center text-gray-900 dark:text-white">
        User confirmation
      </h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...verificationCodeConfig} />
          <div className="submit btn text-center">
            <button
              onClick={onSubmit}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Submit
            </button>
          </div>
        </form>
      </FormProvider>
      <div className="submit btn text-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            authMethods.resendVerificationCode();
          }}
          className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 my-3 text-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        >
          Resend confirmation code
        </button>
      </div>
      <br />
    </div>
  );
}
