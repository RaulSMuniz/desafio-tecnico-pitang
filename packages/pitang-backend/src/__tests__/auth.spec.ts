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

    it('should return 401 for invalid user (non-active user)', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'usuarioinativo@gmail.com',
                senha: '12345678'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Credenciais inválidas');
    });

    it('should return 400 for invalid email', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'invalid_email',
                senha: '12345678'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Dados de login inválidos');
    });

    it('should return 400 for invalid password', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'colaborador@gmail.com',
                senha: ''
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Dados de login inválidos');
    });

    it('should return 401 when trying to access a private route without token', async () => {
        const response = await request(app).get('/reimbursements');

        expect(response.status).toBe(401);
    });

    it('should return 401 for a malformed or forged JWT token', async () => {
        const response = await request(app)
            .get('/reimbursements')
            .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(401);
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});