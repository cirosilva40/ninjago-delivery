import React from 'react';
import { Users, Shield, User, Building2, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CpfInput, CnpjInput, TelefoneInput, CurrencyInput } from '@/components/ui/masked-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ModalCadastroUsuario({ open, onOpenChange, form, setForm, onSubmit, loading, success, uploadingFoto, onFotoUpload }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Cadastrar Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Tipo de Pessoa */}
          <div>
            <Label className="text-slate-400 mb-3 block">Tipo de Pessoa</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, tipo_pessoa: 'fisica' })}
                className={`p-4 rounded-xl border-2 transition-all ${form.tipo_pessoa === 'fisica' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
                <User className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <p className="text-white font-medium">Pessoa Física</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, tipo_pessoa: 'juridica' })}
                className={`p-4 rounded-xl border-2 transition-all ${form.tipo_pessoa === 'juridica' ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
                <Building2 className="w-6 h-6 mx-auto mb-2 text-orange-400" />
                <p className="text-white font-medium">Pessoa Jurídica</p>
              </button>
            </div>
          </div>

          {/* Dados */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-orange-400" />
              Dados {form.tipo_pessoa === 'fisica' ? 'Pessoais' : 'da Empresa'}
            </h3>
            {/* Upload de Foto */}
            <div>
              <Label className="text-slate-400 mb-3 block">Foto de Perfil</Label>
              <div className="flex items-center gap-4">
                {form.foto_url ? (
                  <div className="relative">
                    <img src={form.foto_url} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-slate-700" />
                    <button type="button" onClick={() => setForm({ ...form, foto_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <div>
                  <input type="file" id="foto-usuario-upload" accept="image/*" onChange={onFotoUpload} className="hidden" disabled={uploadingFoto} />
                  <Button type="button" variant="outline" className="border-slate-600 text-slate-100 cursor-pointer" disabled={uploadingFoto} onClick={() => document.getElementById('foto-usuario-upload').click()}>
                    {uploadingFoto ? 'Enviando...' : form.foto_url ? 'Alterar Foto' : 'Upload da Foto'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-400">{form.tipo_pessoa === 'fisica' ? 'Nome Completo' : 'Razão Social'}</Label>
                <Input value={form.nome_completo} onChange={(e) => setForm({ ...form, nome_completo: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">{form.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}</Label>
                {form.tipo_pessoa === 'fisica' ? (
                  <CpfInput value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                ) : (
                  <CnpjInput value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                )}
              </div>
              <div>
                <Label className="text-slate-400">Telefone</Label>
                <TelefoneInput value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-400">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="usuario@exemplo.com" />
              </div>
            </div>
          </div>

          {/* Plano e Pagamento */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              Pagamento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Data de Pagamento</Label>
                <Input type="date" value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-400">Valor (R$)</Label>
                <CurrencyInput value={form.valor_pagamento} onChange={(e) => setForm({ ...form, valor_pagamento: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-400">Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Nível de Acesso */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              Nível de Acesso
            </h3>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              📧 Um email será enviado para <strong>{form.email || 'o endereço informado'}</strong> com instruções de acesso.
            </p>
            {form.role === 'admin' && (
              <p className="text-sm text-yellow-300 mt-2">⚠️ O usuário será convidado como Usuário comum. Após aceitar, você poderá promovê-lo a Administrador.</p>
            )}
          </div>

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-sm text-emerald-300 font-medium">✅ Usuário cadastrado com sucesso!</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300">Cancelar</Button>
            <Button onClick={onSubmit} disabled={!form.email || !form.nome_completo || loading || success} className="bg-gradient-to-r from-orange-500 to-red-600">
              {loading ? 'Cadastrando...' : success ? 'Cadastrado!' : 'Cadastrar Usuário'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}