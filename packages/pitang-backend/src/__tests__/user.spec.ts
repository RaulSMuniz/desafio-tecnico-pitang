import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('User Management (Admin CRUD Rules)', () => {
    let tokenAdmin: string;
    let userIdParaTeste: string;
    const emailUnico = `admin_test_${Date.now()}@pitang.com`;


    // Fazendo o login de administrador para poder acessar as rotas de gerenciamento
    beforeAll(async () => {
        const resAdmin = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@gmail.com', senha: '12345678' });

        tokenAdmin = resAdmin.body.token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Admin Flow - Create, Update', () => {
        it('should allow admin to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenAdmin}`)
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
                .set('Authorization', `Bearer ${tokenAdmin}`)
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
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).not.toBeNull();
        });

        it('should allow admin to restore a soft-deleted user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).toBeNull();
        });
    });

    describe('Fail cases (Colaborador, Gestor, Financeiro)', () => {
        let tokenColaborador: string;
        let tokenGestor: string;
        let tokenFinanceiro: string;

        beforeAll(async () => {
            const [resColab, resGestor, resFinanceiro] = await Promise.all([
                request(app).post('/auth/login').send({ email: 'colaborador@gmail.com', senha: '12345678' }),
                request(app).post('/auth/login').send({ email: 'gestor@gmail.com', senha: '12345678' }),
                request(app).post('/auth/login').send({ email: 'financeiro@gmail.com', senha: '12345678' })
            ]);

            tokenColaborador = resColab.body.token;
            tokenGestor = resGestor.body.token;
            tokenFinanceiro = resFinanceiro.body.token;
        });

        // Colaborador fail case, should not be able to create a user
        it('should return 403 for a collaborator trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenColaborador}`)
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
                .set('Authorization', `Bearer ${tokenColaborador}`)
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
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(403);
        });

        // Colaborador fail case, should not be able to restore a user
        it('should return 403 for a collaborator trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to create a user
        it('should return 403 for a gestor trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenGestor}`)
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
                .set('Authorization', `Bearer ${tokenGestor}`)
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
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(403);
        });

        // Gestor fail case, should not be able to restore a user
        it('should return 403 for a gestor trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to create a user
        it('should return 403 for a financeiro trying to create a user', async () => {
            const res = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${tokenFinanceiro}`)
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
                .set('Authorization', `Bearer ${tokenFinanceiro}`)
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
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(403);
        });

        // Financeiro fail case, should not be able to restore a user
        it('should return 403 for a financeiro trying to restore a user', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(403);
        });
    })
});