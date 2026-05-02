import { Pencil, Trash2, User, Mail, UserCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from '@/components/ui/badge'

interface UserTableProps {
    users: any[]
    onEdit: (user: any) => void
    onDelete: (user: any) => void
    onRestore: (user: any) => void
}

export function UserTable({ users, onEdit, onDelete, onRestore }: UserTableProps) {
    const getPerfilBadge = (perfil: string) => {
        const configs: any = {
            'ADMIN': 'bg-slate-900 text-white',
            'GESTOR': 'bg-purple-100 text-purple-700 border-purple-200',
            'FINANCEIRO': 'bg-amber-100 text-amber-700 border-amber-200',
            'COLABORADOR': 'bg-blue-100 text-blue-700 border-blue-200'
        }
        return <Badge className={`${configs[perfil]} border font-bold uppercase text-[9px] tracking-tighter`}>{perfil}</Badge>
    }

    return (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuário</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Perfil</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {users.map((u) => {
                        const isInactive = u.deletadoEm !== null;

                        return (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-xl">
                                            <User className="h-4 w-4 text-slate-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{u.nome}</span>
                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {u.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {getPerfilBadge(u.perfil)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {!isInactive ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(u)}
                                                    className="hover:bg-orange-50 hover:text-orange-600 rounded-lg h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(u)}
                                                    className="hover:bg-red-50 hover:text-red-600 rounded-lg h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRestore(u)}
                                                className="hover:bg-green-50 hover:text-green-600 rounded-lg h-8 w-8 p-0"
                                                title="Reativar usuário"
                                            >
                                                <UserCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            {users.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-medium text-sm">
                    Nenhum usuário encontrado nesta lista.
                </div>
            )}
        </div>
    )
}