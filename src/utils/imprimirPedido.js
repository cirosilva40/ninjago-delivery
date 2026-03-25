export function imprimirPedido(pedido, pizzaria = {}) {
  const data = new Date(pedido.horario_pedido || pedido.created_date);
  const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formaPagLabel = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    vale_refeicao: 'Vale Refeição',
    online: 'Online',
    pagar_na_entrega: 'Dinheiro (na entrega)',
    outro: 'Outro',
  };

  const itensHtml = (pedido.itens || []).map(item => `
    <tr>
      <td style="padding: 4px 0; vertical-align: top;">
        <strong>${item.quantidade}x</strong> ${item.nome}
        ${item.observacao ? `<br/><small style="color:#555">* ${item.observacao}</small>` : ''}
      </td>
      <td style="padding: 4px 0; text-align: right; vertical-align: top; white-space: nowrap;">
        R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const enderecoHtml = pedido.tipo_pedido !== 'balcao' ? `
    <p><strong>Endereço:</strong> ${pedido.cliente_endereco || ''}, Nº ${pedido.cliente_numero || ''}</p>
    ${pedido.cliente_complemento ? `<p><strong>Complemento:</strong> ${pedido.cliente_complemento}</p>` : ''}
    <p><strong>Bairro:</strong> ${pedido.cliente_bairro || ''}</p>
    <p><strong>Cidade:</strong> ${pedido.cliente_cidade || ''}${pedido.cliente_estado ? '/' + pedido.cliente_estado : ''}</p>
    ${pedido.cliente_cep ? `<p><strong>CEP:</strong> ${pedido.cliente_cep}</p>` : ''}
  ` : '<p><strong>Tipo:</strong> Retirada no Balcão</p>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Pedido #${pedido.numero_pedido}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          color: #000;
          background: #fff;
          width: 80mm;
          margin: 0 auto;
          padding: 8px;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .divider-solid { border-top: 2px solid #000; margin: 8px 0; }
        h1 { font-size: 15px; text-transform: uppercase; }
        h2 { font-size: 13px; text-transform: uppercase; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { font-size: 13px; }
        .total-row td { font-weight: bold; font-size: 14px; padding-top: 6px; }
        .footer { margin-top: 16px; font-size: 11px; text-align: center; color: #555; }
        .pedido-num { font-size: 36px; font-weight: bold; text-align: center; margin-top: 8px; }
        @media print {
          body { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <h1>${pizzaria.nome || 'ESTABELECIMENTO'}</h1>
        ${pizzaria.telefone ? `<p>TELEFONE: ${pizzaria.telefone}</p>` : ''}
        ${pizzaria.endereco ? `<p>${pizzaria.endereco}${pizzaria.numero ? ', Nº ' + pizzaria.numero : ''}</p>` : ''}
      </div>

      <div class="divider-solid"></div>

      <div class="center">
        <h2>PEDIDO Nº ${pedido.numero_pedido} - ${pedido.origem === 'site' || pedido.origem === 'app' ? 'ONLINE' : (pedido.origem || 'BALCÃO').toUpperCase()}</h2>
        <p>DATA ${dataFormatada}</p>
      </div>

      <div class="divider"></div>

      <p><strong>Cliente:</strong> ${pedido.cliente_nome}</p>
      <p><strong>Telefone:</strong> ${pedido.cliente_telefone || '-'}</p>
      ${enderecoHtml}

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <td class="bold" style="padding-bottom:4px;">DESCRIÇÃO</td>
            <td class="bold" style="text-align:right; padding-bottom:4px;">TOTAL</td>
          </tr>
        </thead>
        <tbody>
          ${itensHtml}
        </tbody>
      </table>

      <div class="divider"></div>

      <table>
        ${pedido.taxa_entrega > 0 ? `
        <tr>
          <td>Taxa de Entrega</td>
          <td style="text-align:right;">R$ ${pedido.taxa_entrega.toFixed(2)}</td>
        </tr>` : ''}
        ${pedido.desconto > 0 ? `
        <tr>
          <td>Desconto</td>
          <td style="text-align:right;">- R$ ${pedido.desconto.toFixed(2)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td>VALOR TOTAL</td>
          <td style="text-align:right;">R$ ${pedido.valor_total?.toFixed(2)}</td>
        </tr>
        <tr>
          <td>${formaPagLabel[pedido.forma_pagamento] || pedido.forma_pagamento || '-'}</td>
          <td style="text-align:right;">R$ ${pedido.valor_total?.toFixed(2)}</td>
        </tr>
        ${pedido.troco_para > 0 ? `
        <tr>
          <td>Troco para</td>
          <td style="text-align:right;">R$ ${pedido.troco_para.toFixed(2)}</td>
        </tr>` : ''}
      </table>

      ${pedido.observacoes ? `
      <div class="divider"></div>
      <p><strong>Obs:</strong> ${pedido.observacoes}</p>
      ` : ''}

      <div class="divider-solid"></div>

      <div class="pedido-num">${pedido.numero_pedido}</div>

      <div class="footer">
        <p>NinjaGO Delivery</p>
        <p>${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=400,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}