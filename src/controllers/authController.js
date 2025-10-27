const { AppDataSource } = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middlewares/authJWT");
const User = require("../entity/User");
const { encode } = require("../utils/hashid");

class userController {
  async createUser(req, res) {
    try {
      const { firstName, lastName, email, cpf, phone, password, gender } =
        req.body;

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

      let profileImage;

      if (req.file) {
        profileImage = req.file.filename;
      } else {
        profileImage = null;
      }

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

      return res.status(201).json({
        success: true,
        message: "Usuário cadastrado com sucesso!",
        token,
        user: newUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: error.message,
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

      const userRepository = AppDataSource.getRepository("User");
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

      res.status(200).json({
        success: true,
        message: "Login bem-sucedido!",
        token,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno no servidor",
        error: error.message,
      });
    }
  }
  async updateUser(req, res) {
    const { id } = req.params;
    const { firstName, lastName, email, cpf, phone, password, gender } =
      req.body;
    try {
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: parseInt(id) },
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario não encontrado",
        });
      }
      if (firstName) user.name = firstName;
      if (lastName) user.surname = lastName;
      if (email) user.email = email;
      if (cpf) user.cpf = cpf;
      if (phone) user.number = phone;
      if (gender) user.gender = gender;

      if (req.file) {
        user.profileImage = req.file.filename;
      }

      await userRepository.save(user);

      const userResponse = {
        id: encode(user.id),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        gender: user.gender,
        profileImage: user.profileImage,
      };

      return res.status(200).json({
        success: true,
        message: "Usuario atualizado com sucesso",
        data: userResponse,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: parseInt(id) },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario não encontrado",
        });
      }

      const userResponse = {
        id: encode(user.id),
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        gender: user.gender,
        profileImage: user.profileImage,
      };

      return res.status(200).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const userRepository = AppDataSource.getRepository(User);

      const users = await userRepository.find();

      const usersResponse = users.map(user => {
        return {
          id: encode(user.id), 
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          gender: user.gender,
          profileImage: user.profileImage,
        };
      });

      return res.status(200).json({
        success: true,
        data: usersResponse,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new userController();
