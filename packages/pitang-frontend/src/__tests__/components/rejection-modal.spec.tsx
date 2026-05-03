import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RejectionModal } from '@/components/rejection-modal';

describe('RejectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with textarea and disabled button initially', () => {
    render(<RejectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    expect(screen.getByText('Rejeitar Solicitação')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirmar rejeição/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('keeps button disabled if text is less than 5 characters', async () => {
    const user = userEvent.setup();
    render(<RejectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    const textarea = screen.getByPlaceholderText(/descreva o motivo da rejeição/i);
    await user.type(textarea, '1234'); // 4 chars

    const confirmBtn = screen.getByRole('button', { name: /confirmar rejeição/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('enables the button and calls onConfirm when text has 5 or more characters', async () => {
    const user = userEvent.setup();
    render(<RejectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    const textarea = screen.getByPlaceholderText(/descreva o motivo da rejeição/i);
    await user.type(textarea, 'Falta de nota fiscal'); // more than 5 chars

    const confirmBtn = screen.getByRole('button', { name: /confirmar rejeição/i });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);
    expect(mockOnConfirm).toHaveBeenCalledWith('Falta de nota fiscal');
  });

  it('calls onClose when clicking Cancelar', () => {
    render(<RejectionModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
