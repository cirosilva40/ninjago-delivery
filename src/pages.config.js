/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcessoCliente from './pages/AcessoCliente';
import AcessoUsuario from './pages/AcessoUsuario';
import AcompanharPedido from './pages/AcompanharPedido';
import AdminUsers from './pages/AdminUsers';
import AppEntregador from './pages/AppEntregador';
import CardapioCliente from './pages/CardapioCliente';
import Configuracoes from './pages/Configuracoes';
import ConfiguracoesFinanceiras from './pages/ConfiguracoesFinanceiras';
import ControleComandas from './pages/ControleComandas';
import Cozinha from './pages/Cozinha';
import Dashboard from './pages/Dashboard';
import EntregadorDetalhe from './pages/EntregadorDetalhe';
import Entregadores from './pages/Entregadores';
import EntregasHoje from './pages/EntregasHoje';
import Financeiro from './pages/Financeiro';
import FluxoDeCaixa from './pages/FluxoDeCaixa';
import Home from './pages/Home';
import MapaTempoReal from './pages/MapaTempoReal';
import NotificacoesCliente from './pages/NotificacoesCliente';
import NovoPedido from './pages/NovoPedido';
import Pagamentos from './pages/Pagamentos';
import Pedidos from './pages/Pedidos';
import PerfilCliente from './pages/PerfilCliente';
import Produtos from './pages/Produtos';
import ProgramaFidelidade from './pages/ProgramaFidelidade';
import Relatorios from './pages/Relatorios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcessoCliente": AcessoCliente,
    "AcessoUsuario": AcessoUsuario,
    "AcompanharPedido": AcompanharPedido,
    "AdminUsers": AdminUsers,
    "AppEntregador": AppEntregador,
    "CardapioCliente": CardapioCliente,
    "Configuracoes": Configuracoes,
    "ConfiguracoesFinanceiras": ConfiguracoesFinanceiras,
    "ControleComandas": ControleComandas,
    "Cozinha": Cozinha,
    "Dashboard": Dashboard,
    "EntregadorDetalhe": EntregadorDetalhe,
    "Entregadores": Entregadores,
    "EntregasHoje": EntregasHoje,
    "Financeiro": Financeiro,
    "FluxoDeCaixa": FluxoDeCaixa,
    "Home": Home,
    "MapaTempoReal": MapaTempoReal,
    "NotificacoesCliente": NotificacoesCliente,
    "NovoPedido": NovoPedido,
    "Pagamentos": Pagamentos,
    "Pedidos": Pedidos,
    "PerfilCliente": PerfilCliente,
    "Produtos": Produtos,
    "ProgramaFidelidade": ProgramaFidelidade,
    "Relatorios": Relatorios,
}

export const pagesConfig = {
    mainPage: "CardapioCliente",
    Pages: PAGES,
    Layout: __Layout,
};