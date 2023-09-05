import "./App.css";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Authentication, { Auth } from "./components/Auth";
import HomeLayout from "./layouts/HomeLayout";
import Redirect from "./components/utils/Redirect";
import { pages } from "./components/utils/PageDirection";
import Form from "./pages/Form";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import AuthLayout from "./layouts/AuthLayout";
import ConfirmUser from "./pages/auth/ConfirmUser";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={
        <Auth>
          <HomeLayout />
        </Auth>
      }
    >
      {/* Redirect page for logged in or not users */}
      <Route
        index
        element={<Redirect login={pages.auth.login} to={pages.form} />}
      />

      {/* Main input form */}
      <Route path={pages.form} element={<Form />} />

      {/* Authentication pages */}
      <Route
        element={
          <Authentication>
            <AuthLayout />
          </Authentication>
        }
      >
        <Route path={pages.auth.login} element={<Login />} />
        <Route path={pages.auth.sign_up} element={<SignUp />} />
        <Route path={pages.auth.confirm_user} element={<ConfirmUser />} />
      </Route>
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
