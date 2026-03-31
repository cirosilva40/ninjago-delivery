import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Phone, Mail, MapPin, Eye, EyeOff } from 'lucide-react';

export default function ClientesTab({ pizzariaId }) {
  const [busca, setBusca] = useState('');
  const [senhasVisiveis, setSenhasVisiveis] = useState({});

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes-config', pizzariaId],
    enabled: !!pizzariaId,
    queryFn: () => base44.entities.Cliente.filter({ pizzaria_id: pizzariaId }, '-created_date', 200),
  });

  const clientesFiltrados = clientes.filter(c =>
    !busca ||
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSenha = (id) => setSenhasVisiveis(prev => ({ ...prev, [id]: !prev[id] }));
  const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Clientes</h2>
          <p className="text-slate-400 text-sm">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
        />
      </div>

      {clientesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clientesFiltrados.map(cliente => (
            <Card key={cliente.id} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">
                        {cliente.nome?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{cliente.nome}</p>
                      <p className="text-xs text-slate-400">Cadastrado em {formatarData(cliente.created_date)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{cliente.telefone || '-'}</span>
                    </div>
                    {cliente.email && (
                      <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-sm text-slate-300 truncate">{cliente.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 shrink-0">Senha:</span>
                      <span className="text-sm text-slate-300 font-mono">
                        {senhasVisiveis[cliente.id] ? (cliente.senha || '-') : '••••••'}
                      </span>
                      <button onClick={() => toggleSenha(cliente.id)} className="text-slate-500 hover:text-slate-300">
                        {senhasVisiveis[cliente.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-400">{cliente.total_pedidos || 0}</p>
                      <p className="text-xs text-slate-500">pedidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-400">{cliente.pontos_fidelidade || 0}</p>
                      <p className="text-xs text-slate-500">pontos</p>
                    </div>
                  </div>
                </div>

                {cliente.bairro && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-400">
                      {[cliente.endereco, cliente.numero, cliente.bairro, cliente.cidade].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}