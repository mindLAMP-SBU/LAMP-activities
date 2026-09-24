import useHashRoute from "../hooks/useHashRoute";
import Home from "../pages/Home";
import ModuleOne from "../pages/ModuleOne";


export default function AppRoutes() {
  const route = useHashRoute();

  if (route === "/") return <Home />;
  if (route === "/module-one") return <ModuleOne />;
  // if (route === "/module-two") return <ModuleTwo />;

  return <div>Not Found</div>;
}