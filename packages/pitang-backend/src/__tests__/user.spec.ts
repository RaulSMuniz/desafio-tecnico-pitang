import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../core/PrismaClient.js';

describe('User Management (Admin CRUD Rules)', () => {
    let tokenAdmin: string;
    let userIdParaTeste: string;
    // Gerando um e-mail único para evitar o erro 409 (Conflict) em execuções repetidas[cite: 10]
    const emailUnico = `admin_test_${Date.now()}@pitang.com`;

    beforeAll(async () => {
        const resAdmin = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@gmail.com', senha: '12345678' });

        tokenAdmin = resAdmin.body.token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('User CRUD Operations', () => {
        it('should create a new user with UUID', async () => {
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
            userIdParaTeste = createdUser!.id; // ID no formato UUID[cite: 11]
        });

        it('should update user information (providing name and email as required by schema)', async () => {
            const res = await request(app)
                .put(`/users/${userIdParaTeste}`)
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .send({
                    nome: 'Nome Atualizado', // Obrigatório no seu updateUserSchema
                    email: emailUnico,      // Obrigatório no seu updateUserSchema[cite: 9]
                    perfil: 'ADMIN'         // Opcional[cite: 9]
                });

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.nome).toBe('Nome Atualizado');
        });
    });

    describe('Soft Delete and Recovery', () => {
        it('should mark a user as deleted (status 200)', async () => {
            const res = await request(app)
                .delete(`/users/${userIdParaTeste}`)
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).not.toBeNull();
        });

        it('should restore a soft-deleted user (status 200)', async () => {
            const res = await request(app)
                .patch(`/users/${userIdParaTeste}/restore`)
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(200);

            const user = await prisma.user.findUnique({ where: { id: userIdParaTeste } });
            expect(user?.deletadoEm).toBeNull();
        });
    });
});