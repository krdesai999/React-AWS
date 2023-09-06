import InputText from "../../components/utils/inputText";
import { FormProvider, useForm } from "react-hook-form";
import {
  userNameConfig,
  passwordConfig,
} from "../../components/config/formConfig";
import { useAuth, useAuthentication } from "../../components/Auth";
import { Navigate } from "react-router-dom";
import { pages } from "../../components/utils/PageDirection";

export default function SignUp() {
  const auth = useAuth();
  const authMethods = useAuthentication();

  // React hook default
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

  function handleAttributes(data) {
    var tempArray = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== "userName" && key !== "password") {
        tempArray.push({
          Name: key,
          Value: value,
        });
      }
    }
    return tempArray;
  }

  const onSubmit = methods.handleSubmit((data) => {
    data.attributes = handleAttributes(data);
    authMethods.signUp(data.email, data.password, data.attributes);
  });

  return (
    <div className="sign-up">
      <h1>Sign up</h1>
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
