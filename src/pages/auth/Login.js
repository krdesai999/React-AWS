import InputText from "../../components/utils/inputText";
import { FormProvider, useForm } from "react-hook-form";
import {
  userNameConfig,
  passwordConfig,
} from "../../components/config/formConfig";
import { Navigate } from "react-router";
import { useAuth, useAuthentication } from "../../components/Auth";
import { pages } from "../../components/utils/PageDirection";

export default function Login() {
  const auth = useAuth();
  const authMethods = useAuthentication();

  const methods = useForm({
    mode: "all",
    defaultValues: {
      userName: "",
      password: "",
    },
  });

  if (auth.user) {
    if (auth.user.verified) return <Navigate to={pages.form} />;
    else return <Navigate to={pages.auth.confirm_user} />;
  }

  const onSubmit = methods.handleSubmit((data) => {
    authMethods.login(data.email, data.password);
  });

  return (
    <div className="login">
      <h1 className="mb-4 text-3xl tracking-tight font-extrabold text-center text-gray-900 dark:text-white">
        Login
      </h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...userNameConfig} />
          <br />
          <InputText {...passwordConfig} />
          <div>
            <button
              onClick={onSubmit}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Submit
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
