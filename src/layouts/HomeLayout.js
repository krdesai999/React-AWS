import Footer from "../components/footer/Footer";
import Header from "../components/header/Header";
import { Outlet } from "react-router";

export default function HomeLayout() {
  return (
    <div className="Home flex flex-col h-screen justify-between">
      {/* Header */}
      <div className="h-10 headerContainer bg-opacity-1 bg-blue-900 w-full">
        <Header />
      </div>

      <main className="content mx-auto h-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
