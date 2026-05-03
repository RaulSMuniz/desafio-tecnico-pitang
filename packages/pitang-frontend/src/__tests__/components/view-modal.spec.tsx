import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewReimbursementModal } from '@/components/view-modal';

// Mock Radix UI Dialog to render its content directly
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe('ViewReimbursementModal', () => {
  const mockData = {
    id: '1',
    status: 'APROVADO',
    descricao: 'Viagem de Negócios',
    valor: 1500.50,
    dataDespesa: '2024-03-20T10:00:00Z',
    categoria: { nome: 'Viagens' },
    attachments: [],
    history: [
      {
        acao: 'CREATED',
        criadoEm: '20/03/2024 10:00',
        usuario: { nome: 'João Silva' },
        observacao: 'Solicitação inicial'
      },
      {
        acao: 'APPROVED',
        criadoEm: '21/03/2024 14:00',
        usuario: { nome: 'Maria Gestora' },
        observacao: 'Aprovado conforme política'
      }
    ]
  };

  it('renders reimbursement details correctly', () => {
    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={mockData} 
      />
    );

    expect(screen.getByText('Viagem de Negócios')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,50')).toBeInTheDocument();
    expect(screen.getByText('Viagens')).toBeInTheDocument();
  });

  it('renders history audit trail correctly', () => {
    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={mockData} 
      />
    );

    // Check history section title
    expect(screen.getByText('Trilha de Auditoria')).toBeInTheDocument();

    // Check individual history items
    expect(screen.getByText('Criado')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('"Solicitação inicial"')).toBeInTheDocument();

    expect(screen.getByText('Aprovado')).toBeInTheDocument();
    expect(screen.getByText('Maria Gestora')).toBeInTheDocument();
    expect(screen.getByText('"Aprovado conforme política"')).toBeInTheDocument();
  });

  it('renders list of attachments correctly', () => {
    const dataWithAttachments = {
      ...mockData,
      attachments: [
        { nomeArquivo: 'nota_fiscal.pdf', tipoArquivo: 'PDF', urlArquivo: 'http://example.com/nota.pdf' },
        { nomeArquivo: 'comprovante.png', tipoArquivo: 'PNG', urlArquivo: 'http://simulated-storage.com/comp.png' }
      ]
    };

    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={dataWithAttachments} 
      />
    );

    expect(screen.getByText('Anexos Vinculados')).toBeInTheDocument();
    expect(screen.getByText('nota_fiscal.pdf')).toBeInTheDocument();
    expect(screen.getByText('comprovante.png')).toBeInTheDocument();
  });

  it('opens attachment preview and goes back', () => {
    const dataWithAttachments = {
      ...mockData,
      attachments: [
        { nomeArquivo: 'nota_fiscal.pdf', tipoArquivo: 'PDF', urlArquivo: 'http://example.com/nota.pdf' }
      ]
    };

    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={dataWithAttachments} 
      />
    );

    // Click on the attachment to open preview
    fireEvent.click(screen.getByText('nota_fiscal.pdf'));

    // Check preview screen elements
    expect(screen.getByText('Voltar')).toBeInTheDocument();
    expect(screen.getByText('Baixar Arquivo Original')).toBeInTheDocument();
    
    // Check if the filename is in the preview header
    const previewHeader = screen.getAllByText('nota_fiscal.pdf');
    expect(previewHeader.length).toBeGreaterThan(0);

    // Click "Voltar" to return to details
    fireEvent.click(screen.getByText('Voltar'));

    // Check if we are back to details
    expect(screen.getByText('Detalhes da Solicitação')).toBeInTheDocument();
  });

  it('shows unavailable preview for simulated URLs', () => {
    const dataWithSimulated = {
      ...mockData,
      attachments: [
        { nomeArquivo: 'fake.pdf', tipoArquivo: 'PDF', urlArquivo: 'http://simulated-storage.com/fake.pdf' }
      ]
    };

    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={dataWithSimulated} 
      />
    );

    // Open preview
    fireEvent.click(screen.getByText('fake.pdf'));

    // Check for "unavailable" message
    expect(screen.getByText('Pré-visualização indisponível')).toBeInTheDocument();
  });

  it('renders empty history message when no history is provided', () => {
    const noHistoryData = { ...mockData, history: [] };
    render(
      <ViewReimbursementModal 
        isOpen={true} 
        onClose={jest.fn()} 
        data={noHistoryData} 
      />
    );

    expect(screen.getByText('Nenhum histórico disponível')).toBeInTheDocument();
  });
});
