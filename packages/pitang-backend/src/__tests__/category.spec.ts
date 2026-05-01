import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('Category Management (Admin Rules)', () => {
    let tokenAdmin: string;
    let tokenColaborador: string;

    beforeAll(async () => {
        const [resAdmin, resColab] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'admin@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' })
        ]);
        tokenAdmin = resAdmin.body.token;
        tokenColaborador = resColab.body.token;
    });

    it('should allow ADMIN to create a new category', async () => {
        const nomeUnico = `Viagens ${Date.now()}`; // Garante que não dê erro 409
        const res = await request(app)
            .post('/categories')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ nome: nomeUnico, ativo: true });

        expect(res.status).toBe(201);
        const data = res.body.data || res.body;
        expect(data.nome).toBe(nomeUnico);
    });

    it('should forbid COLABORADOR from creating categories', async () => {
        const res = await request(app)
            .post('/categories')
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({ nome: 'Tentativa Hacker' });

        expect(res.status).toBe(403);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});