import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReimbursementCard } from '@/components/reimbursement-card';

describe('ReimbursementCard RBAC & Status Rules', () => {
  const mockOnAction = jest.fn();
  const mockOnOpenReject = jest.fn();
  const mockOnEdit = jest.fn();

  const baseItem = {
    id: '123',
    descricao: 'Compra de Monitor',
    valor: 1200.0,
    dataDespesa: '2023-10-01T00:00:00Z',
    categoria: { nome: 'Equipamentos' },
    status: 'RASCUNHO',
    solicitante: { nome: 'Usuário Teste' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // COLABORADOR
  // ============================================
  it('Colaborador VÊ botões de Editar, Enviar e Deletar quando o status é RASCUNHO', () => {
    const user = { perfil: 'COLABORADOR' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'RASCUNHO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // O primeiro botão é o de Editar (ícone Edit3)
    const editButton = buttons[0];
    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith('123');
  });

  it('Colaborador NÃO VÊ botões de edição quando o status NÃO for RASCUNHO (ex: ENVIADO)', () => {
    const user = { perfil: 'COLABORADOR' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'ENVIADO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  // ============================================
  // GESTOR
  // ============================================
  it('Gestor VÊ botões de Aprovar e Rejeitar quando o status é ENVIADO', () => {
    const user = { perfil: 'GESTOR' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'ENVIADO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const approveBtn = screen.getByRole('button', { name: /aprovar/i });
    const rejectBtn = screen.getByRole('button', { name: /rejeitar/i });

    expect(approveBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();

    fireEvent.click(approveBtn);
    expect(mockOnAction).toHaveBeenCalledWith('123', 'approve');

    fireEvent.click(rejectBtn);
    expect(mockOnOpenReject).toHaveBeenCalledWith('123');
  });

  it('Gestor NÃO VÊ botões de ação quando o status NÃO for ENVIADO (ex: RASCUNHO)', () => {
    const user = { perfil: 'GESTOR' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'RASCUNHO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  // ============================================
  // FINANCEIRO
  // ============================================
  it('Financeiro VÊ botão Pagar quando o status é APROVADO', () => {
    const user = { perfil: 'FINANCEIRO' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'APROVADO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const payBtn = screen.getByRole('button', { name: /pagar/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);
    expect(mockOnAction).toHaveBeenCalledWith('123', 'pay');
  });

  it('Financeiro NÃO VÊ botões de ação quando o status NÃO for APROVADO (ex: ENVIADO)', () => {
    const user = { perfil: 'FINANCEIRO' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'ENVIADO' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  // ============================================
  // ADICIONAIS DE INTERFACE
  // ============================================
  it('Renderiza o botão com o Motivo da Rejeição se o status for REJEITADO', () => {
    const user = { perfil: 'COLABORADOR' };

    render(
      <ReimbursementCard
        item={{ ...baseItem, status: 'REJEITADO', justificativaRejeicao: 'Nota fiscal ilegível' }}
        user={user}
        onAction={mockOnAction}
        onEdit={mockOnEdit}
        onOpenReject={mockOnOpenReject}
      />
    );

    const motivoBtn = screen.getByRole('button', { name: /motivo/i });
    expect(motivoBtn).toBeInTheDocument();
  });
});
