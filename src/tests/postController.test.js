    // Importações
    const request = require('supertest');
    const app = require('../app');
    const { AppDataSource } = require('../config/db');
    const User = require('../entity/User');
    const Job = require('../entity/Job');
    const Application = require('../entity/Application');
    const Avaliacao = require('../entity/Avaliacao'); // <-- Verifique o nome/caminho

    // --- Variáveis Globais ---
    let tokenUser1 = ""; let tokenUser2 = ""; let user1Id; let user2Id; let testPost;

    // --- Dados Mockados ---
    const mockJobData = {
      title: "Vaga Teste",
      description: "Descrição Teste",
      value: 1000,
      cep: "14800000",
      street: "Rua Teste",
      district: "Bairro Teste",
      city: "Cidade Teste",
      state: "SP",
      number: "100",
      // <<< CORREÇÃO 1: Formato da Data para YYYY-MM-DD >>>
      date: new Date().toISOString().split('T')[0],
      phone: "16999990000",
      category: "geral",
      // <<< CORREÇÃO 2: Valor de 'payment' válido (do seu ENUM) >>>
      payment: "hora", // ou "dia", ou "servico"
      urgent: false
    };
    const userData1 = {
      firstName: "User", lastName: "Um", email: "user1@test.com", cpf: "11111111111",
      phone: "11111111111", password: "password1", gender: "M"
    };
    const userData2 = {
      firstName: "User", lastName: "Dois", email: "user2@test.com", cpf: "22222222222",
      phone: "22222222222", password: "password2", gender: "F"
    };

    // --- Suíte Principal ---
    describe('Testes das Rotas de Post (/api/post)', () => {

      // Setup: Conecta, limpa, cria usuários e pega tokens
      beforeAll(async () => {
        let step = "Inicializando";
        try {
          step = "Conectando ao DB"; await AppDataSource.initialize();
          const userRepository = AppDataSource.getRepository(User);
          step = "Limpando usuários";
          await userRepository.delete({ email: userData1.email });
          await userRepository.delete({ email: userData2.email });

          step = "Registrando User 1";
          const reg1 = await request(app).post('/api/auth/register').send(userData1);
          if (reg1.status !== 201) throw new Error(`Falha ao registrar User 1: ${JSON.stringify(reg1.body)}`);
          user1Id = reg1.body.user.id;

          step = "Logando User 1";
          const login1 = await request(app).post('/api/auth/login').send({ identificator: userData1.email, password: userData1.password });
          if (login1.status !== 200) throw new Error(`Falha ao logar User 1: ${JSON.stringify(login1.body)}`);
          tokenUser1 = login1.body.token;

          step = "Registrando User 2";
          const reg2 = await request(app).post('/api/auth/register').send(userData2);
          if (reg2.status !== 201) throw new Error(`Falha ao registrar User 2: ${JSON.stringify(reg2.body)}`);
          user2Id = reg2.body.user.id;

          step = "Logando User 2";
          const login2 = await request(app).post('/api/auth/login').send({ identificator: userData2.email, password: userData2.password });
          if (login2.status !== 200) throw new Error(`Falha ao logar User 2: ${JSON.stringify(login2.body)}`);
          tokenUser2 = login2.body.token;

        } catch (err) {
          console.error(`!!! ERRO FATAL no setup (postController) no passo: ${step} !!!`);
          console.error("!!! Mensagem:", err.message);
          process.exit(1);
        }
      });

      // Limpeza antes de CADA teste 'it'
      beforeEach(async () => {
        const jobRepository = AppDataSource.getRepository(Job);
        const applicationRepository = AppDataSource.getRepository(Application);
        const avaliacaoRepository = AppDataSource.getRepository(Avaliacao);
        try {
          await applicationRepository.delete({});
          await avaliacaoRepository.delete({});
          await jobRepository.delete({});
          
          // Cria post padrão para user1
          testPost = await jobRepository.save(jobRepository.create({
            ...mockJobData,
            title: "Post Padrão beforeEach",
            user: { id: user1Id }
          }));
        } catch (err) {
            console.error(`!!! ERRO na limpeza/criação (postController beforeEach):`, err.message);
            testPost = undefined;
        }
      });

      // Limpeza final
      afterAll(async () => {
        const userRepository = AppDataSource.getRepository(User);
        await userRepository.clear({ email: userData1.email });
        await userRepository.clear({ email: userData2.email });
        await AppDataSource.destroy();
      });

      // --- Testes de Criação ---
      describe('Criação (POST /api/post)', () => {
        it('Deve criar post com dados válidos (201)', async () => {
            const response = await request(app).post('/api/post').set('Authorization', `Bearer ${tokenUser1}`).send(mockJobData);
            expect(response.status).toBe(201); // <-- Deve passar agora
            expect(response.body.data.user.id).toBe(user1Id);
        });
        
        it('Não deve criar post sem título (400)', async () => {
          const data = { ...mockJobData, title: "" };
          const response = await request(app).post('/api/post').set('Authorization', `Bearer ${tokenUser1}`).send(data);
          expect(response.status).toBe(400);
          expect(response.body.message).toBe("Os campos titulo e descricao são obrigatórios");
        });
      });

      // --- Testes de Listagem ---
      describe('Listagem (GET /api/post)', () => {
        it('Deve retornar a lista de posts (200)', async () => {
          const response = await request(app).get('/api/post');
          expect(response.status).toBe(200);
          expect(response.body.data.length).toBe(1); // <-- Deve passar agora
        });
      });

      // --- Testes de Busca por ID ---
      describe('Busca por ID (GET /api/post/:id)', () => {
        it('Deve retornar post pelo ID (200)', async () => {
          if (!testPost) throw new Error("Falha no setup: testPost não definido."); // <-- 'fail' corrigido
          const response = await request(app).get(`/api/post/${testPost.id}`);
          expect(response.status).toBe(200);
          expect(response.body.data.id).toBe(testPost.id);
        });

        it('Deve retornar 404 para ID inexistente', async () => {
          const response = await request(app).get('/api/post/999999');
          expect(response.status).toBe(404);
        });
      });

      // --- Testes de Busca por Usuário ---
      describe('Busca por Usuário (GET /api/post/user/:userId)', () => {
        it('Deve retornar posts do usuário correto (200)', async () => {
          const jobRepo = AppDataSource.getRepository(Job);
          await jobRepo.save(jobRepo.create({ ...mockJobData, title:"Post User 2", user: { id: user2Id }}));
          
          const response = await request(app).get(`/api/post/user/${user1Id}`);
          expect(response.status).toBe(200);
          expect(response.body.data.length).toBe(1); // <-- Deve passar agora
          expect(response.body.data[0].user.id).toBe(user1Id);
        });
      });

      // --- Testes de Atualização ---
      describe('Atualização (PUT /api/post/:id)', () => {
        it('Deve permitir ao dono atualizar (200)', async () => {
          if (!testPost) throw new Error("Falha no setup: testPost não definido.");
          const updatedData = { title: "Título Atualizado" };
          const response = await request(app).put(`/api/post/${testPost.id}`).set('Authorization', `Bearer ${tokenUser1}`).send(updatedData);
          expect(response.status).toBe(200);
          expect(response.body.data.title).toBe(updatedData.title);
        });

        it('Não deve permitir atualizar post de outro (403)', async () => {
          if (!testPost) throw new Error("Falha no setup: testPost não definido.");
          const response = await request(app).put(`/api/post/${testPost.id}`).set('Authorization', `Bearer ${tokenUser2}`).send({ title: "Update Falho" });
          expect(response.status).toBe(403);
        });

        it('Deve retornar erro ao atualizar post inexistente (404)', async () => {
          const response = await request(app).put('/api/post/999999').set('Authorization', `Bearer ${tokenUser1}`).send({ title: "Inexistente" });
          expect(response.status).toBe(404); // Corrigido de 44 para 404
        });
      });

      // --- Testes de Deleção ---
      describe('Deleção (DELETE /api/post/:id)', () => {
        it('Deve permitir ao dono deletar (200)', async () => {
          if (!testPost) throw new Error("Falha no setup: testPost não definido.");
          const deleteResponse = await request(app).delete(`/api/post/${testPost.id}`).set('Authorization', `Bearer ${tokenUser1}`);
          expect(deleteResponse.status).toBe(200);
          // Verifica se sumiu
          const getResponse = await request(app).get(`/api/post/${testPost.id}`);
          expect(getResponse.status).toBe(404);
        });
      });

    }); // Fim da suíte