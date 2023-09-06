import { Navigate } from "react-router-dom";
import { useAuth } from "../components/Auth";
import { pages } from "../components/utils/PageDirection";

export default function Form() {
  const auth = useAuth();

  if (auth.user) {
    if (!auth.user.verified) return <Navigate to={pages.auth.confirm_user} />;
  }

  return (
    <div className="form">
      <h1>Input form</h1>
    </div>
  );
}
