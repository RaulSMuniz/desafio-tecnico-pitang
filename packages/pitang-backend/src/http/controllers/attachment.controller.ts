import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../core/PrismaClient.js";
import { attachmentSchema, paramId } from "../../schemas/index.js";
import z from "zod";

export async function postAttachmentSimulated(req: Request, res: Response, next: NextFunction) {
    try {
        const paramIdResult = paramId.safeParse(req.params);

        if (!paramIdResult.success) {
            return res.status(400).json({
                message: "Dados de entrada inválidos",
                errors: z.treeifyError(paramIdResult.error),
                statusCode: 400
            });
        }

        const id = paramIdResult.data.id;
        const result = attachmentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.message,
                errors: z.treeifyError(result.error),
                statusCode: 400
            });
        }

        const { nomeArquivo, tipoArquivo } = result.data;
        const reimbursement = await prisma.reimbursement.findUnique({ where: { id } });

        if (!reimbursement) {
            return res.status(404).json({ message: "Reembolso não encontrado", statusCode: 404 });
        }

        if (reimbursement.solicitanteId !== req.user.id) {
            return res.status(403).json({ message: "Acesso negado", statusCode: 403 });
        }

        if (reimbursement.status !== "RASCUNHO") {
            return res.status(400).json({
                message: "Não é possível adicionar anexos a um reembolso que já foi enviado ou finalizado.",
                statusCode: 400
            });
        }

        const attachment = await prisma.attachment.create({
            data: {
                solicitacaoId: id,
                nomeArquivo,
                urlArquivo: `https://simulated-storage.com/uploads/${Date.now()}-${nomeArquivo}`,
                tipoArquivo
            }
        });

        return res.status(200).json({
            message: "Anexo simulado com sucesso",
            statusCode: 200,
            data: attachment
        });
    } catch (error) {
        next(error);
    }
}

export async function getAttachmentById(req: Request, res: Response, next: NextFunction) {
    try {
        const paramIdResult = paramId.safeParse(req.params);
        if (!paramIdResult.success) {
            return res.status(400).json({ message: "ID do reembolso inválido", statusCode: 400 });
        }

        const solicitacaoId = paramIdResult.data.id;

        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id: solicitacaoId }
        });

        if (!reimbursement) {
            return res.status(404).json({ message: "Reembolso não encontrado", statusCode: 404 });
        }

        const isOwner = reimbursement.solicitanteId === req.user.id;
        const isPrivileged = ['GESTOR', 'FINANCEIRO', 'ADMIN'].includes(req.user.perfil as string);

        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ message: "Acesso negado", statusCode: 403 });
        }

        const attachments = await prisma.attachment.findMany({
            where: { solicitacaoId }
        });

        if (!attachments) {
            return res.status(404).json({ message: "Anexos não encontrados", statusCode: 404 });
        }

        return res.status(200).json({
            message: "Anexos listados com sucesso",
            statusCode: 200,
            data: attachments
        });
    } catch (error) {
        next(error);
    }
}