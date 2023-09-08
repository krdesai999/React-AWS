import { useFormContext } from "react-hook-form";
import { ErrorMessage } from "@hookform/error-message";

function InputError(id, message) {
  return (
    <>
      {message && (
        <div
          className={
            "block mb-2 text-sm font-medium text-red-700 dark:text-red-500 error " +
            id
          }
        >
          Ooops! {message}
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
  type,
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div class="mb-6">
      <label
        htmlFor={id}
        className={
          "block mb-2 text-sm font-medium text-gray-900 dark:text-white " + id
        }
      >
        {label}
      </label>
      <input
        type={type}
        className={
          "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 " +
          id
        }
        placeholder={placeholder}
        {...register(id, validation)}
      />
      <ErrorMessage
        errors={errors}
        name={id}
        render={({ message }) => InputError(id, message)}
      />
    </div>
  );
}

InputText.defaultProps = {
  label: "Default label",
  id: "defaultId",
  placeholder: "Default Placeholder",
  validation: {},
};
