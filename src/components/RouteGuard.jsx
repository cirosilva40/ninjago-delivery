import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Páginas totalmente públicas (sem nenhuma autenticação)
const PUBLIC_PAGES = [
  'CardapioCliente',
  'AcompanharPedido',
  'AcessoCliente',
  'AcessoUsuario',
  'AcessoAdmin',
  'AppEntregador',
  'Home',
  'PagamentoSucesso',
  'PagamentoFalha',
  'NotificacoesCliente',
  'PerfilCliente',
  'CriarNovaSenha',
];

// Páginas exclusivas do painel do estabelecimento (requer estabelecimento_logado)
const ESTABELECIMENTO_PAGES = [
  'Pedidos',
  'NovoPedido',
  'Cozinha',
  'Produtos',
  'MapaTempoReal',
  'Entregadores',
  'Financeiro',
  'Relatorios',
  'Configuracoes',
  'Dashboard',
  'EntregadoresDetalhe',
  'EntregasHoje',
  'ConfiguracoesFinanceiras',
  'ControleComandas',
  'FluxoDeCaixa',
  'Pagamentos',
  'ProgramaFidelidade',
  'EntregadorDetalhe',
];

export function useRouteGuard(currentPageName) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = () => {
      // Páginas públicas: sempre libera
      if (PUBLIC_PAGES.includes(currentPageName)) {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      // Páginas do painel do estabelecimento
      if (ESTABELECIMENTO_PAGES.includes(currentPageName)) {
        const estabelecimento = localStorage.getItem('estabelecimento_logado');
        if (!estabelecimento) {
          navigate(createPageUrl('AcessoUsuario'));
          return;
        }
        setAuthorized(true);
        setChecking(false);
        return;
      }

      // Qualquer outra página não mapeada: redireciona para login do estabelecimento
      const estabelecimento = localStorage.getItem('estabelecimento_logado');
      if (!estabelecimento) {
        navigate(createPageUrl('AcessoUsuario'));
        return;
      }

      setAuthorized(true);
      setChecking(false);
    };

    check();
  }, [currentPageName]);

  return { authorized, checking };
}