import { Navigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { pages } from "../components/utils/PageDirection";
import { FormProvider, useForm } from "react-hook-form";
import InputText from "../components/utils/inputText";
import { inputTextConfig } from "../components/config/formConfig";

export default function Form() {
  const auth = useAuth();

  const methods = useForm({
    mode: "all",
    defaultValues: {
      inputText: "",
    },
  });

  if (auth.user) {
    if (!auth.user.verified) return <Navigate to={pages.auth.confirm_user} />;
  }

  const onSubmit = methods.handleSubmit((data) => {

  });

  return (
    <div className="form">
      <h1>Input form</h1>
      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()} noValidate>
          <InputText {...inputTextConfig} />
          <br />
          <div>
            <button onClick={onSubmit}>Submit</button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}