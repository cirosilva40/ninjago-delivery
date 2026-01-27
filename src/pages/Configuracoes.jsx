import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Settings,
  Store,
  MapPin,
  Clock,
  DollarSign,
  Bell,
  Users,
  Shield,
  Save,
  Upload,
  CreditCard,
  Truck,
  Pizza,
  Gift,
  Award,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CepInput, TelefoneInput, CnpjInput, CurrencyInput } from '@/components/ui/masked-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Configuracoes() {
  const [pizzaria, setPizzaria] = useState({
    nome: 'Minha Pizzaria',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    horario_abertura: '18:00',
    horario_fechamento: '23:00',
    taxa_entrega_base: 5,
    raio_entrega_km: 10,
    status: 'ativa',
    configuracoes: {
      aceitar_pix: true,
      aceitar_cartao: true,
      aceitar_dinheiro: true,
      tempo_medio_preparo: 30,
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRecompensaModal, setShowRecompensaModal] = useState(false);
  const [recompensaEditando, setRecompensaEditando] = useState(null);
  const [formRecompensa, setFormRecompensa] = useState({
    titulo: '',
    descricao: '',
    pontos_necessarios: 100,
    tipo: 'desconto_valor',
    valor_desconto: 0,
    imagem_url: '',
    validade_dias: 30,
    ativa: true,
  });

  const { data: pizzarias = [], refetch } = useQuery({
    queryKey: ['pizzarias'],
    queryFn: () => base44.entities.Pizzaria.list('-created_date', 1),
  });

  const { data: recompensas = [], refetch: refetchRecompensas } = useQuery({
    queryKey: ['recompensas-admin'],
    queryFn: () => base44.entities.Recompensa.list('-created_date'),
  });

  useEffect(() => {
    if (pizzarias.length > 0) {
      setPizzaria(pizzarias[0]);
    }
  }, [pizzarias]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (pizzarias.length > 0) {
        await base44.entities.Pizzaria.update(pizzarias[0].id, pizzaria);
      } else {
        await base44.entities.Pizzaria.create(pizzaria);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refetch();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key, value) => {
    setPizzaria(prev => ({
      ...prev,
      configuracoes: {
        ...prev.configuracoes,
        [key]: value,
      },
    }));
  };

  const handleSaveRecompensa = async () => {
    setLoading(true);
    try {
      if (recompensaEditando) {
        await base44.entities.Recompensa.update(recompensaEditando.id, formRecompensa);
      } else {
        await base44.entities.Recompensa.create(formRecompensa);
      }
      refetchRecompensas();
      setShowRecompensaModal(false);
      setRecompensaEditando(null);
      setFormRecompensa({
        titulo: '',
        descricao: '',
        pontos_necessarios: 100,
        tipo: 'desconto_valor',
        valor_desconto: 0,
        imagem_url: '',
        validade_dias: 30,
        ativa: true,
      });
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecompensa = async (id) => {
    if (!confirm('Deseja realmente excluir esta recompensa?')) return;
    try {
      await base44.entities.Recompensa.delete(id);
      refetchRecompensas();
    } catch (error) {
      console.error('Erro ao excluir recompensa:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400 mt-1">Gerencie as configurações da sua pizzaria</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={loading}
          className={`bg-gradient-to-r ${saved ? 'from-emerald-500 to-green-600' : 'from-orange-500 to-red-600'}`}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
        </Button>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="geral" className="data-[state=active]:bg-white/10">
            <Store className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="loja" className="data-[state=active]:bg-white/10">
            <Pizza className="w-4 h-4 mr-2" />
            Personalizar Minha Loja
          </TabsTrigger>
          <TabsTrigger value="entrega" className="data-[state=active]:bg-white/10">
            <Truck className="w-4 h-4 mr-2" />
            Entrega
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="data-[state=active]:bg-white/10">
            <CreditCard className="w-4 h-4 mr-2" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="data-[state=active]:bg-white/10">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="data-[state=active]:bg-white/10">
            <Settings className="w-4 h-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="fidelidade" className="data-[state=active]:bg-white/10">
            <Gift className="w-4 h-4 mr-2" />
            Programa de Fidelidade
          </TabsTrigger>
        </TabsList>

        {/* Tab Geral */}
        <TabsContent value="geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dados da Pizzaria */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Pizza className="w-5 h-5 text-orange-500" />
                  Meus Dados
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Informações básicas do estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-slate-400">Nome do Estabelecimento</Label>
                    <Input
                      value={pizzaria.nome}
                      onChange={(e) => setPizzaria({ ...pizzaria, nome: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">CNPJ</Label>
                    <CnpjInput
                      value={pizzaria.cnpj}
                      onChange={(e) => setPizzaria({ ...pizzaria, cnpj: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Telefone</Label>
                    <TelefoneInput
                      value={pizzaria.telefone}
                      onChange={(e) => setPizzaria({ ...pizzaria, telefone: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-400">Email</Label>
                    <Input
                      type="email"
                      value={pizzaria.email}
                      onChange={(e) => setPizzaria({ ...pizzaria, email: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  Endereço
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Localização do estabelecimento (usado no mapa ao vivo)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400">Endereço Completo</Label>
                  <Input
                    value={pizzaria.endereco}
                    onChange={(e) => setPizzaria({ ...pizzaria, endereco: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Rua, número"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">Cidade</Label>
                    <Input
                      value={pizzaria.cidade}
                      onChange={(e) => setPizzaria({ ...pizzaria, cidade: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Estado</Label>
                    <Select 
                      value={pizzaria.estado} 
                      onValueChange={(v) => setPizzaria({ ...pizzaria, estado: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="PR">PR</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="RS">RS</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                        <SelectItem value="PE">PE</SelectItem>
                        <SelectItem value="CE">CE</SelectItem>
                        <SelectItem value="GO">GO</SelectItem>
                        <SelectItem value="DF">DF</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="MS">MS</SelectItem>
                        <SelectItem value="PA">PA</SelectItem>
                        <SelectItem value="AM">AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-400">CEP</Label>
                    <CepInput
                      value={pizzaria.cep}
                      onChange={(e) => setPizzaria({ ...pizzaria, cep: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card className="bg-white/5 border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-slate-400">Abertura</Label>
                    <Input
                      type="time"
                      value={pizzaria.horario_abertura}
                      onChange={(e) => setPizzaria({ ...pizzaria, horario_abertura: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Fechamento</Label>
                    <Input
                      type="time"
                      value={pizzaria.horario_fechamento}
                      onChange={(e) => setPizzaria({ ...pizzaria, horario_fechamento: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Tempo Médio Preparo (min)</Label>
                    <Input
                      type="number"
                      value={pizzaria.configuracoes?.tempo_medio_preparo || 30}
                      onChange={(e) => updateConfig('tempo_medio_preparo', parseInt(e.target.value))}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400">Status</Label>
                    <Select 
                      value={pizzaria.status} 
                      onValueChange={(v) => setPizzaria({ ...pizzaria, status: v })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
                        <SelectItem value="suspensa">Suspensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Personalizar Minha Loja */}
        <TabsContent value="loja" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Personalizar Minha Loja
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure a aparência da sua loja para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div>
                <Label className="text-slate-400">Logo da Loja</Label>
                <div className="flex items-center gap-4 mt-2">
                  {pizzaria.logo_url && (
                    <img 
                      src={pizzaria.logo_url} 
                      alt="Logo" 
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white/10"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      value={pizzaria.logo_url || ''}
                      onChange={(e) => setPizzaria({ ...pizzaria, logo_url: e.target.value })}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                      placeholder="URL da logo (ex: https://exemplo.com/logo.png)"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLoading(true);
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              setPizzaria({ ...pizzaria, logo_url: file_url });
                            } catch (error) {
                              console.error('Erro ao fazer upload:', error);
                              alert('Erro ao fazer upload da imagem');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <Upload className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Cole a URL ou faça upload da sua logo
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome de Exibição */}
              <div>
                <Label className="text-slate-400">Nome da Loja (exibido para clientes)</Label>
                <Input
                  value={pizzaria.nome_exibicao_cliente || pizzaria.nome}
                  onChange={(e) => setPizzaria({ ...pizzaria, nome_exibicao_cliente: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: Pizzaria do João"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Este nome aparecerá no cardápio para os clientes
                </p>
              </div>

              {/* Tema do Cliente */}
              <div>
                <Label className="text-slate-400 mb-3 block">Tema da Loja do Cliente</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPizzaria({ ...pizzaria, tema_cliente: 'dark' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      (pizzaria.tema_cliente || 'dark') === 'dark'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-slate-900 border border-slate-700 mb-3 flex items-center justify-center">
                      <Pizza className="w-8 h-8 text-orange-500" />
                    </div>
                    <p className="font-medium text-white">Tema Escuro</p>
                    <p className="text-xs text-slate-400">Fundo escuro, letras claras</p>
                  </button>

                  <button
                    onClick={() => setPizzaria({ ...pizzaria, tema_cliente: 'light' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      pizzaria.tema_cliente === 'light'
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg bg-gray-50 border border-gray-300 mb-3 flex items-center justify-center">
                      <Pizza className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="font-medium text-white">Tema Claro</p>
                    <p className="text-xs text-slate-400">Fundo claro, letras escuras</p>
                  </button>
                </div>
              </div>

              {/* Cor Primária */}
              <div>
                <Label className="text-slate-400">Cor Primária da Loja</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="color"
                    value={pizzaria.cor_primaria_cliente || '#f97316'}
                    onChange={(e) => setPizzaria({ ...pizzaria, cor_primaria_cliente: e.target.value })}
                    className="w-20 h-12 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <Input
                    value={pizzaria.cor_primaria_cliente || '#f97316'}
                    onChange={(e) => setPizzaria({ ...pizzaria, cor_primaria_cliente: e.target.value })}
                    className="flex-1 bg-slate-800 border-slate-700 text-white"
                    placeholder="#f97316"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Esta cor será usada nos botões e destaques da loja
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300 mb-2">💡 Prévia</p>
                <p className="text-xs text-slate-400">
                  Após salvar, acesse a página de cardápio do cliente para ver as mudanças aplicadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Entrega */}
        <TabsContent value="entrega" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                Configurações de Entrega
              </CardTitle>
              <CardDescription className="text-slate-400">
                Defina as regras de entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <Label className="text-slate-400">Taxa de Entrega Base (R$)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={pizzaria.taxa_entrega_base}
                    onChange={(e) => setPizzaria({ ...pizzaria, taxa_entrega_base: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Valor cobrado dentro do raio base</p>
                </div>
                <div>
                  <Label className="text-slate-400">Raio Base (km)</Label>
                  <Input
                    type="number"
                    value={pizzaria.raio_entrega_km}
                    onChange={(e) => setPizzaria({ ...pizzaria, raio_entrega_km: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Distância coberta pela taxa base</p>
                </div>
                <div>
                  <Label className="text-slate-400">Taxa Adicional por KM (R$)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={pizzaria.taxa_adicional_por_km || 0}
                    onChange={(e) => setPizzaria({ ...pizzaria, taxa_adicional_por_km: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">Valor por km além do raio base</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  💡 Cálculo Automático de Taxa
                </h4>
                <p className="text-sm text-slate-400 mb-2">
                  A taxa de entrega será calculada automaticamente com base na distância real entre seu estabelecimento e o endereço do cliente.
                </p>
                <div className="text-sm text-slate-300 space-y-1">
                  <p><strong>Exemplo:</strong></p>
                  <p>• Taxa base: R$ {pizzaria.taxa_entrega_base?.toFixed(2) || '0.00'} (até {pizzaria.raio_entrega_km || 0} km)</p>
                  <p>• Taxa adicional: R$ {pizzaria.taxa_adicional_por_km?.toFixed(2) || '0.00'} por km adicional</p>
                  <p className="pt-2 text-emerald-400">
                    Cliente a 15 km = R$ {(pizzaria.taxa_entrega_base + ((15 - pizzaria.raio_entrega_km) * (pizzaria.taxa_adicional_por_km || 0))).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pagamento */}
        <TabsContent value="pagamento" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                Formas de Pagamento
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure as formas de pagamento aceitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Dinheiro</p>
                      <p className="text-sm text-slate-400">Pagamento em espécie</p>
                    </div>
                  </div>
                  <Switch
                    checked={pizzaria.configuracoes?.aceitar_dinheiro}
                    onCheckedChange={(checked) => updateConfig('aceitar_dinheiro', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-500 font-bold text-sm">PIX</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">PIX</p>
                      <p className="text-sm text-slate-400">Transferência instantânea</p>
                    </div>
                  </div>
                  <Switch
                    checked={pizzaria.configuracoes?.aceitar_pix}
                    onCheckedChange={(checked) => updateConfig('aceitar_pix', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Cartão</p>
                      <p className="text-sm text-slate-400">Crédito ou débito na entrega</p>
                    </div>
                  </div>
                  <Switch
                    checked={pizzaria.configuracoes?.aceitar_cartao}
                    onCheckedChange={(checked) => updateConfig('aceitar_cartao', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure quando e como receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Novos Pedidos</p>
                    <p className="text-sm text-slate-400">Notificar quando um novo pedido chegar</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Entrega Concluída</p>
                    <p className="text-sm text-slate-400">Notificar quando uma entrega for finalizada</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Problemas na Entrega</p>
                    <p className="text-sm text-slate-400">Alertar sobre atrasos ou problemas</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium text-white">Relatórios Diários</p>
                    <p className="text-sm text-slate-400">Receber resumo do dia por email</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Aparência */}
        <TabsContent value="aparencia" className="space-y-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Tema do Sistema
              </CardTitle>
              <CardDescription className="text-slate-400">
                Escolha o tema visual da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'dark');
                    window.location.reload();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    (localStorage.getItem('theme') || 'dark') === 'dark'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-full h-20 rounded-lg bg-slate-900 border border-slate-700 mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 rounded bg-orange-500" />
                  </div>
                  <p className="font-medium text-white">Tema Escuro</p>
                  <p className="text-xs text-slate-400">Interface escura padrão</p>
                </button>

                <button
                  onClick={() => {
                    localStorage.setItem('theme', 'light');
                    window.location.reload();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    localStorage.getItem('theme') === 'light'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="w-full h-20 rounded-lg bg-gray-100 border border-gray-300 mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 rounded bg-orange-500" />
                  </div>
                  <p className="font-medium text-white">Tema Claro</p>
                  <p className="text-xs text-slate-400">Interface clara</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Programa de Fidelidade */}
        <TabsContent value="fidelidade" className="space-y-6">
          {/* Regras de Pontuação */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Regras de Pontuação
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure como os clientes ganham pontos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  ⭐ Sistema de Pontos Atual
                </h4>
                <p className="text-sm text-slate-300">
                  • 1 ponto = R$ 1,00 gasto no pedido
                </p>
                <p className="text-sm text-slate-300">
                  • Pontos são acumulados automaticamente em cada pedido finalizado
                </p>
                <p className="text-sm text-slate-300">
                  • Válido apenas para clientes cadastrados
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/5">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">1:1</div>
                  <p className="text-sm text-slate-400 mt-1">R$ 1 = 1 ponto</p>
                </div>
                <div className="text-center border-l border-r border-white/10">
                  <div className="text-3xl font-bold text-emerald-500">+{recompensas.length}</div>
                  <p className="text-sm text-slate-400 mt-1">Recompensas ativas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">30d</div>
                  <p className="text-sm text-slate-400 mt-1">Validade padrão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recompensas */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
                    Recompensas Disponíveis
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Gerencie as recompensas que os clientes podem resgatar
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setRecompensaEditando(null);
                    setFormRecompensa({
                      titulo: '',
                      descricao: '',
                      pontos_necessarios: 100,
                      tipo: 'desconto_valor',
                      valor_desconto: 0,
                      imagem_url: '',
                      validade_dias: 30,
                      ativa: true,
                    });
                    setShowRecompensaModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Recompensa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recompensas.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Nenhuma recompensa cadastrada</p>
                  <p className="text-sm text-slate-500 mt-2">Comece adicionando sua primeira recompensa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recompensas.map((recompensa) => (
                    <div
                      key={recompensa.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      {recompensa.imagem_url && (
                        <img
                          src={recompensa.imagem_url}
                          alt={recompensa.titulo}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{recompensa.titulo}</h3>
                          {!recompensa.ativa && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                              Inativa
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{recompensa.descricao}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-orange-500" />
                            {recompensa.pontos_necessarios} pontos
                          </span>
                          {recompensa.tipo === 'desconto_valor' && (
                            <span className="text-emerald-400">
                              R$ {recompensa.valor_desconto?.toFixed(2)} de desconto
                            </span>
                          )}
                          {recompensa.tipo === 'desconto_percentual' && (
                            <span className="text-emerald-400">
                              {recompensa.valor_desconto}% de desconto
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRecompensaEditando(recompensa);
                            setFormRecompensa(recompensa);
                            setShowRecompensaModal(true);
                          }}
                          className="border-slate-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRecompensa(recompensa.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Recompensa */}
      <Dialog open={showRecompensaModal} onOpenChange={setShowRecompensaModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {recompensaEditando ? 'Editar Recompensa' : 'Nova Recompensa'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-400">Título da Recompensa</Label>
              <Input
                value={formRecompensa.titulo}
                onChange={(e) => setFormRecompensa({ ...formRecompensa, titulo: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ex: 10 reais de desconto"
              />
            </div>

            <div>
              <Label className="text-slate-400">Descrição</Label>
              <Textarea
                value={formRecompensa.descricao}
                onChange={(e) => setFormRecompensa({ ...formRecompensa, descricao: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Descreva os detalhes da recompensa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Pontos Necessários</Label>
                <Input
                  type="number"
                  value={formRecompensa.pontos_necessarios}
                  onChange={(e) => setFormRecompensa({ ...formRecompensa, pontos_necessarios: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-400">Tipo de Recompensa</Label>
                <Select
                  value={formRecompensa.tipo}
                  onValueChange={(v) => setFormRecompensa({ ...formRecompensa, tipo: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="desconto_valor">Desconto em R$</SelectItem>
                    <SelectItem value="desconto_percentual">Desconto em %</SelectItem>
                    <SelectItem value="produto_gratis">Produto Grátis</SelectItem>
                    <SelectItem value="entrega_gratis">Entrega Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formRecompensa.tipo === 'desconto_valor' || formRecompensa.tipo === 'desconto_percentual') && (
                <div>
                  <Label className="text-slate-400">
                    Valor do Desconto {formRecompensa.tipo === 'desconto_percentual' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    type="number"
                    step="0.50"
                    value={formRecompensa.valor_desconto}
                    onChange={(e) => setFormRecompensa({ ...formRecompensa, valor_desconto: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}

              <div>
                <Label className="text-slate-400">Validade (dias)</Label>
                <Input
                  type="number"
                  value={formRecompensa.validade_dias}
                  onChange={(e) => setFormRecompensa({ ...formRecompensa, validade_dias: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-400">URL da Imagem (opcional)</Label>
              <Input
                value={formRecompensa.imagem_url}
                onChange={(e) => setFormRecompensa({ ...formRecompensa, imagem_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium text-white">Recompensa Ativa</p>
                <p className="text-sm text-slate-400">Disponível para resgate pelos clientes</p>
              </div>
              <Switch
                checked={formRecompensa.ativa}
                onCheckedChange={(checked) => setFormRecompensa({ ...formRecompensa, ativa: checked })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRecompensaModal(false)}
                className="flex-1 border-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRecompensa}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {loading ? 'Salvando...' : 'Salvar Recompensa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}