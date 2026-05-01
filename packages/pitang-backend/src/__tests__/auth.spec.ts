import request from 'supertest';
import { prisma } from '../core/PrismaClient.js';
import { app } from '../app.js';

describe('Auth Flow', () => {
    it('should return a token when logging in with valid credentials', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'colaborador@gmail.com',
                senha: '12345678'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('colaborador@gmail.com');
    });

    it('should return 401 for invalid credentials', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'wrong@gmail.com',
                senha: 'wrong_password'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Credenciais inválidas');
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});