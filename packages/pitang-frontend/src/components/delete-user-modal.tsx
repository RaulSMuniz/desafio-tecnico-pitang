import { AlertTriangle, UserMinus, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

interface DeleteUserModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    selectedUser: any
    onDelete: () => void
    isSubmitting: boolean
}

export function DeleteUserModal({ isOpen, onOpenChange, selectedUser, onDelete, isSubmitting }: DeleteUserModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl max-w-sm [&>button]:text-slate-400 [&>button]:opacity-100">
                <DialogHeader className="text-left">
                    <DialogTitle className="font-bold flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" /> Desativar Usuário
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-2">
                        Deseja desativar o acesso de <strong>{selectedUser?.nome}</strong>? O histórico de solicitações será mantido, mas o usuário não poderá mais acessar o sistema.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold" disabled={isSubmitting}>Cancelar</Button>
                    <Button onClick={onDelete} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold min-w-[120px]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserMinus className="h-4 w-4 mr-2" />}
                        Desativar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}