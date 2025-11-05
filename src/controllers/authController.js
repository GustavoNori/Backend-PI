const { AppDataSource } = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middlewares/authJWT");
const User = require("../entity/User");
const { encode } = require("../utils/hashid");

class UserController {
  async createUser(req, res) {
    try {
      const { firstName, lastName, email, cpf, phone, password, gender } = req.body;

      if (!(email || cpf) || !password) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não fornecidos",
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      const existingUser = await userRepository.findOneBy({ email });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email já cadastrado",
        });
      }

      const completeName = `${firstName} ${lastName}`;
      const senhaCriptografada = await bcrypt.hash(password, 10);
      const profileImage = req.file ? req.file.filename : null;

      const newUser = userRepository.create({
        name: completeName,
        email,
        cpf,
        phone,
        password: senhaCriptografada,
        gender,
        profileImage,
      });

      await userRepository.save(newUser);
      const token = generateToken(newUser);

      // Remove a senha antes de retornar
      const { password: _, ...userParaRetorno } = newUser;

      return res.status(201).json({
        success: true,
        message: "Usuário cadastrado com sucesso!",
        token,
        user: { ...userParaRetorno, id: encode(newUser.id) },
      });
    } catch (error) {
      console.error("Erro em createUser:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno no servidor ao criar usuário",
      });
    }
  }

  async loginUser(req, res) {
    try {
      const { identificator, password } = req.body;
      if (!identificator || !password) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios não fornecidos",
        });
      }

      const userRepository = AppDataSource.getRepository(User);
      let user;

      if (identificator.includes("@")) {
        user = await userRepository.findOneBy({ email: identificator });
      } else {
        user = await userRepository.findOneBy({ cpf: identificator });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Senha incorreta",
        });
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: "Login bem-sucedido!",
        token,
      });
    } catch (error) {
      console.error("Erro em loginUser:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno no servidor durante o login",
      });
    }
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const { firstName, lastName, email, cpf, phone, gender } = req.body;

    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      if (firstName !== undefined) user.name = firstName;
      if (lastName !== undefined) user.surname = lastName;
      if (email !== undefined) user.email = email;
      if (cpf !== undefined) user.cpf = cpf;
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      if (req.file) user.profileImage = req.file.filename;

      await userRepository.save(user);

      const { password: _, ...userParaRetorno } = user;

      return res.status(200).json({
        success: true,
        message: "Usuário atualizado com sucesso",
        data: { ...userParaRetorno, id: encode(user.id) },
      });
    } catch (error) {
      console.error("Erro em updateUser:", error);
      if (error.code === "ER_DUP_ENTRY" || error.message.includes("unique constraint")) {
        return res.status(409).json({
          success: false,
          message: "Email ou CPF já está em uso por outro usuário.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Erro interno ao atualizar usuário",
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: parseInt(id) } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
      }

      const { password, ...userSemSenha } = user;
      return res.status(200).json({
        success: true,
        data: { ...userSemSenha, id: encode(user.id) },
      });
    } catch (error) {
      console.error("Erro em getUserById:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário",
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      const usersSemSenha = users.map(({ password, ...u }) => ({
        ...u,
        id: encode(u.id),
      }));

      return res.status(200).json({
        success: true,
        data: usersSemSenha,
      });
    } catch (error) {
      console.error("Erro em getAllUsers:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar usuários",
      });
    }
  }
}

module.exports = new UserController();
