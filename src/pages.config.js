import Dashboard from './pages/Dashboard';
import Pedidos from './pages/Pedidos';
import Entregadores from './pages/Entregadores';
import MapaTempoReal from './pages/MapaTempoReal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Pedidos": Pedidos,
    "Entregadores": Entregadores,
    "MapaTempoReal": MapaTempoReal,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};