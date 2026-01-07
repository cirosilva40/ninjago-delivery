import AcompanharPedido from './pages/AcompanharPedido';
import AdminUsers from './pages/AdminUsers';
import AppEntregador from './pages/AppEntregador';
import CardapioCliente from './pages/CardapioCliente';
import Configuracoes from './pages/Configuracoes';
import Cozinha from './pages/Cozinha';
import Dashboard from './pages/Dashboard';
import EntregadorDetalhe from './pages/EntregadorDetalhe';
import Entregadores from './pages/Entregadores';
import EntregasHoje from './pages/EntregasHoje';
import Home from './pages/Home';
import MapaTempoReal from './pages/MapaTempoReal';
import NovoPedido from './pages/NovoPedido';
import Pagamentos from './pages/Pagamentos';
import Pedidos from './pages/Pedidos';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcompanharPedido": AcompanharPedido,
    "AdminUsers": AdminUsers,
    "AppEntregador": AppEntregador,
    "CardapioCliente": CardapioCliente,
    "Configuracoes": Configuracoes,
    "Cozinha": Cozinha,
    "Dashboard": Dashboard,
    "EntregadorDetalhe": EntregadorDetalhe,
    "Entregadores": Entregadores,
    "EntregasHoje": EntregasHoje,
    "Home": Home,
    "MapaTempoReal": MapaTempoReal,
    "NovoPedido": NovoPedido,
    "Pagamentos": Pagamentos,
    "Pedidos": Pedidos,
    "Produtos": Produtos,
    "Relatorios": Relatorios,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};