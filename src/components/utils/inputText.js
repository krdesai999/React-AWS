import { useFormContext } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";

function InputError(id, message) {
  return (
    <>
      {message && (
        <div className={"error " + id}>
          Error:{message}
        </div>
      )}
    </>
  );
}

export default function InputText({
  label,
  id,
  placeholder,
  validation,
  password = false,
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <label htmlFor={id} className={id}>
        {label}
      </label>
      <input
        type={password ? "password" : "text"}
        className={id}
        placeholder={placeholder}
        {...register(id, validation)}
      />
      <ErrorMessage
        errors={errors}
        name={id}
        render={({ message }) => InputError(id, message)}
      />
    </>
  );
}

InputText.defaultProps = {
  label: "Default label",
  id: "defaultId",
  placeholder: "Default Placeholder",
  validation: {},
};
