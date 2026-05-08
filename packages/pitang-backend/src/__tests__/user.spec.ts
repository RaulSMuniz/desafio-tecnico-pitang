import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('User Management (Admin CRUD Rules)', () => {
    let tokenAdmin = '';
    let userIdParaTeste: string;
    const emailUnico = `admin_test_${Date.now()}@pitang.com`;


    // Fazendo o login de administrador para poder acessar as rotas de gerenciamento
    beforeAll(async () => {
        const resAdmin = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@gmail.com', senha: '12345678' });

        const getCookie = (res: any) => {
            const cookies = res.header['set-cookie'];
            if (!cookies || !cookies[0]) return '';
            return cookies[0].split(';')[0].split('=')[1] || '';
        };
        tokenAdmin = getCookie(resAdmin);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Admin Flow - Create, Update', () => {
        it('should allow admin to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Cookie', [`pitang_token=${tokenAdmin}`])
                .send({
                    nome: 'Novo Usuario Teste',
                    email: emailUnico,
                    senha: 'senha_segura_123',
                    perfil: 'GESTOR'
                });

            expect(res.status).toBe(201);

            const createdUser = await prisma.user.findUnique({ where: { email: emailUnico } });
            userIdParaTeste = createdUser!.id;
        });

        it('should allow admin to update user information', async () => {
            const res = await request(app)
                .put(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`])
                .send({
                    nome: 'Nome Atualizado',
                    email: emailUnico,
                    perfil: 'ADMIN'
                });

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.nome).toBe('Nome Atualizado');
        });
    });

    describe('Admin Flow - Soft Delete and Recovery', () => {
        it('should allow admin to soft delete users', async () => {
            const res = await request(app)
                .delete(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).not.toBeNull();
        });

        it('should allow admin to restore a soft-deleted user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Cookie', [`pitang_token=${tokenAdmin}`]);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).toBeNull();
        });
    });

    describe('Fail cases (Colaborador, Gestor, Financeiro)', () => {
        let tokenColaborador = '';
        let tokenGestor = '';
        let tokenFinanceiro = '';

        beforeAll(async () => {
            const [resColab, resGestor, resFinanceiro] = await Promise.all([
                request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' }),
                request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' }),
                request(app).post('/auth/login').send({ email: 'financeiro@gmail.com', senha: '12345678' })
            ]);

            const getCookie = (res: any) => res.header['set-cookie']?.[0]?.split(';')[0]?.split('=')[1] || '';
            tokenColaborador = getCookie(resColab);
            tokenGestor = getCookie(resGestor);
            tokenFinanceiro = getCookie(resFinanceiro);
        });

        // Colaborador fail case, should not be able to create a user
        it('should return 403 for a collaborator trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    nome: 'Novo Usuario Teste',
                    email: emailUnico,
                    senha: 'senha_segura_123',
                    perfil: 'GESTOR'
                });

            expect(res.status).toBe(403);
        });

        // Colaborador fail case, should not be able to update a user
        it('should return 403 for a collaborator trying to update a user', async () => {
            const res = await request(app)
                .put(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`])
                .send({
                    nome: 'Nome Atualizado',
                    email: emailUnico,
                    perfil: 'ADMIN'
                });

            expect(res.status).toBe(403);
        });

        // Colaborador fail case, should not be able to delete a user
        it('should return 403 for a collaborator trying to delete a user', async () => {
            const res = await request(app)
                .delete(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(403);
        });

        // Colaborador fail case, should not be able to restore a user
        it('should return 403 for a collaborator trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Cookie', [`pitang_token=${tokenColaborador}`]);

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to create a user
        it('should return 403 for a gestor trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Cookie', [`pitang_token=${tokenGestor}`])
                .send({
                    nome: 'Novo Usuario Teste',
                    email: emailUnico,
                    senha: 'senha_segura_123',
                    perfil: 'GESTOR'
                });

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to update a user
        it('should return 403 for a gestor trying to update a user', async () => {
            const res = await request(app)
                .put(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenGestor}`])
                .send({
                    nome: 'Nome Atualizado',
                    email: emailUnico,
                    perfil: 'ADMIN'
                });

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to delete a user
        it('should return 403 for a gestor trying to delete a user', async () => {
            const res = await request(app)
                .delete(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to restore a user
        it('should return 403 for a gestor trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Cookie', [`pitang_token=${tokenGestor}`]);

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to create a user
        it('should return 403 for a financeiro trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`])
                .send({
                    nome: 'Novo Usuario Teste',
                    email: emailUnico,
                    senha: 'senha_segura_123',
                    perfil: 'GESTOR'
                });

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to update a user
        it('should return 403 for a financeiro trying to update a user', async () => {
            const res = await request(app)
                .put(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`])
                .send({
                    nome: 'Nome Atualizado',
                    email: emailUnico,
                    perfil: 'ADMIN'
                });

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to delete a user
        it('should return 403 for a financeiro trying to delete a user', async () => {
            const res = await request(app)
                .delete(`/users/${userIdParaTeste}`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to restore a user
        it('should return 403 for a financeiro trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Cookie', [`pitang_token=${tokenFinanceiro}`]);

            expect(res.status).toBe(403);
        });
    })
});