import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Tag, FileText, Download, Eye, ChevronLeft, ImageOff, History, User } from 'lucide-react'
import { useState } from 'react'
import dayjs from 'dayjs'

interface ViewModalProps {
    isOpen: boolean
    onClose: () => void
    data: any
}

export function ViewReimbursementModal({ isOpen, onClose, data }: ViewModalProps) {
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [imageError, setImageError] = useState(false);

    if (!data) return null;

    const attachments = data.attachments || data.anexos || [];
    const history = data.history || [];

    const isSimulated = (url: string) => url?.includes('simulated-storage.com') || url?.includes('placeholder');

    const getStatusConfig = (action: string) => {
        const configs: any = {
            'CREATED': { label: 'Criado', color: 'text-blue-600', bg: 'bg-blue-100' },
            'SUBMITTED': { label: 'Enviado', color: 'text-indigo-600', bg: 'bg-indigo-100' },
            'APPROVED': { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-100' },
            'REJECTED': { label: 'Rejeitado', color: 'text-red-600', bg: 'bg-red-100' },
            'PAID': { label: 'Pago', color: 'text-amber-600', bg: 'bg-amber-100' },
            'UPDATED': { label: 'Editado', color: 'text-slate-600', bg: 'bg-slate-100' },
            'CANCELED': { label: 'Cancelado', color: 'text-slate-600', bg: 'bg-slate-100' },
        };
        return configs[action] || { label: action, color: 'text-slate-600', bg: 'bg-slate-100' };
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setSelectedFile(null);
                setImageError(false);
                onClose();
            }
        }}>
            <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl text-left max-h-[90vh] overflow-y-auto scrollbar-thin [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:text-black transition-colors">
                {selectedFile ? (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                        <div className="p-6 bg-red-950 flex items-center gap-4 text-left">
                            <button onClick={() => { setSelectedFile(null); setImageError(false); }} className="flex items-center gap-2 text-[10px] font-bold text-red-300 uppercase tracking-widest hover:text-white transition-colors">
                                <ChevronLeft className="h-4 w-4" /> Voltar
                            </button>
                            <div className="flex flex-col min-w-0 overflow-hidden text-left">
                                <p className="text-white font-bold text-xs truncate text-left">{selectedFile.nomeArquivo || "Arquivo"}</p>
                                <p className="text-[9px] text-red-400 font-bold uppercase text-left">{selectedFile.tipoArquivo || "Anexo"}</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 flex items-center justify-center min-h-[400px] p-4 text-left">
                            {isSimulated(selectedFile.urlArquivo) || imageError ? (
                                <div className="text-center p-8 flex flex-col items-center">
                                    <ImageOff className="h-16 w-16 text-slate-300 mb-4" />
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Pré-visualização indisponível</p>
                                </div>
                            ) : (
                                <img src={selectedFile.urlArquivo} alt="Preview" className="max-h-[450px] rounded-lg shadow-lg w-full object-contain" onError={() => setImageError(true)} />
                            )}
                        </div>
                        <div className="p-6 bg-white border-t border-slate-100 flex justify-center text-left">
                            <a href={selectedFile.urlArquivo || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-3 px-6 bg-red-900 rounded-xl text-xs font-bold text-white uppercase tracking-widest hover:bg-red-800 transition-colors">
                                <Download className="h-4 w-4" /> Baixar Arquivo Original
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="p-8 bg-red-950 text-white text-left">
                            <div className="text-left">
                                <Badge className="mb-2 bg-red-600 hover:bg-red-700 border-none font-bold uppercase text-[10px] w-fit tracking-widest">{data.status}</Badge>
                                <DialogTitle className="text-2xl font-bold leading-tight">Detalhes da Solicitação</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="p-8 space-y-8 bg-white text-left">
                            <div className="space-y-4 text-left">
                                <div className="flex items-start gap-3 text-left">
                                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">Descrição</p>
                                        <p className="text-slate-700 font-medium text-left">{data.descricao}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="flex items-start gap-3 text-left">
                                        <DollarSign className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">Valor</p>
                                            <p className="text-slate-900 font-bold text-left">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 text-left">
                                        <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">Data</p>
                                            <p className="text-slate-700 font-medium text-left">{dayjs(data.dataDespesa).format('DD/MM/YYYY')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <Tag className="h-5 w-5 text-slate-400 mt-0.5" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">Categoria</p>
                                        <p className="text-slate-700 font-medium text-left">{data.categoria?.nome || data.category?.nome || 'Não informada'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 text-left">
                                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3 text-left">Anexos Vinculados</p>
                                {attachments.length > 0 ? (
                                    <div className="space-y-2 text-left">
                                        {attachments.map((file: any, index: number) => (
                                            <div key={index} onClick={() => setSelectedFile(file)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer group text-left">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm text-left"><FileText className="h-4 w-4 text-red-800" /></div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px] text-left">{file.nomeArquivo || "Arquivo"}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase text-left">{file.tipoArquivo || "Anexo"}</p>
                                                    </div>
                                                </div>
                                                <Eye className="h-4 w-4 text-slate-300 group-hover:text-red-800 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-left">
                                        <p className="text-xs text-slate-400 italic uppercase font-bold tracking-tighter text-left">Nenhum anexo encontrado</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100 text-left">
                                <div className="flex items-center gap-2 mb-4 text-left">
                                    <History className="h-4 w-4 text-slate-400" />
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest text-left">Trilha de Auditoria</p>
                                </div>

                                {history.length > 0 ? (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-[15px] before:w-px before:bg-slate-100 text-left">
                                        {history.map((step: any, index: number) => {
                                            const config = getStatusConfig(step.acao);
                                            return (
                                                <div key={index} className="relative pl-10 text-left">
                                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center border-4 border-white z-10`}>
                                                        <User className={`h-3 w-3 ${config.color}`} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center justify-between mb-1 text-left">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                                                                {config.label}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium text-left">
                                                                {step.criadoEm}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-700 text-left">
                                                            {step.usuario?.nome || "Sistema"}
                                                        </p>
                                                        {step.observacao && (
                                                            <p className="text-[11px] text-slate-500 mt-0.5 italic text-left">
                                                                "{step.observacao}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic text-center">Nenhum histórico disponível</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}