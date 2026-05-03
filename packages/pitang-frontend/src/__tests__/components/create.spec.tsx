import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateReimbursementPage } from '@/routes/_auth/reimbursements/create';
import fetcher from '@/api/fetcher';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

// Mocking dependencies
jest.mock('@/api/fetcher', () => {
  const f: any = jest.fn();
  f.get = jest.fn();
  f.post = jest.fn();
  return {
    __esModule: true,
    default: f,
  };
});

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
    (fetcher as unknown as jest.Mock).mockResolvedValue({ data: mockCategories });
  });

  it('submits the form successfully', async () => {
    const user = userEvent.setup();
    (fetcher.post as jest.Mock).mockResolvedValue({ data: { id: '999' } });

    render(<CreateReimbursementPage />);

    await waitFor(() => expect(fetcher).toHaveBeenCalled());

    await user.type(screen.getByLabelText(/descrição/i), 'Almoço');
    await user.type(screen.getByLabelText(/valor/i), '50');

    const categoryTrigger = screen.getByRole('combobox');
    await user.click(categoryTrigger);
    const categoryItem = await screen.findByText('Alimentação');
    await user.click(categoryItem);

    const submitButton = screen.getByRole('button', { name: /criar solicitação/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetcher.post).toHaveBeenCalledWith('/reimbursements', expect.objectContaining({
        descricao: 'Almoço',
        valor: 50,
        categoriaId: 1
      }));
      expect(toast.success).toHaveBeenCalledWith('Solicitação criada!');
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
    const dateInput = screen.getByLabelText(/data da despesa/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2099-12-31');
    await user.click(submitButton);
    expect(await screen.findByText(/a data da despesa não pode ser futura/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('A data da despesa não pode ser futura');
  });
});
