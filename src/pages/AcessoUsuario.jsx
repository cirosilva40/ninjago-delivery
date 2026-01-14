import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AcessoUsuario() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('login'); // 'login', 'primeiro-acesso', 'recuperar-senha'
  const [etapa, setEtapa] = useState(1); // 1: email, 2: código, 3: criar senha
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [userId, setUserId] = useState(null);

  // Login Normal
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuarios = await base44.entities.User.filter({ email });
      
      if (usuarios.length === 0) {
        setError('Email não encontrado. Verifique com o administrador.');
        setLoading(false);
        return;
      }

      const usuario = usuarios[0];

      if (!usuario.senha) {
        setError('Você ainda não criou sua senha. Use a opção "Primeiro Acesso".');
        setLoading(false);
        return;
      }

      if (usuario.senha !== senha) {
        setError('Senha incorreta.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      await base44.auth.login(email, senha);
      navigate(createPageUrl('Pedidos'));
    } catch (error) {
      setError('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };