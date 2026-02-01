import React from 'react';
import InputMask from 'react-input-mask';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const MaskedInput = React.forwardRef(({ mask, className, ...props }, ref) => {
  return (
    <InputMask mask={mask} {...props}>
      {(inputProps) => <Input {...inputProps} ref={ref} className={className} />}
    </InputMask>
  );
});

MaskedInput.displayName = 'MaskedInput';

// Componentes específicos para cada tipo de máscara
export const CepInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <MaskedInput
      mask="99999-999"
      placeholder="00000-000"
      {...props}
      ref={ref}
      className={className}
    />
  );
});

CepInput.displayName = 'CepInput';

export const TelefoneInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <MaskedInput
      mask="(99) 99999-9999"
      placeholder="(00) 00000-0000"
      {...props}
      ref={ref}
      className={className}
    />
  );
});

TelefoneInput.displayName = 'TelefoneInput';

export const CnpjInput = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  // CNPJ Alfanumérico: aceita letras e números (novo formato 2026)
  const handleChange = (e) => {
    let val = e.target.value.toUpperCase();
    // Remove tudo exceto letras e números
    val = val.replace(/[^A-Z0-9]/g, '');
    
    // Aplica formatação: XX.XXX.XXX/XXXX-XX
    if (val.length > 14) val = val.substring(0, 14);
    
    let formatted = '';
    if (val.length > 0) {
      formatted = val.substring(0, 2);
      if (val.length > 2) formatted += '.' + val.substring(2, 5);
      if (val.length > 5) formatted += '.' + val.substring(5, 8);
      if (val.length > 8) formatted += '/' + val.substring(8, 12);
      if (val.length > 12) formatted += '-' + val.substring(12, 14);
    }
    
    if (onChange) {
      onChange({ target: { value: formatted } });
    }
  };
  
  return (
    <Input
      {...props}
      ref={ref}
      value={value || ''}
      onChange={handleChange}
      className={className}
      placeholder="00.000.000/0000-00"
      maxLength={18}
    />
  );
});

CnpjInput.displayName = 'CnpjInput';

export const CpfInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <MaskedInput
      mask="999.999.999-99"
      placeholder="000.000.000-00"
      {...props}
      ref={ref}
      className={className}
    />
  );
});

CpfInput.displayName = 'CpfInput';

// Componente para valores monetários
export const CurrencyInput = React.forwardRef(({ value, onChange, className, ...props }, ref) => {
  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') {
      onChange({ target: { value: '' } });
      return;
    }
    const numericValue = parseFloat(val) / 100;
    onChange({ target: { value: numericValue.toString() } });
  };

  const formatValue = (val) => {
    if (!val || val === '') return '';
    const numericValue = parseFloat(val);
    if (isNaN(numericValue)) return '';
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
      <Input
        {...props}
        ref={ref}
        value={formatValue(value)}
        onChange={handleChange}
        className={cn('pl-10', className)}
        placeholder="0,00"
      />
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';