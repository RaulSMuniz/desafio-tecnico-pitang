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

    const { container } = render(<CreateReimbursementPage />);

    await waitFor(() => expect(fetcher).toHaveBeenCalled());

    await user.type(screen.getByPlaceholderText(/Ex: Jantar com cliente/i), 'Almoço');
    const valorInput = container.querySelector('input[type="number"]') as HTMLInputElement;
    await user.type(valorInput, '50');

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
});
