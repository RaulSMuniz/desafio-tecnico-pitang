import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Bem-vindo ao Pitang Reembolsos</h1>
      <p className="mt-4">Sua plataforma de gestão financeira.</p>

      <div>
        <Link to="/login">Login</Link>
      </div>
    </div>
  ),
})