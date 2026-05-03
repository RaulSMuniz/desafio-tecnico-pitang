import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from 'react'
import { rejectionSchema } from '@/zodSchemas'

interface RejectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (justificativa: string) => void
}

export function RejectionModal({ isOpen, onClose, onConfirm }: RejectionModalProps) {
    const [text, setText] = useState('')
    const isValid = rejectionSchema.safeParse({ justificativa: text }).success

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rejeitar Solicitação</DialogTitle>
                    <DialogDescription>
                        É obrigatório informar uma justificativa para a rejeição deste reembolso.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Descreva o motivo da rejeição..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        disabled={!isValid}
                        onClick={() => {
                            onConfirm(text)
                            setText('')
                        }}
                    >
                        Confirmar Rejeição
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}