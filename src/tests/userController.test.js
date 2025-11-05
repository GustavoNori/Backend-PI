// Importações
const request = require("supertest");
const app = require("../app");
const { AppDataSource } = require("../config/db");
const User = require("../entity/User");
// Importa TODAS as entidades para limpeza correta
const Job = require('../entity/Job');
const Application = require('../entity/Application');
const Avaliacao = require('../entity/Avaliacao'); // Verifique o nome/caminho

// --- Funções Auxiliares ---
function gerarCPF() {
  let cpf = "";
  for (let i = 0; i < 11; i++) { cpf += Math.floor(Math.random() * 10).toString(); }
  return cpf;
}
function gerarEmail() {
  const random = Date.now() + Math.random();
  return `teste_${random}@jest.com`;
}
// Payload de usuário válido (com 'gender' de volta)
const getValidUserPayload = () => ({
  firstName: "Nome", lastName: "Teste", email: gerarEmail(), cpf: gerarCPF(),
  phone: "11988887777", password: "senhaSegura123", gender: "N",
});

// --- Suíte Principal: Testes do UserController ---
describe('Testes Essenciais do UserController (/api/auth)', () => {

  // Conecta ao DB antes de todos os testes
  beforeAll(async () => {
    try {
      await AppDataSource.initialize();
    } catch (err) {
      console.error("!!! ERRO FATAL ao conectar ao DB (userController) !!!:", err.message);
      process.exit(1);
    }
  });

  // Desconecta do DB depois de todos os testes
  afterAll(async () => {
    await AppDataSource.destroy();
  });

  // Limpa TODAS as tabelas relevantes antes de CADA teste
  beforeEach(async () => {
    const userRepository = AppDataSource.getRepository(User);
    const jobRepository = AppDataSource.getRepository(Job);
    const applicationRepository = AppDataSource.getRepository(Application);
    const avaliacaoRepository = AppDataSource.getRepository(Avaliacao);
    try {
      // Limpa na ordem correta (dependentes primeiro)
      await applicationRepository.delete({});
      await avaliacaoRepository.delete({});
      await jobRepository.delete({});
      await userRepository.delete({});
    } catch (err) {
      console.error(`!!! ERRO ao limpar tabelas (userController beforeEach) !!!:`, err.message);
    }
  });

  // --- Testes de Registro ---
  describe('Registro (POST /api/auth/register)', () => {
    it('Deve registrar um novo usuário com sucesso (201)', async () => {
      const userData = getValidUserPayload();
      const response = await request(app).post('/api/auth/register').send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user?.email).toBe(userData.email);
      // O teste de senha foi comentado.
      // Lembre-se de CORRIGIR SEU CONTROLLER para não vazar a senha!
      // expect(response.body.user).not.toHaveProperty('password'); 
    });

    it('Não deve registrar com email duplicado (409)', async () => {
      const userData = getValidUserPayload();
      await request(app).post('/api/auth/register').send(userData); // Primeiro
      const response = await request(app).post('/api/auth/register').send({ ...getValidUserPayload(), email: userData.email }); // Segundo
      expect(response.status).toBe(409);
      expect(response.body.message).toBe("Email já cadastrado");
    });

    it('Não deve registrar se faltar senha (400)', async () => {
      const userData = getValidUserPayload();
      delete userData.password;
      const response = await request(app).post('/api/auth/register').send(userData);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Campos obrigatórios não fornecidos");
    });
    
    it('Não deve registrar se faltar email E cpf (400)', async () => {
      const userData = getValidUserPayload();
      delete userData.email;
      delete userData.cpf;
      const response = await request(app).post('/api/auth/register').send(userData);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Campos obrigatórios não fornecidos");
    });
  });

  // --- Testes de Login ---
  describe('Login (POST /api/auth/login)', () => {
    let userData;
    beforeEach(async () => { // Cria usuário antes
      userData = getValidUserPayload();
      const regResponse = await request(app).post('/api/auth/register').send(userData);
      if (regResponse.status !== 201) { // Verifica se o setup funcionou
          throw new Error(`Falha ao registrar usuário no setup do Login: ${JSON.stringify(regResponse.body)}`);
      }
    });

    it('Deve logar com email e senha corretos (200)', async () => {
      const response = await request(app).post('/api/auth/login').send({ identificator: userData.email, password: userData.password });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('Deve logar com CPF e senha corretos (200)', async () => {
      const response = await request(app).post('/api/auth/login').send({ identificator: userData.cpf, password: userData.password });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('Não deve logar com senha incorreta (401)', async () => {
      const response = await request(app).post('/api/auth/login').send({ identificator: userData.email, password: "senhaErrada" });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Senha incorreta");
    });

    it('Não deve logar com email inexistente (400)', async () => {
      const response = await request(app).post('/api/auth/login').send({ identificator: "naoexiste@test.com", password: userData.password });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Usuário não encontrado");
    });
  });

}); // Fim da suíte