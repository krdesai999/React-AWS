const rootPages = {
    auth: "/auth",
    form: "/form",
}

export const pages = {
    ...rootPages,
  auth: {
    login: rootPages.auth + "/login",
    sign_up: rootPages.auth + "/sign-up",
    confirm_user: rootPages.auth + "/confirm-user",
  },
};