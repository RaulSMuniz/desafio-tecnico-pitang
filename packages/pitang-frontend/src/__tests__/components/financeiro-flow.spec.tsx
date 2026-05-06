import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReimbursementCard } from '@/components/reimbursement-card';

describe('ReimbursementCard (Financeiro Flow)', () => {
  const mockApprovedItem = {
    id: '102',
    descricao: 'Passagem Aérea',
    valor: 1200.00,
    status: 'APROVADO',
    dataDespesa: new Date().toISOString(),
    categoria: { nome: 'Viagens' },
    solicitante: { nome: 'Colaborador B' }
  };

  const financeiroUser = { id: '3', nome: 'Financeiro Pitang', perfil: 'FINANCEIRO' };
  const gestorUser = { id: '1', nome: 'Gestor Pitang', perfil: 'GESTOR' };

  const mockOnAction = jest.fn();
  const mockOnOpenReject = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Pagar button for FINANCEIRO when status is APROVADO', () => {
    render(
      <ReimbursementCard 
        item={mockApprovedItem} 
        user={financeiroUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.getByRole('button', { name: /pagar/i })).toBeInTheDocument();
  });

  it('does NOT render Pagar button for GESTOR even if status is APROVADO', () => {
    render(
      <ReimbursementCard 
        item={mockApprovedItem} 
        user={gestorUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.queryByRole('button', { name: /pagar/i })).not.toBeInTheDocument();
  });

  it('calls onAction with "pay" when clicking the Pagar button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard 
        item={mockApprovedItem} 
        user={financeiroUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    const payBtn = screen.getByRole('button', { name: /pagar/i });
    await user.click(payBtn);

    expect(mockOnAction).toHaveBeenCalledWith('102', 'pay');
  });

  it('does NOT show Pagar button if status is ENVIADO for FINANCEIRO', () => {
    const sentItem = { ...mockApprovedItem, status: 'ENVIADO' };
    render(
      <ReimbursementCard 
        item={sentItem} 
        user={financeiroUser} 
        onAction={mockOnAction} 
        onOpenReject={mockOnOpenReject} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.queryByRole('button', { name: /pagar/i })).not.toBeInTheDocument();
  });
});
