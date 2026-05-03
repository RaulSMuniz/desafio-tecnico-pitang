import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('Audit History (Traceability Rules)', () => {
    let tokenColaborador: string;
    let tokenOutroColaborador: string;
    let tokenGestor: string;
    let reimbursementId: string;

    beforeAll(async () => {
        const [resColab, resOutro, resGestor] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'outro@gmail.com', senha: '12345678' }),
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
                .set('Authorization', `Bearer ${tokenColaborador}`);

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
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /history/:id', () => {
        it('should allow the owner to access history of a specific reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(res.body.data[0]).toHaveProperty('criadoEm');
            expect(res.body.data[0].criadoEm).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
        });

        it('should forbid a colaborador from accessing history of another person\'s reimbursement', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenOutroColaborador}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('Acesso negado');
        });

        it('should allow gestor to access history of any reimbursement by ID', async () => {
            const res = await request(app)
                .get(`/history/${reimbursementId}`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(200);
        });

        it('should return 404 for an invalid reimbursement ID', async () => {
            const res = await request(app)
                .get('/history/999999')
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(400);
        });
    });
});