import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateReimbursementPage } from '@/routes/_auth/reimbursements/create';
import fetcher from '@/api/fetcher';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

// Mocking dependencies
jest.mock('@/api/fetcher', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({ component: () => null }),
  useNavigate: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CreateReimbursementPage', () => {
  const mockNavigate = jest.fn();
  const mockCategories = [
    { id: 1, nome: 'Alimentação', ativo: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (fetcher.get as jest.Mock).mockResolvedValue({ data: mockCategories });
  });

  it('submits the form successfully', async () => {
    const user = userEvent.setup();
    (fetcher.post as jest.Mock).mockResolvedValue({ data: { id: '999' } });

    render(<CreateReimbursementPage />);

    await waitFor(() => expect(fetcher.get).toHaveBeenCalled());

    await user.type(screen.getByPlaceholderText(/Jantar com cliente/i), 'Almoço');

    // Buscar o input de valor de forma mais robusta
    const valorLabel = screen.getByText(/Valor \(R\$\)/i);
    const valorInput = valorLabel.parentElement?.querySelector('input');
    expect(valorInput).toBeInTheDocument();
    if (valorInput) {
      await user.clear(valorInput);
      await user.type(valorInput, '50');
    }

    // Selecionar categoria e clicar no botão para fechar o combobox
    const categoryTrigger = screen.getByRole('combobox');
    await user.click(categoryTrigger);
    const categoryItem = await screen.findByText('Alimentação');
    await user.click(categoryItem);

    // Clicar no botão de enviar
    const submitButton = screen.getByRole('button', { name: /criar solicitação/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetcher.post).toHaveBeenCalled();
    }, { timeout: 5000 });

    expect(fetcher.post).toHaveBeenCalledWith('/reimbursements', expect.objectContaining({
      descricao: 'Almoço',
      valor: 50,
      categoriaId: 1
    }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Solicitação criada com sucesso!');
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/reimbursements' });
    });
  });

  it('navigates back when clicking Descartar', async () => {
    const user = userEvent.setup();
    render(<CreateReimbursementPage />);
    const discardBtn = screen.getByText(/descartar/i);
    await user.click(discardBtn);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/reimbursements' });
  });

  it('exibe erros de validação via Toast e mensagem de campo', async () => {
    const user = userEvent.setup();
    render(<CreateReimbursementPage />);

    const submitButton = screen.getByRole('button', { name: /criar solicitação/i });

    // Test empty description
    await user.click(submitButton);
    expect(await screen.findByText(/a descrição deve ter pelo menos 3 caracteres/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/a descrição/i));

    // Test future date
    const descInput = screen.getByPlaceholderText(/Jantar com cliente/i);
    await user.type(descInput, 'Almoço válido');

    const valorInput = screen.getByText(/Valor/i).parentElement?.querySelector('input');
    if (valorInput) {
      await user.clear(valorInput);
      await user.type(valorInput, '100');
    }

    const categoryTrigger = screen.getByRole('combobox');
    await user.click(categoryTrigger);
    const categoryItem = await screen.findByText('Alimentação');
    await user.click(categoryItem);

    const dateLabel = screen.getByText(/Data da Despesa/i);
    const dateInput = dateLabel.parentElement?.querySelector('input');
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
    }
    await user.click(submitButton);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('A data da despesa não pode ser futura');
    });
  });
});
