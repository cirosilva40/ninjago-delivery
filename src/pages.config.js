import Dashboard from './pages/Dashboard';
import Pedidos from './pages/Pedidos';
import Entregadores from './pages/Entregadores';
import MapaTempoReal from './pages/MapaTempoReal';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import AppEntregador from './pages/AppEntregador';
import Produtos from './pages/Produtos';
import NovoPedido from './pages/NovoPedido';
import EntregadorDetalhe from './pages/EntregadorDetalhe';
import Pagamentos from './pages/Pagamentos';
import Cozinha from './pages/Cozinha';
import EntregasHoje from './pages/EntregasHoje';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Pedidos": Pedidos,
    "Entregadores": Entregadores,
    "MapaTempoReal": MapaTempoReal,
    "Relatorios": Relatorios,
    "Configuracoes": Configuracoes,
    "AppEntregador": AppEntregador,
    "Produtos": Produtos,
    "NovoPedido": NovoPedido,
    "EntregadorDetalhe": EntregadorDetalhe,
    "Pagamentos": Pagamentos,
    "Cozinha": Cozinha,
    "EntregasHoje": EntregasHoje,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};