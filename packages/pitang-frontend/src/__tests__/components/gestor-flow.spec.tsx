import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReimbursementCard } from '@/components/reimbursement-card';

describe('ReimbursementCard (Gestor Flow)', () => {
  const mockItem = {
    id: '101',
    descricao: 'Almoço com cliente',
    valor: 150.50,
    status: 'ENVIADO',
    dataDespesa: new Date().toISOString(),
    categoria: { nome: 'Alimentação' },
    solicitante: { nome: 'Colaborador A' }
  };

  const gestorUser = { id: '1', nome: 'Gestor Pitang', perfil: 'GESTOR' };
  const colabUser = { id: '2', nome: 'Colaborador Teste', perfil: 'COLABORADOR' };

  const mockOnAction = jest.fn();
  const mockOnOpenReject = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Approve and Reject buttons for GESTOR when status is ENVIADO', () => {
    render(
      <ReimbursementCard 
        item={mockItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument();
  });

  it('does NOT render Gestor buttons for COLABORADOR even if status is ENVIADO', () => {
    render(
      <ReimbursementCard 
        item={mockItem} 
        user={colabUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument();
  });

  it('calls onAction with "approve" when clicking the Aprovar button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard 
        item={mockItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    const approveBtn = screen.getByRole('button', { name: /aprovar/i });
    await user.click(approveBtn);

    expect(mockOnAction).toHaveBeenCalledWith('101', 'approve');
  });

  it('calls onOpenReject when clicking the Rejeitar button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard 
        item={mockItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    const rejectBtn = screen.getByRole('button', { name: /rejeitar/i });
    await user.click(rejectBtn);

    expect(mockOnOpenReject).toHaveBeenCalledWith('101');
  });

  it('does NOT show actions if status is already APROVADO for GESTOR', () => {
    const approvedItem = { ...mockItem, status: 'APROVADO' };
    render(
      <ReimbursementCard 
        item={approvedItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.queryByRole('button', { name: /aprovar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rejeitar/i })).not.toBeInTheDocument();
  });

  it('does NOT show any actions for GESTOR if status is RASCUNHO', () => {
    const draftItem = { ...mockItem, status: 'RASCUNHO' };
    render(
      <ReimbursementCard 
        item={draftItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});
