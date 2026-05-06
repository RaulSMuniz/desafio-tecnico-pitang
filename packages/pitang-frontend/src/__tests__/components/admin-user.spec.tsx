import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersManagement } from '@/routes/_auth/users';
import fetcher from '@/api/fetcher';
import { toast } from 'sonner';
import { useNavigate, useSearch } from '@tanstack/react-router';
import useSWR from 'swr';

// Mocking dependencies following create.spec.tsx pattern
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
  useSearch: jest.fn(),
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

describe('UsersManagement (Admin)', () => {
  const mockNavigate = jest.fn();
  const mockUsers = [
    { id: '1', nome: 'Admin Pitang', email: 'admin@pitang.com', perfil: 'ADMIN', deletadoEm: null },
    { id: '2', nome: 'Colaborador Teste', email: 'colab@test.com', perfil: 'COLABORADOR', deletadoEm: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useSearch as jest.Mock).mockReturnValue({ search: '' });
    (fetcher.get as jest.Mock).mockResolvedValue(mockUsers);
    
    // Mock useSWR return value
    (useSWR as jest.Mock).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      mutate: jest.fn()
    });
  });

  it('renders the users list and searches', async () => {
    const user = userEvent.setup();
    render(<UsersManagement />);

    expect(await screen.findByText('Admin Pitang')).toBeInTheDocument();
    expect(screen.getByText('Colaborador Teste')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/buscar por nome ou e-mail/i);
    await user.type(searchInput, 'Colab');

    await waitFor(() => {
      expect(fetcher.get).toHaveBeenCalledWith('/users?search=Colab');
    }, { timeout: 2000 });
  });

  it('opens the modal and creates a new user successfully', async () => {
    const user = userEvent.setup();
    (fetcher.post as jest.Mock).mockResolvedValue({ statusCode: 201 });

    render(<UsersManagement />);

    // Wait for load and click the button specifically by role
    const newBtn = await screen.findByRole('button', { name: /novo usuário/i });
    await user.click(newBtn);

    // Wait for modal to open - Title is an H2
    expect(await screen.findByRole('heading', { name: /novo usuário/i })).toBeInTheDocument();

    // Fill Form - Using labels to find inputs
    const nomeInput = screen.getByText(/Nome Completo/i).parentElement?.querySelector('input')!;
    const emailInput = screen.getByText(/E-mail Corporativo/i).parentElement?.querySelector('input')!;
    const senhaInput = screen.getByPlaceholderText(/Mínimo 8 caracteres/i);

    await user.type(nomeInput, 'Novo Usuário');
    await user.type(emailInput, 'novo@pitang.com');
    await user.type(senhaInput, '12345678');

    // Select Profile
    const profileTrigger = screen.getByRole('combobox');
    await user.click(profileTrigger);
    const colabItem = await screen.findByText('Colaborador');
    await user.click(colabItem);

    // Submit - Button text is "Criar Usuário"
    const saveBtn = screen.getByRole('button', { name: /Criar Usuário/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(fetcher.post).toHaveBeenCalledWith('/users', expect.objectContaining({
        nome: 'Novo Usuário',
        email: 'novo@pitang.com',
        perfil: 'COLABORADOR'
      }));
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Usuário criado com sucesso!');
    });
  });

  it('edits an existing user successfully', async () => {
    const user = userEvent.setup();
    (fetcher.put as jest.Mock).mockResolvedValue({ statusCode: 200 });

    const { container } = render(<UsersManagement />);

    // Wait for load
    await screen.findByText('Admin Pitang');

    // Find the edit button (Pencil icon) in the Admin Pitang row
    const editBtn = container.querySelector('.lucide-pencil')?.closest('button');
    if (!editBtn) throw new Error('Edit button not found');
    await user.click(editBtn);

    // Wait for modal to open - Title should be "Editar Usuário"
    expect(await screen.findByText('Editar Usuário')).toBeInTheDocument();

    // Change the name
    const nomeInput = screen.getByText(/Nome Completo/i).parentElement?.querySelector('input')!;
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Admin Editado');

    // Submit - Button text is "Salvar Alterações"
    const saveBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(fetcher.put).toHaveBeenCalledWith('/users/1', expect.objectContaining({
        nome: 'Admin Editado'
      }));
      expect(toast.success).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
    });
  });

  it('deactivates a user successfully', async () => {
    const user = userEvent.setup();
    (fetcher.delete as jest.Mock).mockResolvedValue({ statusCode: 200 });

    const { container } = render(<UsersManagement />);

    // Wait for load
    await screen.findByText('Colaborador Teste');

    // Find the delete button (Trash2 icon) in the second row
    const deleteBtns = container.querySelectorAll('.lucide-trash-2');
    const deleteBtn = deleteBtns[1]?.closest('button'); // Second user (Colaborador Teste)
    if (!deleteBtn) throw new Error('Delete button not found');
    await user.click(deleteBtn);

    // Wait for confirm modal
    expect(await screen.findByText('Desativar Usuário')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^Desativar$/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(fetcher.delete).toHaveBeenCalledWith('/users/2');
      expect(toast.success).toHaveBeenCalledWith('Usuário desativado!');
    });
  });

  it('restores a deactivated user successfully', async () => {
    const user = userEvent.setup();
    const inactiveUser = { id: '3', nome: 'Usuário Inativo', email: 'inativo@test.com', perfil: 'COLABORADOR', deletadoEm: '2024-01-01' };
    (fetcher.get as jest.Mock).mockResolvedValue([...mockUsers, inactiveUser]);
    (fetcher.patch as jest.Mock).mockResolvedValue({ statusCode: 200 });

    const { container } = render(<UsersManagement />);

    // Wait for load
    await screen.findByText('Admin Pitang');

    // Click on "Inativos" tab
    const inativosTab = screen.getByRole('button', { name: /inativos/i });
    await user.click(inativosTab);

    // Wait for the inactive user to appear
    expect(await screen.findByText('Usuário Inativo')).toBeInTheDocument();

    // Find the restore button (UserCheck icon)
    const restoreBtn = container.querySelector('.lucide-user-check')?.closest('button');
    if (!restoreBtn) throw new Error('Restore button not found');
    await user.click(restoreBtn);

    await waitFor(() => {
      expect(fetcher.patch).toHaveBeenCalledWith('/users/3/restore', {});
      expect(toast.success).toHaveBeenCalledWith('Usuário Inativo reativado com sucesso!');
    });
  });
});
