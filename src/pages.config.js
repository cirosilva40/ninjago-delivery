import Dashboard from './pages/Dashboard';
import Pedidos from './pages/Pedidos';
import Entregadores from './pages/Entregadores';
import MapaTempoReal from './pages/MapaTempoReal';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import AppEntregador from './pages/AppEntregador';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Pedidos": Pedidos,
    "Entregadores": Entregadores,
    "MapaTempoReal": MapaTempoReal,
    "Relatorios": Relatorios,
    "Configuracoes": Configuracoes,
    "AppEntregador": AppEntregador,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};