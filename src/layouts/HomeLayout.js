import Header from "../components/header/Header";
import { Outlet } from "react-router";

export default function HomeLayout() {
  return (
    <div className="Home">
      {/* Header */}
      <div className="headerContainer bg-opacity-1 bg-blue-900 w-full">
        <Header />
      </div>

        <main className="content">
          <Outlet />
        </main>
    </div>
  );
}
