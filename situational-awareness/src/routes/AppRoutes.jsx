import useHashRoute from "../hooks/useHashRoute";
import Home from "../pages/Home";
import ModuleOne from "../pages/ModuleOne";
import ModuleThree from "../pages/ModuleThree";
import ModuleTwo from "../pages/ModuleTwo";


export default function AppRoutes() {
  const route = useHashRoute();

  if (route === "/") return <Home />;
  if (route === "/module-one") return <ModuleOne />;
  if (route === "/module-two") return <ModuleTwo />;
  if (route === "/module-three") return <ModuleThree />;

  return <div>Not Found</div>;
}