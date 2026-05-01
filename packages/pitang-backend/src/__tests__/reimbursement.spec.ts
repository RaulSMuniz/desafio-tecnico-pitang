import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('Reimbursement Flow (Business Rules)', () => {
    let tokenColaborador: string;
    let tokenGestor: string;
    let tokenFinanceiro: string;
    let categoriaId: number;

    beforeAll(async () => {
        const categoria = await prisma.category.findFirst({ where: { ativo: true } });
        if (!categoria) {
            const novaCat = await prisma.category.create({ data: { nome: 'Geral', ativo: true } });
            categoriaId = novaCat.id;
        } else {
            categoriaId = categoria.id;
        }

        const [resColab, resGestor, resFin] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'financeiro@gmail.com', senha: '12345678' })
        ]);

        tokenColaborador = resColab.body.token;
        tokenGestor = resGestor.body.token;
        tokenFinanceiro = resFin.body.token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Creation and Validation (Zod)', () => {
        it('should create a reimbursement as RASCUNHO and record history', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Almoço com cliente',
                    valor: 45.00,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.status).toBe('RASCUNHO');

            const history = await prisma.history.findFirst({
                where: { solicitacaoId: response.body.data.id, acao: 'CREATED' }
            });
            expect(history).toBeDefined();
        });

        it('should return 400 if valor is zero or negative', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Valor inválido',
                    valor: 0,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Status Transitions and RBAC', () => {
        let reimbursementId: string;

        beforeEach(async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Teste de Fluxo',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            reimbursementId = res.body.data?.id;

            if (!reimbursementId) {
                throw new Error("Falha no teste: O Controller não retornou o ID em body.data.id");
            }
        });

        it('should allow manager to approve only if status is ENVIADO', async () => {
            const failRes = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(failRes.status).toBe(400);

            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const successRes = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(successRes.status).toBe(200);
            expect(successRes.body.data.status).toBe('APROVADO');
        });

        it('should forbid collaborator from approving their own reimbursement', async () => {
            const response = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(response.status).toBe(403);
        });

        it('should require a justification when rejecting', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const response = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ justificativaRejeicao: '' });

            expect(response.status).toBe(400);
        });

        it('should require justification and change status to REJEITADO', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ justificativaRejeicao: 'Nota fiscal ilegível' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('REJEITADO');

            const history = await prisma.history.findFirst({
                where: { solicitacaoId: reimbursementId, acao: 'REJECTED' }
            });
            expect(history?.observacao).toContain('Nota fiscal ilegível');
        });

        it('should allow FINANCEIRO to mark as PAGO only if APROVADO', async () => {
            await request(app).post(`/reimbursements/${reimbursementId}/submit`).set('Authorization', `Bearer ${tokenColaborador}`);
            await request(app).post(`/reimbursements/${reimbursementId}/approve`).set('Authorization', `Bearer ${tokenGestor}`);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('PAGO');
        });

        it('should block editing if status is not RASCUNHO', async () => {
            await request(app).post(`/reimbursements/${reimbursementId}/submit`).set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .put(`/reimbursements/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({ descricao: 'Tentativa de alteração pós-envio' });

            expect(res.status).toBe(400);
        });

        it('should allow a collaborator to cancel their own RASCUNHO', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/cancel`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);

            // Tenta pegar status de .data ou do corpo direto
            const data = res.body.data || res.body;
            expect(data.status).toBe('CANCELADO');

            const history = await prisma.history.findFirst({
                where: { solicitacaoId: reimbursementId, acao: 'CANCELED' }
            });
            expect(history).toBeDefined();
        });

        it('should allow uploading a simulated attachment', async () => {
            // Se der 404, certifique-se que sua rota no express é:
            // router.post('/:id/attachments', controller)
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nomeArquivo: 'cupom.pdf',
                    urlArquivo: 'http://upload.com/cupom.pdf',
                    tipoArquivo: 'application/pdf'
                });

            // Se o backend não tiver essa rota, este teste continuará dando 404
            expect(res.status).toBe(201);

            const attachment = await prisma.attachment.findFirst({
                where: { solicitacaoId: reimbursementId }
            });
            expect(attachment).toBeDefined();
        });
    });
});