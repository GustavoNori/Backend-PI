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
          message: "Os campos titulo e descricao são obrigatórios",
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

      const postCompleto = await jobRepository.findOne({
        where: { id: newPost.id },
        relations: ["user"],
      });

      const formattedPost = this._formatPostResponse(postCompleto);

      return res.status(201).json({
        success: true,
        message: "Post criado com sucesso",
        data: formattedPost,
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
      console.log('=== GET POST BY ID - CONTROLLER ===');
      console.log('req.params:', req.params);
      console.log('req.user:', req.user);
      
      const { id } = req.params;
      console.log('ID from params:', id, 'Type:', typeof id);
      
      const jobRepository = AppDataSource.getRepository(Job);

      // O ID já foi decodificado pelo middleware, não precisa decodificar novamente
      console.log('Buscando post com ID:', id);
      
      const post = await jobRepository.findOne({
        where: { id: id },
        relations: ["user"],
      });

      console.log('Post encontrado:', post ? 'SIM' : 'NÃO');

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      const userId = req.user?.id;
      const FromTheUser = post.user && parseInt(post.user.id) === parseInt(userId);

      console.log('User ID:', userId);
      console.log('Post User ID:', post.user?.id);
      console.log('Is owner:', FromTheUser);

      return res.status(200).json({
        success: true,
        data: this._formatPostResponse(post),
        FromTheUser,
      });
    } catch (error) {
      console.error('ERROR no getPostById:', error);
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
      
      console.log('=== GET USER POSTS ===');
      console.log('User ID from params:', userId);

      // O userId já foi decodificado pelo middleware
      const jobRepository = AppDataSource.getRepository(Job);

      const posts = await jobRepository.find({
        where: { user: { id: userId } },
        relations: ["user"],
      });

      const postsResponse = posts.map((post) => this._formatPostResponse(post));

      return res.status(200).json({
        success: true,
        data: postsResponse,
      });
    } catch (error) {
      console.error('ERROR no getUserPosts:', error);
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
      const body = req.body;

      console.log('=== UPDATE POST ===');
      console.log('Post ID:', id);
      console.log('User ID:', userId);
      
      // O ID já foi decodificado pelo middleware
      const jobRepository = AppDataSource.getRepository(Job);

      const post = await jobRepository.findOne({
        where: { id: id },
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

      jobRepository.merge(post, body);
      await jobRepository.save(post);

      return res.status(200).json({
        success: true,
        message: "Post atualizado com sucesso",
        data: this._formatPostResponse(post),
      });
    } catch (error) {
      console.error('ERROR no updatePost:', error);
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
      
      console.log('=== DELETE POST ===');
      console.log('Post ID:', id);
      
      // O ID já foi decodificado pelo middleware
      const jobRepository = AppDataSource.getRepository(Job);

      const result = await jobRepository.delete(id);

      if (result.affected === 0) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Post deletado com sucesso",
      });
    } catch (error) {
      console.error('ERROR no deletePost:', error);
      return res.status(500).json({
        success: false,
        message: "Erro ao deletar post",
        error: error.message,
      });
    }
  }
}

module.exports = PostController;