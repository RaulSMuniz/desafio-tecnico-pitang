import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesManagement } from '@/routes/_auth/categories';
import fetcher from '@/api/fetcher';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import useSWR from 'swr';

// Mocking dependencies following admin-user.spec.tsx pattern
jest.mock('@/api/fetcher', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
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

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
  mutate: jest.fn(),
}));

describe('CategoriesManagement (Admin)', () => {
  const mockNavigate = jest.fn();
  const mockCategories = [
    { id: '1', nome: 'Alimentação', ativo: true },
    { id: '2', nome: 'Transporte', ativo: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (fetcher.get as jest.Mock).mockResolvedValue({ data: mockCategories });

    // Mock useSWR return value
    (useSWR as jest.Mock).mockReturnValue({
      data: { data: mockCategories },
      isLoading: false,
      mutate: jest.fn()
    });
  });

  it('renders the categories list', async () => {
    render(<CategoriesManagement />);

    expect(await screen.findByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('creates a new category successfully', async () => {
    const user = userEvent.setup();
    (fetcher.post as jest.Mock).mockResolvedValue({ statusCode: 201 });
    
    render(<CategoriesManagement />);

    // Wait for load and click "Nova Categoria"
    const newBtn = await screen.findByRole('button', { name: /nova categoria/i });
    await user.click(newBtn);

    expect(await screen.findByRole('heading', { name: /nova categoria/i })).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Ex: Viagens, Alimentação/i);
    await user.type(input, 'Hospedagem');

    const saveBtn = screen.getByRole('button', { name: /salvar/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(fetcher.post).toHaveBeenCalledWith('/categories', { nome: 'Hospedagem' });
      expect(toast.success).toHaveBeenCalledWith('Categoria criada');
    });
  });

  it('edits an existing category successfully', async () => {
    const user = userEvent.setup();
    (fetcher.put as jest.Mock).mockResolvedValue({ statusCode: 200 });
    
    const { container } = render(<CategoriesManagement />);

    // Wait for load
    await screen.findByText('Alimentação');

    // Find edit button (Pencil icon)
    const editBtn = container.querySelector('.lucide-pencil')?.closest('button');
    if (!editBtn) throw new Error('Edit button not found');
    await user.click(editBtn);

    expect(await screen.findByRole('heading', { name: /editar categoria/i })).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Ex: Viagens, Alimentação/i);
    await user.clear(input);
    await user.type(input, 'Refeição');

    const saveBtn = screen.getByRole('button', { name: /salvar/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(fetcher.put).toHaveBeenCalledWith('/categories/1', {
        nome: 'Refeição',
        ativo: true
      });
      expect(toast.success).toHaveBeenCalledWith('Categoria atualizada');
    });
  });

  it('toggles category status successfully (Deactivate)', async () => {
    const user = userEvent.setup();
    (fetcher.put as jest.Mock).mockResolvedValue({ statusCode: 200 });
    
    render(<CategoriesManagement />);

    // Find the status button for the active category specifically
    const activeStatusBtn = await screen.findByRole('button', { name: /^ativo$/i });
    await user.click(activeStatusBtn);

    await waitFor(() => {
      expect(fetcher.put).toHaveBeenCalledWith('/categories/1', {
        nome: 'Alimentação',
        ativo: false
      });
      expect(toast.success).toHaveBeenCalledWith('Categoria inativada com sucesso');
    });
  });

  it('toggles category status successfully (Activate)', async () => {
    const user = userEvent.setup();
    (fetcher.put as jest.Mock).mockResolvedValue({ statusCode: 200 });
    
    render(<CategoriesManagement />);

    // Find the status button for the inactive category specifically
    const inactiveStatusBtn = await screen.findByRole('button', { name: /^inativo$/i });
    await user.click(inactiveStatusBtn);

    await waitFor(() => {
      expect(fetcher.put).toHaveBeenCalledWith('/categories/2', {
        nome: 'Transporte',
        ativo: true
      });
      expect(toast.success).toHaveBeenCalledWith('Categoria ativada com sucesso');
    });
  });
});
