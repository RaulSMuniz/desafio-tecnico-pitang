/// <reference types="node" />
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/core/PrismaClient.js';

async function main() {
    const salt = await bcrypt.genSalt(10);
    const senhaPadrao = await bcrypt.hash('12345678', salt);

    console.log('Iniciando seed de categorias e usuários...');

    const categorias = [
        { nome: 'Alimentação', ativo: true },
        { nome: 'Transporte', ativo: true },
        { nome: 'Hospedagem', ativo: true },
        { nome: 'Saúde', ativo: true },
        { nome: 'Outros', ativo: true },
        { nome: 'Categoria Inativa Exemplo', ativo: false },
    ];

    for (const cat of categorias) {
        await prisma.category.upsert({
            where: { nome: cat.nome },
            update: {},
            create: cat,
        });
    }

    const usuarios = [
        { nome: 'Admin Pitang', email: 'admin@gmail.com', perfil: 'ADMIN' },
        { nome: 'Gestor Pitang', email: 'gestor@gmail.com', perfil: 'GESTOR' },
        { nome: 'Financeiro Pitang', email: 'financeiro@gmail.com', perfil: 'FINANCEIRO' },
        { nome: 'Colaborador Pitang', email: 'colaborador@gmail.com', perfil: 'COLABORADOR' },
    ];

    for (const u of usuarios) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                nome: u.nome,
                email: u.email,
                senha: senhaPadrao,
                perfil: u.perfil as any,
            },
        });
    }

    console.log('Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });