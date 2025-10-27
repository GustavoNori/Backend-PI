const express = require('express');
const router = express.Router();
const PostController = require('../controllers/postController'); 
const { verifyToken } = require('../middlewares/authJWT');
const { isPostOwner } = require('../middlewares/postOwner');
const decodeId = require("../middlewares/decodeId")

const postController = new PostController();

router.get('/', postController.getAllPosts.bind(postController));
router.get('/user/:userId', decodeId("userId"), postController.getUserPosts.bind(postController));
router.get('/:id', decodeId("id"), verifyToken, postController.getPostById.bind(postController));

router.post('/', verifyToken, postController.createPost.bind(postController));
router.put('/:id', decodeId("id"), verifyToken, isPostOwner, postController.updatePost.bind(postController));
router.delete('/:id', decodeId("id"), verifyToken, isPostOwner, postController.deletePost.bind(postController));

module.exports = router;  