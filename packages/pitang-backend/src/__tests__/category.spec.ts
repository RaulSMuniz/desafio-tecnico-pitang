import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('Category Management (Admin Rules)', () => {
    let tokenAdmin = '';
    let tokenColaborador = '';
    let tokenGestor = '';

    beforeAll(async () => {
        const [resAdmin, resColab, resGestor] = await Promise.all([
            request(app).post('/auth/login').send({ email: 'admin@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' }),
            request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' })
        ]);
        const getCookie = (res: any) => {
            const cookies = res.header['set-cookie'];
            if (!cookies || !cookies[0]) return '';
            return cookies[0].split(';')[0].split('=')[1] || '';
        };
        tokenAdmin = getCookie(resAdmin);
        tokenColaborador = getCookie(resColab);
        tokenGestor = getCookie(resGestor);
    });

    it('should allow ADMIN to create a new category', async () => {
        const nomeUnico = `Viagens ${Date.now()}`;
        const res = await request(app)
            .post('/categories')
            .set('Cookie', [`pitang_token=${tokenAdmin}`])
            .send({ nome: nomeUnico, ativo: true });

        expect(res.status).toBe(201);
        const data = res.body.data || res.body;
        expect(data.nome).toBe(nomeUnico);
    });

    it('should allow ADMIN to edit a category', async () => {
        const nomeCategory = `Update ${Date.now()}`;

        const category = await prisma.category.create({
            data: {
                nome: nomeCategory,
                ativo: true
            }
        });

        const newId = category.id;
        const newName = `Update_${Date.now()}`;

        const res = await request(app)
            .put(`/categories/${newId}`)
            .set('Cookie', [`pitang_token=${tokenAdmin}`])
            .send({ nome: newName, ativo: false });

        expect(res.status).toBe(200);
        const data = res.body.data || res.body;
        expect(data.nome).toBe(newName);
        expect(data.ativo).toBe(false);
    });

    it('should allow anyone authenticated to list categories', async () => {
        const res = await request(app)
            .get('/categories')
            .set('Cookie', [`pitang_token=${tokenColaborador}`]);

        expect(res.status).toBe(200);
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
    });

    it('should forbid COLABORADOR from creating categories', async () => {
        const res = await request(app)
            .post('/categories')
            .set('Cookie', [`pitang_token=${tokenColaborador}`])
            .send({ nome: 'Tentativa Hacker' });

        expect(res.status).toBe(403);
    });

    it('should forbid GESTOR from creating categories', async () => {
        const res = await request(app)
            .post('/categories')
            .set('Cookie', [`pitang_token=${tokenGestor}`])
            .send({ nome: 'Tentativa Gestor' });

        expect(res.status).toBe(403);
    });

    it('should forbid COLABORADOR from editing categories', async () => {
        const res = await request(app)
            .put('/categories/1')
            .set('Cookie', [`pitang_token=${tokenColaborador}`])
            .send({ nome: 'Edit Hacker' });

        expect(res.status).toBe(403);
    });

    it('should return 400 for invalid category data', async () => {
        const res = await request(app)
            .post('/categories')
            .set('Cookie', [`pitang_token=${tokenAdmin}`])
            .send({ nome: '' });

        expect(res.status).toBe(400);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });
});