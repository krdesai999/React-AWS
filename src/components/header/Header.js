import { NavLink } from "react-router-dom";
import { pages } from "../utils/PageDirection";
import { useAuth } from "../Auth";

export default function Header() {
  const auth = useAuth();
  return (
    <header>
      Fovus Keyur desai project
      <nav>
        <ul>
          {!auth.user ? (
            <div className="flex my-1">
              <NavLink to={pages.auth.login} className="cursor-pointer btn">
                Login
              </NavLink>
              <NavLink
                to={pages.auth.sign_up}
                className="ml-1 mr-1 cursor-pointer btn"
              >
                SignUp
              </NavLink>
            </div>
          ) : !auth.user.authorizationToken ? (
            <div>
              <NavLink
                to={pages.auth.confirm_user}
                className="ml-1 mr-1 cursor-pointer btn"
              >
                Confirm user
              </NavLink>
            </div>
          ) : (
            <div className="profile-pic">
              <NavLink to={pages.form}>Form</NavLink>
              <button onClick={auth.logout}>Logout</button>
            </div>
          )}
        </ul>
      </nav>
    </header>
  );
}
