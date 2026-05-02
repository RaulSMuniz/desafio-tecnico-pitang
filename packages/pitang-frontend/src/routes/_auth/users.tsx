import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { UserPlus, Users, UserX } from 'lucide-react'
import fetcher from '@/api/fetcher'
import { toast } from 'sonner'
import { updateUserSchema, createUserSchema } from '@/zodSchemas'
import { UserTable } from '@/components/user-table'
import { UserFormModal } from '@/components/user-form-modal'
import { DeleteUserModal } from '@/components/delete-user-modal'

export const Route = createFileRoute('/_auth/users')({
  component: UsersManagement,
})

function UsersManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ativos' | 'inativos'>('ativos')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editData, setEditData] = useState({ nome: '', email: '', perfil: '', senha: '' })

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetcher.get<any>('/users')
      const data = response?.data || response || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const filteredUsers = useMemo(() => {
    return users.filter(u => filter === 'ativos' ? !u.deletadoEm : !!u.deletadoEm)
  }, [users, filter])

  const handleSaveUser = async () => {
    if (!editData.nome.trim()) return toast.error("O nome está vazio.")
    if (!editData.email.trim()) return toast.error("O e-mail está vazio.")
    if (!selectedUser && !editData.senha.trim()) return toast.error("A senha está vazia.")

    try {
      setIsSubmitting(true)
      const payload: any = { nome: editData.nome, email: editData.email, perfil: editData.perfil }
      if (editData.senha.trim()) payload.senha = editData.senha

      const schema = selectedUser ? updateUserSchema : createUserSchema
      const validation = schema.safeParse(payload)

      if (!validation.success) {
        const formattedErrors = validation.error.flatten().fieldErrors
        const firstErrorKey = Object.keys(formattedErrors)[0] as keyof typeof formattedErrors
        if (firstErrorKey) toast.error(formattedErrors[firstErrorKey]?.[0])
        return
      }

      if (selectedUser) {
        await fetcher.put(`/users/${selectedUser.id}`, validation.data)
        toast.success("Usuário atualizado com sucesso!")
      } else {
        await fetcher.post('/users', validation.data)
        toast.success("Usuário criado com sucesso!")
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (error: any) {
      if (error.response?.status === 409) toast.error("Este e-mail já está em uso.")
      else toast.error("Erro ao processar solicitação")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      setIsSubmitting(true)
      await fetcher.delete(`/users/${selectedUser.id}`)
      toast.success("Usuário desativado!")
      setIsDeleteModalOpen(false)
      loadUsers()
    } catch (error) {
      toast.error("Erro ao desativar usuário")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestoreUser = async (user: any) => {
    try {
      await fetcher.patch(`/users/${user.id}/restore`, {})
      toast.success(`${user.nome} reativado com sucesso!`)
      loadUsers()
    } catch (error) {
      toast.error("Erro ao reativar usuário")
    }
  }

  if (loading) return <div className="p-8 font-bold text-slate-900 text-left">Carregando usuários...</div>

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-left">
      <div className="flex items-center justify-between px-6 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Usuários</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-tighter">Controle de acessos e permissões</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl items-center">
            <button
              onClick={() => setFilter('ativos')}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${filter === 'ativos'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Users className="h-3 w-3 mr-2" /> Ativos
            </button>
            <button
              onClick={() => setFilter('inativos')}
              className={`flex items-center px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all ${filter === 'inativos'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <UserX className="h-3 w-3 mr-2" /> Inativos
            </button>
          </div>

          <Button
            onClick={() => {
              setSelectedUser(null);
              setEditData({ nome: '', email: '', perfil: 'COLABORADOR', senha: '' });
              setIsModalOpen(true);
            }}
            className="bg-red-900 hover:bg-red-800 rounded-xl font-bold"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="px-6 overflow-y-auto">
        <UserTable
          users={filteredUsers}
          onEdit={(u) => {
            setSelectedUser(u);
            setEditData({ nome: u.nome, email: u.email, perfil: u.perfil, senha: '' });
            setIsModalOpen(true);
          }}
          onDelete={(u) => {
            setSelectedUser(u);
            setIsDeleteModalOpen(true);
          }}
          onRestore={handleRestoreUser}
        />
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedUser={selectedUser}
        editData={editData}
        setEditData={setEditData}
        onSave={handleSaveUser}
        isSubmitting={isSubmitting}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        selectedUser={selectedUser}
        onDelete={handleDeleteUser}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}