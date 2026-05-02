import { Shield, Loader2, BadgeCheck, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface UserFormModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedUser: any
    editData: any
    setEditData: (data: any) => void
    onSave: () => void
    isSubmitting: boolean
}

export function UserFormModal({ isOpen, onOpenChange, selectedUser, editData, setEditData, onSave, isSubmitting }: UserFormModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl max-w-md [&>button]:text-slate-400 [&>button]:opacity-100">
                <DialogHeader className="text-left">
                    <DialogTitle className="font-bold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-900" /> {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
                    </DialogTitle>
                </DialogHeader>

                <form autoComplete="off" className="py-4 space-y-5 text-left">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome Completo</label>
                        <Input value={editData.nome} onChange={(e) => setEditData({ ...editData, nome: e.target.value })} className="rounded-xl border-slate-200 h-12" autoComplete="off" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail Corporativo</label>
                        <Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="rounded-xl border-slate-200 h-12" autoComplete="new-password" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{selectedUser ? 'Nova Senha (Opcional)' : 'Senha de Acesso'}</label>
                        <div className="relative">
                            <Input type="password" placeholder={selectedUser ? "Em branco para manter" : "Mínimo 8 caracteres"} value={editData.senha} onChange={(e) => setEditData({ ...editData, senha: e.target.value })} className="rounded-xl border-slate-200 h-12 pl-10" autoComplete="new-password" />
                            <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-4" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Perfil de Acesso</label>
                        <Select value={editData.perfil} onValueChange={(val) => setEditData({ ...editData, perfil: val ?? '' })}>
                            <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                <SelectValue placeholder="Selecione o perfil" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                                <SelectItem value="GESTOR">Gestor</SelectItem>
                                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                                <SelectItem value="ADMIN">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold" disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={onSave} className="bg-red-900 hover:bg-red-800 rounded-xl font-bold text-white min-w-[140px]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BadgeCheck className="h-4 w-4 mr-2" />}
                        {selectedUser ? 'Salvar Alterações' : 'Criar Usuário'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}