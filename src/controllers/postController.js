const { AppDataSource } = require("../config/db");
const Job = require("../entity/Job");
const isPostOwner = require("../middlewares/postOwner")
const { encode } = require("../utils/hashid");


class PostController {

_formatPostResponse(post) {
    if (!post) return null;

    const formattedUser = post.user
      ? {
          id: encode(post.user.id), 
          name: post.user.name, 
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
      const { title, description, value, cep, street, district, city, state, number, date, phone, category, payment, urgent } = req.body;
      const userId = req.user.id;
      console.log('Dados recebidos:', { title, description, value, cep, street, district, city, state, number, date, phone, category, payment, urgent });

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message: "Os campos titulo e descricao são obrigatórios"
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
          user: { id: userId } 
      });

      await jobRepository.save(newPost);

      return res.status(201).json({
        success: true,
        message: "Post criado com sucesso",
        data: newPost
      });
    } catch (error) {
      console.error("Erro ao criar post:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar o post",
        error: error.message
      });
    }
  }

  async getAllPosts(req, res) {
    try {
      const jobRepository = AppDataSource.getRepository(Job);
      const posts = await jobRepository.find();
      

const responsePosts = posts.map(post => this._formatPostResponse(post));
      return res.status(200).json({
        success: true,
        data: responsePosts
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar posts",
        error: error.message
      });
    }
  }

  async getPostById(req, res) {
    try {
      const { id } = req.params;
      const jobRepository = AppDataSource.getRepository(Job);
      const post = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['user']
    });
      const userId = req.user?.id;  


      let FromTheUser = false

if (userId && post.user && parseInt(post.user.id) === parseInt(userId)) { 
  FromTheUser = true;
}

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado"
        });
      }

    console.log("--- DEBUG DE PERMISSÃO ---");
    console.log("ID do Usuário Logado (userId):", userId);
    console.log("ID do Dono do Post (post.user.id):", post.user?.id);
    console.log("----------------------------");

      return res.status(200).json({
        success: true,
        data: post,
        FromTheUser
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar post",
        error: error.message
      });
    }
  }

  async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const jobRepository = AppDataSource.getRepository(Job);

      const posts = await jobRepository.find({
  where: { user: { id: parseInt(userId) } },
  relations: ["user"]
});

  const postsResponse = posts.map(post => this._formatPostResponse(post));

      return res.status(200).json({
        success: true,
        data: postsResponse
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar posts do usuário",
        error: error.message
      });
    }
  }

    async updatePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;  
            const body = req.body;

            const jobRepository = AppDataSource.getRepository(Job);
            const post = await jobRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["user"] 
            });   

            if (!post) {
                return res.status(44).json({
                    success: false,
                    message: "Post não encontrado"
                });
            }   

            if (post.user.id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Você não tem permissão para modificar este post"
                });
            }

            jobRepository.merge(post, body);

            await jobRepository.save(post);

            return res.status(200).json({
                success: true,
                message: "Post atualizado com sucesso",
                data: this._formatPostResponse(post)
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Erro ao atualizar post",
                error: error.message
            });
        }
    }

  async deletePost(req, res) {
    try {
      const { id } = req.params;
      const jobRepository = AppDataSource.getRepository(Job);
      
      const result = await jobRepository.delete(id);
      
      if (result.affected === 0) {
        return res.status(404).json({
          success: false,
          message: "Post não encontrado"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Post deletado com sucesso"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao deletar post",
        error: error.message
      });
    }
  }
}

module.exports = PostController;