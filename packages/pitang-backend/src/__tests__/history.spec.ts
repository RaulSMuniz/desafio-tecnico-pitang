import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';
import bcrypt from 'bcrypt';

describe('Audit History (Traceability Rules)', () => {
    let tokenColaborador = '';
    let tokenOutroColaborador = '';
    let tokenGestor = '';
    let tokenFinanceiro = '';
    let tokenAdmin = '';
    let reimbursementId: string;

    beforeAll(async () => {
        const hashedSenha = await bcrypt.hash('12345678', 10);

        // Criar usuários específicos para esta suíte para evitar poluição
        await prisma.user.upsert({
            where: { email: 'history_colab@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'history_colab@gmail.com', nome: 'History Colab', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        await prisma.user.upsert({
            where: { email: 'history_outro@gmail.com' },
            update: { perfil: 'COLABORADOR', ativo: true, deletadoEm: null },
            create: { email: 'history_outro@gmail.com', nome: 'History Outro', senha: hashedSenha, perfil: 'COLABORADOR' }
        });

        const [resColab, resOutro, resGestor, resFinanceiro, resAdmin] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'history_colab@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'history_outro@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'financeiro@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'admin@gmail.com', senha: '12345678' })
        ]);

        const getCookie = (res: any) => {
            const cookies = res.header['set-cookie'];
            if (!cookies || !cookies[0]) return '';
            return cookies[0].split(';')[0].split('=')[1] || '';
        };

        tokenColaborador = getCookie(resColab);
        tokenOutroColaborador = getCookie(resOutro);
        tokenGestor = getCookie(resGestor);
        tokenFinanceiro = getCookie(resFinanceiro);
        tokenAdmin = getCookie(resAdmin);

        const cat = await prisma.category.findFirst({ where: { ativo: true } });
        const rb = await request(app)
            .post('/reimbursements')
            .set('Cookie', [`pitang_token=${tokenColaborador}`])
            .send({
                descricao: 'Solicitação para Teste de Histórico',
                valor: 150.00,
                dataDespesa: new Date(),
                categoriaId: cat!.id
            });

        reimbursementId = rb.body.data.id;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('GET /history', () => {
        it('should allow a colaborador to see only their own history records', async () => {
            const res = await request(app)
                .get('/history')
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            if (res.body.data.length > 0) {
                res.body.data.forEach((h: any) => {
                    expect(h).toHaveProperty('solicitacaoId');
                    expect(h).toHaveProperty('acao');
                    expect(h).toHaveProperty('usuario');
                    expect(h.criadoEm).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
                });
            }
        });

        it('should allow a gestor to see all history records', async () => {
            const res = await request(app)
                .get('/history')
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /history/:id', () => {
        it('should allow the owner to access history of a specific reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(200);
            expect(res.body.data[0]).toHaveProperty('criadoEm');
            expect(res.body.data[0].criadoEm).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
        });

        it('should allow gestor to access history of a specific reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(200);
        });

        it('should allow financeiro to access history of a specific reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(200);
        });

        it('should allow admin to access history of any reimbursement by ID', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(200);
        });

        it('should return 404 for an invalid reimbursement ID', async () => {
            const res = await request(app)
                .get('/history/999999')
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(400);
        });

        it('should forbid a colaborador from accessing history of another person\'s reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Cookie', [`pitang_token=${tokenOutroColaborador}`]);

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('Acesso negado');
        });
    });
});