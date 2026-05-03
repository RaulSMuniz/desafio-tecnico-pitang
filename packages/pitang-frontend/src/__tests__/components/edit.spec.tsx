import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditReimbursementPage } from '@/routes/_auth/reimbursements/edit.$id';
import fetcher from '@/api/fetcher';
import { toast } from 'sonner';
import { useNavigate, useParams } from '@tanstack/react-router';

// Mocking dependencies
jest.mock('@/api/fetcher', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@tanstack/react-router', () => {
  const useParamsMock = jest.fn();
  const useNavigateMock = jest.fn();
  return {
    createFileRoute: jest.fn(() => {
      return (config: any) => ({
        ...config,
        useParams: useParamsMock,
      });
    }),
    useNavigate: useNavigateMock,
    useParams: useParamsMock,
  };
});

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('EditReimbursementPage', () => {
  const mockNavigate = jest.fn();
  const mockCategories = [{ id: 1, nome: 'Alimentação', ativo: true }];
  const mockReimbursement = {
    id: '123',
    descricao: 'Jantar Antigo',
    valor: 100,
    dataDespesa: '2023-10-01T00:00:00Z',
    categoriaId: 1,
    attachments: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    
    (fetcher.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/categories')) return Promise.resolve({ data: mockCategories });
      if (url.includes('/reimbursements/123')) return Promise.resolve({ data: mockReimbursement });
      return Promise.resolve({ data: {} });
    });
    (fetcher.put as jest.Mock).mockResolvedValue({ success: true });
  });

  it('loads and populates the form', async () => {
    render(<EditReimbursementPage />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jantar Antigo')).toBeInTheDocument();
    });
  });

  it('submits updated data', async () => {
    const user = userEvent.setup();

    render(<EditReimbursementPage />);
    const descInput = await screen.findByDisplayValue('Jantar Antigo');
    
    await user.clear(descInput);
    await user.type(descInput, 'Jantar Novo');

    const submitButton = screen.getByRole('button', { name: /salvar alterações/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetcher.put).toHaveBeenCalledWith('/reimbursements/123', expect.objectContaining({
        descricao: 'Jantar Novo'
      }));
      expect(toast.success).toHaveBeenCalledWith('Solicitação atualizada!');
    });
  });
});
