# Pitang.reembolsos

Bem-vindo ao **Pitang.reembolsos**, uma solução completa para o controle de solicitações de reembolso, desenvolvida como desafio técnico para a Pitang.

O sistema permite que colaboradores gerenciem seus pedidos de reembolso, gestores analisem solicitações com fluxos de aprovação/rejeição e o departamento financeiro finalize os pagamentos, tudo com uma trilha de auditoria completa e segura.

## Como Executar o Projeto

Este projeto é um monorepo que utiliza **npm workspaces**. Siga os passos abaixo para rodar localmente:

### Pré-requisitos
- Node.js (v18 ou superior)
- npm (v9 ou superior)

### Passo 1: Clonar o repositório
```bash
git clone https://github.com/RaulSMuniz/desafio-tecnico-pitang.git

cd desafio-tecnico-pitang
```

### Via Docker
```bash
docker compose up -d
```

Os containers estarão disponíveis em `http://localhost:80` (Frontend) e `http://localhost:3333` (Backend).

### Via npm:

### Passo 2: Instalar dependências
Na raiz do projeto, instale todas as dependências:
```bash
npm install
```

### Passo 3: Configuração do Backend
1. Navegue até o diretório do backend: `cd packages/pitang-backend`
2. Crie um arquivo `.env` na pasta `packages/pitang-backend`. Você pode usar o exemplo abaixo (ajuste as credenciais do seu banco de dados PostgreSQL):

```env
# URL de conexão com o banco (Exemplo para Postgres local ou Docker)
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/NOMEDATABASE?schema=public""

# Configurações do Servidor
HTTP_PORT=3333
BACKEND_URL="http://localhost:3333"

# Segurança (Mínimo 8 caracteres)
JWT_SECRET="12345678"
```

> **Nota**: Certifique-se de que o banco de dados especificado na `DATABASE_URL` existe em seu servidor PostgreSQL antes de rodar as migrations.

3. Em `packages/pitang-backend`, execute os comandos do Prisma para preparar o banco e popular os dados iniciais:
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### Passo 4: Rodar o Sistema
No raiz do projeto, rode o comando:
```bash
npm run dev
```
O **Frontend** estará disponível em `http://localhost:5173` e o **Backend** em `http://localhost:3333`.

---

## Usuários de Teste

Utilize as credenciais abaixo para testar os diferentes perfis de acesso. **A senha para todos os usuários é `12345678`**.

| Perfil         | E-mail             | O que pode fazer                       |
| ----           | -------            | ----                                   |
| **Admin**      | `admin@gmail.com`  | Gerenciar usuários e categorias.       |
| **Gestor**     | `gestor@gmail.com` | Aprovar/Rejeitar solicitações de terceiros. |
| **Financeiro** | `financeiro@gmail.com` | Marcar solicitações aprovadas como pagas. |
| **Colaborador**| `colaborador@gmail.com` | Criar, editar (rascunho) e enviar solicitações. |

---

## 🛠 Tecnologias Utilizadas

Este projeto foi construído utilizando as tecnologias exigidas e sugeridas na ementa do desafio:

### Backend
- **Node.js & Express**: Servidor e roteamento.
- **TypeScript**: Tipagem estática para maior segurança.
- **Prisma ORM**: Modelagem e persistência de dados.
- **JWT (JSON Web Token)**: Autenticação de usuários.
- **Zod**: Validação rigorosa de esquemas de dados.
- **Day.js**: Manipulação de datas.
- **Bcrypt**: Criptografia de senhas.
- **Jest & Supertest**: Testes de integração e cobertura de regras de negócio.
- **Teste manual de API**: Postman. 

### Frontend
- **React (Functional Components & Hooks)**: Biblioteca base.
- **TanStack Router**: Navegação avançada e proteção de rotas.
- **SWR (Stale-While-Revalidate)**: Caching de dados e otimização de performance.
- **Context API**: Gerenciamento global de estado (Autenticação).
- **Tailwind CSS & ShadcnUI**: Estilização premium e componentes de UI modernos.
- **Consumo de API**: Fetcher separado para otimização de fetches.
- **React Testing Library**: Testes unitários e de componentes.

---

## Funcionalidades Implementadas

### Essenciais (Obrigatórias)

#### Backend:
- [x] **Autenticação**: Login seguro com JWT, middleware de autenticação e middleware de proteção de rotas por perfil (RBAC).
- [x] **Validação com Zod**: Validação rigorosa de body e params.
- [x] **Gestão de Usuários**: Admin pode criar, editar e excluir (soft delete) usuários.
- [x] **Gestão de Categorias**: Admin pode criar e desativar categorias.
- [x] **CRUD de Reembolsos do Colaborador**: Criação, edição e cancelamento (de rascunho) e envio de reembolso para aprovação.
- [x] **CRUD de Reembolsos do Gestor**: O gestor pode aprovar ou rejeitar (com justificativa obrigatória) caso esteja como 'ENVIADO'.
- [x] **CRUD de Reembolsos do Financeiro**: O financeiro pode marcar como pago caso esteja como 'APROVADO' pelo gestor.
- [x] **CRUD de Históricos**: Qualquer colaborador pode visualizar o histórico de solicitações, desde que seja o histórico da sua própria solicitação. Gestor, financeiro e admin podem visualizar o histórico de todas as solicitações.
- [x] **Fluxo de Status**: Ciclo completo (Rascunho -> Enviado ou Cancelado -> Aprovação/Rejeição -> Pago).
- [x] **Tratamento de erros**: Tratamento de erros em todas as etapas do fluxo.
- [x] **CRUD de Históricos**: Histórico detalhado de todas as ações em cada solicitação.
- [x] **Anexos**: Suporte para múltiplos arquivos (Simulado).
- [x] **Testes no backend**: Testes de integração e cobertura de regras de negócio.

#### Frontend:
- [x] **Login e Cadastro**: Fluxos completos de autenticação e registro de novos colaboradores.
- [x] **Listagem de Reembolsos (Kanban)**: Visão geral das solicitações com filtros e busca.
- [x] **Formulário de Reembolso**: Criação e edição de solicitações com upload de anexos e validação de datas futuras.
- [x] **Painel de Aprovação (Kanban)**: Visualização e gerenciamento de solicitações para gestores e equipe financeira.
- [x] **Visualização de Histórico**: Detalhes e auditoria de cada solicitação.
- [x] **Gerenciamento de Usuários**: Criação, edição e desativação de usuários pelo administrador.
- [x] **Gerenciamento de Categorias**: Criação, edição e desativação de categorias de reembolso pelo administrador.
- [x] **Dashboard de Estatísticas**: Métricas agregadas e filtros visuais para acompanhamento de reembolsos.
- [x] **Testes no frontend**: Testes cobrindo todos os fluxos relevantes.

### Diferenciais (Plus)
- [x] **Segregação de Funções**: Gestores não podem aprovar suas próprias solicitações, caso tenha criado uma antes de ser promovido à gestor.
- [x] **Bloqueio de Datas Futuras**: Validação no Zod para impedir despesas antecipadas.
- [x] **Expiração de Sessão**: Monitoramento de validade do Token JWT.
- [x] **Filtro por descrição do pedido, categoria e data**: Implementado para todas as listas de solicitações.
- [x] **Soft delete**: Implementado para usuários e categorias.
- [x] **Dashboard**: Dashboard com métricas totais e atividades recentes baseadas no perfil do usuário.
- [x] **Paginação**: Paginação implementada no backend em relação as solicitações de reembolso. É consumida corretamente no frontend, tanto no dashboard total com métricas, quanto nas listas de solicitações de reembolso. 
- [x] **Filtros**: Filtros de nome do colaborador, categoria, status e ordenação por data ou valor implementada nas solicitações de reembolso. Filtro de nome do colaborador ou e-mail do colaborador implementado no painel de usuários do Administrador.
- [x] **Docker**: O projeto está dockerizado, permitindo fácil execução em qualquer ambiente.

---

## Testes

Para rodar os testes de ambos os pacotes individualmente:
```bash
npm test
```
No backend (`packages/pitang-backend`) e no frontend (`packages/pitang-frontend`).
