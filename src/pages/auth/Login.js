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
      <h1>Login</h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...userNameConfig} />
          <br />
          <InputText {...passwordConfig} />
          <div>
            <button onClick={onSubmit}>Submit</button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
