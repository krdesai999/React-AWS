export const userNameConfig = {
  label: "Email",
  id: "email",
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
  password: true,
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
  label: "Verification code",
  id: "verification-code",
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
