import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReimbursementCard } from '@/components/reimbursement-card';

describe('ReimbursementCard (Colaborador Flow)', () => {
  const mockDraftItem = {
    id: '123',
    descricao: 'Compra de Monitor',
    valor: 1200.0,
    dataDespesa: new Date().toISOString(),
    categoria: { nome: 'Equipamentos' },
    status: 'RASCUNHO',
    solicitante: { nome: 'Colaborador Teste' }
  };

  const colabUser = { id: '2', nome: 'Colaborador Teste', perfil: 'COLABORADOR' };

  const mockOnAction = jest.fn();
  const mockOnOpenReject = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Edit, Delete and Submit buttons for COLABORADOR when status is RASCUNHO', () => {
    render(
      <ReimbursementCard
        item={mockDraftItem}
        user={colabUser}
        onAction={mockOnAction}
        onOpenReject={mockOnOpenReject}
        onEdit={mockOnEdit}
      />
    );

    // Draft actions for Colaborador
    // Note: Edit and Delete buttons in ReimbursementCard for Colaborador don't have text, only icons.
    // We'll use querySelector for those or just check the count of buttons.
    // The Submit button has an icon (Send) and is the third button.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('calls onEdit when clicking the Edit button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard item={mockDraftItem} user={colabUser} onAction={mockOnAction} onOpenReject={mockOnOpenReject} onEdit={mockOnEdit} />
    );

    const buttons = screen.getAllByRole('button');
    const editBtn = buttons[0];
    await user.click(editBtn);

    expect(mockOnEdit).toHaveBeenCalledWith('123');
  });

  it('calls onAction with "cancel" when clicking the Delete button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard item={mockDraftItem} user={colabUser} onAction={mockOnAction} onOpenReject={mockOnOpenReject} onEdit={mockOnEdit} />
    );

    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons[1];
    await user.click(deleteBtn);

    expect(mockOnAction).toHaveBeenCalledWith('123', 'cancel');
  });

  it('calls onAction with "submit" when clicking the Submit button', async () => {
    const user = userEvent.setup();
    render(
      <ReimbursementCard item={mockDraftItem} user={colabUser} onAction={mockOnAction} onOpenReject={mockOnOpenReject} onEdit={mockOnEdit} />
    );

    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons[2];
    await user.click(submitBtn);

    expect(mockOnAction).toHaveBeenCalledWith('123', 'submit');
  });

  it('shows the Rejection Motive button if status is REJEITADO', () => {
    const rejectedItem = { ...mockDraftItem, status: 'REJEITADO', justificativaRejeicao: 'Nota fiscal ilegível' };
    render(
      <ReimbursementCard item={rejectedItem} user={colabUser} onAction={mockOnAction} onOpenReject={mockOnOpenReject} onEdit={mockOnEdit} />
    );

    expect(screen.getByRole('button', { name: /motivo/i })).toBeInTheDocument();
  });
});
