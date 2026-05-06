import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('Attachment Management (List and Security Rules)', () => {
    let tokenColaborador: string;
    let tokenOutroColaborador: string;
    let tokenGestor: string;
    let reimbursementId: string;

    beforeAll(async () => {
        const hashedSenha = await bcrypt.hash('12345678', 10);

        // Criar usuários específicos para esta suíte para evitar poluição
        await prisma.user.upsert({
            where: { email: 'attach_colab@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'attach_colab@gmail.com', nome: 'Attach Colab', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        await prisma.user.upsert({
            where: { email: 'attach_outro@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'attach_outro@gmail.com', nome: 'Attach Outro', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        const [resColab, resOutro, resGestor] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'attach_colab@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'attach_outro@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' })
        ]);

        tokenColaborador = resColab.body.token;
        tokenOutroColaborador = resOutro.body.token;
        tokenGestor = resGestor.body.token;

        const cat = await prisma.category.findFirst({ where: { ativo: true } });
        const rb = await request(app)
            .post('/reimbursements')
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({
                descricao: 'Reembolso para Teste de Listagem de Anexos',
                valor: 120.00,
                dataDespesa: new Date(),
                categoriaId: cat!.id
            });

        reimbursementId = rb.body.data.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /reimbursements/:id/attachments', () => {
        it('should allow the owner to upload a simulated attachment', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nomeArquivo: 'comprovante_01.pdf',
                    tipoArquivo: 'application/pdf'
                });

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('solicitacaoId', reimbursementId);
        });

        it('should block attachments if status is not RASCUNHO', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nomeArquivo: 'arquivo_atrasado.jpg',
                    tipoArquivo: 'image/jpeg'
                });

            expect(res.status).toBe(400);
            expect(res.body.message.toLowerCase()).toContain('não é possível adicionar anexos');
        });
    });

    describe('GET /reimbursements/:id/attachments', () => {
        it('should return a list of attachments for the owner of the reimbursement', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0]).toHaveProperty('nomeArquivo', 'comprovante_01.pdf');
        });

        it('should allow GESTOR to list attachments of any reimbursement', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should forbid other colaboradores from listing attachments of a reimbursement they do not own', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}/attachments`)
                .set('Authorization', `Bearer ${tokenOutroColaborador}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Acesso negado: seu perfil não tem permissão para esta ação.');
        });

        it('should return 404 for a non-existent reimbursement ID', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const res = await request(app)
                .get(`/reimbursements/${fakeId}/attachments`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('Reembolso não encontrado');
        });
    });
});