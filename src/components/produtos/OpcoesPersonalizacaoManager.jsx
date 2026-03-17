import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, DollarSign, Copy, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function OpcoesPersonalizacaoManager({ opcoes = [], onChange }) {
  const addGrupo = () => {
    const novoGrupo = {
      nome_grupo: '',
      obrigatorio: false,
      min_selecoes: 0,
      max_selecoes: 3,
      permite_precificacao: false,
      itens: []
    };
    onChange([...opcoes, novoGrupo]);
  };

  const removeGrupo = (index) => {
    const novasOpcoes = opcoes.filter((_, i) => i !== index);
    onChange(novasOpcoes);
  };

  const updateGrupo = (index, campo, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[index] = { ...novasOpcoes[index], [campo]: valor };
    onChange(novasOpcoes);
  };

  const addItem = (grupoIndex) => {
    const novasOpcoes = [...opcoes];
    const novoItem = { nome: '', preco_adicional: 0, disponivel: true };
    novasOpcoes[grupoIndex].itens = [...(novasOpcoes[grupoIndex].itens || []), novoItem];
    onChange(novasOpcoes);
  };

  const removeItem = (grupoIndex, itemIndex) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[grupoIndex].itens = novasOpcoes[grupoIndex].itens.filter((_, i) => i !== itemIndex);
    onChange(novasOpcoes);
  };

  const updateItem = (grupoIndex, itemIndex, campo, valor) => {
    const novasOpcoes = [...opcoes];
    novasOpcoes[grupoIndex].itens[itemIndex] = {
      ...novasOpcoes[grupoIndex].itens[itemIndex],
      [campo]: valor
    };
    onChange(novasOpcoes);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-slate-300 text-base">Complementos e Adicionais</Label>
          <p className="text-xs text-slate-500 mt-1">Configure grupos de opções para personalização do produto</p>
        </div>
        <Button
          type="button"
          onClick={addGrupo}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Grupo
        </Button>
      </div>

      {opcoes.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
          <p className="text-slate-500 mb-2">Nenhum grupo de complementos cadastrado</p>
          <p className="text-xs text-slate-600">Clique em "Novo Grupo" para adicionar complementos ou adicionais</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opcoes.map((grupo, grupoIndex) => (
            <Card key={grupoIndex} className="bg-slate-800/50 border-slate-700 p-4">
              <div className="space-y-4">
                {/* Header do Grupo */}
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-slate-500 mt-2 cursor-move" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={grupo.nome_grupo}
                        onChange={(e) => updateGrupo(grupoIndex, 'nome_grupo', e.target.value)}
                        className="bg-slate-900 border-slate-600 text-white flex-1"
                        placeholder="Nome do grupo (ex: Complementos Grátis)"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeGrupo(grupoIndex)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Configurações do Grupo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">Mín. itens</Label>
                        <Input
                          type="number"
                          min="0"
                          value={grupo.min_selecoes}
                          onChange={(e) => updateGrupo(grupoIndex, 'min_selecoes', parseInt(e.target.value) || 0)}
                          className="bg-slate-900 border-slate-600 text-white h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Máx. itens</Label>
                        <Input
                          type="number"
                          min="1"
                          value={grupo.max_selecoes}
                          onChange={(e) => updateGrupo(grupoIndex, 'max_selecoes', parseInt(e.target.value) || 1)}
                          className="bg-slate-900 border-slate-600 text-white h-9"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                      <Label className="text-xs text-slate-400">Permite precificar itens</Label>
                      <Switch
                        checked={grupo.permite_precificacao}
                        onCheckedChange={(v) => updateGrupo(grupoIndex, 'permite_precificacao', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                      <Label className="text-xs text-slate-400">Seleção obrigatória</Label>
                      <Switch
                        checked={grupo.obrigatorio}
                        onCheckedChange={(v) => updateGrupo(grupoIndex, 'obrigatorio', v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Itens do Grupo */}
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Itens do grupo</Label>
                    <Button
                      type="button"
                      onClick={() => addItem(grupoIndex)}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 h-7 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  {(grupo.itens || []).length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">Nenhum item adicionado</p>
                  ) : (
                    <div className="space-y-2">
                      {grupo.itens.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
                          <Input
                            value={item.nome}
                            onChange={(e) => updateItem(grupoIndex, itemIndex, 'nome', e.target.value)}
                            className="flex-1 bg-slate-800 border-slate-600 text-white h-8 text-sm"
                            placeholder="Nome do item (ex: M&M)"
                          />
                          
                          {grupo.permite_precificacao && (
                            <div className="flex items-center gap-1 w-28">
                              <DollarSign className="w-3 h-3 text-slate-500" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.preco_adicional}
                                onChange={(e) => updateItem(grupoIndex, itemIndex, 'preco_adicional', parseFloat(e.target.value) || 0)}
                                className="bg-slate-800 border-slate-600 text-white h-8 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Switch
                              checked={item.disponivel}
                              onCheckedChange={(v) => updateItem(grupoIndex, itemIndex, 'disponivel', v)}
                              className="scale-75"
                            />
                            <span className="text-xs text-slate-500 hidden sm:inline">
                              {item.disponivel ? '✓' : '✗'}
                            </span>
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(grupoIndex, itemIndex)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {opcoes.length > 0 && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-300">
            💡 <strong>Dica:</strong> Use "Complementos Grátis" para itens inclusos (até 3) e "Adicionais" para cobrar por extras.
          </p>
        </div>
      )}
    </div>
  );
}