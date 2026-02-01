import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Frown, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CardapioCliente() {
  const location = useLocation();
  const [restauranteId, setRestauranteId] = useState(null);
  const [estabelecimento, setEstabelecimento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('restauranteId');
    if (id) {
      setRestauranteId(id);
    } else {
      setError('ID do restaurante não fornecido na URL.');
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchEstabelecimento = async () => {
      if (!restauranteId) return;
      setLoading(true);
      setError(null);
      try {
        const estab = await base44.entities.Pizzaria.get(restauranteId);
        setEstabelecimento(estab);
      } catch (err) {
        console.error('Erro ao buscar estabelecimento:', err);
        setError('Não foi possível carregar os dados do estabelecimento.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstabelecimento();
  }, [restauranteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Carregando cardápio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Frown className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Erro ao carregar cardápio</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Store className="w-16 h-16 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Estabelecimento não encontrado</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">O ID do restaurante fornecido não corresponde a nenhum estabelecimento válido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
            {estabelecimento.logo_url && (
              <img 
                src={estabelecimento.logo_url} 
                alt={estabelecimento.nome_exibicao_cliente || estabelecimento.nome} 
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-orange-500 shadow-md" 
              />
            )}
            <CardTitle className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2">
              {estabelecimento.nome_exibicao_cliente || estabelecimento.nome || 'Cardápio Digital'}
            </CardTitle>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Bem-vindo ao nosso cardápio! Faça seu pedido.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">Produtos</h3>
            <p className="text-gray-700 dark:text-gray-300">Em breve, aqui você verá os produtos deste estabelecimento.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}