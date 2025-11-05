const { AppDataSource } = require("../config/db");
const Job = require("../entity/Job");
const { encode, decode } = require("../utils/hashid");

class PostController {
  _formatPostResponse(post) {
    if (!post) return null;

    const formattedUser = post.user
      ? {
          id: encode(post.user.id),
          name: post.user.name,
          avatar: post.user.avatar || null,
        }
      : null;

    return {
      id: encode(post.id),
      title: post.title,
      description: post.description,
      value: post.value,
      cep: post.cep,
      street: post.street,
      district: post.district,
      city: post.city,
      state: post.state,
      number: post.number,
      date: post.date,
      phone: post.phone,
      category: post.category,
      payment: post.payment,
      urgent: post.urgent,
      user: formattedUser,
    };
  }

  async createPost(req, res) {
    try {
      const {
        title,
        description,
        value,
        cep,
        street,
        district,
        city,
        state,
        number,
        date,
        phone,
        category,
        payment,
        urgent,
      } = req.body;

      const userId = req.user.id;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Os campos título e descrição são obrigatórios",
        });
      }

      const jobRepository = AppDataSource.getRepository(Job);

      const newPost = jobRepository.create({
        title,
        description,
        value,
        cep,
        street,
        district,
        city,
        state,
        number,
        phone,
        category,
        payment,
        urgent,
        date,
        user: { id: userId },
      });

      await jobRepository.save(newPost);

      const savedPost = await jobRepository.findOne({
        where: { id: newPost.id },
        relations: ["user"],
      });

      return res.status(201).json({
        success: true,
        message: "Post criado com sucesso",
        data: this._formatPostResponse(savedPost),
      });
    } catch (error) {
      console.error("Erro ao criar post:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar o post",
        error: error.message,
      });
    }
  }

  async getAllPosts(req, res) {
    try {
      const jobRepository = AppDataSource.getRepository(Job);
      const posts = await jobRepository.find({
        relations: ["user"],
        order: { id: "DESC" },
      });

      const responsePosts = posts.map((post) => this._formatPostResponse(post));

      return res.status(200).json({
        success: true,
        data: responsePosts,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar posts",
        error: error.message,
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const jobRepository = AppDataSource.getRepository(Job);

      const decodedId = isNaN(id) ? decode(id) : id;

      const post = await jobRepository.findOne({
        where: { id: decodedId },
        relations: ["user"],
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      const userId = req.user?.id;
      const isOwner = post.user && parseInt(post.user.id) === parseInt(userId);

      return res.status(200).json({
        success: true,
        data: this._formatPostResponse(post),
        isOwner,
      });
    } catch (error) {
      console.error("Erro no getPostById:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar post",
        error: error.message,
      });
    }
  }

  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const decodedId = isNaN(userId) ? decode(userId) : userId;

      const jobRepository = AppDataSource.getRepository(Job);
      const posts = await jobRepository.find({
        where: { user: { id: decodedId } },
        relations: ["user"],
      });

      const formatted = posts.map((p) => this._formatPostResponse(p));

      return res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error) {
      console.error("Erro no getUserPosts:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar posts do usuário",
        error: error.message,
      });
    }
  }

  async updatePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const jobRepository = AppDataSource.getRepository(Job);

      const decodedId = isNaN(id) ? decode(id) : id;

      const post = await jobRepository.findOne({
        where: { id: decodedId },
        relations: ["user"],
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      if (post.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para modificar este post",
        });
      }

      jobRepository.merge(post, req.body);
      await jobRepository.save(post);

      return res.status(200).json({
        success: true,
        message: "Post atualizado com sucesso",
        data: this._formatPostResponse(post),
      });
    } catch (error) {
      console.error("Erro no updatePost:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar post",
        error: error.message,
      });
    }
  }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const jobRepository = AppDataSource.getRepository(Job);

      const decodedId = isNaN(id) ? decode(id) : id;

      const post = await jobRepository.findOne({
        where: { id: decodedId },
        relations: ["user"],
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      if (post.user.id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Você não tem permissão para excluir este post",
        });
      }

      await jobRepository.delete(decodedId);

      return res.status(200).json({
        success: true,
        message: "Post deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro no deletePost:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao deletar post",
        error: error.message,
      });
    }
  }
}

module.exports = PostController;
