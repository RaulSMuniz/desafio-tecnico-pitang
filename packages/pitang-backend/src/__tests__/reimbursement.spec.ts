import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';
import bcrypt from 'bcryptjs';

describe('Reimbursement Flow (Business Rules)', () => {
    let tokenColaborador: string;
    let tokenColaborador2: string;
    let tokenGestor: string;
    let tokenFinanceiro: string;
    let categoriaId: number;
    let categoriaInativaId: number;

    beforeAll(async () => {
        const categoria = await prisma.category.findFirst({ where: { ativo: true } });
        if (!categoria) {
            const novaCat = await prisma.category.create({ data: { nome: 'Geral', ativo: true } });
            categoriaId = novaCat.id;
        } else {
            categoriaId = categoria.id;
        }

        const inativa = await prisma.category.upsert({
            where: { nome: 'Inativa' },
            update: {},
            create: { nome: 'Inativa', ativo: false }
        });
        categoriaInativaId = inativa.id;

        const hashedSenha = await bcrypt.hash('12345678', 10);
        
        // Criar usuários específicos para esta suíte para evitar poluição
        await prisma.user.upsert({
            where: { email: 'colab_test@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'colab_test@gmail.com', nome: 'Colab Test 1', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        await prisma.user.upsert({
            where: { email: 'outro_test@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'outro_test@gmail.com', nome: 'Colab Test 2', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        const [resColab, resColab2, resGestor, resFin] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'colab_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'outro_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'financeiro@gmail.com', senha: '12345678' })
        ]);

        tokenColaborador = resColab.body.token;
        tokenColaborador2 = resColab2.body.token;
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

        it('should return 400 if category is inactive', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Categoria Inativa',
                    valor: 50,
                    dataDespesa: new Date(),
                    categoriaId: categoriaInativaId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Visibility and Access Control', () => {
        let reimbursementId: string;

        beforeAll(async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Reembolso Privado',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });
            reimbursementId = res.body.data.id;
        });

        it('should restrict colaborador from accessing someone else\'s reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenColaborador2}`);

            expect(res.status).toBe(403);
        });

        it('should allow GESTOR to access any reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(200);
        });

        it('should allow FINANCEIRO to access any reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(200);
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
        });

        it('should return 400 when rejecting without a justification', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ justificativaRejeicao: '' });

            expect(res.status).toBe(400);
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

        it('should return 400 when trying to pay a reimbursement that is not APROVADO', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(400);
        });

        it('should block editing if status is not RASCUNHO', async () => {
            await request(app).post(`/reimbursements/${reimbursementId}/submit`).set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .put(`/reimbursements/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Tentativa de alteração',
                    valor: 120,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(400);
        });

        it('should allow a collaborator to cancel their own RASCUNHO', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/cancel`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            const data = res.body.data || res.body;
            expect(data.status).toBe('CANCELADO');
        });

        it('should return 400 when creating a reimbursement with a future date', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const res = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Viagem Futura',
                    valor: 500,
                    dataDespesa: tomorrow,
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(400);
        });

        it('should return 403 when a manager tries to approve a reimbursement they created as a collaborator', async () => {
            const resCreate = await request(app)
                .post('/reimbursements')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    descricao: 'Meu Reembolso de Viagem',
                    valor: 150,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(resCreate.status).toBe(201);
            const myId = resCreate.body.data.id;
            const myUserId = resCreate.body.data.solicitanteId;

            await request(app).post(`/reimbursements/${myId}/submit`).set('Authorization', `Bearer ${tokenColaborador}`);

            await prisma.user.update({
                where: { id: myUserId },
                data: { perfil: 'GESTOR' }
            });

            const resApprove = await request(app)
                .post(`/reimbursements/${myId}/approve`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(resApprove.status).toBe(403);

            await prisma.user.update({
                where: { id: myUserId },
                data: { perfil: 'COLABORADOR' }
            });
        });
    });
});
