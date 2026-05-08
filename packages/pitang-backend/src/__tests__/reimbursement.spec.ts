import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';
import bcrypt from 'bcryptjs';

describe('Reimbursement Flow (Business Rules)', () => {
    let tokenColaborador = '';
    let tokenColaborador2 = '';
    let tokenGestor = '';
    let tokenFinanceiro = '';
    let tokenAdmin = '';
    let categoriaId: number;
    let categoriaInativaId: number;
    let reimbursementId: string;

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

        await prisma.user.upsert({
            where: { email: 'gestor_test@gmail.com' },
            update: { perfil: 'GESTOR', ativo: true, deletadoEm: null },
            create: { email: 'gestor_test@gmail.com', nome: 'Gestor Test', senha: hashedSenha, perfil: 'GESTOR' }
        });

        await prisma.user.upsert({
            where: { email: 'financeiro_test@gmail.com' },
            update: { perfil: 'FINANCEIRO', ativo: true, deletadoEm: null },
            create: { email: 'financeiro_test@gmail.com', nome: 'Financeiro Test', senha: hashedSenha, perfil: 'FINANCEIRO' }
        });

        await prisma.user.upsert({
            where: { email: 'admin_test@gmail.com' },
            update: { perfil: 'ADMIN', ativo: true, deletadoEm: null },
            create: { email: 'admin_test@gmail.com', nome: 'Admin Test', senha: hashedSenha, perfil: 'ADMIN' }
        });

        const [resColab, resColab2, resGestor, resFin, resAdmin] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'colab_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'outro_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'financeiro_test@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'admin_test@gmail.com', senha: '12345678' })
        ]);

        const getCookie = (res: any) => {
            const cookies = res.header['set-cookie'];
            if (!cookies || !cookies[0]) return '';
            return cookies[0].split(';')[0].split('=')[1] || '';
        };

        tokenColaborador = getCookie(resColab);
        tokenColaborador2 = getCookie(resColab2);
        tokenGestor = getCookie(resGestor);
        tokenFinanceiro = getCookie(resFin);
        tokenAdmin = getCookie(resAdmin);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Colaborador Flow', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Teste de Fluxo',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            reimbursementId = res.body.data?.id;
        });

        // Colaborador test case, colaborador creating a reimbursement
        it('should create a reimbursement as RASCUNHO and record history', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
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

        // Colaborador test case, colaborador editing their own RASCUNHO
        it('should allow a collaborator to edit their own RASCUNHO', async () => {
            const res = await request(app)
                .put(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Editado',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(200);
        });

        // Colaborador test case, colaborador canceling their own RASCUNHO
        it('should allow a collaborator to cancel their own RASCUNHO', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/cancel`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(200);
        });

        // Colaborador test case, colaborador submitting their own RASCUNHO
        it('should allow a collaborator to submit their own RASCUNHO', async () => {
            const resCreate = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Teste de Fluxo',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(resCreate.status).toBe(201);

            const reimbursementIdCreate = resCreate.body.data?.id;

            const resSubmit = await request(app)
                .post(`/reimbursements/${reimbursementIdCreate}/submit`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(resSubmit.status).toBe(200);
        });

        // Colaborador test case, colaborador should be able to access his own reimbursements
        it('should allow a collaborator to list his reimbursements', async () => {
            const res = await request(app)
                .get(`/reimbursements`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(200);
        });

        // Colaborador test case, colaborador creating a reimbursement with invalid value
        it('should return 400 if valor is zero or negative', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Valor inválido',
                    valor: 0,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(response.status).toBe(400);
        });

        // Colaborador test case, colaborador creating a reimbursement with inactive category
        it('should return 400 if category is inactive', async () => {
            const response = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Categoria Inativa',
                    valor: 50,
                    dataDespesa: new Date(),
                    categoriaId: categoriaInativaId
                });

            expect(response.status).toBe(400);
        });

        // Colaborador test case, colaborador 2 trying to access reimbursement created by colaborador 1
        it('should restrict colaborador from accessing someone else\'s reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenColaborador2}`]);

            expect(res.status).toBe(403);
        });

        // Colaborador test case, colaborador trying to edit a reimbursement that is not in RASCUNHO status
        it('should block editing if status is not RASCUNHO', async () => {
            await request(app).post(`/reimbursements/${reimbursementId}/submit`).set('Cookie', [`pitang_token=${tokenColaborador}`]);

            const res = await request(app)
                .put(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Tentativa de alteração',
                    valor: 120,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(400);
        });

        // Colaborador test case, colaborador creating a reimbursement with a future date
        it('should return 400 when creating a reimbursement with a future date', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const res = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Viagem Futura',
                    valor: 500,
                    dataDespesa: tomorrow,
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(400);
        });

        // Colaborador test case, colaborador trying to pay a reimbursement
        it('should return 403 when a collaborator tries to pay a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(403);
        });

        // Colaborador test case, colaborador trying to approve a reimbursement
        it('should return 403 when a collaborator tries to approve a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(403);
        });

        // Colaborador test case, colaborador trying to reject a reimbursement
        it('should return 403 when a collaborator tries to reject a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(403);
        });
    });

    describe('Gestor Flow', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Teste de Fluxo',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            reimbursementId = res.body.data?.id;
        });

        // Gestor test case, GESTOR accessing any reimbursement detail
        it('should allow GESTOR to access any reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(200);
        });

        // Gestor test case, GESTOR rejecting a reimbursement
        it('should require justification and change status to REJEITADO', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Cookie', [`pitang_token=${tokenGestor}`])
                .send({ justificativaRejeicao: 'Nota fiscal ilegível' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('REJEITADO');
        });

        // Gestor test case, GESTOR trying to approve a reimbursement that is not in ENVIADO status
        it('should allow manager to approve only if status is ENVIADO', async () => {
            const failRes = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(failRes.status).toBe(400);

            // Gestor test case, GESTOR approving a reimbursement
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            const successRes = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(successRes.status).toBe(200);
            expect(successRes.body.data.status).toBe('APROVADO');
        });

        // GESTOR TEST case, GESTOR rejecting a reimbursement without a justification
        it('should return 400 when rejecting without a justification', async () => {
            await request(app)
                .post(`/reimbursements/${reimbursementId}/submit`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Cookie', [`pitang_token=${tokenGestor}`])
                .send({ justificativaRejeicao: '' });

            expect(res.status).toBe(400);
        });

        // Gestor test case, gestor trying to approve a reimbursement they created as a collaborator
        it('should return 403 when a manager tries to approve a reimbursement they created as a collaborator', async () => {
            const resCreate = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Meu Reembolso de Viagem',
                    valor: 150,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });
            // Successful post as a collaborator
            expect(resCreate.status).toBe(201);
            const myId = resCreate.body.data.id;
            const myUserId = resCreate.body.data.solicitanteId;

            // Successfully submitted as a collaborator
            await request(app).post(`/reimbursements/${myId}/submit`).set('Cookie', [`pitang_token=${tokenColaborador}`]);

            // Promoting the user to GESTOR
            await prisma.user.update({
                where: { id: myUserId },
                data: { perfil: 'GESTOR' }
            });

            // Trying to approve the reimbursement as a GESTOR
            const resApprove = await request(app)
                .post(`/reimbursements/${myId}/approve`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(resApprove.status).toBe(403);

            // Demoting the user to COLABORADOR
            await prisma.user.update({
                where: { id: myUserId },
                data: { perfil: 'COLABORADOR' }
            });
        });

        // Gestor test case, gestor not being able to approve a reimbursement that is not in ENVIADO status
        it('should return 400 when a manager tries to approve a reimbursement that is not in ENVIADO status', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(400);
        });
    });

    describe('Financeiro Flow', () => {
        beforeEach(async () => {
            const res = await request(app)
                .post('/reimbursements')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    descricao: 'Teste de Fluxo',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            reimbursementId = res.body.data?.id;
        });

        // Financeiro test case, FINANCEIRO accessing any reimbursement detail
        it('should allow FINANCEIRO to access any reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(200);
        });

        // FINANCEIRO test case, FINANCEIRO marking a reimbursement as PAGO
        it('should allow FINANCEIRO to mark as PAGO only if APROVADO', async () => {
            await request(app).post(`/reimbursements/${reimbursementId}/submit`).set('Cookie', [`pitang_token=${tokenColaborador}`]);
            await request(app).post(`/reimbursements/${reimbursementId}/approve`).set('Cookie', [`pitang_token=${tokenGestor}`]);

            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('PAGO');
        });

        // Financeiro test case, FINANCEIRO trying to pay a reimbursement that is not in APROVADO status
        it('should return 400 when trying to pay a reimbursement that is not APROVADO', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(400);
        });

        // Financeiro test case, financeiro trying to approve a reimbursement that is not in ENVIADO status
        it('should return 403 when a financeiro tries to approve a reimbursement that is not in ENVIADO status', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(403);
        });
    });

    describe('Admin Flow', () => {
        // Admin test case, admin accessing any reimbursement detail
        it('should allow admin to access any reimbursement detail', async () => {
            const res = await request(app)
                .get(`/reimbursements/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(200);
        });

        // Admin test case, admin should not be able to create a reimbursement
        it('should return 403 when an admin tries to create a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`])
                .send({
                    descricao: 'Reembolso de Viagem',
                    valor: 100,
                    dataDespesa: new Date(),
                    categoriaId: categoriaId
                });

            expect(res.status).toBe(403);
        });

        // Admin test case, admin should not be able to reject a reimbursement
        it('should return 403 when an admin tries to reject a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/reject`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`])
                .send({
                    justificativaRejeicao: 'Rejeitado pelo admin'
                });

            expect(res.status).toBe(403);
        });

        // Admin test case, admin should not be able to approve a reimbursement
        it('should return 403 when an admin tries to approve a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/approve`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(403);
        });

        // Admin test case, admin should not be able to pay a reimbursement
        it('should return 403 when an admin tries to pay a reimbursement', async () => {
            const res = await request(app)
                .post(`/reimbursements/${reimbursementId}/pay`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(403);
        });
    });
});
