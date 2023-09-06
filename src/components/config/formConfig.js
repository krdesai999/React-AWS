export const userNameConfig = {
  label: "Email",
  id: "email",
  type: "text",
  placeholder: "Enter email",
  validation: {
    required: {
      value: true,
      message: "Email is required",
    },
    minLength: {
      value: 5,
      message: "Min length 5 required",
    },
    pattern: {
      value: /^[a-z0-9_-]+@[\w]{1,}\.[a-z]{2,}$/,
      message: "Invalid email address",
    },
  },
};

export const passwordConfig = {
  label: "Password",
  id: "password",
  placeholder: "Enter Password",
  type: "password",
  validation: {
    required: {
      value: true,
      message: "Password is required",
    },
    minLength: {
      value: 6,
      message: "Min length 6 required",
    },
    validate: {
      uppercase: (v) => /[A-Z]/.test(v) || "should contain uppercase",
      lowercase: (v) => /[a-z]/.test(v) || "should contain lowercase",
      digit: (v) => /[0-9]/.test(v) || "should contain a digit",
      specialcharacter: (v) =>
        /[@_$#^]/.test(v) || "should contain a special character @_$#^",
      notcontainArrows: (v) => !/[<>]/.test(v) || "should not contain < >",
    },
  },
};

export const verificationCodeConfig = {
  label: "Confirmation code",
  id: "confirmationCode",
  type: "text",
  placeholder: "Enter verification code",
  validation: {
    required: {
      value: true,
      message: "User verification code is required",
    },
    pattern: {
      value: /^[0-9]+$/,
      message: "Only numbers allowed!",
    },
  },
};

export const inputTextConfig = {
  label: "Input text",
  id: "inputText",
  placeholder: "Enter input text",
  type: "text",
  validation: {
    required: {
      value: true,
      message: "Input text is required",
    },
    pattern: {
      value: /^[a-zA-Z0-9\s]+$/,
      message: "Only alphanumeric and space is allowed!",
    },
  },
};

export const fileUploadConfig = {
  label: "File upload",
  id: "fileUpload",
  type: "file",
  validation: {
    required: {
      value: true,
      message: "File is required",
    },
    validate: (value) => {
      const acceptedFormats = ["txt"];
      const fileExtension = value[0]?.name.split(".").pop().toLowerCase();
      if (!acceptedFormats.includes(fileExtension)) {
        return "Invalid file format. Only txt files are allowed.";
      }
      return true;
    },
  },
};